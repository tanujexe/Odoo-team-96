import { createSalaryRuleSchema } from '../validators/salaryRuleValidator.js';
import * as salaryRuleService from '../services/salaryRuleService.js';

export async function listRules(req, res, next) {
  try {
    const rules = await salaryRuleService.getSalaryRules(req.query);
    return res.success(rules);
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
    const updated = await salaryRuleService.updateSalaryRule(req.params.id, req.body);
    return res.success(updated);
  } catch (error) {
    next(error);
  }
}
