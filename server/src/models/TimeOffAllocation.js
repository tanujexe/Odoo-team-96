import mongoose from 'mongoose';

const timeOffAllocationSchema = new mongoose.Schema(
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
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    takenAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'REFUSED'],
      default: 'DRAFT',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TimeOffAllocation = mongoose.model('TimeOffAllocation', timeOffAllocationSchema);
