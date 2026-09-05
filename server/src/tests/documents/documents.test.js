import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { User, ROLES } from '../../models/User.js';
import { Employee } from '../../models/Employee.js';
import { Department } from '../../models/Department.js';
import { Payrun } from '../../models/Payrun.js';
import { Payslip } from '../../models/Payslip.js';
import { generateToken, hashPassword } from '../../services/authService.js';
import { generatePayslipPDFBuffer, sendPayrunPayslips } from '../../services/payslipDocumentService.js';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/peoplepay360_test';

describe('PP-11 Documents & Payslip Delivery Tests', () => {
  let mgrToken, empToken, employee, payrun, payslip;

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
    await Payrun.deleteMany({});
    await Payslip.deleteMany({});

    const pass = await hashPassword('Pass123!');
    const mgr = await User.create({
      name: 'Payroll Manager',
      email: 'pmgr@peoplepay.com',
      passwordHash: pass,
      role: ROLES.HR_PAYROLL_MANAGER,
    });
    mgrToken = generateToken(mgr);

    employee = await Employee.create({
      employeeCode: 'EMP100',
      name: 'Alice Document',
      email: 'alice@peoplepay.com',
    });

    const empUser = await User.create({
      name: 'Alice Document',
      email: 'alice@peoplepay.com',
      passwordHash: pass,
      role: ROLES.EMPLOYEE,
      employeeId: employee._id,
    });
    empToken = generateToken(empUser);

    const { SalaryStructure } = await import('../../models/SalaryStructure.js');
    await SalaryStructure.deleteMany({});
    const struct = await SalaryStructure.create({ name: 'Default', code: `DEF_${Math.random().toString(36).substring(7)}` });

    payrun = await Payrun.create({
      name: 'Doc Test Payrun',
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      salaryStructureId: struct._id,
      createdBy: mgr._id,
      status: 'PAID',
    });

    payslip = await Payslip.create({
      payrunId: payrun._id,
      employeeId: employee._id,
      salaryStructureId: struct._id,
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      gross: 4000,
      deductions: 400,
      net: 3600,
      status: 'PAID',
      ruleLines: [
        { name: 'Basic', category: 'BASIC', code: 'BASIC', sequence: 1, computationType: 'FIXED', amount: 3000 },
        { name: 'HRA', category: 'ALW', code: 'HRA', sequence: 2, computationType: 'FIXED', amount: 1000 },
        { name: 'Tax', category: 'DED', code: 'TAX', sequence: 3, computationType: 'FIXED', amount: 400 },
      ],

    });

  });

  it('should generate valid PDF buffer for a payslip', async () => {
    const popPayslip = await Payslip.findById(payslip._id).populate('employeeId');
    const buffer = await generatePayslipPDFBuffer(popPayslip);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    // PDF Magic Header check
    expect(buffer.toString('utf8', 0, 4)).toBe('%PDF');
  });

  it('should download payslip PDF via endpoint', async () => {
    const res = await request(app)
      .get(`/api/payslips/${payslip._id}/pdf`)
      .set('Authorization', `Bearer ${empToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('inline');
  });


  it('should bulk send payslips for a payrun and record status', async () => {
    const res = await request(app)
      .post(`/api/payruns/${payrun._id}/send-payslips`)
      .set('Authorization', `Bearer ${mgrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.results.length).toBe(1);

    expect(res.body.data.results[0].status).toBe('SENT');

    const updatedPayslip = await Payslip.findById(payslip._id);
    expect(updatedPayslip.deliveryStatus).toBe('SENT');
  });
});
