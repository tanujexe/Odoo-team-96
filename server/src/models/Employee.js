import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
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
    },
    phone: {
      type: String,
      default: '',
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    jobPosition: {
      type: String,
      default: 'Employee',
    },
    employeeType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN'],
      default: 'FULL_TIME',
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingSchedule',
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'TERMINATED'],
      default: 'ACTIVE',
    },
    bankDetails: {
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

export const Employee = mongoose.model('Employee', employeeSchema);
