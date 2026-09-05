import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { User, ROLES } from '../../models/User.js';
import { Employee } from '../../models/Employee.js';
import { Department } from '../../models/Department.js';
import { Payslip } from '../../models/Payslip.js';
import { Attendance } from '../../models/Attendance.js';
import { TimeOffRequest } from '../../models/TimeOffRequest.js';
import { TimeOffType } from '../../models/TimeOffType.js';
import { Payrun } from '../../models/Payrun.js';
import { SalaryStructure } from '../../models/SalaryStructure.js';
import { generateToken, hashPassword } from '../../services/authService.js';


const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/peoplepay360_test';

describe('PP-11 Executive Dashboard API Tests', () => {
  let hrManagerToken, empToken;

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
    await Payslip.deleteMany({});
    await Attendance.deleteMany({});
    await TimeOffRequest.deleteMany({});
    await TimeOffType.deleteMany({});
    await Payrun.deleteMany({});
    await SalaryStructure.deleteMany({});


    const pass = await hashPassword('Pass123!');
    const hrManager = await User.create({
      name: 'HR Exec',
      email: 'hrexec@peoplepay.com',
      passwordHash: pass,
      role: ROLES.HR_MANAGER,
    });
    hrManagerToken = generateToken(hrManager);

    const empUser = await User.create({
      name: 'Regular Staff',
      email: 'staff@peoplepay.com',
      passwordHash: pass,
      role: ROLES.EMPLOYEE,
    });
    empToken = generateToken(empUser);

    const dept = await Department.create({ name: 'Engineering', code: 'ENG' });
    const emp = await Employee.create({
      employeeCode: 'EMP999',
      name: 'Dashboard Tester',
      email: 'dash@peoplepay.com',
      departmentId: dept._id,
    });

    const pType = await TimeOffType.create({ name: 'Vacation', code: 'VAC' });
    await TimeOffRequest.create({
      employeeId: emp._id,
      typeId: pType._id,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-05'),
      duration: 5,
      status: 'APPROVED',
    });

    await Attendance.create({
      employeeId: emp._id,
      date: new Date('2026-09-01'),
      checkIn: new Date('2026-09-01T09:00:00.000Z'),
      checkOut: new Date('2026-09-01T17:00:00.000Z'),
      status: 'PRESENT',
    });

    const struct = await SalaryStructure.create({ name: 'Default', code: `DEF_${Math.random().toString(36).substring(7)}` });


    const payrun = await Payrun.create({
      name: 'Sep 2026 Run',
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      salaryStructureId: struct._id,
      createdBy: hrManager._id,
      status: 'COMPUTED',
      warnings: [{ severity: 'BLOCKING', message: 'Missing contract' }],
    });

    await Payslip.create({
      payrunId: payrun._id,
      employeeId: emp._id,
      salaryStructureId: struct._id,
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      gross: 5000,
      deductions: 500,
      net: 4500,
      status: 'PAID',
    });

  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('should reject non-HR/Payroll role (EMPLOYEE)', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.status).toBe(403);
  });

  it('should return executive dashboard metrics for HR Manager', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();

    const { kpis, charts, alerts } = res.body.data;

    expect(kpis.totalNetSalaryPaid).toBe(4500);
    expect(kpis.approvedTimeOffDays).toBe(5);
    expect(kpis.attendanceCoveragePct).toBe(100);

    expect(charts.salaryCostByDepartment.length).toBeGreaterThan(0);
    expect(charts.salaryCostByDepartment[0].departmentName).toBe('Engineering');

    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('BLOCKING_PAYROLL');
  });

  it('should filter dashboard metrics by date range', async () => {
    const res = await request(app)
      .get('/api/dashboard?startDate=2026-10-01&endDate=2026-10-31')
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.kpis.totalNetSalaryPaid).toBe(0);
    expect(res.body.data.kpis.approvedTimeOffDays).toBe(0);
  });
});
