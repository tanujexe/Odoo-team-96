import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Plus, FileText, Calendar } from 'lucide-react';
import { mockContracts, mockWorkingSchedules } from '../../lib/api/mockData';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function ContractsFeature() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employment Contracts & Schedules</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage historical contracts, salary structure mappings, and working schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" icon={Plus}>
            New Contract
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contracts Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Active & Historical Contracts"
              subtitle="Contracts used for payroll period resolution"
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Wage</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockContracts.map((cnt) => (
                  <TableRow key={cnt.id}>
                    <TableCell className="font-mono text-xs font-semibold">{cnt.contractCode}</TableCell>
                    <TableCell className="font-medium text-slate-900">{cnt.employeeName}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{formatCurrency(cnt.wage)} / mo</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(cnt.startDate)}</TableCell>
                    <TableCell>
                      <Badge status={cnt.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Working Schedules */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Working Schedules"
              subtitle="Daily definitions & auto-calculated weekly hours"
              action={
                <Button variant="outline" size="sm" icon={Plus}>
                  Add
                </Button>
              }
            />
            <CardContent className="space-y-4">
              {mockWorkingSchedules.map((sch) => (
                <div key={sch.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">{sch.name}</h4>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      {sch.calculatedWeeklyHours}h / week
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Mon - Fri: 09:00 - 17:30 (30m break)</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
