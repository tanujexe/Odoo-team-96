import mongoose from 'mongoose';

const payrunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    employeeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID'],
      default: 'DRAFT',
      index: true,
    },
    warnings: [
      {
        code: String,
        severity: { type: String, enum: ['BLOCKING', 'WARNING'] },
        employeeId: String,
        message: String,
      },
    ],
    totals: {
      totalGross: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      totalNet: { type: Number, default: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Payrun = mongoose.model('Payrun', payrunSchema);
