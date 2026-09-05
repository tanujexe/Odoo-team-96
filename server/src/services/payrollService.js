import { Payrun } from '../models/Payrun.js';
import { Payslip } from '../models/Payslip.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { SalaryRule } from '../models/SalaryRule.js';
import { Employee } from '../models/Employee.js';
import { resolveApplicableContract } from '../payroll/contractResolver.js';
import { calculatePayslipLines } from '../payroll/calculator.js';
import { checkDuplicateFinalizedPayslip, checkEmployeeBankDetails } from '../payroll/warningService.js';
import { logAudit } from './auditService.js';

export async function createPayrun({ salaryStructureId, periodStart, periodEnd, employeeIds, name, actorId }) {
  if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    const err = new Error('Explicit employee selection is required to create a Payrun');
    err.code = 'EMPLOYEES_REQUIRED';
    err.statusCode = 400;
    throw err;
  }

  const structure = await SalaryStructure.findById(salaryStructureId);
  if (!structure) {
    const err = new Error('Salary Structure not found');
    err.code = 'STRUCTURE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);

  const payrunName =
    name || `${structure.name} (${pStart.toISOString().slice(0, 7)})`;

  const payrun = new Payrun({
    name: payrunName,
    salaryStructureId,
    periodStart: pStart,
    periodEnd: pEnd,
    employeeIds,
    status: 'DRAFT',
    createdBy: actorId,
  });

  await payrun.save();

  await logAudit({
    actorId,
    action: 'CREATE_PAYRUN',
    entityType: 'Payrun',
    entityId: payrun._id,
  });

  return payrun.populate('salaryStructureId employeeIds createdBy');
}

export async function computePayrun(payrunId) {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.code = 'PAYRUN_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const rules = await SalaryRule.find({
    salaryStructureId: payrun.salaryStructureId,
    active: true,
  }).sort({ sequence: 1 });

  const globalWarnings = [];
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  // Clear existing payslips for this payrun if re-computing
  await Payslip.deleteMany({ payrunId });

  const generatedPayslips = [];

  for (const empId of payrun.employeeIds) {
    const employee = await Employee.findById(empId);
    if (!employee) continue;

    const empWarnings = [];

    // 1. Resolve contract
    const { contract, warning: contractWarning } = await resolveApplicableContract({
      employeeId: empId,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
    });

    if (contractWarning) {
      empWarnings.push(contractWarning);
      globalWarnings.push(contractWarning);
    }

    // 2. Check duplicate finalized payslips (BR-08)
    const duplicateWarning = await checkDuplicateFinalizedPayslip({
      employeeId: empId,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      currentPayrunId: payrun._id,
    });

    if (duplicateWarning) {
      empWarnings.push(duplicateWarning);
      globalWarnings.push(duplicateWarning);
    }

    // 3. Check bank details warning
    const bankWarning = checkEmployeeBankDetails(employee);
    if (bankWarning) {
      empWarnings.push(bankWarning);
      globalWarnings.push(bankWarning);
    }

    // 4. Calculate rule lines
    let calculationResult = { ruleLines: [], gross: 0, deductions: 0, net: 0, warnings: [] };
    if (contract) {
      calculationResult = calculatePayslipLines({
        contract,
        rules,
        workedDays: 22,
        leaveDays: 0,
      });

      if (calculationResult.warnings && calculationResult.warnings.length > 0) {
        calculationResult.warnings.forEach((w) => {
          const warnObj = { ...w, employeeId: String(empId) };
          empWarnings.push(warnObj);
          globalWarnings.push(warnObj);
        });
      }
    }

    // 5. Create Payslip document snapshot
    const payslip = new Payslip({
      payrunId: payrun._id,
      employeeId: empId,
      contractId: contract ? contract._id : null,
      salaryStructureId: payrun.salaryStructureId,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      workedDays: calculationResult.workedDays || 22,
      ruleLines: calculationResult.ruleLines,
      gross: calculationResult.gross,
      deductions: calculationResult.deductions,
      net: calculationResult.net,
      status: 'COMPUTED',
      warnings: empWarnings,
    });

    await payslip.save();
    generatedPayslips.push(payslip);

    totalGross += calculationResult.gross;
    totalDeductions += calculationResult.deductions;
    totalNet += calculationResult.net;
  }

  payrun.status = 'COMPUTED';
  payrun.warnings = globalWarnings;
  payrun.totals = {
    totalGross: Number(totalGross.toFixed(2)),
    totalDeductions: Number(totalDeductions.toFixed(2)),
    totalNet: Number(totalNet.toFixed(2)),
  };

  await payrun.save();

  return {
    payrun,
    payslips: generatedPayslips,
    warnings: globalWarnings,
  };
}

export async function validatePayrun(payrunId) {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.code = 'PAYRUN_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const blockingWarnings = (payrun.warnings || []).filter((w) => w.severity === 'BLOCKING');

  if (blockingWarnings.length > 0) {
    const err = new Error(
      `Payrun cannot be validated due to ${blockingWarnings.length} unresolved blocking warning(s)`
    );
    err.code = 'BLOCKING_WARNINGS_EXIST';
    err.statusCode = 409;
    err.warnings = blockingWarnings;
    throw err;
  }

  payrun.status = 'VALIDATED';
  await payrun.save();

  await Payslip.updateMany({ payrunId: payrun._id }, { status: 'VALIDATED' });

  return payrun;
}

export async function markPayrunPaid(payrunId, actorId) {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.code = 'PAYRUN_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  if (payrun.status !== 'VALIDATED') {
    const err = new Error('Payrun must be in VALIDATED state before it can be marked Paid');
    err.code = 'PAYRUN_NOT_VALIDATED';
    err.statusCode = 400;
    throw err;
  }

  payrun.status = 'PAID';
  await payrun.save();

  await Payslip.updateMany({ payrunId: payrun._id }, { status: 'PAID' });

  await logAudit({
    actorId,
    action: 'MARK_PAYRUN_PAID',
    entityType: 'Payrun',
    entityId: payrun._id,
  });

  return payrun;
}

export async function getPayruns(query = {}) {
  const page = parseInt(query.page || 1, 10);
  const pageSize = parseInt(query.pageSize || 20, 10);
  const skip = (page - 1) * pageSize;

  const filter = {};
  if (query.status) filter.status = query.status;

  const [payruns, total] = await Promise.all([
    Payrun.find(filter)
      .populate('salaryStructureId employeeIds createdBy')
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }),
    Payrun.countDocuments(filter),
  ]);

  return { payruns, meta: { page, pageSize, total } };
}

export async function getPayrunById(id) {
  const payrun = await Payrun.findById(id).populate('salaryStructureId employeeIds createdBy');
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.code = 'PAYRUN_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const payslips = await Payslip.find({ payrunId: id }).populate('employeeId contractId salaryStructureId');

  return { payrun, payslips };
}
