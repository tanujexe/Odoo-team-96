import mongoose from 'mongoose';

const timeOffTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    unit: {
      type: String,
      enum: ['DAYS', 'HOURS'],
      default: 'DAYS',
    },
    allocationRequired: {
      type: Boolean,
      default: true,
    },
    approvalWorkflow: {
      type: Boolean,
      default: true,
    },
    payrollIntegration: {
      type: Boolean,
      default: true,
    },
    allowUnpaidOverflow: {
      type: Boolean,
      default: false,
    },
    isPaid: {
      type: Boolean,
      default: true,
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

export const TimeOffType = mongoose.model('TimeOffType', timeOffTypeSchema);
