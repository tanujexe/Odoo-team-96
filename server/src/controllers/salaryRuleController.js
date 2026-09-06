import { createSalaryRuleSchema, updateSalaryRuleSchema } from '../validators/salaryRuleValidator.js';
import * as salaryRuleService from '../services/salaryRuleService.js';

export async function listRules(req, res, next) {
  try {
    const rules = await salaryRuleService.getSalaryRules(req.query);
    return res.success(rules);
  } catch (error) {
    next(error);
  }
}

export async function getRule(req, res, next) {
  try {
    const rule = await salaryRuleService.getSalaryRuleById(req.params.id);
    return res.success(rule);
  } catch (error) {
    next(error);
  }
}

export async function createRule(req, res, next) {
  try {
    const validated = createSalaryRuleSchema.parse(req.body);
    const rule = await salaryRuleService.createSalaryRule(validated);
    return res.success(rule, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateRule(req, res, next) {
  try {
    const validated = updateSalaryRuleSchema.parse(req.body);
    const updated = await salaryRuleService.updateSalaryRule(req.params.id, validated);
    return res.success(updated);
  } catch (error) {
    next(error);
  }
}


export async function deleteRule(req, res, next) {
  try {
    const deleted = await salaryRuleService.deleteSalaryRule(req.params.id);
    return res.success(deleted, 'Salary rule deleted successfully');
  } catch (error) {
    next(error);
  }
}

