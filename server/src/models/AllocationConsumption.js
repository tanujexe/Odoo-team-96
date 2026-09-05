import mongoose from 'mongoose';

const allocationConsumptionSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffRequest',
      required: true,
      index: true,
    },
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffAllocation',
      required: true,
    },
    consumedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

allocationConsumptionSchema.index({ requestId: 1, allocationId: 1 }, { unique: true });

export const AllocationConsumption = mongoose.model('AllocationConsumption', allocationConsumptionSchema);
