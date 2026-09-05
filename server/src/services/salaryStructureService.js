import { SalaryStructure } from '../models/SalaryStructure.js';
import { SalaryRule } from '../models/SalaryRule.js';

export async function createSalaryStructure(data) {
  const structure = new SalaryStructure(data);
  await structure.save();
  return structure;
}

export async function updateSalaryStructure(id, data) {
  const structure = await SalaryStructure.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!structure) {
    const err = new Error('Salary Structure not found');
    err.code = 'STRUCTURE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  return structure;
}

export async function getSalaryStructures(query = {}) {
  const filter = query.active !== undefined ? { active: query.active === 'true' } : {};
  const structures = await SalaryStructure.find(filter).populate('ruleIds').sort({ name: 1 });

  // Attach count of rules
  const results = structures.map((s) => {
    const obj = s.toObject();
    obj.ruleCount = s.ruleIds ? s.ruleIds.length : 0;
    return obj;
  });

  return results;
}

export async function getSalaryStructureById(id) {
  const structure = await SalaryStructure.findById(id).populate('ruleIds');
  if (!structure) {
    const err = new Error('Salary Structure not found');
    err.code = 'STRUCTURE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  return structure;
}
