import { createSalaryStructureSchema } from '../validators/salaryStructureValidator.js';
import * as salaryStructureService from '../services/salaryStructureService.js';

export async function listStructures(req, res, next) {
  try {
    const structures = await salaryStructureService.getSalaryStructures(req.query);
    return res.success(structures);
  } catch (error) {
    next(error);
  }
}

export async function getStructure(req, res, next) {
  try {
    const structure = await salaryStructureService.getSalaryStructureById(req.params.id);
    return res.success(structure);
  } catch (error) {
    next(error);
  }
}

export async function createStructure(req, res, next) {
  try {
    const validated = createSalaryStructureSchema.parse(req.body);
    const structure = await salaryStructureService.createSalaryStructure(validated);
    return res.success(structure, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateStructure(req, res, next) {
  try {
    const updated = await salaryStructureService.updateSalaryStructure(req.params.id, req.body);
    return res.success(updated);
  } catch (error) {
    next(error);
  }
}
