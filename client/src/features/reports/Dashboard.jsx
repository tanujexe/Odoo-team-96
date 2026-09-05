import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Users, DollarSign, CalendarCheck, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { mockDashboardMetrics } from '../../lib/api/mockData';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../app/auth/AuthContext';

export default function DashboardFeature() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <Badge status="ACTIVE" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            System Live & Connected
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h2>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            PeoplePay360 is operating in continuous sync across employment records, working schedules, attendance logs, and deterministic payroll.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="primary" icon={TrendingUp}>
            New Payrun
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Headcount</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{mockDashboardMetrics.totalEmployees}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span>+2 this month</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Payroll</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(mockDashboardMetrics.payrollExpenditure)}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">September 2026</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leave</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{mockDashboardMetrics.pendingLeaveRequests}</h3>
              <p className="text-xs text-amber-600 font-medium mt-1">Requires HR approval</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Alerts</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{mockDashboardMetrics.attendanceExceptions}</h3>
              <p className="text-xs text-rose-600 font-medium mt-1">1 Missing check-out</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Recent Payroll Batches"
            subtitle="Current cycle payruns and settlement state"
            action={
              <Button variant="ghost" size="sm" icon={ArrowUpRight}>
                View All
              </Button>
            }
          />
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">September 2026 Regular Payrun</p>
                <p className="text-xs text-slate-500 mt-0.5">3 Employees • Standard Tech Structure</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status="COMPUTED" />
                <span className="text-sm font-bold text-slate-900">$18,950.00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Operational System Status"
            subtitle="Cross-module verification & integrity checks"
          />
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Contract Resolver</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Deterministic Salary Rule Engine</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Audit Logging Ledger</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
