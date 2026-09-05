import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Plus, Calculator, FileCheck, DollarSign, Download, Send } from 'lucide-react';
import { mockPayruns } from '../../lib/api/mockData';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function PayrollFeature() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Operations & Payslips</h2>
          <p className="text-xs text-slate-500 mt-0.5">Two-step payrun wizard, deterministic salary rules, blocking warnings, and payslip PDFs</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" icon={Plus}>
            Create Payrun Wizard
          </Button>
        </div>
      </div>

      {/* Payrun Lifecycle Status */}
      <Card>
        <CardHeader
          title="Payrun Batches"
          subtitle="Lifecycle: DRAFT → COMPUTED → VALIDATED → PAID"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payrun Name</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Gross Total</TableHead>
              <TableHead>Net Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPayruns.map((pr) => (
              <TableRow key={pr.id}>
                <TableCell>
                  <p className="font-semibold text-slate-900">{pr.name}</p>
                  <p className="text-xs text-slate-400">{pr.salaryStructureName}</p>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {formatDate(pr.periodStart)} – {formatDate(pr.periodEnd)}
                </TableCell>
                <TableCell className="font-medium text-slate-800">{pr.employeeCount} selected</TableCell>
                <TableCell className="font-semibold text-slate-900">{formatCurrency(pr.totalGross)}</TableCell>
                <TableCell className="font-bold text-emerald-700">{formatCurrency(pr.totalNet)}</TableCell>
                <TableCell>
                  <Badge status={pr.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm">
                      View Run
                    </Button>
                    <Button variant="ghost" size="sm" icon={Download}>
                      PDF
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
