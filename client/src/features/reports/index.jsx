import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Download, Filter, BarChart2 } from 'lucide-react';
import { fetchDashboardMetrics, mockDashboardData } from '../../lib/api/dashboard';
import { formatCurrency } from '../../lib/utils';

export default function ReportsFeature() {
  const [datePreset, setDatePreset] = useState('YEAR_TO_DATE');
  const { data: metrics = mockDashboardData, isLoading, isError } = useQuery({
    queryKey: ['reportMetrics', datePreset],
    queryFn: () => fetchDashboardMetrics({ datePreset }),
  });

  const monthlyTrends = metrics.charts?.monthlySalaryTrends || [];
  const departmentCosts = metrics.charts?.salaryCostByDepartment || [];
  const maxMonthlyAmount = Math.max(...monthlyTrends.map((trend) => trend.totalNet || 0), 1);

  const downloadSummary = () => {
    const rows = [
      ['Report', 'Period', 'Amount', 'Employees'],
      ...monthlyTrends.map((trend) => ['Monthly Payroll', trend.month, trend.totalNet || 0, trend.count || 0]),
      ...departmentCosts.map((department) => ['Department Cost', department.departmentName, department.totalNet || 0, department.employeeCount || 0]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `peoplepay-report-${datePreset.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Payroll Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated metrics, department cost breakdowns, and historical trends</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="report-period">Report period</label>
          <select
            id="report-period"
            value={datePreset}
            onChange={(event) => setDatePreset(event.target.value)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CURRENT_MONTH">Current month</option>
            <option value="LAST_30_DAYS">Last 30 days</option>
            <option value="Q3_2026">Q3 2026</option>
            <option value="YEAR_TO_DATE">Year to date</option>
          </select>
          <Button variant="outline" size="sm" icon={Download} onClick={downloadSummary} disabled={isLoading}>
            Export Summary (CSV)
          </Button>
        </div>
      </div>

      {isError && (
        <div className="px-4 py-3 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
          Live report data is unavailable. Showing the latest available report values.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Monthly Payroll Trend"
            subtitle="Past 6 months aggregated expenditure"
          />
          <CardContent>
            <div className="space-y-3" aria-busy={isLoading}>
              {monthlyTrends.length === 0 && !isLoading && (
                <p className="py-8 text-center text-xs text-slate-500">No payroll data for this period.</p>
              )}
              {monthlyTrends.map((trend) => (
                <div key={trend.month} className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">{formatReportMonth(trend.month)}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${Math.max((trend.totalNet / maxMonthlyAmount) * 100, 4)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900 w-24 text-right">
                      {formatCurrency(trend.totalNet || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Department Cost Allocations"
            subtitle="Payroll distribution across organizational units"
          />
          <CardContent className="space-y-4" aria-busy={isLoading}>
            {departmentCosts.length === 0 && !isLoading && (
              <p className="py-8 text-center text-xs text-slate-500">No department cost data for this period.</p>
            )}
            {departmentCosts.map((department) => (
              <div key={department.departmentName} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{department.departmentName}</p>
                  <p className="text-[11px] text-slate-500">{department.employeeCount || 0} Employees</p>
                </div>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(department.totalNet || 0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatReportMonth(month) {
  if (!month) return 'Unknown period';
  const date = new Date(`${month}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? month : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
