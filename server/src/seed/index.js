import mongoose from 'mongoose';
import { User, ROLES } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Department } from '../models/Department.js';
import { WorkingSchedule } from '../models/WorkingSchedule.js';
import { Contract } from '../models/Contract.js';
import { Attendance } from '../models/Attendance.js';
import { TimeOffType } from '../models/TimeOffType.js';
import { TimeOffAllocation } from '../models/TimeOffAllocation.js';
import { TimeOffRequest } from '../models/TimeOffRequest.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { SalaryRule } from '../models/SalaryRule.js';
import { Payrun } from '../models/Payrun.js';
import { Payslip } from '../models/Payslip.js';
import { hashPassword } from '../services/authService.js';
import { computePayrun, markPayrunPaid, validatePayrun } from '../services/payrollService.js';
import { config } from '../config/env.js';

export async function seedDatabase(uri = config.mongoUri) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  console.log('[Seeder] Clearing existing database collections...');
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Department.deleteMany({}),
    WorkingSchedule.deleteMany({}),
    Contract.deleteMany({}),
    Attendance.deleteMany({}),
    TimeOffType.deleteMany({}),
    TimeOffAllocation.deleteMany({}),
    TimeOffRequest.deleteMany({}),
    SalaryStructure.deleteMany({}),
    SalaryRule.deleteMany({}),
    Payrun.deleteMany({}),
    Payslip.deleteMany({}),
  ]);

  console.log('[Seeder] Seeding Departments...');
  const [deptEng, deptHR, deptFin] = await Department.create([
    { name: 'Engineering', code: 'ENG', status: 'ACTIVE' },
    { name: 'Human Resources', code: 'HR', status: 'ACTIVE' },
    { name: 'Finance', code: 'FIN', status: 'ACTIVE' },
  ]);

  console.log('[Seeder] Seeding Working Schedules...');
  const [sched40h, sched20h] = await WorkingSchedule.create([
    {
      name: 'Standard 40h Shift',
      type: 'FULL_TIME',
      weeklyHours: 40,
      days: [
        { day: 'MON', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { day: 'TUE', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { day: 'WED', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { day: 'THU', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { day: 'FRI', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      ],
    },
    {
      name: 'Part-Time 20h Shift',
      type: 'PART_TIME',
      weeklyHours: 20,
      days: [
        { day: 'MON', startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
        { day: 'WED', startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
        { day: 'FRI', startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
      ],
    },
  ]);

  console.log('[Seeder] Seeding Employees...');
  const [empJohn, empJane, empCharlie, empWarn] = await Employee.create([
    {
      employeeCode: 'EMP001',
      name: 'John Developer',
      email: 'employee@peoplepay.com',
      phone: '+1-555-0101',
      departmentId: deptEng._id,
      jobPosition: 'Senior Full Stack Engineer',
      employeeType: 'FULL_TIME',
      scheduleId: sched40h._id,
      bankDetails: { accountNumber: '9876543210', bankName: 'Global Bank', ifscCode: 'GLOB000123' },
    },
    {
      employeeCode: 'EMP002',
      name: 'Jane HR Specialist',
      email: 'hrmanager@peoplepay.com',
      phone: '+1-555-0102',
      departmentId: deptHR._id,
      jobPosition: 'HR Manager',
      employeeType: 'FULL_TIME',
      scheduleId: sched40h._id,
      bankDetails: { accountNumber: '8765432109', bankName: 'Metro Bank', ifscCode: 'METR000456' },
    },
    {
      employeeCode: 'EMP003',
      name: 'Charlie Finance',
      email: 'payrollmanager@peoplepay.com',
      phone: '+1-555-0103',
      departmentId: deptFin._id,
      jobPosition: 'Payroll Administrator',
      employeeType: 'FULL_TIME',
      scheduleId: sched40h._id,
      bankDetails: { accountNumber: '7654321098', bankName: 'First National', ifscCode: 'FIRST000789' },
    },
    {
      employeeCode: 'EMP004',
      name: 'David NoContract',
      email: 'david.warning@peoplepay.com',
      phone: '+1-555-0104',
      departmentId: deptEng._id,
      jobPosition: 'Junior Intern',
      employeeType: 'INTERN',
      scheduleId: sched20h._id,
    },
  ]);

  console.log('[Seeder] Seeding Users for all 5 Roles (Password: Password123!)...');
  const hashedPass = await hashPassword('Password123!');

  const [userEmp, userHR, userPUser, userPManager, userAdmin] = await User.create([
    {
      name: 'John Developer',
      email: 'employee@peoplepay.com',
      passwordHash: hashedPass,
      role: ROLES.EMPLOYEE,
      employeeId: empJohn._id,
    },
    {
      name: 'Jane HR Specialist',
      email: 'hrmanager@peoplepay.com',
      passwordHash: hashedPass,
      role: ROLES.HR_MANAGER,
      employeeId: empJane._id,
    },
    {
      name: 'Payroll User Account',
      email: 'payrolluser@peoplepay.com',
      passwordHash: hashedPass,
      role: ROLES.HR_PAYROLL_USER,
      employeeId: empCharlie._id,
    },
    {
      name: 'Charlie Payroll Manager',
      email: 'payrollmanager@peoplepay.com',
      passwordHash: hashedPass,
      role: ROLES.HR_PAYROLL_MANAGER,
      employeeId: empCharlie._id,
    },
    {
      name: 'System Admin',
      email: 'admin@peoplepay.com',
      passwordHash: hashedPass,
      role: ROLES.ADMIN,
    },
  ]);

  console.log('[Seeder] Seeding Salary Structure & Rules...');
  const execStructure = await SalaryStructure.create({
    name: 'Executive & Tech Standard Structure',
    code: 'EXEC_STD',
    active: true,
  });

  const rule1 = await SalaryRule.create({
    name: 'Basic Salary',
    code: 'BASIC',
    salaryStructureId: execStructure._id,
    category: 'BASIC',
    sequence: 1,
    computationType: 'PERCENTAGE',
    percentage: 60, // 60% of Wage
  });

  const rule2 = await SalaryRule.create({
    name: 'House Rent Allowance (HRA)',
    code: 'HRA',
    salaryStructureId: execStructure._id,
    category: 'ALW',
    sequence: 2,
    computationType: 'FORMULA',
    formula: 'BASIC * 0.4', // 40% of Basic
  });

  const rule3 = await SalaryRule.create({
    name: 'Medical & Transport Allowance',
    code: 'ALW_MED',
    salaryStructureId: execStructure._id,
    category: 'ALW',
    sequence: 3,
    computationType: 'FIXED',
    fixedAmount: 500,
  });

  const rule4 = await SalaryRule.create({
    name: 'Tax Deduction',
    code: 'TAX',
    salaryStructureId: execStructure._id,
    category: 'DED',
    sequence: 4,
    computationType: 'PERCENTAGE',
    percentage: 10, // 10% of Basic
  });

  execStructure.ruleIds = [rule1._id, rule2._id, rule3._id, rule4._id];
  await execStructure.save();

  console.log('[Seeder] Seeding Contracts (with historical & current active contracts)...');
  // Historical expired contract for John
  await Contract.create({
    employeeId: empJohn._id,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    wage: 6000,
    departmentId: deptEng._id,
    position: 'Junior Engineer',
    salaryStructureId: execStructure._id,
    status: 'EXPIRED',
  });

  // Current active contracts
  await Contract.create([
    {
      employeeId: empJohn._id,
      startDate: new Date('2026-01-01'),
      endDate: null,
      wage: 10000,
      departmentId: deptEng._id,
      position: 'Senior Full Stack Engineer',
      salaryStructureId: execStructure._id,
      status: 'ACTIVE',
    },
    {
      employeeId: empJane._id,
      startDate: new Date('2026-01-01'),
      endDate: null,
      wage: 8500,
      departmentId: deptHR._id,
      position: 'HR Manager',
      salaryStructureId: execStructure._id,
      status: 'ACTIVE',
    },
    {
      employeeId: empCharlie._id,
      startDate: new Date('2026-01-01'),
      endDate: null,
      wage: 9000,
      departmentId: deptFin._id,
      position: 'Payroll Administrator',
      salaryStructureId: execStructure._id,
      status: 'ACTIVE',
    },
  ]);

  console.log('[Seeder] Seeding Attendance Records (including missing checkout exception)...');
  await Attendance.create([
    {
      employeeId: empJohn._id,
      date: new Date('2026-09-01T00:00:00.000Z'),
      checkIn: new Date('2026-09-01T08:55:00.000Z'),
      checkOut: new Date('2026-09-01T18:05:00.000Z'),
      workedHours: 8.16,
      status: 'PRESENT',
    },
    {
      employeeId: empJohn._id,
      date: new Date('2026-09-02T00:00:00.000Z'),
      checkIn: new Date('2026-09-02T09:15:00.000Z'),
      checkOut: new Date('2026-09-02T18:00:00.000Z'),
      workedHours: 7.75,
      status: 'LATE',
    },
    // Missing check-out exception record
    {
      employeeId: empJohn._id,
      date: new Date('2026-09-03T00:00:00.000Z'),
      checkIn: new Date('2026-09-03T09:00:00.000Z'),
      checkOut: null,
      workedHours: 0,
      status: 'EXCEPTION',
    },
  ]);

  console.log('[Seeder] Seeding Time Off Types, Allocations & Requests...');
  const ptoType = await TimeOffType.create({
    name: 'Paid Time Off',
    code: 'PTO',
    unit: 'DAYS',
    allocationRequired: true,
    approvalWorkflow: true,
    status: 'ACTIVE',
  });

  await TimeOffAllocation.create({
    employeeId: empJohn._id,
    typeId: ptoType._id,
    allocatedAmount: 15,
    takenAmount: 2,
    remainingAmount: 13,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    status: 'APPROVED',
  });

  await TimeOffRequest.create({
    employeeId: empJohn._id,
    typeId: ptoType._id,
    startDate: new Date('2026-08-10'),
    endDate: new Date('2026-08-11'),
    duration: 2,
    status: 'APPROVED',
    approvedBy: userHR._id,
    approvedAt: new Date('2026-08-05'),
  });

  console.log('[Seeder] Seeding Payruns & Historical Paid Payslips...');
  // 1. Historical Paid Payrun (August 2026) for trend chart aggregates
  const pastRun = await Payrun.create({
    name: 'August 2026 Regular Payrun',
    salaryStructureId: execStructure._id,
    periodStart: new Date('2026-08-01'),
    periodEnd: new Date('2026-08-31'),
    employeeIds: [empJohn._id, empJane._id, empCharlie._id],
    status: 'DRAFT',
    createdBy: userPManager._id,
  });

  await computePayrun(pastRun._id);
  await validatePayrun(pastRun._id);
  await markPayrunPaid(pastRun._id, userPManager._id);

  // 2. Clean Ready-to-Process Payrun (September 2026)
  const currentRun = await Payrun.create({
    name: 'September 2026 Regular Payrun',
    salaryStructureId: execStructure._id,
    periodStart: new Date('2026-09-01'),
    periodEnd: new Date('2026-09-30'),
    employeeIds: [empJohn._id, empJane._id, empCharlie._id],
    status: 'DRAFT',
    createdBy: userPManager._id,
  });
  await computePayrun(currentRun._id);

  // 3. Demo Payrun with Seeded Warning Scenario (including Employee without contract)
  const warningRun = await Payrun.create({
    name: 'September 2026 Intern Payrun (Warning Demo)',
    salaryStructureId: execStructure._id,
    periodStart: new Date('2026-09-01'),
    periodEnd: new Date('2026-09-30'),
    employeeIds: [empJohn._id, empWarn._id], // empWarn has NO contract!
    status: 'DRAFT',
    createdBy: userPManager._id,
  });
  await computePayrun(warningRun._id);

  console.log('[Seeder] Database seeding completed successfully!');

  return {
    users: {
      admin: 'admin@peoplepay.com',
      hrManager: 'hrmanager@peoplepay.com',
      payrollUser: 'payrolluser@peoplepay.com',
      payrollManager: 'payrollmanager@peoplepay.com',
      employee: 'employee@peoplepay.com',
    },
    password: 'Password123!',
  };
}

// Allow direct CLI execution: node src/seed/index.js
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  seedDatabase()
    .then((info) => {
      console.log('\n[Seeder Execution Result]');
      console.log('Seed users created:');
      console.log(info.users);
      console.log(`Password: ${info.password}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seeder Failed]', err);
      process.exit(1);
    });
}
