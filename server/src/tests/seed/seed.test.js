import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { seedDatabase } from '../../seed/index.js';
import { User, ROLES } from '../../models/User.js';
import { Employee } from '../../models/Employee.js';
import { Department } from '../../models/Department.js';
import { WorkingSchedule } from '../../models/WorkingSchedule.js';
import { Contract } from '../../models/Contract.js';
import { Attendance } from '../../models/Attendance.js';
import { TimeOffAllocation } from '../../models/TimeOffAllocation.js';
import { TimeOffRequest } from '../../models/TimeOffRequest.js';
import { SalaryStructure } from '../../models/SalaryStructure.js';
import { SalaryRule } from '../../models/SalaryRule.js';
import { Payrun } from '../../models/Payrun.js';
import { Payslip } from '../../models/Payslip.js';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/peoplepay360_test';

describe('PP-11 Seed Data Generator Integration Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('should seed database with complete demo scenario data', async () => {
    const result = await seedDatabase(TEST_DB_URI);

    expect(result.users.admin).toBe('admin@peoplepay.com');
    expect(result.password).toBe('Password123!');

    const [
      userCount,
      empCount,
      deptCount,
      schedCount,
      contractCount,
      attCount,
      allocCount,
      leaveCount,
      structCount,
      ruleCount,
      payrunCount,
      payslipCount,
    ] = await Promise.all([
      User.countDocuments(),
      Employee.countDocuments(),
      Department.countDocuments(),
      WorkingSchedule.countDocuments(),
      Contract.countDocuments(),
      Attendance.countDocuments(),
      TimeOffAllocation.countDocuments(),
      TimeOffRequest.countDocuments(),
      SalaryStructure.countDocuments(),
      SalaryRule.countDocuments(),
      Payrun.countDocuments(),
      Payslip.countDocuments(),
    ]);

    // Check presence of all 5 roles
    expect(userCount).toBe(5);
    const roles = await User.distinct('role');
    expect(roles).toEqual(
      expect.arrayContaining([
        ROLES.EMPLOYEE,
        ROLES.HR_MANAGER,
        ROLES.HR_PAYROLL_USER,
        ROLES.HR_PAYROLL_MANAGER,
        ROLES.ADMIN,
      ])
    );

    expect(empCount).toBeGreaterThanOrEqual(4);
    expect(deptCount).toBe(3);
    expect(schedCount).toBe(2);
    expect(contractCount).toBeGreaterThanOrEqual(4); // Includes historical EXPIRED contract
    expect(attCount).toBeGreaterThanOrEqual(3); // Includes EXCEPTION status attendance
    expect(allocCount).toBeGreaterThanOrEqual(1);
    expect(leaveCount).toBeGreaterThanOrEqual(1);
    expect(structCount).toBeGreaterThanOrEqual(1);
    expect(ruleCount).toBe(4);
    expect(payrunCount).toBe(3); // 1 Paid past, 1 Clean computed, 1 Warning computed
    expect(payslipCount).toBeGreaterThanOrEqual(3);
  });

  it('should execute seedDatabase idempotently', async () => {
    // Run seeder a second time
    const result = await seedDatabase(TEST_DB_URI);
    expect(result.users.admin).toBe('admin@peoplepay.com');

    const userCount = await User.countDocuments();
    expect(userCount).toBe(5);
  });
});
