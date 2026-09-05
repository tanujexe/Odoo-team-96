import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
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
    employeeId: user.employeeId ? user.employeeId.toString() : null,
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

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: extractEmployeeId(user),
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
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: extractEmployeeId(user),
    status: user.status,
  };
}
