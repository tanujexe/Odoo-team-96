import mongoose from 'mongoose';
import { SalaryRule } from '../models/SalaryRule.js';
import { SalaryStructure } from '../models/SalaryStructure.js';

export async function createSalaryRule(data) {
  const rule = new SalaryRule(data);
  await rule.save();

  // Add to parent salary structure if valid ObjectId
  if (mongoose.Types.ObjectId.isValid(data.salaryStructureId)) {
    await SalaryStructure.findByIdAndUpdate(data.salaryStructureId, {
      $addToSet: { ruleIds: rule._id },
    });
  }

  return rule;
}

export async function updateSalaryRule(id, data) {
  const rule = await SalaryRule.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!rule) {
    const err = new Error('Salary Rule not found');
    err.code = 'RULE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  return rule;
}

export async function deleteSalaryRule(id) {
  const rule = await SalaryRule.findByIdAndDelete(id);
  if (!rule) {
    const err = new Error('Salary Rule not found');
    err.code = 'RULE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  if (rule.salaryStructureId && mongoose.Types.ObjectId.isValid(rule.salaryStructureId)) {
    await SalaryStructure.findByIdAndUpdate(rule.salaryStructureId, {
      $pull: { ruleIds: rule._id },
    });
  }
  return rule;
}

export async function getSalaryRules(query = {}) {
  const filter = {};
  const structureId = query.salaryStructureId || query.structureId;

  if (structureId) {
    if (mongoose.Types.ObjectId.isValid(structureId)) {
      filter.salaryStructureId = structureId;
    } else {
      // Return empty if not a valid ObjectId to prevent CastError
      return [];
    }
  }

  if (query.category) filter.category = query.category;

  return SalaryRule.find(filter).sort({ sequence: 1 });
}

