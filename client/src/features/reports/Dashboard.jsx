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
  AlertOctagon,
  ArrowUpRight,
  TrendingUp,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

export default function DashboardFeature() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [datePreset, setDatePreset] = useState('CURRENT_MONTH');
  const [departmentId, setDepartmentId] = useState('');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboardMetrics', { datePreset, departmentId }],
    queryFn: () => fetchDashboardMetrics({ datePreset, departmentId }),
  });

  const kpis = dashboard?.kpis || {};
  const charts = dashboard?.charts || { salaryCostByDepartment: [], monthlySalaryTrends: [] };
  const alerts = dashboard?.alerts || [];

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Operations Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated payroll expenditure, attendance compliance, leave metrics, and system integrity alerts
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

            <Card className="hover:border-slate-300 transition-colors">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Coverage</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {kpis.attendanceCoveragePct || 0}%
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {kpis.activeEmployeeCount || 0} Active Employees
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operational Alerts & Department Charts */}
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
