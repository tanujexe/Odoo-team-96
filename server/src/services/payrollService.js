import mongoose from 'mongoose';
import { Payrun } from '../models/Payrun.js';
import { Payslip } from '../models/Payslip.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { SalaryRule } from '../models/SalaryRule.js';
import { Employee } from '../models/Employee.js';
import { Contract } from '../models/Contract.js';
import { Attendance } from '../models/Attendance.js';
import { TimeOffRequest } from '../models/TimeOffRequest.js';
import { resolveApplicableContract } from '../payroll/contractResolver.js';
import { calculatePayslipLines } from '../payroll/calculator.js';
import {
  checkDuplicateFinalizedPayslip,
  checkEmployeeBankDetails,
  getWarningLabel,
} from '../payroll/warningService.js';
import { logAudit } from './auditService.js';

export async function getEligibleEmployeesForPayrun({ salaryStructureId, periodStart, periodEnd }) {
  const pStart = periodStart ? new Date(periodStart) : new Date();
  const pEnd = periodEnd ? new Date(periodEnd) : new Date();

  // Find all active employees
  const employees = await Employee.find({ status: { $ne: 'TERMINATED' } })
    .populate('departmentId scheduleId')
    .sort({ name: 1 });

  const eligibleList = [];

  for (const emp of employees) {
    // Find active contract overlapping the period
    const contract = await Contract.findOne({
      employeeId: emp._id,
      status: 'ACTIVE',
      startDate: { $lte: pEnd },
      $or: [{ endDate: null }, { endDate: { $gte: pStart } }],
    }).populate('salaryStructureId');

    const workingHours =
      contract?.workingSchedule ||
      emp.scheduleId?.name ||
      (emp.scheduleId?.weeklyHours ? `${emp.scheduleId.weeklyHours} hours/week` : '40 hours/week');

    eligibleList.push({
      id: String(emp._id),
      _id: emp._id,
      name: emp.name,
      firstName: emp.name.split(' ')[0] || '',
      lastName: emp.name.split(' ').slice(1).join(' ') || '',
      employeeCode: emp.employeeCode,
      department: emp.departmentId?.name || 'General',
      jobTitle: emp.jobPosition || 'Employee',
      workingHours,
      contractStartDate: contract?.startDate || null,
      wage: contract ? parseFloat(contract.wage?.toString?.() || contract.wage || 0) : 0,
      contractId: contract?._id || null,
      contractCode: contract?.contractCode || null,
      hasActiveContract: !!contract,
      status: emp.status,
    });
  }

  return eligibleList;
}

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
    const employee = await Employee.findById(empId).populate('departmentId');
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

    // 4. Calculate actual worked days from attendance & leaves
    const presentAttendanceCount = await Attendance.countDocuments({
      employeeId: empId,
      date: { $gte: payrun.periodStart, $lte: payrun.periodEnd },
      status: { $in: ['PRESENT', 'LATE'] },
    });
    const workedDays = presentAttendanceCount > 0 ? presentAttendanceCount : 22;

    const approvedLeaves = await TimeOffRequest.find({
      employeeId: empId,
      status: 'APPROVED',
      startDate: { $lte: payrun.periodEnd },
      endDate: { $gte: payrun.periodStart },
    });
    const leaveDays = approvedLeaves.reduce((sum, req) => sum + (req.paidDuration ?? req.duration ?? 0), 0);
    const unpaidDays = approvedLeaves.reduce((sum, req) => sum + (req.unpaidDuration ?? 0), 0);

    // 5. Calculate rule lines
    let calculationResult = { ruleLines: [], gross: 0, deductions: 0, net: 0, warnings: [] };
    if (contract) {
      calculationResult = calculatePayslipLines({
        contract,
        rules,
        workedDays,
        leaveDays,
        unpaidDays,
      });

      if (calculationResult.warnings && calculationResult.warnings.length > 0) {
        calculationResult.warnings.forEach((w) => {
          const warnObj = { ...w, employeeId: String(empId) };
          empWarnings.push(warnObj);
          globalWarnings.push(warnObj);
        });
      }
    }

    // 6. Create Payslip document snapshot
    const payslip = new Payslip({
      payrunId: payrun._id,
      employeeId: empId,
      contractId: contract ? contract._id : null,
      salaryStructureId: payrun.salaryStructureId,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      workedDays,
      leaveDays,
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
  const pageSize = parseInt(query.pageSize || 50, 10);
  const skip = (page - 1) * pageSize;

  const filter = {};
  if (query.status) filter.status = query.status;

  const [payruns, total] = await Promise.all([
    Payrun.find(filter)
      .populate('salaryStructureId employeeIds createdBy')
      .skip(skip)
      .limit(pageSize)
      .sort({ periodStart: -1, createdAt: -1 }),
    Payrun.countDocuments(filter),
  ]);

  const enrichedPayruns = payruns.map((pr) => {
    const obj = pr.toObject();
    const warningsCount = (pr.warnings || []).length;
    return {
      ...obj,
      id: pr._id,
      employeeCount: (pr.employeeIds || []).length,
      warningsCount,
    };
  });

  return { payruns: enrichedPayruns, meta: { page, pageSize, total } };
}

export async function getPayrunById(id) {
  const payrun = await Payrun.findById(id).populate('salaryStructureId employeeIds createdBy');
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.code = 'PAYRUN_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const rawPayslips = await Payslip.find({ payrunId: id }).populate({
    path: 'employeeId',
    populate: { path: 'departmentId' },
  }).populate('contractId salaryStructureId');

  const enrichedPayslips = rawPayslips.map((ps) => {
    const emp = ps.employeeId || {};
    const contract = ps.contractId || {};
    const baseWage = contract ? parseFloat(contract.wage?.toString?.() || contract.wage || 0) : 0;

    // Extract basic from rule lines
    const basicLine = (ps.ruleLines || []).find(
      (r) => r.category === 'BASIC' || r.code === 'BASIC'
    );
    const basicAmount = basicLine ? basicLine.amount : baseWage * 0.5;

    // Primary warning label
    const firstWarning = (ps.warnings || [])[0];
    const warningLabel = firstWarning ? getWarningLabel(firstWarning.code) : '—';
    const warningSeverity = firstWarning ? firstWarning.severity : null;

    return {
      id: ps._id,
      _id: ps._id,
      payrunId: ps.payrunId,
      employeeId: emp._id || ps.employeeId,
      employeeName: emp.name || 'Unknown',
      employeeCode: emp.employeeCode || '—',
      department: emp.departmentId?.name || 'General',
      workedDays: ps.workedDays || 22,
      baseWage,
      basic: basicAmount,
      gross: ps.gross || 0,
      deductions: ps.deductions || 0,
      net: ps.net || 0,
      status: ps.status === 'VALIDATED' || ps.status === 'PAID' ? 'Done' : (ps.status === 'COMPUTED' ? 'Done' : 'Draft'),
      rawStatus: ps.status,
      deliveryStatus: ps.deliveryStatus || 'NOT_SENT',
      warningLabel,
      warningSeverity,
      warnings: ps.warnings || [],
      ruleLines: ps.ruleLines || [],
    };
  });

  return { payrun, payslips: enrichedPayslips };
}

