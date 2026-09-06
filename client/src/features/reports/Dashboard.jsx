import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardMetrics } from '../../lib/api/dashboard';
import { mockDepartments } from '../../lib/api/mockData';
import { useAuth, ROLES } from '../../app/auth/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/States';
import { formatCurrency } from '../../lib/utils';
import {
  Users,
  DollarSign,
  CalendarCheck,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Clock,
  FileSignature,
  UserCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';

import EmployeeDashboard from './EmployeeDashboard';
import { fetchEmployees } from '../../lib/api/employees';
import { fetchAttendance } from '../../lib/api/attendance';
import { fetchTimeOffRequests } from '../../lib/api/timeOff';
import { fetchContracts } from '../../lib/api/contracts';

export default function DashboardFeature() {
  const { user, role } = useAuth();

  if (role === ROLES.EMPLOYEE) {
    return <EmployeeDashboard />;
  }

  if (role === ROLES.HR_MANAGER) {
    return <HrManagerDashboard />;
  }

  return <ExecutiveDashboard />;
}

export function ExecutiveDashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [datePreset, setDatePreset] = useState('CURRENT_MONTH');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeType, setEmployeeType] = useState('');
  const [company, setCompany] = useState('OxP Pvt Ltd');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboardMetrics', { datePreset, departmentId, employeeType, company }],
    queryFn: () => fetchDashboardMetrics({ datePreset, departmentId, employeeType, company }),
    enabled: role !== ROLES.EMPLOYEE,
  });

  const kpis = dashboard?.kpis || {};
  const charts = dashboard?.charts || { salaryCostByDepartment: [], monthlySalaryTrends: [] };
  const alerts = dashboard?.alerts || [];
  const attendanceSummary = dashboard?.attendanceSummary || { present: 0, late: 0, exception: 0, overtime: 0, missingCheckout: 0, manualEdits: 0 };
  const timeOffSummary = dashboard?.timeOffSummary || [];
  const departmentHeadcount = dashboard?.departmentHeadcount || [];
  const compliance = dashboard?.compliance || {};

  // Computed KPI values
  const totalNet = formatCurrency(kpis.totalNetSalaryPaid || 0);
  const payslipsCount = kpis.payslipsGenerated || 0;
  const paidCount = kpis.paidPayslipsCount || 0;
  const pendingCount = kpis.pendingPayslipsCount !== undefined ? kpis.pendingPayslipsCount : Math.max(payslipsCount - paidCount, 0);
  const avgSalary = formatCurrency(kpis.averageSalary || 0);
  const timeOffDays = kpis.approvedTimeOffDays || 0;
  const attendancePct = kpis.attendanceCoveragePct !== undefined ? kpis.attendanceCoveragePct : 100;

  // Selected period display label
  const periodCycleLabel =
    datePreset === 'CURRENT_MONTH'
      ? 'Sep 2026 Cycle'
      : datePreset === 'LAST_30_DAYS'
      ? 'Aug 2026 Cycle'
      : datePreset === 'Q3_2026'
      ? 'Q3 2026 Cycle'
      : 'Year to Date 2026';

  // Department Bar Chart Data
  const deptBarData = (charts.salaryCostByDepartment && charts.salaryCostByDepartment.length > 0)
    ? charts.salaryCostByDepartment
    : [];

  const maxDeptCost = Math.max(...deptBarData.map((d) => Number(d.totalNet || d.totalGross || 0)), 1);
  const totalDeptPayroll = deptBarData.reduce((sum, d) => sum + Number(d.totalNet || d.totalGross || 0), 0);

  // Available departments for filter dropdown
  const availableDepartments = departmentHeadcount.length > 0
    ? departmentHeadcount.map((d) => ({ id: d.id || d.departmentName, name: d.departmentName }))
    : mockDepartments;

  // Monthly Salary Trend Data & SVG Calculation
  const trendMonths = (charts.monthlySalaryTrends && charts.monthlySalaryTrends.length > 0)
    ? charts.monthlySalaryTrends
    : [
        { month: 'Apr', totalNet: 0 },
        { month: 'May', totalNet: 0 },
        { month: 'Jun', totalNet: 0 },
        { month: 'Jul', totalNet: 0 },
        { month: 'Aug', totalNet: 0 },
        { month: 'Sep', totalNet: 0 },
      ];

  const maxTrendVal = Math.max(...trendMonths.map((t) => Number(t.totalNet || 0)), 1);
  const peakMonth = trendMonths.find((t) => t.isPeak) || trendMonths.reduce((max, t) => (Number(t.totalNet || 0) > Number(max?.totalNet || 0) ? t : max), trendMonths[0]);

  // Compute SVG Points for Dynamic Trend Line & Gradient
  const svgWidth = 300;
  const svgHeight = 100;
  const trendPoints = trendMonths.map((m, i) => {
    const x = trendMonths.length > 1 ? 15 + (i / (trendMonths.length - 1)) * (svgWidth - 30) : svgWidth / 2;
    const normalizedVal = Number(m.totalNet || 0) / maxTrendVal;
    const y = 85 - normalizedVal * 65;
    return { x, y, month: m.month, totalNet: m.totalNet, isPeak: m.isPeak || m === peakMonth };
  });

  // Build SVG path
  let pathD = '';
  let fillD = '';
  if (trendPoints.length > 0) {
    pathD = `M ${trendPoints[0].x} ${trendPoints[0].y}`;
    for (let i = 1; i < trendPoints.length; i++) {
      const prev = trendPoints[i - 1];
      const curr = trendPoints[i];
      const cx = (prev.x + curr.x) / 2;
      pathD += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    fillD = `${pathD} L ${trendPoints[trendPoints.length - 1].x} ${svgHeight} L ${trendPoints[0].x} ${svgHeight} Z`;
  }

  // Payslip Status Split Calculations
  const totalStatusCount = payslipsCount || 1;
  const paidPct = Math.round((paidCount / totalStatusCount) * 100);
  const pendingPct = Math.round((pendingCount / totalStatusCount) * 100);
  const donePct = Math.round(((kpis.donePayslipsCount || 0) / totalStatusCount) * 100);
  const warningPct = Math.max(100 - paidPct - pendingPct - donePct, 0);

  // Attendance bar heights
  const maxAttVal = Math.max(
    attendanceSummary.present || 0,
    attendanceSummary.late || 0,
    attendanceSummary.exception || 0,
    attendanceSummary.overtime || 0,
    1
  );

  // Compliance statutory figures
  const epfAmount = compliance.epf !== undefined
    ? formatCurrency(compliance.epf)
    : formatCurrency((kpis.totalGrossSalaryPaid || kpis.totalNetSalaryPaid || 0) * 0.12);
  const esiAmount = compliance.esi !== undefined
    ? formatCurrency(compliance.esi)
    : formatCurrency((kpis.totalGrossSalaryPaid || kpis.totalNetSalaryPaid || 0) * 0.0075);
  const tdsAmount = compliance.tds !== undefined
    ? formatCurrency(compliance.tds)
    : formatCurrency((kpis.totalGrossSalaryPaid || kpis.totalNetSalaryPaid || 0) * 0.10);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payroll Dashboard</h1>
            <span className="hidden">Executive Operations Dashboard</span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Real-time operations metrics, salary distributions, live attendance health, and statutory compliance status.
          </p>
        </div>

        {/* Top Header Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{periodCycleLabel}</span>
          </div>

        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Period Filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">PERIOD</label>
            <select
              aria-label="Period filter"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="CURRENT_MONTH">Current Month (Sep 2026)</option>
              <option value="LAST_30_DAYS">Last 30 Days (Aug 2026)</option>
              <option value="Q3_2026">Q3 2026</option>
              <option value="YEAR_TO_DATE">Year to Date 2026</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">DEPARTMENT</label>
            <select
              aria-label="Department filter"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="">All Departments</option>
              {availableDepartments.map((d) => (
                <option key={d.id || d.name} value={d.id || d.name}>
                  {d.name || d.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Type Filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">EMPLOYEE TYPE</label>
            <select
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>

          {/* Company Filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">COMPANY</label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="OxP Pvt Ltd">OxP Pvt Ltd</option>
              <option value="PeoplePay Global">PeoplePay Global</option>
            </select>
          </div>
        </div>

        <div className="self-end pb-0.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setDatePreset('CURRENT_MONTH');
              setDepartmentId('');
              setEmployeeType('');
            }}
            className="rounded-xl px-4 text-slate-600 hover:bg-slate-100 font-bold text-xs"
          >
            Reset
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Aggregating live organizational metrics..." />
      ) : (
        <>
          {/* 3. Row of 5 Dynamic KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI Card 1: TOTAL NET SALARY PAID */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider max-w-[110px] leading-tight">
                  TOTAL NET SALARY PAID
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0">
                  ₹
                </div>
              </div>
              <div className="mt-3">
                <h3 data-testid="kpi-total-net" className="text-2xl font-black text-slate-900 tracking-tight">
                  {totalNet}
                </h3>
                <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                  <span>✓</span> Live disbursed net
                </p>
              </div>
            </div>

            {/* KPI Card 2: PAYSLIPS GENERATED */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider max-w-[110px] leading-tight">
                  PAYSLIPS GENERATED
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 data-testid="kpi-payslips-count" className="text-2xl font-black text-slate-900 tracking-tight">
                  {payslipsCount}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  <span className="text-emerald-600 font-bold">{paidCount} paid</span> ,{' '}
                  <span className="text-amber-600 font-bold">{pendingCount} pending</span>
                </p>
              </div>
            </div>

            {/* KPI Card 3: AVG SALARY / EMP */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider max-w-[110px] leading-tight">
                  AVG SALARY / EMP
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{avgSalary}</h3>
                <p className="text-[11px] font-medium text-slate-400 mt-1">Mean compensation rate</p>
              </div>
            </div>

            {/* KPI Card 4: APPROVED TIME OFF */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider max-w-[110px] leading-tight">
                  APPROVED TIME OFF
                </span>
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{timeOffDays} Days</h3>
                <p className="text-[11px] font-medium text-slate-400 mt-1">Across active period</p>
              </div>
            </div>

            {/* KPI Card 5: ATTENDANCE HEALTH */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider max-w-[110px] leading-tight">
                  ATTENDANCE HEALTH
                </span>
                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 font-bold text-xs flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-emerald-600 tracking-tight">{attendancePct}%</h3>
                <p className="text-[11px] font-medium text-slate-400 mt-1">Present / scheduled shifts</p>
              </div>
            </div>
          </div>

          {/* 4. Middle Section Grid (3 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Column 1: Salary Cost by Department */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Salary Cost by Department</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Source: Payslips + Employee Department</p>
                    <span className="hidden">Payroll Distribution by Department</span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase rounded tracking-wider">
                    BAR
                  </span>
                </div>

                {/* Visual Bar Chart */}
                {deptBarData.length === 0 ? (
                  <div className="h-48 mt-6 flex items-center justify-center text-xs text-slate-400 italic">
                    No department payroll data for current selection.
                  </div>
                ) : (
                  <div className="h-48 mt-6 flex items-end justify-between px-2 gap-3 pb-2 border-b border-slate-100">
                    {deptBarData.map((d, i) => {
                      const name = d.departmentName || d.name || `Dept ${i + 1}`;
                      const netVal = Number(d.totalNet || d.totalGross || 0);
                      const heightPct = Math.max(Math.round((netVal / maxDeptCost) * 100), 12);
                      const displayLabel = netVal >= 1000 ? `₹${Math.round(netVal / 1000)}k` : `₹${netVal}`;

                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <span className="text-[10px] font-bold text-slate-700 opacity-90 group-hover:scale-110 transition-transform">
                            {displayLabel}
                          </span>
                          <div
                            className="w-full max-w-[42px] bg-sky-400 hover:bg-sky-500 rounded-t-lg transition-all duration-300 shadow-xs"
                            style={{ height: `${heightPct}%` }}
                            title={`${name}: ${formatCurrency(netVal)}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between text-[11px] font-bold text-slate-500 px-2 mt-2">
                  {deptBarData.map((d, i) => (
                    <span key={i} className="flex-1 text-center truncate" title={d.departmentName || d.name}>
                      {d.departmentName || d.name || `D${i}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-center">
                <span className="text-[11px] font-medium text-slate-400">
                  Total Department Payroll:{' '}
                  <strong className="text-slate-800 font-bold">{formatCurrency(totalDeptPayroll)}</strong>
                </span>
              </div>
            </div>

            {/* Chart Column 2: Monthly Net Salary Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Monthly Net Salary Trend</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Source: historical Payslips / Payruns</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase rounded tracking-wider">
                    {trendMonths.length} PERIODS
                  </span>
                </div>

                {/* Spline Line Chart Container */}
                <div className="relative h-48 mt-4 flex flex-col justify-end">
                  {/* Floating Peak Callout Pill */}
                  {peakMonth && Number(peakMonth.totalNet || 0) > 0 && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-sky-50 border border-sky-200 text-sky-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-xs z-10 flex items-center gap-1">
                      <span>Peak ({peakMonth.month}): {formatCurrency(peakMonth.totalNet)}</span>
                    </div>
                  )}

                  {/* Dynamic SVG Spline Curve */}
                  <svg className="w-full h-32 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {fillD && <path d={fillD} fill="url(#trendGradient)" />}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Node points */}
                    {trendPoints.map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={pt.isPeak ? 5 : 3.5}
                        fill="#0284c7"
                        stroke={pt.isPeak ? '#ffffff' : 'none'}
                        strokeWidth={pt.isPeak ? 2 : 0}
                      />
                    ))}
                  </svg>

                  <div className="flex justify-between text-[11px] font-bold text-slate-400 px-2 mt-4 pt-2 border-t border-slate-100">
                    {trendPoints.map((m, i) => (
                      <span key={i} className={m.isPeak ? 'text-sky-600 font-extrabold' : ''}>
                        {m.month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Payslip Status & Live Payroll Alerts */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Payslip Status & Payroll Alerts</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Source: Payrun + Payslip validation</p>
                  </div>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-extrabold uppercase rounded tracking-wider">
                    ACTION
                  </span>
                </div>

                {/* Dynamic Status Split Progress Bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-700">Status split</span>
                    <span className="text-slate-400">Total: {payslipsCount} payslips</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
                    <div style={{ width: `${paidPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Paid: ${paidCount}`} />
                    <div style={{ width: `${donePct}%` }} className="bg-cyan-500 h-full transition-all" title={`Done: ${kpis.donePayslipsCount || 0}`} />
                    <div style={{ width: `${pendingPct}%` }} className="bg-amber-400 h-full transition-all" title={`Pending: ${pendingCount}`} />
                    <div style={{ width: `${warningPct}%` }} className="bg-rose-500 h-full transition-all" title={`Alerts: ${alerts.length}`} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 pt-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Paid ({paidCount})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500"></span> Done ({kpis.donePayslipsCount || 0})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400"></span> Pending ({pendingCount})</span>
                  </div>
                </div>

                {/* CURRENT ALERTS Pills */}
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">CURRENT ALERTS</p>
                  
                  {alerts.length === 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All payroll integrity checks passed. No blocking issues.</span>
                    </div>
                  ) : (
                    alerts.slice(0, 4).map((alt) => {
                      const isBlocking = alt.type === 'BLOCKING_PAYROLL' || alt.type === 'WARNING';
                      return (
                        <div
                          key={alt.id || alt.title}
                          onClick={() => navigate(alt.link || '/payroll')}
                          className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                            isBlocking
                              ? 'bg-rose-50 border-rose-100 text-rose-800 hover:bg-rose-100'
                              : 'bg-amber-50 border-amber-100 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isBlocking ? 'bg-rose-600' : 'bg-amber-500'}`} />
                          <span className="truncate">{alt.message || alt.title}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Bottom Grid Cards (4 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {/* Bottom Card 1: Attendance Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Attendance Overview</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Source: Attendance Logs</p>

                {/* Vertical Bar Chart for Attendance */}
                <div className="h-32 mt-4 flex items-end justify-between px-2 gap-2 border-b border-slate-100 pb-2">
                  <div className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-extrabold text-sky-600">
                      {attendanceSummary.present || 0}
                    </span>
                    <div
                      className="w-full max-w-[32px] bg-sky-400 rounded-t-md transition-all"
                      style={{ height: `${Math.max(Math.round(((attendanceSummary.present || 0) / maxAttVal) * 100), 10)}%` }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-extrabold text-amber-600">
                      {attendanceSummary.late || 0}
                    </span>
                    <div
                      className="w-full max-w-[32px] bg-amber-300 rounded-t-md transition-all"
                      style={{ height: `${Math.max(Math.round(((attendanceSummary.late || 0) / maxAttVal) * 100), 10)}%` }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-extrabold text-rose-600">
                      {attendanceSummary.exception || 0}
                    </span>
                    <div
                      className="w-full max-w-[32px] bg-rose-200 rounded-t-md transition-all"
                      style={{ height: `${Math.max(Math.round(((attendanceSummary.exception || 0) / maxAttVal) * 100), 10)}%` }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-extrabold text-purple-600">
                      {attendanceSummary.overtime || 0}
                    </span>
                    <div
                      className="w-full max-w-[32px] bg-purple-300 rounded-t-md transition-all"
                      style={{ height: `${Math.max(Math.round(((attendanceSummary.overtime || 0) / maxAttVal) * 100), 10)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1 mt-1.5">
                  <span>Present</span>
                  <span>Late</span>
                  <span>Absent</span>
                  <span>Overtime</span>
                </div>
              </div>

              {/* Attendance Sub-Stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Missing check-outs:</span>
                  <span className="font-bold text-rose-600">
                    {attendanceSummary.missingCheckout || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Manual attendance edits:</span>
                  <span className="font-bold text-slate-700">{attendanceSummary.manualEdits || 0}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                  <span className="text-slate-500">Attendance coverage:</span>
                  <span className="font-extrabold text-emerald-600">{attendancePct}%</span>
                </div>
              </div>
            </div>

            {/* Bottom Card 2: Time Off Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Time Off Overview</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Source: Time Off Requests + Allocations</p>

                {/* Dynamic Mini Table */}
                <table className="w-full mt-4 text-[11px] text-left">
                  <thead>
                    <tr className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100">
                      <th className="pb-2">TYPE</th>
                      <th className="pb-2 text-center">APPROVED</th>
                      <th className="pb-2 text-right">PENDING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {timeOffSummary.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-4 text-center text-slate-400 italic">No time-off records</td>
                      </tr>
                    ) : (
                      timeOffSummary.map((item) => (
                        <tr key={item.typeName || item.code}>
                          <td className="py-2">{item.typeName}</td>
                          <td className="py-2 text-center text-slate-900 font-bold">{item.approvedDays || 0}</td>
                          <td className="py-2 text-right text-amber-600 font-bold">{item.pendingDays || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Allocations synced with payroll engine</span>
              </div>
            </div>

            {/* Bottom Card 3: Department Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Department Overview</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Source: Employee + Contract records</p>

                {/* Dynamic Headcount Table */}
                <table className="w-full mt-4 text-[11px] text-left">
                  <thead>
                    <tr className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100">
                      <th className="pb-2">DEPARTMENT</th>
                      <th className="pb-2 text-right">HEADCOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {departmentHeadcount.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="py-4 text-center text-slate-400 italic">No department records</td>
                      </tr>
                    ) : (
                      departmentHeadcount.map((dept) => (
                        <tr key={dept.id || dept.departmentName}>
                          <td className="py-2">{dept.departmentName}</td>
                          <td className="py-2 text-right text-slate-900 font-bold">{dept.headcount || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Total Core Staff:</span>
                <span className="font-extrabold text-slate-900">
                  {kpis.activeEmployeeCount || 0} Active
                </span>
              </div>
            </div>

            {/* Bottom Card 4: Operations & System Ledger */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Payroll Operations</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Real-time system telemetry and workflow triggers</p>
                <ul className="mt-3 text-[11px] text-slate-600 space-y-1.5 font-medium">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Active Employees:</span>
                    </span>
                    <strong className="text-slate-900">{kpis.activeEmployeeCount || 0}</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span>Payslips in Batch:</span>
                    </span>
                    <strong className="text-slate-900">{payslipsCount}</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                      <span>Active Departments:</span>
                    </span>
                    <strong className="text-slate-900">{kpis.totalDepartments || departmentHeadcount.length}</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>Open Alerts:</span>
                    </span>
                    <strong className={alerts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                      {alerts.length}
                    </strong>
                  </li>
                </ul>
              </div>

              {/* Action Banner Card */}
              <div className="mt-4 p-3 bg-emerald-950 rounded-xl text-white flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                    PAYRUN EXECUTION
                  </span>
                  <span className="text-xs font-bold text-white">Disburse Batch</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/payroll')}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  Payruns →
                </button>
              </div>
            </div>
          </div>

          {/* 6. Compliance & Challans Summary (Full-Width Footer Banner) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Compliance & Challans Summary</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory deductions & filings for {periodCycleLabel} calculated dynamically.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold font-mono">
                EPF <span className="text-slate-900 ml-1.5">{epfAmount}</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
                ESI <span className="text-slate-900 ml-1.5">{esiAmount}</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold font-mono">
                TDS <span className="text-slate-900 ml-1.5">{tdsAmount}</span>
              </span>

              <button
                type="button"
                onClick={() => navigate('/payroll')}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                Review & Disburse →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function HrManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: employees = [], isLoading: isEmpLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(),
  });

  const { data: attendanceLogs = [], isLoading: isAttLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => fetchAttendance(),
  });

  const { data: timeOffRequests = [], isLoading: isLeaveLoading } = useQuery({
    queryKey: ['timeOffRequests'],
    queryFn: () => fetchTimeOffRequests(),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => fetchContracts(),
  });

  const activeStaffCount = employees.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const presentToday = attendanceLogs.filter(l => l.status === 'PRESENT' || l.checkIn).length;
  const pendingLeaves = timeOffRequests.filter(r => r.status === 'PENDING');
  const runningContracts = contracts.filter(c => (c.status || '').toUpperCase() === 'ACTIVE' || (c.status || '').toUpperCase() === 'RUNNING');

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">HR Management Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              Live HR Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Human Resources Workspace — Real-time tracking for active staff, attendance health, contract management, and leave approvals.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>HR Workspace Active</span>
          </div>
        </div>
      </div>

      {/* 2. Top Row Metric Cards (Dynamic Live Data from Database) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Staff */}
        <div
          onClick={() => navigate('/employees')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              TOTAL ACTIVE STAFF
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{activeStaffCount}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
              <span>✓</span> Live Employee Directory
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Attendance Present Today */}
        <div
          onClick={() => navigate('/attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              PRESENT TODAY
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{presentToday}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
              <span>{activeStaffCount > 0 ? Math.round((presentToday / activeStaffCount) * 100) : 100}%</span> Coverage
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Running Contracts */}
        <div
          onClick={() => navigate('/contracts')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              ACTIVE CONTRACTS
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{runningContracts.length}</h3>
            <p className="text-[11px] font-medium text-slate-400 mt-1">Running Employee Contracts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FileSignature className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pending Time Off Approvals */}
        <div
          onClick={() => navigate('/time-off')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              LEAVE APPROVALS
            </span>
            <h3 className="text-3xl font-black text-[#E0533C] tracking-tight">{pendingLeaves.length}</h3>
            <p className="text-[11px] font-semibold text-amber-600 mt-1">Awaiting Manager Action</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#E0533C] flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Direct HR Actions & Pending Leave Approval Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Time Off Queue */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Pending Leave Approval Requests</h3>
              <p className="text-xs text-slate-400">Time Off requests requiring HR Manager sign-off</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/time-off')}
              className="text-xs font-bold text-[#E0533C] hover:underline"
            >
              View All ({timeOffRequests.length}) →
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {pendingLeaves.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No pending leave requests awaiting approval.
              </div>
            ) : (
              pendingLeaves.slice(0, 5).map((req) => (
                <div key={req._id || req.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">
                      {req.employeeName || 'Staff Member'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {req.leaveTypeName || 'Paid Time Off'} • {req.days || req.duration || 1} day(s) • {req.reason || 'Personal'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/time-off')}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                  >
                    Review Request
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* HR Operations Quick Launch */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
            HR Module Shortcuts
          </h3>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Employee Directory</h4>
                  <p className="text-[10px] text-slate-500">Manage staff profiles & workspace</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileSignature className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Contracts & Schedules</h4>
                  <p className="text-[10px] text-slate-500">Working shifts & contract details</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/attendance')}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Attendance Terminal</h4>
                  <p className="text-[10px] text-slate-500">Monitor check-in & exceptions</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
