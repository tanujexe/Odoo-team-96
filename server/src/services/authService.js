import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Contract } from '../models/Contract.js';
import { Payslip } from '../models/Payslip.js';
import { Payrun } from '../models/Payrun.js';
import { TimeOffRequest } from '../models/TimeOffRequest.js';
import { TimeOffAllocation } from '../models/TimeOffAllocation.js';
import { AllocationConsumption } from '../models/AllocationConsumption.js';
import { config } from '../config/env.js';


export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(user) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    employeeId: extractEmployeeId(user),
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function extractEmployeeId(user) {
  if (!user.employeeId) {
    const rawId = user._doc?.employeeId || (user.get && user.get('employeeId'));
    return rawId ? rawId.toString() : null;
  }
  return user.employeeId._id ? user.employeeId._id.toString() : user.employeeId.toString();
}

export async function resolveOrCreateEmployee({ codeOrId, name, email, jobPosition, departmentId }) {
  if (!codeOrId || !String(codeOrId).trim()) return null;
  const val = String(codeOrId).trim();
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(val);

  let employee = await Employee.findOne({
    $or: [
      { employeeCode: new RegExp(`^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ...(isMongoId ? [{ _id: val }] : []),
    ],
  });

  if (!employee) {
    // If an employee with this email already exists, link & sync their employeeCode
    if (email) {
      const byEmail = await Employee.findOne({ email: email.toLowerCase().trim() });
      if (byEmail) {
        byEmail.employeeCode = val;
        await byEmail.save();
        return byEmail;
      }
    }

    // Auto-create new Employee master profile with this new Employee ID
    employee = new Employee({
      employeeCode: val,
      name: name ? name.trim() : 'New Employee',
      email: email ? email.toLowerCase().trim() : `${val.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`,
      jobPosition: jobPosition || 'Employee',
      departmentId: (departmentId && mongoose.isValidObjectId(departmentId)) ? departmentId : null,
      status: 'ACTIVE',
    });
    await employee.save();
  }

  return employee;
}

async function resolveEmployeeByCodeOrId(codeOrId) {
  if (!codeOrId || !String(codeOrId).trim()) return null;
  const val = String(codeOrId).trim();
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(val);
  const employee = await Employee.findOne({
    $or: [
      { employeeCode: new RegExp(`^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ...(isMongoId ? [{ _id: val }] : []),
    ],
  });
  if (!employee) {
    const err = new Error(`Employee Code '${val}' does not exist in the employee database`);
    err.code = 'INVALID_EMPLOYEE_CODE';
    err.statusCode = 400;
    throw err;
  }
  return employee;
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('employeeId');
  if (!user) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    err.statusCode = 401;
    throw err;
  }

  if (user.status !== 'ACTIVE') {
    const err = new Error('Account is inactive. Please contact an administrator.');
    err.code = 'ACCOUNT_INACTIVE';
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);
  const empObj = typeof user.employeeId === 'object' && user.employeeId !== null ? user.employeeId : null;

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: extractEmployeeId(user),
      employeeCode: empObj?.employeeCode || null,
      employeeName: empObj?.name || null,
      status: user.status,
    },
    token,
  };
}

export async function getUserById(userId) {
  const user = await User.findById(userId).populate('employeeId').select('-passwordHash');
  if (!user) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  const empObj = typeof user.employeeId === 'object' && user.employeeId !== null ? user.employeeId : null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: extractEmployeeId(user),
    employeeCode: empObj?.employeeCode || null,
    employeeName: empObj?.name || null,
    status: user.status,
  };
}

export async function registerUser({ name, email, password }) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.code = 'DUPLICATE_EMAIL';
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  // STRICT RULE: All new self-registered accounts DEFAULT strictly to EMPLOYEE role
  const newUser = new User({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    role: 'EMPLOYEE',
    status: 'ACTIVE',
  });

  await newUser.save();
  const token = generateToken(newUser);

  return {
    user: {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      employeeId: null,
      employeeCode: null,
      employeeName: null,
      status: newUser.status,
    },
    token,
  };
}

export async function getAllUsers() {
  const users = await User.find().select('-passwordHash').populate('employeeId').sort({ createdAt: -1 });
  return users.map((u) => {
    const empObj = typeof u.employeeId === 'object' && u.employeeId !== null ? u.employeeId : null;
    return {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      employeeId: extractEmployeeId(u),
      employeeCode: empObj?.employeeCode || null,
      employeeName: empObj?.name || null,
      createdAt: u.createdAt,
    };
  });
}

export async function updateUserRole(userId, newRole) {
  return updateUserAccount(userId, { role: newRole });
}

export async function updateUserAccount(userId, data) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User account not found');
    err.code = 'USER_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  if (data.role && data.role !== user.role) {
    if (user.email.toLowerCase() === 'admin@peoplepay.com' || user.role === 'SUPER_ADMIN') {
      const err = new Error('The System Super Admin account role is protected and cannot be changed or demoted.');
      err.code = 'SUPER_ADMIN_PROTECTED';
      err.statusCode = 403;
      throw err;
    }
    user.role = data.role;
  }
  if (data.status) user.status = data.status;

  const targetCodeOrId = data.employeeCode !== undefined ? data.employeeCode : data.employeeId;
  if (targetCodeOrId !== undefined) {
    if (!targetCodeOrId || !String(targetCodeOrId).trim()) {
      user.employeeId = null;
    } else {
      const emp = await resolveOrCreateEmployee({
        codeOrId: targetCodeOrId,
        name: user.name,
        email: user.email,
        jobPosition: data.jobPosition || data.jobTitle || 'Employee',
        departmentId: data.departmentId,
      });
      user.employeeId = emp ? emp._id : null;
    }
  }

  await user.save();
  await user.populate('employeeId');

  const empObj = typeof user.employeeId === 'object' && user.employeeId !== null ? user.employeeId : null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    employeeId: extractEmployeeId(user),
    employeeCode: empObj?.employeeCode || null,
    employeeName: empObj?.name || null,
  };
}

