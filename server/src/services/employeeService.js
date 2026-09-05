import mongoose from 'mongoose';
import { Employee } from '../models/Employee.js';
import { Contract } from '../models/Contract.js';

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

  const employee = new Employee(data);
  await employee.save();
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
  const contractCount = await Contract.countDocuments({ employeeId: id });

  return {
    employee,
    smartCounts: {
      contracts: contractCount,
      // Attendance and TimeOff counts will be appended as models are registered
      attendance: 0,
      allocations: 0,
      requests: 0,
    },
  };
}
