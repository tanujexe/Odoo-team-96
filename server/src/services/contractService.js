import mongoose from 'mongoose';
import { Contract } from '../models/Contract.js';
import { Employee } from '../models/Employee.js';

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
  const contract = await Contract.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('employeeId departmentId salaryStructureId');

  if (!contract) {
    const err = new Error('Contract not found');
    err.code = 'CONTRACT_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
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

