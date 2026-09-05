import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { User, ROLES } from '../../models/User.js';
import { Employee } from '../../models/Employee.js';
import { Department } from '../../models/Department.js';
import { Contract } from '../../models/Contract.js';
import { SalaryStructure } from '../../models/SalaryStructure.js';
import { SalaryRule } from '../../models/SalaryRule.js';
import { Payrun } from '../../models/Payrun.js';
import { Payslip } from '../../models/Payslip.js';
import { hashPassword, generateToken } from '../../services/authService.js';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/peoplepay360_test';

describe('PP-09 Payroll Engine & Operations Integration Tests', () => {
  let payrollUserToken, payrollManagerToken, employee, department, structure, ruleBasic;

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
    await Department.deleteMany({});
    await Contract.deleteMany({});
    await SalaryStructure.deleteMany({});
    await SalaryRule.deleteMany({});
    await Payrun.deleteMany({});
    await Payslip.deleteMany({});

    department = await Department.create({ name: 'Finance', code: 'FIN' });

    employee = await Employee.create({
      employeeCode: 'EMP500',
      name: 'Emma Payroll',
      email: 'emma@peoplepay.com',
      departmentId: department._id,
      bankDetails: { accountNumber: '1234567890', bankName: 'Standard Bank' },
    });

    const pass = await hashPassword('Pass123!');

    const payrollUser = await User.create({
      name: 'Payroll User',
      email: 'puser@peoplepay.com',
      passwordHash: pass,
      role: ROLES.HR_PAYROLL_USER,
    });

    const payrollManager = await User.create({
      name: 'Payroll Manager',
      email: 'pmanager@peoplepay.com',
      passwordHash: pass,
      role: ROLES.HR_PAYROLL_MANAGER,
    });

    payrollUserToken = generateToken(payrollUser);
    payrollManagerToken = generateToken(payrollManager);

    structure = await SalaryStructure.create({
      name: 'Executive Salary Structure',
      code: 'EXEC_SAL',
    });

    ruleBasic = await SalaryRule.create({
      name: 'Basic Salary',
      code: 'BASIC',
      salaryStructureId: structure._id,
      category: 'BASIC',
      sequence: 1,
      computationType: 'PERCENTAGE',
      percentage: 100,
    });
  });

  describe('RBAC Rights for Salary Configuration (BR-14)', () => {
    it('HR Payroll User should be REJECTED when creating a Salary Structure', async () => {
      const res = await request(app)
        .post('/api/salary-structures')
        .set('Authorization', `Bearer ${payrollUserToken}`)
        .send({ name: 'Unauthorized Structure', code: 'UNAUTH' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('HR Payroll Manager should be ALLOWED to create a Salary Structure', async () => {
      const res = await request(app)
        .post('/api/salary-structures')
        .set('Authorization', `Bearer ${payrollManagerToken}`)
        .send({ name: 'Authorized Structure', code: 'AUTH_STRUCT' });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('AUTH_STRUCT');
    });
  });

  describe('Two-Step Payrun Wizard & Explicit Employee Selection (BR-07)', () => {
    it('Payrun creation without explicit employee selection should be rejected with 400', async () => {
      const res = await request(app)
        .post('/api/payruns')
        .set('Authorization', `Bearer ${payrollUserToken}`)
        .send({
          salaryStructureId: structure._id.toString(),
          periodStart: '2026-09-01',
          periodEnd: '2026-09-30',
          employeeIds: [], // Empty selection!
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Payrun creation with explicit employee selection should create DRAFT payrun', async () => {
      const res = await request(app)
        .post('/api/payruns')
        .set('Authorization', `Bearer ${payrollUserToken}`)
        .send({
          salaryStructureId: structure._id.toString(),
          periodStart: '2026-09-01',
          periodEnd: '2026-09-30',
          employeeIds: [employee._id.toString()],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');
    });
  });

  describe('Payrun Processing: Compute, Validate, & Mark Paid Lifecycle', () => {
    it('Compute payrun with missing active contract should surface BLOCKING warning', async () => {
      // Create DRAFT payrun without creating a contract first
      const runRes = await request(app)
        .post('/api/payruns')
        .set('Authorization', `Bearer ${payrollUserToken}`)
        .send({
          salaryStructureId: structure._id.toString(),
          periodStart: '2026-09-01',
          periodEnd: '2026-09-30',
          employeeIds: [employee._id.toString()],
        });

      const payrunId = runRes.body.data._id;

      // Compute
      const compRes = await request(app)
        .post(`/api/payruns/${payrunId}/compute`)
        .set('Authorization', `Bearer ${payrollUserToken}`);

      expect(compRes.status).toBe(200);
      expect(compRes.body.data.warnings).toHaveLength(1);
      expect(compRes.body.data.warnings[0].code).toBe('MISSING_CONTRACT');

      // Attempting to Validate must be REJECTED with 409 Conflict due to blocking warning
      const valRes = await request(app)
        .post(`/api/payruns/${payrunId}/validate`)
        .set('Authorization', `Bearer ${payrollUserToken}`);

      expect(valRes.status).toBe(409);
      expect(valRes.body.error.code).toBe('BLOCKING_WARNINGS_EXIST');
    });

    it('Clean Payrun compute -> validate -> mark paid end-to-end flow', async () => {
      // Create active contract
      await Contract.create({
        employeeId: employee._id,
        startDate: new Date('2026-01-01'),
        endDate: null,
        wage: 8000,
        departmentId: department._id,
        position: 'Financial Analyst',
        status: 'ACTIVE',
      });

      // 1. Create Payrun
      const runRes = await request(app)
        .post('/api/payruns')
        .set('Authorization', `Bearer ${payrollUserToken}`)
        .send({
          salaryStructureId: structure._id.toString(),
          periodStart: '2026-09-01',
          periodEnd: '2026-09-30',
          employeeIds: [employee._id.toString()],
        });

      const payrunId = runRes.body.data._id;

      // 2. Compute Payrun
      const compRes = await request(app)
        .post(`/api/payruns/${payrunId}/compute`)
        .set('Authorization', `Bearer ${payrollUserToken}`);

      expect(compRes.status).toBe(200);
      expect(compRes.body.data.payrun.status).toBe('COMPUTED');
      expect(compRes.body.data.payrun.totals.totalNet).toBe(8000);

      // 3. Validate Payrun
      const valRes = await request(app)
        .post(`/api/payruns/${payrunId}/validate`)
        .set('Authorization', `Bearer ${payrollUserToken}`);

      expect(valRes.status).toBe(200);
      expect(valRes.body.data.status).toBe('VALIDATED');

      // 4. Mark Paid
      const payRes = await request(app)
        .post(`/api/payruns/${payrunId}/pay`)
        .set('Authorization', `Bearer ${payrollUserToken}`);

      expect(payRes.status).toBe(200);
      expect(payRes.body.data.status).toBe('PAID');

      // Check persisted payslips status
      const payslips = await Payslip.find({ payrunId });
      expect(payslips).toHaveLength(1);
      expect(payslips[0].status).toBe('PAID');
      expect(payslips[0].net).toBe(8000);
    });
  });
});
