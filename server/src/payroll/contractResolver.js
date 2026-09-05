import { Contract } from '../models/Contract.js';
import '../models/SalaryStructure.js';

/**
 * Resolves the applicable employment contract for a given employee during a specified payroll period.
 *
 * Business Rules (BR-01, BR-02):
 * - Contract must be ACTIVE.
 * - Contract validity must overlap the payroll period:
 *   startDate <= periodEnd AND (endDate IS NULL OR endDate >= periodStart)
 * - If 0 active contracts match => returns BLOCKING warning `MISSING_CONTRACT`.
 * - If >1 active contracts match => returns BLOCKING warning `AMBIGUOUS_CONTRACT`.
 * - If exactly 1 matches => returns resolved contract.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.employeeId
 * @param {Date|string} params.periodStart
 * @param {Date|string} params.periodEnd
 * @returns {Promise<{ contract: Object|null, warning: Object|null }>}
 */
export async function resolveApplicableContract({ employeeId, periodStart, periodEnd }) {
  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);

  // Find all ACTIVE contracts for the employee that overlap [periodStart, periodEnd]
  const overlappingContracts = await Contract.find({
    employeeId,
    status: 'ACTIVE',
    startDate: { $lte: pEnd },
    $or: [{ endDate: null }, { endDate: { $gte: pStart } }],
  }).populate('departmentId salaryStructureId');

  if (overlappingContracts.length === 0) {
    return {
      contract: null,
      warning: {
        code: 'MISSING_CONTRACT',
        severity: 'BLOCKING',
        employeeId: String(employeeId),
        message: `No active contract found applicable for period ${pStart.toISOString().slice(0, 10)} to ${pEnd.toISOString().slice(0, 10)}.`,
      },
    };
  }

  if (overlappingContracts.length > 1) {
    return {
      contract: null,
      warning: {
        code: 'AMBIGUOUS_CONTRACT',
        severity: 'BLOCKING',
        employeeId: String(employeeId),
        message: `Multiple active contracts (${overlappingContracts.length}) overlap payroll period ${pStart.toISOString().slice(0, 10)} to ${pEnd.toISOString().slice(0, 10)}. Ambiguity must be resolved before payroll computation.`,
      },
    };
  }

  return {
    contract: overlappingContracts[0],
    warning: null,
  };
}