export async function deleteUser(userId) {
  // ── 1. Load user (fail fast if not found or protected) ──────────────────────
  const user = await User.findById(userId).populate('employeeId');
  if (!user) {
    const err = new Error('User account not found');
    err.code = 'USER_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  if (user.email.toLowerCase() === 'admin@peoplepay.com' || user.role === 'SUPER_ADMIN') {
    const err = new Error('The System Super Admin account is protected and cannot be deleted.');
    err.code = 'SUPER_ADMIN_PROTECTED';
    err.statusCode = 403;
    throw err;
  }

  const snapshot = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };

  // Resolve the linked employee ObjectId (if any)
  const empObj = typeof user.employeeId === 'object' && user.employeeId !== null
    ? user.employeeId
    : null;
  const employeeMongoId = empObj ? empObj._id : null;

  // Helper function to execute all cascade step operations
  const executeCascade = async (sessionOptions = {}) => {
    // ── Nullify references to this User ID across system records ──────────
    await Attendance.updateMany({ correctedBy: userId }, { correctedBy: null }, sessionOptions);
    await TimeOffRequest.updateMany({ approvedBy: userId }, { approvedBy: null }, sessionOptions);

    if (employeeMongoId) {
      // Nullify manager reference in other employees if this employee was a manager
      await Employee.updateMany({ managerId: employeeMongoId }, { managerId: null }, sessionOptions);

      // Find all TimeOffRequests for this employee (for AllocationConsumption cleanup)
      const timeOffRequests = await TimeOffRequest.find(
        { employeeId: employeeMongoId },
        { _id: 1 },
        sessionOptions
      );
      const requestIds = timeOffRequests.map((r) => r._id);

      if (requestIds.length > 0) {
        await AllocationConsumption.deleteMany({ requestId: { $in: requestIds } }, sessionOptions);
      }

      // Delete employee-specific records
      await TimeOffRequest.deleteMany({ employeeId: employeeMongoId }, sessionOptions);
      await TimeOffAllocation.deleteMany({ employeeId: employeeMongoId }, sessionOptions);
      await Attendance.deleteMany({ employeeId: employeeMongoId }, sessionOptions);
      await Payslip.deleteMany({ employeeId: employeeMongoId }, sessionOptions);
      await Contract.deleteMany({ employeeId: employeeMongoId }, sessionOptions);

      // Pull employee from Payrun arrays
      await Payrun.updateMany(
        { employeeIds: employeeMongoId },
        { $pull: { employeeIds: employeeMongoId } },
        sessionOptions
      );

      // Delete Employee master profile
      await Employee.findByIdAndDelete(employeeMongoId, sessionOptions);
    }

    // Delete User account document from DB
    await User.findByIdAndDelete(userId, sessionOptions);
  };

  // ── 2. Run cascade (with fallback for standalone MongoDB instances without Replica Set)
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await executeCascade({ session });
      });
    } finally {
      await session.endSession();
    }
  } catch (txErr) {
    // Fallback if standalone MongoDB does not support transactions
    await executeCascade();
  }

  return snapshot;
}


export async function adminCreateUser(params) {
  const { name, email, password, role, employeeCode, employeeId, jobPosition, jobTitle, departmentId } = params;
  const cleanEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.code = 'DUPLICATE_EMAIL';
    err.statusCode = 400;
    throw err;
  }

  const targetCodeOrId = employeeCode !== undefined ? employeeCode : employeeId;
  let linkedEmpId = null;
  let emp = null;

  if (targetCodeOrId && String(targetCodeOrId).trim()) {
    emp = await resolveOrCreateEmployee({
      codeOrId: targetCodeOrId,
      name: name.trim(),
      email: cleanEmail,
      jobPosition: jobPosition || jobTitle || (role === 'ADMIN' ? 'System Administrator' : 'Employee'),
      departmentId,
    });
    if (emp) {
      linkedEmpId = emp._id;
    }
  }

  const passwordHash = await hashPassword(password);
  const newUser = new User({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    role: role || 'EMPLOYEE',
    employeeId: linkedEmpId,
    status: 'ACTIVE',
  });

  await newUser.save();

  // Provision Initial Employment Contract if contract terms provided
  if (linkedEmpId && (params.wage || params.contractCode || params.workingSchedule || params.startDate || params.notes)) {
    const year = new Date().getFullYear();
    const count = await Contract.countDocuments();
    const defaultCode = `CON/${year}/${String(count + 42).padStart(4, '0')}`;

    const contract = new Contract({
      contractCode: params.contractCode || defaultCode,
      employeeId: linkedEmpId,
      startDate: params.startDate ? new Date(params.startDate) : new Date('2026-01-01'),
      endDate: params.endDate ? new Date(params.endDate) : null,
      wage: Number(params.wage || 85000),
      departmentId: departmentId || null,
      position: jobPosition || jobTitle || 'Employee',
      workingSchedule: params.workingSchedule || '40 Hours / Week',
      notes: params.notes || 'This running contract is the source for payroll calculation in the active period.',
      status: params.contractStatus || 'ACTIVE',
    });
    await contract.save();
  }

  await newUser.populate('employeeId');

  const empObj = typeof newUser.employeeId === 'object' && newUser.employeeId !== null ? newUser.employeeId : null;

  return {
    id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    status: newUser.status,
    employeeId: extractEmployeeId(newUser),
    employeeCode: empObj?.employeeCode || null,
    employeeName: empObj?.name || null,
  };
}
