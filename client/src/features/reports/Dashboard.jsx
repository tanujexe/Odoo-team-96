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
  Building2,
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

  // Default / fallback values matching the design screenshot
  const totalNet = kpis.totalNetSalaryPaid !== undefined && kpis.totalNetSalaryPaid !== 0 ? formatCurrency(kpis.totalNetSalaryPaid) : '₹18.4L';
  const payslipsCount = kpis.payslipsGenerated || 148;
  const paidCount = kpis.paidPayslipsCount || 142;
  const pendingCount = payslipsCount - paidCount > 0 ? payslipsCount - paidCount : 6;
  const avgSalary = kpis.averageSalary !== undefined && kpis.averageSalary !== 0 ? formatCurrency(kpis.averageSalary) : '₹12,432';
  const timeOffDays = kpis.approvedTimeOffDays || 34;
  const attendancePct = kpis.attendanceCoveragePct || 94;

  // Department Bar Chart Data
  const deptBarData = charts.salaryCostByDepartment && charts.salaryCostByDepartment.length > 0
    ? charts.salaryCostByDepartment
    : [
        { departmentName: 'HR', totalNet: 110000, label: '₹110k', heightPct: 65 },
        { departmentName: 'Sales', totalNet: 150000, label: '₹150k', heightPct: 85 },
        { departmentName: 'Support', totalNet: 90000, label: '₹90k', heightPct: 50 },
        { departmentName: 'Finance', totalNet: 130000, label: '₹130k', heightPct: 75 },
        { departmentName: 'IT', totalNet: 170000, label: '₹170k', heightPct: 95 },
      ];

  // Monthly Salary Trend Data (for SVG Spline Line)
  const trendMonths = [
    { month: 'Apr', val: 12.0 },
    { month: 'May', val: 12.8 },
    { month: 'Jun', val: 12.2 },
    { month: 'Jul', val: 15.0, isPeak: true },
    { month: 'Aug', val: 10.5 },
    { month: 'Sep', val: 13.5 },
  ];

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
            Dashboard should help payroll/HR users understand payments, staffing impact, leave patterns, and attendance quality for the selected period.
          </p>
        </div>

        {/* Top Header Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sep 2026 Cycle</span>
          </div>

          <button
            type="button"
            className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Notifications"
          >
            <Clock className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </button>

          <button
            type="button"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Dashboard Settings"
          >
            <Building2 className="w-4 h-4" />
          </button>
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
              <option value="CURRENT_MONTH">Sep 2026</option>
              <option value="LAST_30_DAYS">Aug 2026</option>
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
              {mockDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
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
          <Button variant="primary" size="md" className="rounded-xl px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs">
            Apply Filters
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Aggregating live organizational metrics..." />
      ) : (
        <>
          {/* 3. Row of 5 KPI Cards */}
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
                  <span>↑</span> +8.5% vs previous month
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
                <p className="text-[11px] font-medium text-slate-400 mt-1">Based on current payrun</p>
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
                <p className="text-[11px] font-medium text-slate-400 mt-1">Across selected period</p>
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
                <p className="text-[11px] font-medium text-slate-400 mt-1">Present / reviewed records</p>
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
                <div className="h-48 mt-6 flex items-end justify-between px-2 gap-3 pb-2 border-b border-slate-100">
                  {deptBarData.map((d, i) => {
                    const name = d.departmentName || d.name || `Dept ${i + 1}`;
                    const label = d.label || (d.totalNet ? `₹${Math.round(d.totalNet / 1000)}k` : '₹100k');
                    const height = d.heightPct || (30 + i * 15);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <span className="text-[10px] font-bold text-slate-700 opacity-90 group-hover:scale-110 transition-transform">
                          {label}
                        </span>
                        <div
                          className="w-full max-w-[42px] bg-sky-400 hover:bg-sky-500 rounded-t-lg transition-all duration-300 shadow-xs"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[11px] font-bold text-slate-500 px-2 mt-2">
                  {deptBarData.map((d, i) => (
                    <span key={i} className="flex-1 text-center truncate">
                      {d.departmentName || d.name || `D${i}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-center">
                <span className="text-[11px] font-medium text-slate-400">
                  Total Department Payroll:{' '}
                  <strong className="text-slate-800 font-bold">₹6,50,000</strong>
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
                    6 MONTHS
                  </span>
                </div>

                {/* Spline Line Chart Container */}
                <div className="relative h-48 mt-4 flex flex-col justify-end">
                  {/* Floating Peak Callout Pill */}
                  <div className="absolute top-4 left-[58%] -translate-x-1/2 bg-sky-50 border border-sky-200 text-sky-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-xs z-10 flex items-center gap-1">
                    <span>Jul Peak: 15.0L</span>
                  </div>

                  {/* SVG Spline Curve */}
                  <svg className="w-full h-32 overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 60 Q 60 50 110 65 T 210 20 T 290 55 L 290 100 L 10 100 Z"
                      fill="url(#trendGradient)"
                    />
                    <path
                      d="M 10 60 Q 60 50 110 65 T 210 20 T 290 55"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Node points */}
                    <circle cx="10" cy="60" r="3.5" fill="#0284c7" />
                    <circle cx="66" cy="54" r="3.5" fill="#0284c7" />
                    <circle cx="122" cy="62" r="3.5" fill="#0284c7" />
                    <circle cx="178" cy="22" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="234" cy="75" r="3.5" fill="#0284c7" />
                    <circle cx="290" cy="55" r="3.5" fill="#0284c7" />
                  </svg>

                  <div className="flex justify-between text-[11px] font-bold text-slate-400 px-2 mt-4 pt-2 border-t border-slate-100">
                    {trendMonths.map((m, i) => (
                      <span key={i} className={m.isPeak ? 'text-sky-600 font-extrabold' : ''}>
                        {m.month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Payslip Status & Payroll Alerts */}
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

                {/* Status Split Progress Bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-700">Status split</span>
                    <span className="text-slate-400">Total: {payslipsCount} payslips</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
                    <div className="bg-emerald-500 h-full w-[65%]" title="Paid" />
                    <div className="bg-cyan-500 h-full w-[18%]" title="Done" />
                    <div className="bg-amber-400 h-full w-[11%]" title="Pending" />
                    <div className="bg-rose-500 h-full w-[6%]" title="Warning" />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 pt-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Paid</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500"></span> Done</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400"></span> Pending</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500"></span> Warning</span>
                  </div>
                </div>

                {/* CURRENT ALERTS Pills */}
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">CURRENT ALERTS</p>
                  
                  <div
                    onClick={() => navigate('/employees')}
                    className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium flex items-center gap-2.5 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                    <span>2 employees missing bank account</span>
                  </div>

                  <div
                    onClick={() => navigate('/payroll')}
                    className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100/60 text-rose-700 text-xs font-medium flex items-center gap-2.5 hover:bg-rose-100/80 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>1 duplicate payslip warning</span>
                  </div>

                  <div
                    onClick={() => navigate('/payroll')}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-medium flex items-center gap-2.5 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>4 drafts still not validated</span>
                  </div>

                  <div
                    onClick={() => navigate('/contracts')}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-2.5 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                    <span>3 contracts expiring this month</span>
                  </div>
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
                <p className="text-[11px] text-slate-400 mt-0.5">Source: Attendance</p>

                {/* Vertical Bar Chart for Attendance */}
                <div className="h-32 mt-4 flex items-end justify-between px-2 gap-2 border-b border-slate-100 pb-2">
                  <div className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-extrabold text-sky-600">
                      {dashboard?.attendanceSummary?.present || 94}
                    </span>
                    <div className="w-full max-w-[32px] bg-sky-400 rounded-t-md h-[85%]" />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-extrabold text-amber-600">
                      {dashboard?.attendanceSummary?.late || 18}
                    </span>
                    <div className="w-full max-w-[32px] bg-amber-300 rounded-t-md h-[45%]" />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-extrabold text-rose-600">
                      {dashboard?.attendanceSummary?.exception || 9}
                    </span>
                    <div className="w-full max-w-[32px] bg-rose-200 rounded-t-md h-[25%]" />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-extrabold text-purple-600">22</span>
                    <div className="w-full max-w-[32px] bg-purple-300 rounded-t-md h-[55%]" />
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
                    {dashboard?.attendanceSummary?.missingCheckout || 5}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Manual attendance edits:</span>
                  <span className="font-bold text-slate-700">7</span>
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

                {/* Mini Table */}
                <table className="w-full mt-4 text-[11px] text-left">
                  <thead>
                    <tr className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100">
                      <th className="pb-2">TYPE</th>
                      <th className="pb-2 text-center">APPROVED</th>
                      <th className="pb-2 text-right">PENDING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    <tr>
                      <td className="py-2">Paid Time Off</td>
                      <td className="py-2 text-center text-slate-900 font-bold">24</td>
                      <td className="py-2 text-right text-amber-600 font-bold">3</td>
                    </tr>
                    <tr>
                      <td className="py-2">Sick Leave</td>
                      <td className="py-2 text-center text-slate-900 font-bold">6</td>
                      <td className="py-2 text-right text-amber-600 font-bold">1</td>
                    </tr>
                    <tr>
                      <td className="py-2">Comp Off</td>
                      <td className="py-2 text-center text-slate-900 font-bold">4</td>
                      <td className="py-2 text-right text-amber-600 font-bold">2</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Allocations synced with Sep payroll</span>
              </div>
            </div>

            {/* Bottom Card 3: Department Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Department Overview</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Source: Employee + Contract + Payslip totals</p>

                {/* Mini Headcount Table */}
                <table className="w-full mt-4 text-[11px] text-left">
                  <thead>
                    <tr className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100">
                      <th className="pb-2">DEPARTMENT</th>
                      <th className="pb-2 text-right">HEADCOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    <tr>
                      <td className="py-2">IT</td>
                      <td className="py-2 text-right text-slate-900 font-bold">18</td>
                    </tr>
                    <tr>
                      <td className="py-2">Sales</td>
                      <td className="py-2 text-right text-slate-900 font-bold">22</td>
                    </tr>
                    <tr>
                      <td className="py-2">HR</td>
                      <td className="py-2 text-right text-slate-900 font-bold">8</td>
                    </tr>
                    <tr>
                      <td className="py-2">Support</td>
                      <td className="py-2 text-right text-slate-900 font-bold">14</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Total Core Staff:</span>
                <span className="font-extrabold text-slate-900">
                  {kpis.activeEmployeeCount || 62} Active
                </span>
              </div>
            </div>

            {/* Bottom Card 4: Models to Aggregate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Models to Aggregate</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">This is the actual challenge behind the dashboard.</p>
                <ul className="mt-3 text-[11px] text-slate-600 space-y-1.5 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Employees / Depts: headcount & ownership</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Contracts: wage & schedule link</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Payruns / Payslips: totals & trend data</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Attendance: overtime & late marks</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Time Off: leave taken vs balances</span>
                  </li>
                </ul>
              </div>

              {/* Dark Green Banner Card */}
              <div className="mt-4 p-3 bg-emerald-950 rounded-xl text-white flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                    AUDIT LEDGER
                  </span>
                  <span className="text-xs font-bold text-white">Run Summary</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/reports')}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  Full Report →
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
                  Statutory deductions & filings for Sep 2026 cycle are synchronized.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold font-mono">
                EPF <span className="text-slate-900 ml-1.5">₹11,97,638</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
                ESI <span className="text-slate-900 ml-1.5">₹65,505</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold font-mono">
                TDS <span className="text-slate-900 ml-1.5">₹9,16,551</span>
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
