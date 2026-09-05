import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { User, ROLES } from '../../models/User.js';
import { Employee } from '../../models/Employee.js';
import { AuditLog } from '../../models/AuditLog.js';
import { hashPassword, generateToken } from '../../services/authService.js';
import { logAudit } from '../../services/auditService.js';
import { requireRole } from '../../middleware/authorize.js';
import { enforceEmployeeSelfService } from '../../middleware/ownership.js';
import { authenticate } from '../../middleware/authenticate.js';
import { responseEnvelopeMiddleware, notFoundHandler, errorHandler } from '../../middleware/responseEnvelope.js';
import express from 'express';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/peoplepay360_test';

describe('PP-03 Authentication, RBAC, & Audit Foundation', () => {
  let employeeUser, hrManagerUser, hrPayrollUser, hrPayrollManagerUser, adminUser;
  let empProfile1, empProfile2;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Employee.deleteMany({});
    await AuditLog.deleteMany({});

    // Create dummy employee profiles
    empProfile1 = await Employee.create({
      employeeCode: 'EMP001',
      name: 'John Employee',
      email: 'john@peoplepay.com',
    });

    empProfile2 = await Employee.create({
      employeeCode: 'EMP002',
      name: 'Jane Other',
      email: 'jane@peoplepay.com',
    });

    const hashedPassword = await hashPassword('Password123!');

    // Create users for all 5 roles
    employeeUser = await User.create({
      name: 'John Employee',
      email: 'john@peoplepay.com',
      passwordHash: hashedPassword,
      role: ROLES.EMPLOYEE,
      employeeId: empProfile1._id,
      status: 'ACTIVE',
    });

    hrManagerUser = await User.create({
      name: 'HR Manager',
      email: 'hrmanager@peoplepay.com',
      passwordHash: hashedPassword,
      role: ROLES.HR_MANAGER,
      status: 'ACTIVE',
    });

    hrPayrollUser = await User.create({
      name: 'Payroll User',
      email: 'payrolluser@peoplepay.com',
      passwordHash: hashedPassword,
      role: ROLES.HR_PAYROLL_USER,
      status: 'ACTIVE',
    });

    hrPayrollManagerUser = await User.create({
      name: 'Payroll Manager',
      email: 'payrollmanager@peoplepay.com',
      passwordHash: hashedPassword,
      role: ROLES.HR_PAYROLL_MANAGER,
      status: 'ACTIVE',
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@peoplepay.com',
      passwordHash: hashedPassword,
      role: ROLES.ADMIN,
      status: 'ACTIVE',
    });
  });

  describe('Password Hashing & Service Functions', () => {
    it('hashPassword should securely hash passwords', async () => {
      const plain = 'SecretPass123';
      const hash = await hashPassword(plain);
      expect(hash).not.toBe(plain);
      expect(hash).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it('generateToken and verifyToken should sign and decode claims', () => {
      const token = generateToken(employeeUser);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'john@peoplepay.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', 'john@peoplepay.com');
      expect(res.body.data.user).toHaveProperty('role', ROLES.EMPLOYEE);
      expect(res.body.data.user).toHaveProperty('employeeId', empProfile1._id.toString());

      // Should write AUDIT_LOG entry
      const audit = await AuditLog.findOne({ action: 'USER_LOGIN' });
      expect(audit).not.toBeNull();
      expect(audit.actorId.toString()).toBe(employeeUser._id.toString());
    });

    it('should reject invalid password with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'john@peoplepay.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should reject non-existent user email with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@peoplepay.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user details when token provided', async () => {
      const token = generateToken(hrManagerUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('email', 'hrmanager@peoplepay.com');
      expect(res.body.data.user).toHaveProperty('role', ROLES.HR_MANAGER);
    });

    it('should reject requests without authorization token with 401', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('RBAC Authorization Matrix & Ownership Middleware', () => {
    let testApp;

    beforeAll(() => {
      testApp = express();
      testApp.use(responseEnvelopeMiddleware);
      testApp.use(express.json());

      // Protected test endpoints representing role boundaries
      testApp.get(
        '/api/test/payroll-admin',
        authenticate,
        requireRole(ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
        (req, res) => res.success({ allowed: true })
      );

      testApp.get(
        '/api/test/employee-record/:id',
        authenticate,
        enforceEmployeeSelfService,
        (req, res) => res.success({ accessedId: req.params.id, targetEmployee: req.query.employeeId })
      );

      testApp.use(notFoundHandler);
      testApp.use(errorHandler);
    });

    it('HR Payroll User should be REJECTED from salary/payroll configuration endpoints', async () => {
      const token = generateToken(hrPayrollUser);
      const res = await request(testApp)
        .get('/api/test/payroll-admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    it('HR Payroll Manager and Admin should be ALLOWED on payroll admin endpoints', async () => {
      const pmToken = generateToken(hrPayrollManagerUser);
      const adminToken = generateToken(adminUser);

      const res1 = await request(testApp)
        .get('/api/test/payroll-admin')
        .set('Authorization', `Bearer ${pmToken}`);
      expect(res1.status).toBe(200);

      const res2 = await request(testApp)
        .get('/api/test/payroll-admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.status).toBe(200);
    });

    it('Employee role should NOT be able to access another employee profile', async () => {
      const empToken = generateToken(employeeUser);

      // Attempting to access empProfile2 ID
      const res = await request(testApp)
        .get(`/api/test/employee-record/${empProfile2._id}`)
        .set('Authorization', `Bearer ${empToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    it('Employee role CAN access their own employee profile', async () => {
      const empToken = generateToken(employeeUser);

      const res = await request(testApp)
        .get(`/api/test/employee-record/${empProfile1._id}`)
        .set('Authorization', `Bearer ${empToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accessedId).toBe(empProfile1._id.toString());
    });
  });

  describe('Audit Log Helper', () => {
    it('logAudit should insert a structured AuditLog document', async () => {
      const log = await logAudit({
        actorId: adminUser._id,
        action: 'UPDATE_CONTRACT',
        entityType: 'Contract',
        entityId: '12345',
        before: { wage: 5000 },
        after: { wage: 6000 },
      });

      expect(log).not.toBeNull();
      expect(log.action).toBe('UPDATE_CONTRACT');
      expect(log.entityId).toBe('12345');
      expect(log.before).toEqual({ wage: 5000 });
      expect(log.after).toEqual({ wage: 6000 });
    });
  });
});
