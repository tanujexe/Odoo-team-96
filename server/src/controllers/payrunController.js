import { createPayrunSchema } from '../validators/payrunValidator.js';
import * as payrollService from '../services/payrollService.js';

export async function listPayruns(req, res, next) {
  try {
    const result = await payrollService.getPayruns(req.query);
    return res.success(result.payruns, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getPayrun(req, res, next) {
  try {
    const result = await payrollService.getPayrunById(req.params.id);
    return res.success(result);
  } catch (error) {
    next(error);
  }
}

export async function createPayrun(req, res, next) {
  try {
    const validated = createPayrunSchema.parse(req.body);
    const payrun = await payrollService.createPayrun({
      ...validated,
      actorId: req.actor.userId,
    });
    return res.success(payrun, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function computePayrun(req, res, next) {
  try {
    const result = await payrollService.computePayrun(req.params.id);
    return res.success(result);
  } catch (error) {
    next(error);
  }
}

export async function validatePayrun(req, res, next) {
  try {
    const payrun = await payrollService.validatePayrun(req.params.id);
    return res.success(payrun);
  } catch (error) {
    next(error);
  }
}

export async function markPayrunPaid(req, res, next) {
  try {
    const payrun = await payrollService.markPayrunPaid(req.params.id, req.actor.userId);
    return res.success(payrun);
  } catch (error) {
    next(error);
  }
}
