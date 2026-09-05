import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
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

export async function adminCreateUser({ name, email, password, role, employeeCode, employeeId, jobPosition, jobTitle, departmentId }) {
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
  if (targetCodeOrId && String(targetCodeOrId).trim()) {
    const emp = await resolveOrCreateEmployee({
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
