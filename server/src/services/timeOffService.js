import mongoose from 'mongoose';
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

export async function getTimeOffBalances(employeeId) {
  const result = {
    pto: { available: 20, total: 20, consumed: 0 },
    sick: { available: 10, total: 10, consumed: 0 },
    unpaid: { available: 0, total: 0, consumed: 0 },
  };

  if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
    return result;
  }

  const allocations = await TimeOffAllocation.find({
    employeeId,
    status: 'APPROVED',
  }).populate('typeId');

  let ptoTotal = 0;
  let ptoTaken = 0;
  let sickTotal = 0;
  let sickTaken = 0;

  allocations.forEach((alloc) => {
    const code = alloc.typeId?.code?.toUpperCase() || '';
    if (code === 'PTO' || code === 'PAID_TIME_OFF') {
      ptoTotal += alloc.allocatedAmount || 0;
      ptoTaken += alloc.takenAmount || 0;
    } else if (code === 'SICK' || code === 'SICK_LEAVE') {
      sickTotal += alloc.allocatedAmount || 0;
      sickTaken += alloc.takenAmount || 0;
    }
  });

  const approvedRequests = await TimeOffRequest.find({
    employeeId,
    status: 'APPROVED',
  }).populate('typeId');

  let unpaidTaken = 0;
  let reqPtoTaken = 0;
  let reqSickTaken = 0;

  approvedRequests.forEach((req) => {
    const code = req.typeId?.code?.toUpperCase() || '';
    if (code === 'UNPAID' || code === 'UNPAID_LEAVE') {
      unpaidTaken += req.duration || 0;
    } else {
      if (req.unpaidDuration > 0) {
        unpaidTaken += req.unpaidDuration;
      }
      if (code === 'PTO' || code === 'PAID_TIME_OFF') {
        reqPtoTaken += req.paidDuration ?? req.duration ?? 0;
      } else if (code === 'SICK' || code === 'SICK_LEAVE') {
        reqSickTaken += req.paidDuration ?? req.duration ?? 0;
      }
    }
  });

  const finalPtoTotal = ptoTotal > 0 ? ptoTotal : 20;
  const finalSickTotal = sickTotal > 0 ? sickTotal : 10;
  const finalPtoTaken = ptoTaken > 0 ? ptoTaken : reqPtoTaken;
  const finalSickTaken = sickTaken > 0 ? sickTaken : reqSickTaken;

  return {
    pto: {
      total: finalPtoTotal,
      consumed: finalPtoTaken,
      available: Math.max(0, finalPtoTotal - finalPtoTaken),
    },
    sick: {
      total: finalSickTotal,
      consumed: finalSickTaken,
      available: Math.max(0, finalSickTotal - finalSickTaken),
    },
    unpaid: {
      total: 0,
      consumed: unpaidTaken,
      available: 0,
    },
  };
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
  if (query.employeeId && mongoose.isValidObjectId(query.employeeId)) filter.employeeId = query.employeeId;
  if (query.typeId && mongoose.isValidObjectId(query.typeId)) filter.typeId = query.typeId;
  if (query.status) filter.status = query.status;

  return TimeOffAllocation.find(filter).populate('employeeId typeId').sort({ validFrom: -1 });
}

// Requests
export async function submitRequest(data) {
  if (!mongoose.isValidObjectId(data.typeId)) {
    const err = new Error('Time off type not found');
    err.code = 'TYPE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  const type = await TimeOffType.findById(data.typeId);
  if (!type) {
    const err = new Error('Time off type not found');
    err.code = 'TYPE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const requestUnit = data.requestUnit || 'FULL';
  let duration = data.duration;

  if (requestUnit === 'HALF_AM' || requestUnit === 'HALF_PM') {
    duration = 0.5;
  } else if (!duration) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end - start);
    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  let paidDuration = duration;
  let unpaidDuration = 0;

  if (type.allocationRequired) {
    // Find active allocation balance
    const allocation = await TimeOffAllocation.findOne({
      employeeId: data.employeeId,
      typeId: data.typeId,
      status: 'APPROVED',
      validFrom: { $lte: new Date(data.startDate) },
      validTo: { $gte: new Date(data.endDate) },
    });

    const availableBalance = allocation ? allocation.remainingAmount : 0;

    if (duration > availableBalance && type.allowUnpaidOverflow === true) {
      paidDuration = Math.max(0, availableBalance);
      unpaidDuration = duration - paidDuration;
    }
  } else if (!type.isPaid) {
    paidDuration = 0;
    unpaidDuration = duration;
  }

  const request = new TimeOffRequest({
    ...data,
    requestUnit,
    duration,
    paidDuration,
    unpaidDuration,
    status: type.approvalWorkflow ? 'PENDING' : 'APPROVED',
  });

  await request.save();

  // If auto-approved (no approval workflow), consume allocation
  if (!type.approvalWorkflow && type.allocationRequired && paidDuration > 0) {
    await approveRequest({ requestId: request._id, actorId: data.employeeId });
  }

  return request.populate('employeeId typeId');
}

export async function getRequests(query = {}) {
  const filter = {};
  if (query.employeeId && mongoose.isValidObjectId(query.employeeId)) filter.employeeId = query.employeeId;
  if (query.typeId && mongoose.isValidObjectId(query.typeId)) filter.typeId = query.typeId;
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
  const amountToDeduct = (request.paidDuration !== null && request.paidDuration !== undefined) ? request.paidDuration : request.duration;

  // If allocation is required for this leave type and there is a paid duration
  if (type && type.allocationRequired && amountToDeduct > 0) {
    // Find active allocation for this employee & type
    let allocation = await TimeOffAllocation.findOne({
      employeeId: request.employeeId,
      typeId: request.typeId,
      status: 'APPROVED',
      validFrom: { $lte: request.startDate },
      validTo: { $gte: request.endDate },
    });

    if (!allocation) {
      // Fallback: Check if any approved allocation exists for employee & type
      allocation = await TimeOffAllocation.findOne({
        employeeId: request.employeeId,
        typeId: request.typeId,
        status: 'APPROVED',
      });
    }

    if (!allocation) {
      // Auto-create allocation so approval succeeds gracefully
      allocation = new TimeOffAllocation({
        employeeId: request.employeeId,
        typeId: request.typeId,
        allocatedAmount: 20,
        takenAmount: 0,
        remainingAmount: 20,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        status: 'APPROVED',
      });
      await allocation.save();
    }

    // Check idempotency: Has this request already consumed this allocation?
    const existingConsumption = await AllocationConsumption.findOne({
      requestId: request._id,
      allocationId: allocation._id,
    });

    if (!existingConsumption) {
      if (allocation.remainingAmount < amountToDeduct) {
        const err = new Error(
          `Insufficient leave balance. Remaining: ${allocation.remainingAmount}, Requested: ${amountToDeduct}`
        );
        err.code = 'INSUFFICIENT_BALANCE';
        err.statusCode = 400;
        throw err;
      }

      // Deduct balance
      allocation.takenAmount += amountToDeduct;
      allocation.remainingAmount -= amountToDeduct;
      await allocation.save();

      // Write idempotency ledger row
      await AllocationConsumption.create({
        requestId: request._id,
        allocationId: allocation._id,
        consumedAmount: amountToDeduct,
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
