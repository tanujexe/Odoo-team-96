import { SalaryStructure } from '../models/SalaryStructure.js';
import { SalaryRule } from '../models/SalaryRule.js';
import { Contract } from '../models/Contract.js';

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

export async function deleteSalaryStructure(id) {
  const activeContractsCount = await Contract.countDocuments({
    salaryStructureId: id,
    status: 'ACTIVE',
  });

  if (activeContractsCount > 0) {
    const err = new Error(`Cannot delete salary structure assigned to ${activeContractsCount} active employee contract(s).`);
    err.code = 'STRUCTURE_IN_USE';
    err.statusCode = 400;
    throw err;
  }

  const structure = await SalaryStructure.findByIdAndDelete(id);
  if (!structure) {
    const err = new Error('Salary Structure not found');
    err.code = 'STRUCTURE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  // Delete associated rules
  await SalaryRule.deleteMany({ salaryStructureId: id });
  return structure;
}

export async function getSalaryStructures(query = {}) {
  const filter = query.active !== undefined ? { active: query.active === 'true' } : {};
  const structures = await SalaryStructure.find(filter).populate('ruleIds').sort({ name: 1 });

  // Get employee counts per structure from active contracts
  const structureIds = structures.map((s) => s._id);
  const contractCounts = await Contract.aggregate([
    { $match: { salaryStructureId: { $in: structureIds }, status: 'ACTIVE' } },
    { $group: { _id: '$salaryStructureId', count: { $sum: 1 } } },
  ]);

  const contractMap = {};
  contractCounts.forEach((c) => {
    contractMap[c._id.toString()] = c.count;
  });

  const results = structures.map((s) => {
    const obj = s.toObject();
    obj.ruleCount = s.ruleIds ? s.ruleIds.length : 0;
    obj.employeeCount = contractMap[s._id.toString()] || 0;
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
  const employeeCount = await Contract.countDocuments({
    salaryStructureId: id,
    status: 'ACTIVE',
  });
  const obj = structure.toObject();
  obj.ruleCount = structure.ruleIds ? structure.ruleIds.length : 0;
  obj.employeeCount = employeeCount;
  return obj;
}

