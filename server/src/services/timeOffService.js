import { TimeOffType } from '../models/TimeOffType.js';
import { TimeOffAllocation } from '../models/TimeOffAllocation.js';
import { TimeOffRequest } from '../models/TimeOffRequest.js';
import { AllocationConsumption } from '../models/AllocationConsumption.js';
import { logAudit } from './auditService.js';

// Types
export async function createTimeOffType(data) {
  const type = new TimeOffType(data);
  await type.save();
  return type;
}

export async function getTimeOffTypes(query = {}) {
  const filter = query.status ? { status: query.status } : {};
  return TimeOffType.find(filter).sort({ name: 1 });
}

// Allocations
export async function createAllocation(data) {
  const remainingAmount = data.allocatedAmount - (data.takenAmount || 0);
  const allocation = new TimeOffAllocation({
    ...data,
    remainingAmount,
    status: data.status || 'APPROVED',
  });
  await allocation.save();
  return allocation.populate('employeeId typeId');
}

export async function getAllocations(query = {}) {
  const filter = {};
  if (query.employeeId) filter.employeeId = query.employeeId;
  if (query.typeId) filter.typeId = query.typeId;
  if (query.status) filter.status = query.status;

  return TimeOffAllocation.find(filter).populate('employeeId typeId').sort({ validFrom: -1 });
}

// Requests
export async function submitRequest(data) {
  const type = await TimeOffType.findById(data.typeId);
  if (!type) {
    const err = new Error('Time off type not found');
    err.code = 'TYPE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  // Calculate duration in days if not provided
  let duration = data.duration;
  if (!duration) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end - start);
    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  const request = new TimeOffRequest({
    ...data,
    duration,
    status: type.approvalWorkflow ? 'PENDING' : 'APPROVED',
  });

  await request.save();

  // If auto-approved (no approval workflow), consume allocation
  if (!type.approvalWorkflow && type.allocationRequired) {
    await approveRequest({ requestId: request._id, actorId: data.employeeId });
  }

  return request.populate('employeeId typeId');
}

export async function getRequests(query = {}) {
  const filter = {};
  if (query.employeeId) filter.employeeId = query.employeeId;
  if (query.typeId) filter.typeId = query.typeId;
  if (query.status) filter.status = query.status;

  return TimeOffRequest.find(filter).populate('employeeId typeId approvedBy').sort({ createdAt: -1 });
}

/**
 * Transactional & Idempotent Approval of Time Off Request (BR-04)
 */
export async function approveRequest({ requestId, actorId }) {
  const request = await TimeOffRequest.findById(requestId);
  if (!request) {
    const err = new Error('Time off request not found');
    err.code = 'REQUEST_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const type = await TimeOffType.findById(request.typeId);

  // If allocation is required for this leave type
  if (type && type.allocationRequired) {
    // Find active allocation for this employee & type
    const allocation = await TimeOffAllocation.findOne({
      employeeId: request.employeeId,
      typeId: request.typeId,
      status: 'APPROVED',
      validFrom: { $lte: request.startDate },
      validTo: { $gte: request.endDate },
    });

    if (!allocation) {
      const err = new Error('No valid approved leave allocation found for requested period');
      err.code = 'INSUFFICIENT_ALLOCATION';
      err.statusCode = 400;
      throw err;
    }

    // Check idempotency: Has this request already consumed this allocation?
    const existingConsumption = await AllocationConsumption.findOne({
      requestId: request._id,
      allocationId: allocation._id,
    });

    if (!existingConsumption) {
      if (allocation.remainingAmount < request.duration) {
        const err = new Error(
          `Insufficient leave balance. Remaining: ${allocation.remainingAmount}, Requested: ${request.duration}`
        );
        err.code = 'INSUFFICIENT_BALANCE';
        err.statusCode = 400;
        throw err;
      }

      // Deduct balance
      allocation.takenAmount += request.duration;
      allocation.remainingAmount -= request.duration;
      await allocation.save();

      // Write idempotency ledger row
      await AllocationConsumption.create({
        requestId: request._id,
        allocationId: allocation._id,
        consumedAmount: request.duration,
      });
    }
  }

  request.status = 'APPROVED';
  request.approvedBy = actorId;
  request.approvedAt = new Date();
  await request.save();

  await logAudit({
    actorId,
    action: 'APPROVE_TIME_OFF_REQUEST',
    entityType: 'TimeOffRequest',
    entityId: request._id,
  });

  return request.populate('employeeId typeId approvedBy');
}

/**
 * Refuse Time Off Request
 */
export async function refuseRequest({ requestId, reason = '', actorId }) {
  const request = await TimeOffRequest.findById(requestId);
  if (!request) {
    const err = new Error('Time off request not found');
    err.code = 'REQUEST_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  request.status = 'REFUSED';
  request.refusalReason = reason;
  await request.save();

  await logAudit({
    actorId,
    action: 'REFUSE_TIME_OFF_REQUEST',
    entityType: 'TimeOffRequest',
    entityId: request._id,
  });

  return request.populate('employeeId typeId');
}

/**
 * Cancel Time Off Request and Reverse Consumed Allocation
 */
export async function cancelRequest({ requestId, actorId }) {
  const request = await TimeOffRequest.findById(requestId);
  if (!request) {
    const err = new Error('Time off request not found');
    err.code = 'REQUEST_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  // If request was approved, reverse allocation consumption
  const consumptions = await AllocationConsumption.find({ requestId: request._id });

  for (const c of consumptions) {
    const allocation = await TimeOffAllocation.findById(c.allocationId);
    if (allocation) {
      allocation.takenAmount = Math.max(0, allocation.takenAmount - c.consumedAmount);
      allocation.remainingAmount += c.consumedAmount;
      await allocation.save();
    }
    await AllocationConsumption.findByIdAndDelete(c._id);
  }

  request.status = 'CANCELLED';
  await request.save();

  await logAudit({
    actorId,
    action: 'CANCEL_TIME_OFF_REQUEST',
    entityType: 'TimeOffRequest',
    entityId: request._id,
  });

  return request.populate('employeeId typeId');
}
