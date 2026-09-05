import { Contract } from '../models/Contract.js';

export async function createContract(data) {
  const contract = new Contract(data);
  await contract.save();
  return contract.populate('employeeId departmentId salaryStructureId');
}

export async function updateContract(id, data) {
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
  if (query.employeeId) {
    filter.employeeId = query.employeeId;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.departmentId) {
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
  const contract = await Contract.findById(id).populate('employeeId departmentId salaryStructureId');
  if (!contract) {
    const err = new Error('Contract not found');
    err.code = 'CONTRACT_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  return contract;
}
