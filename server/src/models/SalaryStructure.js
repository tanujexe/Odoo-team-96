import mongoose from 'mongoose';

const salaryStructureSchema = new mongoose.Schema(
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
    ruleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryRule',
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);
