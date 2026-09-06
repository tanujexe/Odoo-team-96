import { Payslip } from '../models/Payslip.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { TimeOffRequest } from '../models/TimeOffRequest.js';
import { TimeOffType } from '../models/TimeOffType.js';
import { Payrun } from '../models/Payrun.js';
import { Department } from '../models/Department.js';
import { Contract } from '../models/Contract.js';

export async function getDashboardMetrics(query = {}) {
  const matchPayslip = {};
  const timeOffMatch = {};
  const attendanceMatch = {};

  // Resolve Date Range Filter
  let startDate = query.startDate ? new Date(query.startDate) : null;
  let endDate = query.endDate ? new Date(query.endDate) : null;

  if (query.datePreset && !startDate && !endDate) {
    const now = new Date('2026-09-05T00:00:00.000Z');
    if (query.datePreset === 'CURRENT_MONTH') {
      startDate = new Date('2026-09-01T00:00:00.000Z');
      endDate = new Date('2026-09-30T23:59:59.999Z');
    } else if (query.datePreset === 'LAST_30_DAYS') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (query.datePreset === 'Q3_2026') {
      startDate = new Date('2026-07-01T00:00:00.000Z');
      endDate = new Date('2026-09-30T23:59:59.999Z');
    } else if (query.datePreset === 'YEAR_TO_DATE') {
      startDate = new Date('2026-01-01T00:00:00.000Z');
      endDate = new Date('2026-12-31T23:59:59.999Z');
    }
  }

  if (startDate || endDate) {
    matchPayslip.periodStart = {};
    if (startDate) matchPayslip.periodStart.$gte = startDate;
    if (endDate) matchPayslip.periodStart.$lte = endDate;

    timeOffMatch.startDate = {};
    if (startDate) timeOffMatch.startDate.$gte = startDate;
    if (endDate) timeOffMatch.startDate.$lte = endDate;

    attendanceMatch.date = {};
    if (startDate) attendanceMatch.date.$gte = startDate;
    if (endDate) attendanceMatch.date.$lte = endDate;
  }

  // Resolve Department Filter
  if (query.departmentId && String(query.departmentId).trim() !== '') {
    const empCond = { departmentId: query.departmentId };
    if (query.employeeType) empCond.employeeType = query.employeeType;
    const empsInDept = await Employee.find(empCond).select('_id');
    const empIds = empsInDept.map((e) => e._id);
    
    matchPayslip.employeeId = { $in: empIds };
    timeOffMatch.employeeId = { $in: empIds };
    attendanceMatch.employeeId = { $in: empIds };
  } else if (query.employeeType) {
    const empsInType = await Employee.find({ employeeType: query.employeeType }).select('_id');
    const empIds = empsInType.map((e) => e._id);
    matchPayslip.employeeId = { $in: empIds };
    timeOffMatch.employeeId = { $in: empIds };
    attendanceMatch.employeeId = { $in: empIds };
  }

  // 1. Payslip & Salary Aggregation
  const payslipAgg = await Payslip.aggregate([
    { $match: matchPayslip },
    {
      $group: {
        _id: null,
        totalNetPaid: {
          $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$net', 0] },
        },
        totalGrossPaid: {
          $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$gross', 0] },
        },
        totalDeductionsPaid: {
          $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$deductions', 0] },
        },
        payslipsCount: { $sum: 1 },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] },
        },
        doneCount: {
          $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] },
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] },
        },
        avgSalary: { $avg: '$net' },
      },
    },
  ]);

  const stats = payslipAgg[0] || {
    totalNetPaid: 0,
    totalGrossPaid: 0,
    totalDeductionsPaid: 0,
    payslipsCount: 0,
    paidCount: 0,
    doneCount: 0,
    pendingCount: 0,
    avgSalary: 0,
  };

  // If no payslips exist for current filter, check active contracts for estimated avg salary
  let calculatedAvgSalary = stats.avgSalary > 0 ? Number(stats.avgSalary.toFixed(2)) : 0;
  if (calculatedAvgSalary === 0) {
    const activeContracts = await Contract.find({ status: 'ACTIVE' }).select('wage');
    if (activeContracts.length > 0) {
      const totalWage = activeContracts.reduce((sum, c) => sum + (parseFloat(c.wage) || 0), 0);
      calculatedAvgSalary = Number((totalWage / activeContracts.length).toFixed(2));
    }
  }

  // 2. Approved Time Off Days
  const approvedTimeOffMatch = { ...timeOffMatch, status: 'APPROVED' };
  const timeOffAgg = await TimeOffRequest.aggregate([
    { $match: approvedTimeOffMatch },
    { $group: { _id: null, totalDays: { $sum: '$duration' } } },
  ]);

  const approvedTimeOffDays = timeOffAgg[0]?.totalDays || 0;

  // Time-Off Summary grouped by Type
  const allTimeOffTypes = await TimeOffType.find({ status: 'ACTIVE' }).lean();
  const timeOffRequests = await TimeOffRequest.find(timeOffMatch).populate('typeId').lean();
  
  const timeOffSummaryMap = {};
  allTimeOffTypes.forEach((t) => {
    timeOffSummaryMap[t._id.toString()] = {
      typeName: t.name,
      code: t.code,
      approvedDays: 0,
      pendingDays: 0,
      totalRequests: 0,
    };
  });

  timeOffRequests.forEach((req) => {
    const typeIdStr = req.typeId?._id?.toString() || req.typeId?.toString() || 'other';
    if (!timeOffSummaryMap[typeIdStr]) {
      timeOffSummaryMap[typeIdStr] = {
        typeName: req.typeId?.name || req.leaveTypeName || 'Time Off',
        code: req.typeId?.code || 'LEAVE',
        approvedDays: 0,
        pendingDays: 0,
        totalRequests: 0,
      };
    }
    const days = req.duration || req.days || 1;
    timeOffSummaryMap[typeIdStr].totalRequests += 1;
    if (req.status === 'APPROVED') {
      timeOffSummaryMap[typeIdStr].approvedDays += days;
    } else if (req.status === 'PENDING') {
      timeOffSummaryMap[typeIdStr].pendingDays += days;
    }
  });

  const timeOffSummary = Object.values(timeOffSummaryMap);

  // 3. Attendance Health
  const attendanceAgg = await Attendance.aggregate([
    { $match: attendanceMatch },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
        exception: { $sum: { $cond: [{ $eq: ['$status', 'EXCEPTION'] }, 1, 0] } },
        overtime: { $sum: { $cond: [{ $gt: ['$workedHours', 8] }, 1, 0] } },
        missingCheckout: { $sum: { $cond: [{ $eq: ['$checkOut', null] }, 1, 0] } },
        manualEdits: { $sum: { $cond: [{ $eq: ['$status', 'CORRECTED'] }, 1, 0] } },
      },
    },
  ]);

  const attStats = attendanceAgg[0] || { total: 0, present: 0, late: 0, exception: 0, overtime: 0, missingCheckout: 0, manualEdits: 0 };
  const attendanceCoveragePct = attStats.total > 0 ? Number(((attStats.present / attStats.total) * 100).toFixed(1)) : 100;

  // 4. Salary Cost by Department Chart Series
  const deptCostAgg = await Payslip.aggregate([
    { $match: { ...matchPayslip } },
    {
      $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'emp',
      },
    },
    { $unwind: '$emp' },
    {
      $lookup: {
        from: 'departments',
        localField: 'emp.departmentId',
        foreignField: '_id',
        as: 'dept',
      },
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$dept.name', 'General'] },
        totalNet: { $sum: '$net' },
        totalGross: { $sum: '$gross' },
        headcount: { $addToSet: '$employeeId' },
      },
    },
    {
      $project: {
        departmentName: '$_id',
        totalNet: 1,
        totalGross: 1,
        employeeCount: { $size: '$headcount' },
      },
    },
  ]);

  // If no payslips match, aggregate by active contracts per department
  let salaryCostByDepartment = deptCostAgg;
  if (salaryCostByDepartment.length === 0) {
    const contractsByDept = await Contract.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'dept',
        },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$dept.name', 'General'] },
          totalWage: { $sum: '$wage' },
          headcount: { $addToSet: '$employeeId' },
        },
      },
      {
        $project: {
          departmentName: '$_id',
          totalNet: '$totalWage',
          totalGross: '$totalWage',
          employeeCount: { $size: '$headcount' },
        },
      },
    ]);
    if (contractsByDept.length > 0) {
      salaryCostByDepartment = contractsByDept;
    }
  }

  // 5. Monthly Net Salary Trends Chart Series
  const monthlyTrendAgg = await Payslip.aggregate([
    { $match: {} },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$periodStart' } },
        totalNet: { $sum: '$net' },
        payslipCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  let monthlySalaryTrends = monthlyTrendAgg.map((m) => ({
    month: m._id,
    totalNet: m.totalNet,
    count: m.payslipCount,
  }));

  // Identify peak month in trends
  if (monthlySalaryTrends.length > 0) {
    let maxVal = -1;
    let peakIndex = 0;
    monthlySalaryTrends.forEach((t, i) => {
      if (t.totalNet > maxVal) {
        maxVal = t.totalNet;
        peakIndex = i;
      }
    });
    monthlySalaryTrends = monthlySalaryTrends.map((t, i) => ({
      ...t,
      isPeak: i === peakIndex && maxVal > 0,
    }));
  }

  // 6. Department Headcount
  const allDepartments = await Department.find({ status: 'ACTIVE' }).lean();
  const employeesByDept = await Employee.aggregate([
    { $match: { status: 'ACTIVE' } },
    {
      $group: {
        _id: '$departmentId',
        headcount: { $sum: 1 },
      },
    },
  ]);

  const headcountMap = {};
  employeesByDept.forEach((item) => {
    if (item._id) headcountMap[item._id.toString()] = item.headcount;
  });

  const departmentHeadcount = allDepartments.map((dept) => ({
    id: dept._id,
    departmentName: dept.name,
    code: dept.code,
    headcount: headcountMap[dept._id.toString()] || 0,
  }));

  // 7. Dynamic Operational Alerts
  const alertList = [];
  
  // A. Payrun Warnings
  const activePayruns = await Payrun.find({ status: { $in: ['DRAFT', 'COMPUTED'] } }).select('name status warnings');
  activePayruns.forEach((run) => {
    if (run.warnings && run.warnings.length > 0) {
      run.warnings.forEach((w) => {
        alertList.push({
          id: `alt-${Math.random().toString(36).substr(2, 6)}`,
          type: w.severity === 'BLOCKING' ? 'BLOCKING_PAYROLL' : 'WARNING_PAYROLL',
          title: `Payrun Alert: ${run.name}`,
          message: w.message,
          link: '/payroll',
        });
      });
    }
  });

  // B. Missing Bank Accounts
  const employeesMissingBank = await Employee.countDocuments({
    status: 'ACTIVE',
    $or: [
      { bankDetails: { $exists: false } },
      { 'bankDetails.accountNumber': { $exists: false } },
      { 'bankDetails.accountNumber': '' },
      { 'bankDetails.accountNumber': null },
    ],
  });
  if (employeesMissingBank > 0) {
    alertList.push({
      id: 'alt-bank',
      type: 'WARNING',
      title: 'Bank Account Integrity',
      message: `${employeesMissingBank} employee${employeesMissingBank > 1 ? 's' : ''} missing bank account details for payroll disbursement`,
      link: '/employees',
    });
  }

  // C. Unvalidated Payrun Drafts
  const unvalidatedDraftsCount = await Payrun.countDocuments({ status: 'DRAFT' });
  if (unvalidatedDraftsCount > 0) {
    alertList.push({
      id: 'alt-drafts',
      type: 'DRAFT',
      title: 'Unvalidated Payrun Drafts',
      message: `${unvalidatedDraftsCount} payrun draft${unvalidatedDraftsCount > 1 ? 's' : ''} awaiting computation and validation`,
      link: '/payroll',
    });
  }

  // D. Expiring Contracts in next 30 days
  const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiringContractsCount = await Contract.countDocuments({
    status: 'ACTIVE',
    endDate: { $ne: null, $gte: new Date(), $lte: thirtyDaysOut },
  });
  if (expiringContractsCount > 0) {
    alertList.push({
      id: 'alt-contracts',
      type: 'CONTRACT',
      title: 'Contract Expiration Notice',
      message: `${expiringContractsCount} contract${expiringContractsCount > 1 ? 's' : ''} expiring within 30 days requiring renewal review`,
      link: '/contracts',
    });
  }

  // E. Missing Check-Outs
  if (attStats.missingCheckout > 0) {
    alertList.push({
      id: 'alt-attendance',
      type: 'WARNING',
      title: 'Attendance Exception',
      message: `${attStats.missingCheckout} unresolved missing check-out${attStats.missingCheckout > 1 ? 's' : ''} requiring manager review`,
      link: '/attendance',
    });
  }

  // 8. Compliance & Challans (EPF, ESI, TDS)
  const totalNet = stats.totalNetPaid > 0 ? stats.totalNetPaid : (stats.totalGrossPaid > 0 ? stats.totalGrossPaid * 0.85 : 0);
  const totalGross = stats.totalGrossPaid > 0 ? stats.totalGrossPaid : (totalNet > 0 ? totalNet * 1.15 : 0);
  
  const compliance = {
    epf: Number((totalGross * 0.12).toFixed(2)),
    esi: Number((totalGross * 0.0075).toFixed(2)),
    tds: Number((totalGross * 0.10).toFixed(2)),
  };

  const empCountFilter = {};
  if (query.departmentId) empCountFilter.departmentId = query.departmentId;
  if (query.employeeType) empCountFilter.employeeType = query.employeeType;
  empCountFilter.status = 'ACTIVE';

  const totalEmployees = await Employee.countDocuments(empCountFilter);
  const totalDepartments = allDepartments.length;

  return {
    kpis: {
      totalNetSalaryPaid: Number(stats.totalNetPaid.toFixed(2)),
      totalGrossSalaryPaid: Number(stats.totalGrossPaid.toFixed(2)),
      totalDeductionsPaid: Number(stats.totalDeductionsPaid.toFixed(2)),
      payslipsGenerated: stats.payslipsCount,
      paidPayslipsCount: stats.paidCount,
      donePayslipsCount: stats.doneCount,
      pendingPayslipsCount: stats.pendingCount,
      averageSalary: calculatedAvgSalary,
      approvedTimeOffDays,
      attendanceCoveragePct,
      activeEmployeeCount: totalEmployees,
      totalDepartments,
    },
    attendanceSummary: attStats,
    timeOffSummary,
    departmentHeadcount,
    charts: {
      salaryCostByDepartment,
      monthlySalaryTrends,
    },
    compliance,
    alerts: alertList,
  };
}
