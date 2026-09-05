import { createContractSchema, updateContractSchema } from '../validators/contractValidator.js';
import * as contractService from '../services/contractService.js';
import { resolveApplicableContract } from '../payroll/contractResolver.js';
import { logAudit } from '../services/auditService.js';

export async function listContracts(req, res, next) {
  try {
    const result = await contractService.getContracts(req.query);
    return res.success(result.contracts, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getContract(req, res, next) {
  try {
    const contract = await contractService.getContractById(req.params.id);
    return res.success(contract);
  } catch (error) {
    next(error);
  }
}

export async function createContract(req, res, next) {
  try {
    const validated = createContractSchema.parse(req.body);
    const contract = await contractService.createContract(validated);

    await logAudit({
      actorId: req.actor.userId,
      action: 'CREATE_CONTRACT',
      entityType: 'Contract',
      entityId: contract._id,
      after: contract.toObject(),
    });

    return res.success(contract, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateContract(req, res, next) {
  try {
    const validated = updateContractSchema.parse(req.body);
    const oldContract = await contractService.getContractById(req.params.id);
    const updated = await contractService.updateContract(req.params.id, validated);

    await logAudit({
      actorId: req.actor.userId,
      action: 'UPDATE_CONTRACT',
      entityType: 'Contract',
      entityId: updated._id,
      before: oldContract.toObject(),
      after: updated.toObject(),
    });

    return res.success(updated);
  } catch (error) {
    next(error);
  }
}

export async function resolveContract(req, res, next) {
  try {
    const { employeeId, periodStart, periodEnd } = req.query;

    if (!employeeId || !periodStart || !periodEnd) {
      return res.fail(
        'VALIDATION_ERROR',
        'employeeId, periodStart, and periodEnd are required query parameters',
        400
      );
    }

    const result = await resolveApplicableContract({ employeeId, periodStart, periodEnd });
    return res.success(result);
  } catch (error) {
    next(error);
  }
}
