import mongoose from 'mongoose';

const timeOffRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    typeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffType',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0.5,
    },
    requestUnit: {
      type: String,
      enum: ['FULL', 'HALF_AM', 'HALF_PM'],
      default: 'FULL',
    },
    paidDuration: {
      type: Number,
      default: null,
    },
    unpaidDuration: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REFUSED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    refusalReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const TimeOffRequest = mongoose.model('TimeOffRequest', timeOffRequestSchema);
