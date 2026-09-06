import mongoose from 'mongoose';

const ruleLineSnapshotSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryRule',
    },
    code: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    sequence: { type: Number, required: true },
    computationType: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const payslipSchema = new mongoose.Schema(
  {
    payrunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payrun',
      required: false,
      default: null,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      default: null,
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
    workedDays: {
      type: Number,
      default: 0,
    },
    ruleLines: [ruleLineSnapshotSchema],
    gross: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    net: {
      type: Number,
      default: 0,
    },
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
        message: String,
      },
    ],
    pdfRef: {
      type: String,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: ['NOT_SENT', 'SENT', 'FAILED'],
      default: 'NOT_SENT',
    },
  },
  {
    timestamps: true,
  }
);

payslipSchema.index({ employeeId: 1, periodStart: 1, periodEnd: 1, payrunId: 1 }, { unique: true });

export const Payslip = mongoose.model('Payslip', payslipSchema);
