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

export default function DashboardFeature() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [datePreset, setDatePreset] = useState('CURRENT_MONTH');
  const [departmentId, setDepartmentId] = useState('');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboardMetrics', { datePreset, departmentId }],
    queryFn: () => fetchDashboardMetrics({ datePreset, departmentId }),
    enabled: role !== ROLES.EMPLOYEE, // Managerial metrics only fetched for non-employee roles
  });

  const kpis = dashboard?.kpis || {};
  const charts = dashboard?.charts || { salaryCostByDepartment: [], monthlySalaryTrends: [] };
  const alerts = dashboard?.alerts || [];

  // ==========================================
  // 1. EMPLOYEE ROLE DASHBOARD (Personal View)
  // ==========================================
  if (role === ROLES.EMPLOYEE) {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-emerald-950 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
              <UserCheck className="w-3.5 h-3.5" /> Employee Portal
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name || 'Employee'}!</h2>
            <p className="text-xs text-slate-300 mt-1">
              Access your personal workspace, daily check-in attendance, leave requests, and payslips
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={Clock} onClick={() => navigate('/attendance')}>
              Mark Attendance
            </Button>
            <Button variant="primary" size="sm" icon={CalendarCheck} onClick={() => navigate('/time-off')}>
              Request Time Off
            </Button>
          </div>
        </div>

        {/* Employee Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Status</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">PRESENT</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">On Schedule (09:00 AM)</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Leave</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">13 Days</h3>
                <p className="text-[11px] text-slate-400 mt-1">Paid Time Off (PTO)</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Payslip</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">August 2026</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Disbursed & Ready</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            onClick={() => navigate('/attendance')}
            className="hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
                <Clock className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Daily Attendance Ledger</h3>
              <p className="text-xs text-slate-500 mt-1">
                View your check-in logs, total weekly hours, and attendance compliance history.
              </p>
            </div>
          </Card>

          <Card
            onClick={() => navigate('/time-off')}
            className="hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-700">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Time Off & Leave Requests</h3>
              <p className="text-xs text-slate-500 mt-1">
                Submit new leave applications, check approval status, and track your leave balance.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 2. MANAGEMENT & ADMIN DASHBOARD (Role-tailored operations)
  // ==============================================================
  const isHRManager = role === ROLES.HR_MANAGER;
  const isPayroll = role === ROLES.HR_PAYROLL_MANAGER || role === ROLES.HR_PAYROLL_USER;
  const isAdmin = role === ROLES.ADMIN;

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono uppercase tracking-wider ${
                isAdmin
                  ? 'bg-purple-100 text-purple-800'
                  : isPayroll
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {role} Workspace
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isAdmin
              ? 'Executive System & Governance Dashboard'
              : isPayroll
              ? 'Payroll & Disbursement Operations Hub'
              : 'HR Operations & Workforce Intelligence'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, {user?.name}! Tailored operational metrics for your role.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Period filter"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-medium"
            >
              <option value="CURRENT_MONTH">September 2026 (Current Cycle)</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="Q3_2026">Q3 2026 (Jul - Sep)</option>
              <option value="YEAR_TO_DATE">Year to Date 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Department filter"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-medium"
            >
              <option value="">All Departments</option>
              {mockDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Aggregating live organizational metrics..." />
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {(isAdmin || isPayroll) && (
              <Card className="hover:border-slate-300 transition-colors">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Net Disbursement</p>
                    <h3 data-testid="kpi-total-net" className="text-2xl font-extrabold text-emerald-700 mt-1">
                      {formatCurrency(kpis.totalNetSalaryPaid || 0)}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Gross: {formatCurrency(kpis.totalGrossSalaryPaid || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            )}

            {(isAdmin || isPayroll) && (
              <Card className="hover:border-slate-300 transition-colors">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid Payslips</p>
                    <h3 data-testid="kpi-payslips-count" className="text-2xl font-bold text-slate-900 mt-1">
                      {kpis.paidPayslipsCount || 0} / {kpis.payslipsGenerated || 0}
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Reconciled</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="hover:border-slate-300 transition-colors">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Employees</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {kpis.activeEmployeeCount || 4} <span className="text-xs font-normal text-slate-500">staff</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Across 3 departments</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-slate-300 transition-colors">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Leave</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {kpis.approvedTimeOffDays || 0} <span className="text-xs font-normal text-slate-500">days</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Idempotent ledger tracked</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operational Quick Actions based on Role */}
          <Card className="p-4 bg-slate-900 text-white border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Operational Quick Actions ({role})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Direct shortcuts tailored to your access permissions</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isAdmin && (
                  <Button variant="primary" size="sm" icon={ShieldCheck} onClick={() => navigate('/admin')}>
                    User Role Governance
                  </Button>
                )}
                {(isAdmin || isHRManager) && (
                  <Button variant="outline" size="sm" icon={Users} onClick={() => navigate('/employees')}>
                    Manage Directory
                  </Button>
                )}
                {(isAdmin || isPayroll) && (
                  <Button variant="primary" size="sm" icon={DollarSign} onClick={() => navigate('/payroll')}>
                    Process Payruns
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Department Breakdown & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Breakdown Card */}
            <Card className="lg:col-span-2">
              <CardHeader
                title="Payroll Distribution by Department"
                subtitle="Aggregated Net & Gross expenditures across organizational units"
                action={
                  <Button variant="ghost" size="sm" icon={ArrowUpRight} onClick={() => navigate('/reports')}>
                    View Details
                  </Button>
                }
              />
              <CardContent className="space-y-4">
                {charts.salaryCostByDepartment.map((dept, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">
                        {dept.departmentName} ({dept.employeeCount} Staff)
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(dept.totalNet)}
                        </span>
                        <span className="text-[11px] text-slate-400">({dept.percentage || 50}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${dept.percentage || 50}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Operational Alerts Card */}
            <Card>
              <CardHeader
                title="Integrity & Notice Feed"
                subtitle="Live status from contract resolver & attendance exceptions"
              />
              <CardContent className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => alert.link && navigate(alert.link)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{alert.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{alert.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
