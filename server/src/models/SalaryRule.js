import mongoose from 'mongoose';

const salaryRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['BASIC', 'ALW', 'GROSS', 'DED', 'NET'],
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 1,
    },
    computationType: {
      type: String,
      enum: ['FIXED', 'PERCENTAGE', 'FORMULA'],
      required: true,
    },
    fixedAmount: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    formula: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Code must be unique per salary structure
salaryRuleSchema.index({ salaryStructureId: 1, code: 1 }, { unique: true });

export const SalaryRule = mongoose.model('SalaryRule', salaryRuleSchema);
