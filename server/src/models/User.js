import mongoose from 'mongoose';

export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  HR_MANAGER: 'HR_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
