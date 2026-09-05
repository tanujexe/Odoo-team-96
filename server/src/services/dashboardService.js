import { Payslip } from '../models/Payslip.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { TimeOffRequest } from '../models/TimeOffRequest.js';
import { Payrun } from '../models/Payrun.js';
import { Department } from '../models/Department.js';

export async function getDashboardMetrics(query = {}) {
  const matchPayslip = {};

  if (query.startDate || query.endDate) {
    matchPayslip.periodStart = {};
    if (query.startDate) matchPayslip.periodStart.$gte = new Date(query.startDate);
    if (query.endDate) matchPayslip.periodStart.$lte = new Date(query.endDate);
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
        payslipsCount: { $sum: 1 },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] },
        },
        avgSalary: { $avg: '$net' },
      },
    },
  ]);

  const stats = payslipAgg[0] || {
    totalNetPaid: 0,
    totalGrossPaid: 0,
    payslipsCount: 0,
    paidCount: 0,
    avgSalary: 0,
  };

  // 2. Approved Time Off Days
  const timeOffMatch = { status: 'APPROVED' };
  if (query.startDate || query.endDate) {
    timeOffMatch.startDate = {};
    if (query.startDate) timeOffMatch.startDate.$gte = new Date(query.startDate);
    if (query.endDate) timeOffMatch.startDate.$lte = new Date(query.endDate);
  }

  const timeOffAgg = await TimeOffRequest.aggregate([
    { $match: timeOffMatch },
    { $group: { _id: null, totalDays: { $sum: '$duration' } } },
  ]);

  const approvedTimeOffDays = timeOffAgg[0]?.totalDays || 0;

  // 3. Attendance Health
  const attendanceMatch = {};
  if (query.startDate || query.endDate) {
    attendanceMatch.date = {};
    if (query.startDate) attendanceMatch.date.$gte = new Date(query.startDate);
    if (query.endDate) attendanceMatch.date.$lte = new Date(query.endDate);
  }

  const attendanceAgg = await Attendance.aggregate([
    { $match: attendanceMatch },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
        exception: { $sum: { $cond: [{ $eq: ['$status', 'EXCEPTION'] }, 1, 0] } },
        missingCheckout: { $sum: { $cond: [{ $eq: ['$checkOut', null] }, 1, 0] } },
      },
    },
  ]);

  const attStats = attendanceAgg[0] || { total: 0, present: 0, late: 0, exception: 0, missingCheckout: 0 };
  const attendanceCoveragePct = attStats.total > 0 ? Number(((attStats.present / attStats.total) * 100).toFixed(1)) : 100;

  // 4. Salary Cost by Department Chart Series
  const deptCostAgg = await Payslip.aggregate([
    { $match: { ...matchPayslip, status: 'PAID' } },
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
        _id: { $ifNull: ['$dept.name', 'Unassigned'] },
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

  // 5. Monthly Net Salary Trends Chart Series
  const monthlyTrendAgg = await Payslip.aggregate([
    { $match: { status: 'PAID' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$periodStart' } },
        totalNet: { $sum: '$net' },
        payslipCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 6. Operational Alerts
  const activePayruns = await Payrun.find({ status: { $in: ['DRAFT', 'COMPUTED'] } }).select('name status warnings');
  const alertList = [];

  activePayruns.forEach((run) => {
    if (run.warnings && run.warnings.length > 0) {
      run.warnings.forEach((w) => {
        alertList.push({
          type: w.severity === 'BLOCKING' ? 'BLOCKING_PAYROLL' : 'WARNING_PAYROLL',
          title: `Payrun Alert: ${run.name}`,
          message: w.message,
        });
      });
    }
  });

  const totalEmployees = await Employee.countDocuments({ status: 'ACTIVE' });

  return {
    kpis: {
      totalNetSalaryPaid: Number(stats.totalNetPaid.toFixed(2)),
      totalGrossSalaryPaid: Number(stats.totalGrossPaid.toFixed(2)),
      payslipsGenerated: stats.payslipsCount,
      paidPayslipsCount: stats.paidCount,
      averageSalary: Number((stats.avgSalary || 0).toFixed(2)),
      approvedTimeOffDays,
      attendanceCoveragePct,
      activeEmployeeCount: totalEmployees,
    },
    attendanceSummary: attStats,
    charts: {
      salaryCostByDepartment: deptCostAgg,
      monthlySalaryTrends: monthlyTrendAgg.map((m) => ({ month: m._id, totalNet: m.totalNet, count: m.payslipCount })),
    },
    alerts: alertList,
  };
}
