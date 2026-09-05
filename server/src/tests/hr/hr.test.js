import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { User, ROLES } from '../../models/User.js';
import { Employee } from '../../models/Employee.js';
import { Department } from '../../models/Department.js';
import { WorkingSchedule } from '../../models/WorkingSchedule.js';
import { Contract } from '../../models/Contract.js';
import { hashPassword, generateToken } from '../../services/authService.js';
import { calculateWeeklyHours } from '../../services/scheduleService.js';
import { resolveApplicableContract } from '../../payroll/contractResolver.js';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/peoplepay360_test';

describe('PP-05 HR Master Data & Contract Resolver', () => {
  let hrToken, empToken, department, employee;

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
    await WorkingSchedule.deleteMany({});
    await Contract.deleteMany({});

    department = await Department.create({
      name: 'Engineering',
      code: 'ENG',
    });

    employee = await Employee.create({
      employeeCode: 'EMP100',
      name: 'Alice Dev',
      email: 'alice@peoplepay.com',
      departmentId: department._id,
    });

    const pass = await hashPassword('Pass123!');

    const hrUser = await User.create({
      name: 'HR Manager',
      email: 'hr@peoplepay.com',
      passwordHash: pass,
      role: ROLES.HR_MANAGER,
    });

    const empUser = await User.create({
      name: 'Alice Dev',
      email: 'alice@peoplepay.com',
      passwordHash: pass,
      role: ROLES.EMPLOYEE,
      employeeId: employee._id,
    });

    hrToken = generateToken(hrUser);
    empToken = generateToken(empUser);
  });

  describe('Working Schedule Calculation Logic', () => {
    it('should calculate correct weekly hours from daily definitions', () => {
      const days = [
        { day: 'MON', startTime: '09:00', endTime: '17:00', breakMinutes: 60 }, // 7h
        { day: 'TUE', startTime: '09:00', endTime: '17:00', breakMinutes: 60 }, // 7h
        { day: 'WED', startTime: '09:00', endTime: '17:00', breakMinutes: 60 }, // 7h
        { day: 'THU', startTime: '09:00', endTime: '17:00', breakMinutes: 60 }, // 7h
        { day: 'FRI', startTime: '09:00', endTime: '17:00', breakMinutes: 60 }, // 7h
      ];

      const weekly = calculateWeeklyHours(days);
      expect(weekly).toBe(35);
    });

    it('POST /api/schedules should automatically save calculated weeklyHours', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Standard 40h',
          days: [
            { day: 'MON', startTime: '08:00', endTime: '17:00', breakMinutes: 60 }, // 8h
            { day: 'TUE', startTime: '08:00', endTime: '17:00', breakMinutes: 60 }, // 8h
            { day: 'WED', startTime: '08:00', endTime: '17:00', breakMinutes: 60 }, // 8h
            { day: 'THU', startTime: '08:00', endTime: '17:00', breakMinutes: 60 }, // 8h
            { day: 'FRI', startTime: '08:00', endTime: '17:00', breakMinutes: 60 }, // 8h
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.weeklyHours).toBe(40);
    });
  });

  describe('Employee Master Data CRUD', () => {
    it('POST /api/employees should create new employee record', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeCode: 'EMP101',
          name: 'Bob Tester',
          email: 'bob@peoplepay.com',
          departmentId: department._id.toString(),
          jobPosition: 'QA Engineer',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.employeeCode).toBe('EMP101');
      expect(res.body.data.name).toBe('Bob Tester');
    });

    it('GET /api/employees/:id should return employee details with smartCounts', async () => {
      const res = await request(app)
        .get(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('employee');
      expect(res.body.data).toHaveProperty('smartCounts');
      expect(res.body.data.employee._id).toBe(employee._id.toString());
    });
  });

  describe('Period-Aware Contract Resolver', () => {
    it('should return MISSING_CONTRACT when no active contract exists for period', async () => {
      const result = await resolveApplicableContract({
        employeeId: employee._id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
      });

      expect(result.contract).toBeNull();
      expect(result.warning).not.toBeNull();
      expect(result.warning.code).toBe('MISSING_CONTRACT');
    });

    it('should select single active contract applicable to the payroll period', async () => {
      const activeContract = await Contract.create({
        employeeId: employee._id,
        startDate: new Date('2026-01-01'),
        endDate: null,
        wage: 60000,
        departmentId: department._id,
        position: 'Software Engineer',
        status: 'ACTIVE',
      });

      const result = await resolveApplicableContract({
        employeeId: employee._id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
      });

      expect(result.warning).toBeNull();
      expect(result.contract).not.toBeNull();
      expect(result.contract._id.toString()).toBe(activeContract._id.toString());
      expect(parseFloat(result.contract.wage)).toBe(60000);
    });

    it('should exclude EXPIRED contracts from selection for current period', async () => {
      await Contract.create({
        employeeId: employee._id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        wage: 50000,
        departmentId: department._id,
        position: 'Junior Dev',
        status: 'EXPIRED',
      });

      const result = await resolveApplicableContract({
        employeeId: employee._id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
      });

      expect(result.contract).toBeNull();
      expect(result.warning.code).toBe('MISSING_CONTRACT');
    });

    it('should detect AMBIGUOUS_CONTRACT when >1 active contracts overlap period', async () => {
      await Contract.create({
        employeeId: employee._id,
        startDate: new Date('2026-01-01'),
        endDate: null,
        wage: 60000,
        departmentId: department._id,
        position: 'Dev Lead',
        status: 'ACTIVE',
      });

      await Contract.create({
        employeeId: employee._id,
        startDate: new Date('2026-06-01'),
        endDate: null,
        wage: 75000,
        departmentId: department._id,
        position: 'Architect',
        status: 'ACTIVE',
      });

      const result = await resolveApplicableContract({
        employeeId: employee._id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
      });

      expect(result.contract).toBeNull();
      expect(result.warning).not.toBeNull();
      expect(result.warning.code).toBe('AMBIGUOUS_CONTRACT');
    });
  });
});
