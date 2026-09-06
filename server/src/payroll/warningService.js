import { Payslip } from '../models/Payslip.js';

export async function checkDuplicateFinalizedPayslip({ employeeId, periodStart, periodEnd, currentPayrunId = null }) {
  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);

  const query = {
    employeeId,
    status: { $in: ['VALIDATED', 'PAID'] },
    periodStart: { $lte: pEnd },
    periodEnd: { $gte: pStart },
  };

  if (currentPayrunId) {
    query.payrunId = { $ne: currentPayrunId };
  }

  const existing = await Payslip.findOne(query);

  if (existing) {
    return {
      code: 'DUPLICATE_PAYSLIP',
      severity: 'BLOCKING',
      employeeId: String(employeeId),
      message: `A finalized/paid payslip already exists for employee for overlapping period ${pStart.toISOString().slice(0, 10)} to ${pEnd.toISOString().slice(0, 10)}.`,
    };
  }

  return null;
}

export function checkEmployeeBankDetails(employee) {
  if (!employee || !employee.bankDetails || !employee.bankDetails.accountNumber) {
    return {
      code: 'MISSING_BANK_DETAILS',
      severity: 'WARNING',
      employeeId: String(employee?._id || employee?.id),
      message: `Employee ${employee?.name || ''} (${employee?.employeeCode || ''}) is missing bank account details.`,
    };
  }
  return null;
}

export function getWarningLabel(code) {
  switch (code) {
    case 'MISSING_BANK_DETAILS':
      return 'A/C missing';
    case 'DUPLICATE_PAYSLIP':
      return 'Duplicate';
    case 'MISSING_CONTRACT':
      return 'No contract';
    case 'AMBIGUOUS_CONTRACT':
      return 'Ambiguous contract';
    case 'MISSING_WAGE':
      return 'Missing wage';
    case 'RULE_CALCULATION_ERROR':
      return 'Calc error';
    default:
      return code || 'Warning';
  }
}

