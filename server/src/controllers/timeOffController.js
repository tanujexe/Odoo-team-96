import {
  createTimeOffTypeSchema,
  createAllocationSchema,
  createRequestSchema,
} from '../validators/timeOffValidator.js';
import * as timeOffService from '../services/timeOffService.js';

// Types
export async function listTypes(req, res, next) {
  try {
    const types = await timeOffService.getTimeOffTypes(req.query);
    return res.success(types);
  } catch (error) {
    next(error);
  }
}

export async function createType(req, res, next) {
  try {
    const validated = createTimeOffTypeSchema.parse(req.body);
    const type = await timeOffService.createTimeOffType(validated);
    return res.success(type, undefined, 201);
  } catch (error) {
    next(error);
  }
}

// Balances
export async function getBalances(req, res, next) {
  try {
    const employeeId = req.query.employeeId || req.actor?.employeeId;
    const balances = await timeOffService.getTimeOffBalances(employeeId);
    return res.success(balances);
  } catch (error) {
    next(error);
  }
}

// Allocations
export async function listAllocations(req, res, next) {
  try {
    const allocations = await timeOffService.getAllocations(req.query);
    return res.success(allocations);
  } catch (error) {
    next(error);
  }
}

export async function createAllocation(req, res, next) {
  try {
    const validated = createAllocationSchema.parse(req.body);
    const allocation = await timeOffService.createAllocation(validated);
    return res.success(allocation, undefined, 201);
  } catch (error) {
    next(error);
  }
}

// Requests
export async function listRequests(req, res, next) {
  try {
    const requests = await timeOffService.getRequests(req.query);
    return res.success(requests);
  } catch (error) {
    next(error);
  }
}

export async function createRequest(req, res, next) {
  try {
    const validated = createRequestSchema.parse(req.body);
    const employeeId = validated.employeeId || req.actor.employeeId;

    if (!employeeId) {
      return res.fail('VALIDATION_ERROR', 'Employee ID is required', 400);
    }

    const request = await timeOffService.submitRequest({
      ...validated,
      employeeId,
    });

    return res.success(request, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function approveRequest(req, res, next) {
  try {
    const request = await timeOffService.approveRequest({
      requestId: req.params.id,
      actorId: req.actor.userId,
    });
    return res.success(request);
  } catch (error) {
    next(error);
  }
}

export async function refuseRequest(req, res, next) {
  try {
    const request = await timeOffService.refuseRequest({
      requestId: req.params.id,
      reason: req.body.reason || '',
      actorId: req.actor.userId,
    });
    return res.success(request);
  } catch (error) {
    next(error);
  }
}

export async function cancelRequest(req, res, next) {
  try {
    const request = await timeOffService.cancelRequest({
      requestId: req.params.id,
      actorId: req.actor.userId,
    });
    return res.success(request);
  } catch (error) {
    next(error);
  }
}
