import mongoose from 'mongoose';
import { Contract } from '../models/Contract.js';
import { Employee } from '../models/Employee.js';

export async function checkContractOverlap(employeeId, startDate, endDate = null, excludeContractId = null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const query = {
    employeeId,
    status: 'ACTIVE',
  };

  if (excludeContractId) {
    query._id = { $ne: excludeContractId };
  }

  if (end) {
    query.startDate = { $lte: end };
    query.$or = [{ endDate: null }, { endDate: { $gte: start } }];
  } else {
    query.$or = [{ endDate: null }, { endDate: { $gte: start } }];
  }

  const overlapping = await Contract.findOne(query);
  if (overlapping) {
    const err = new Error(
      `An active contract (${overlapping.contractCode || overlapping._id}) already exists with an overlapping period for this employee.`
    );
    err.code = 'CONTRACT_OVERLAP_ERROR';
    err.statusCode = 400;
    throw err;
  }
}

export async function createContract(data) {
  const payload = { ...data };

  if (payload.endDate === '') {
    payload.endDate = null;
  }

  if (payload.employeeId && mongoose.isValidObjectId(payload.employeeId)) {
    const emp = await Employee.findById(payload.employeeId);
    if (emp) {
      if (!payload.departmentId && emp.departmentId) {
        payload.departmentId = emp.departmentId;
      }
      if (!payload.position && emp.jobPosition) {
        payload.position = emp.jobPosition;
      }
    }

    if (payload.status === 'ACTIVE' || !payload.status) {
      await checkContractOverlap(payload.employeeId, payload.startDate, payload.endDate);
    }
  }

  if (!payload.contractCode) {
    const year = new Date().getFullYear();
    const count = await Contract.countDocuments();
    payload.contractCode = `CNT-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  const contract = new Contract(payload);
  await contract.save();
  return contract.populate('employeeId departmentId salaryStructureId');
}

export async function updateContract(id, data) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Contract not found');
    err.code = 'CONTRACT_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const existing = await Contract.findById(id);
  if (!existing) {
    const err = new Error('Contract not found');
    err.code = 'CONTRACT_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const employeeId = data.employeeId || existing.employeeId;
  const startDate = data.startDate || existing.startDate;
  const endDate = data.endDate !== undefined ? (data.endDate === '' ? null : data.endDate) : existing.endDate;
  const status = data.status || existing.status;

  if (status === 'ACTIVE') {
    await checkContractOverlap(employeeId, startDate, endDate, id);
  }

  const updatePayload = { ...data };
  if (updatePayload.endDate === '') {
    updatePayload.endDate = null;
  }

  const contract = await Contract.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
    .populate('employeeId departmentId salaryStructureId');

  return contract;
}

export async function getContracts(query = {}) {
  const page = parseInt(query.page || 1, 10);
  const pageSize = parseInt(query.pageSize || 20, 10);
  const skip = (page - 1) * pageSize;

  const filter = {};
  if (query.employeeId && mongoose.isValidObjectId(query.employeeId)) {
    filter.employeeId = query.employeeId;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.departmentId && mongoose.isValidObjectId(query.departmentId)) {
    filter.departmentId = query.departmentId;
  }

  const [contracts, total] = await Promise.all([
    Contract.find(filter)
      .populate('employeeId departmentId salaryStructureId')
      .skip(skip)
      .limit(pageSize)
      .sort({ startDate: -1 }),
    Contract.countDocuments(filter),
  ]);

  return { contracts, meta: { page, pageSize, total } };
}

export async function getContractById(id) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Contract not found');
    err.code = 'CONTRACT_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  const contract = await Contract.findById(id).populate('employeeId departmentId salaryStructureId');
  if (!contract) {
    const err = new Error('Contract not found');
    err.code = 'CONTRACT_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  return contract;
}

