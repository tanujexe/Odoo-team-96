import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee.js';
import { Contract } from '../models/Contract.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { TimeOffRequest } from '../models/TimeOffRequest.js';

export async function createEmployee(data) {
  const existingCode = await Employee.findOne({ employeeCode: data.employeeCode.trim() });
  if (existingCode) {
    const err = new Error('Employee code already exists');
    err.code = 'DUPLICATE_EMPLOYEE_CODE';
    err.statusCode = 400;
    throw err;
  }

  const existingEmail = await Employee.findOne({ email: data.email.toLowerCase().trim() });
  if (existingEmail) {
    const err = new Error('Employee email already exists');
    err.code = 'DUPLICATE_EMPLOYEE_EMAIL';
    err.statusCode = 400;
    throw err;
  }

  const fullName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'New Employee';

  const employee = new Employee({
    employeeCode: data.employeeCode.trim(),
    name: fullName,
    email: data.email.toLowerCase().trim(),
    phone: data.phone || '',
    departmentId: (data.departmentId && mongoose.isValidObjectId(data.departmentId)) ? data.departmentId : null,
    managerId: (data.managerId && mongoose.isValidObjectId(data.managerId)) ? data.managerId : null,
    jobPosition: data.jobPosition || data.jobTitle || 'Software Engineer',
    employeeType: data.employmentType || data.employeeType || 'FULL_TIME',
    scheduleId: (data.scheduleId && mongoose.isValidObjectId(data.scheduleId)) ? data.scheduleId : null,
    status: data.status || 'ACTIVE',
  });
  await employee.save();

  // Provision User login account if password provided
  if (data.email && data.password) {
    const existingUser = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = new User({
        name: fullName,
        email: data.email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        role: data.role || 'EMPLOYEE',
        employeeId: employee._id,
        status: 'ACTIVE',
      });
      await user.save();
    }
  }

  // Provision Initial Employment Contract if contract terms provided
  if (data.wage || data.contractCode || data.workingSchedule || data.startDate || data.notes) {
    const year = new Date().getFullYear();
    const count = await Contract.countDocuments();
    const defaultCode = `CON/${year}/${String(count + 42).padStart(4, '0')}`;

    const contract = new Contract({
      contractCode: data.contractCode || defaultCode,
      employeeId: employee._id,
      startDate: data.startDate ? new Date(data.startDate) : new Date('2026-01-01'),
      endDate: data.endDate ? new Date(data.endDate) : null,
      wage: Number(data.wage || 85000),
      departmentId: employee.departmentId || null,
      position: employee.jobPosition || 'Software Engineer',
      workingSchedule: data.workingSchedule || '40 Hours / Week',
      notes: data.notes || 'This running contract is the source for payroll calculation in the active period.',
      status: data.contractStatus || 'ACTIVE',
    });
    await contract.save();
  }

  return employee.populate('departmentId managerId scheduleId');
}

export async function updateEmployee(id, data) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Employee not found');
    err.code = 'EMPLOYEE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  const employee = await Employee.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('departmentId managerId scheduleId');
  if (!employee) {
    const err = new Error('Employee not found');
    err.code = 'EMPLOYEE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  return employee;
}

export async function getEmployees(query = {}) {
  const page = parseInt(query.page || 1, 10);
  const pageSize = parseInt(query.pageSize || 20, 10);
  const skip = (page - 1) * pageSize;

  const filter = {};

  if (query.departmentId && mongoose.isValidObjectId(query.departmentId)) {
    filter.departmentId = query.departmentId;
  }
  if (query.employeeType) {
    filter.employeeType = query.employeeType;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.employeeId && mongoose.isValidObjectId(query.employeeId)) {
    filter._id = query.employeeId;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { employeeCode: searchRegex },
      { jobPosition: searchRegex },
    ];
  }

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate('departmentId managerId scheduleId')
      .skip(skip)
      .limit(pageSize)
      .sort({ name: 1 }),
    Employee.countDocuments(filter),
  ]);

  return { employees, meta: { page, pageSize, total } };
}

export async function getEmployeeById(id) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Employee not found');
    err.code = 'EMPLOYEE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const employee = await Employee.findById(id).populate('departmentId managerId scheduleId');
  if (!employee) {
    const err = new Error('Employee not found');
    err.code = 'EMPLOYEE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  // Calculate related smart action record counts
  const [contractCount, attendanceCount, timeOffCount] = await Promise.all([
    Contract.countDocuments({ employeeId: id }),
    Attendance.countDocuments({ employeeId: id }),
    TimeOffRequest.countDocuments({ employeeId: id }),
  ]);

  return {
    employee,
    smartCounts: {
      contracts: contractCount,
      attendance: attendanceCount,
      allocations: timeOffCount,
      requests: timeOffCount,
      timeOff: timeOffCount,
    },
  };
}
