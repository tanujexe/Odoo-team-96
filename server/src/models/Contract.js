import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    contractCode: {
      type: String,
      trim: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      default: null,
      index: true,
    },
    wage: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    position: {
      type: String,
      default: 'Employee',
      trim: true,
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null,
    },
    workingSchedule: {
      type: String,
      default: '40 Hours / Week',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export const Contract = mongoose.model('Contract', contractSchema);
