import { SalaryRule } from '../models/SalaryRule.js';
import { SalaryStructure } from '../models/SalaryStructure.js';

export async function createSalaryRule(data) {
  const rule = new SalaryRule(data);
  await rule.save();

  // Add to parent salary structure
  await SalaryStructure.findByIdAndUpdate(data.salaryStructureId, {
    $addToSet: { ruleIds: rule._id },
  });

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

export async function getSalaryRules(query = {}) {
  const filter = {};
  if (query.salaryStructureId) filter.salaryStructureId = query.salaryStructureId;
  if (query.category) filter.category = query.category;

  return SalaryRule.find(filter).sort({ sequence: 1 });
}
