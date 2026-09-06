import { evaluateRule } from './ruleEngine.js';

/**
 * Calculates detailed payslip rule lines and totals for a single employee contract & structure.
 *
 * @param {Object} params
 * @param {Object} params.contract - Applicable contract document
 * @param {Array<Object>} params.rules - Array of active SalaryRule documents ordered by sequence ASC
 * @param {number} [params.workedDays=22] - Worked days in period
 * @param {number} [params.leaveDays=0] - Approved leave days in period
 * @returns {{ ruleLines: Array<Object>, gross: number, deductions: number, net: number, warnings: Array<Object> }}
 */
export function calculatePayslipLines({ contract, rules = [], workedDays = 22, leaveDays = 0, unpaidDays = 0 }) {
  const warnings = [];

  if (!contract || !contract.wage) {
    return {
      ruleLines: [],
      gross: 0,
      deductions: 0,
      net: 0,
      warnings: [{ code: 'MISSING_WAGE', severity: 'BLOCKING', message: 'Contract wage is missing or invalid' }],
    };
  }

  const wage = parseFloat(contract.wage.toString ? contract.wage.toString() : contract.wage);

  // Calculation context initially contains contract & period inputs
  const context = {
    WAGE: wage,
    WORKED_DAYS: workedDays,
    LEAVE_DAYS: leaveDays,
    UNPAID_DAYS: unpaidDays,
  };

  const ruleLines = [];
  let calculatedGross = 0;
  let calculatedDeductions = 0;

  // Execute rules in sequence ascending
  const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);

  for (const rule of sortedRules) {
    try {
      const amount = evaluateRule(rule, context);

      // Store in context for subsequent rules to reference by code
      context[rule.code.toUpperCase()] = amount;

      ruleLines.push({
        ruleId: rule._id,
        code: rule.code.toUpperCase(),
        name: rule.name,
        category: rule.category,
        sequence: rule.sequence,
        computationType: rule.computationType,
        amount,
      });

      if (rule.category === 'BASIC' || rule.category === 'ALW' || rule.category === 'ALLOWANCE') {
        calculatedGross += amount;
      } else if (rule.category === 'DED' || rule.category === 'DEDUCTION') {
        calculatedDeductions += amount;
      }
    } catch (err) {
      warnings.push({
        code: 'RULE_CALCULATION_ERROR',
        severity: 'BLOCKING',
        message: `Error calculating rule '${rule.name}' (${rule.code}): ${err.message}`,
      });
      // Fallback 0 amount for broken rule
      ruleLines.push({
        ruleId: rule._id,
        code: rule.code.toUpperCase(),
        name: rule.name,
        category: rule.category,
        sequence: rule.sequence,
        computationType: rule.computationType,
        amount: 0,
      });
    }
  }

  // If a GROSS or NET rule exists in the structure, respect its explicitly evaluated formula value
  const gross = context.GROSS !== undefined ? Number(context.GROSS.toFixed(2)) : Number(calculatedGross.toFixed(2));
  const deductions = Number(calculatedDeductions.toFixed(2));
  const net = context.NET !== undefined
    ? Number(context.NET.toFixed(2))
    : Number(Math.max(0, gross - deductions).toFixed(2));

  return {
    ruleLines,
    gross,
    deductions,
    net,
    warnings,
    workedDays,
  };
}

