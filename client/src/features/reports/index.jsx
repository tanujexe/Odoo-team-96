import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Download, Filter, BarChart2 } from 'lucide-react';
import { mockDashboardMetrics } from '../../lib/api/mockData';
import { formatCurrency } from '../../lib/utils';

export default function ReportsFeature() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Payroll Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated metrics, department cost breakdowns, and historical trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Download}>
            Export Summary (CSV)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Monthly Payroll Trend"
            subtitle="Past 6 months aggregated expenditure"
          />
          <CardContent>
            <div className="space-y-3">
              {mockDashboardMetrics.monthlyPayrollTrends.map((t) => (
                <div key={t.month} className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">{t.month} 2026</span>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${(t.amount / 150000) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900 w-24 text-right">
                      {formatCurrency(t.amount)}
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-slate-900">Engineering (ENG)</p>
                <p className="text-[11px] text-slate-500">14 Employees</p>
              </div>
              <span className="text-sm font-bold text-slate-900">$84,500.00</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-slate-900">Product Management (PROD)</p>
                <p className="text-[11px] text-slate-500">4 Employees</p>
              </div>
              <span className="text-sm font-bold text-slate-900">$26,000.00</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-slate-900">Finance & People (FIN/HR)</p>
                <p className="text-[11px] text-slate-500">6 Employees</p>
              </div>
              <span className="text-sm font-bold text-slate-900">$32,000.00</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
