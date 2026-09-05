import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Plus, Check, X, Calendar } from 'lucide-react';

export default function TimeOffFeature() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Time Off & Leave Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Leave allocations, balance tracking, and manager approval workflows</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" icon={Plus}>
            Request Time Off
          </Button>
        </div>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid Time Off (PTO)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">14.5</span>
            <span className="text-xs text-slate-500">days available</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-[65%]" />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sick Leave</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">8.0</span>
            <span className="text-xs text-slate-500">days available</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full w-[80%]" />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unpaid Leave</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">0</span>
            <span className="text-xs text-slate-500">days consumed</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Requires special approval</p>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader
          title="Leave Requests"
          subtitle="Idempotent consumption ledger with transaction verification"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">HR Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold text-slate-900">Marcus Vance</TableCell>
              <TableCell>Paid Time Off (PTO)</TableCell>
              <TableCell className="text-xs text-slate-600">Sep 15, 2026 - Sep 17, 2026</TableCell>
              <TableCell className="font-semibold">3 days</TableCell>
              <TableCell>
                <Badge status="PENDING" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="primary" size="sm" icon={Check}>
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" icon={X}>
                    Refuse
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold text-slate-900">Alex Rivera</TableCell>
              <TableCell>Sick Leave</TableCell>
              <TableCell className="text-xs text-slate-600">Aug 20, 2026</TableCell>
              <TableCell className="font-semibold">1 day</TableCell>
              <TableCell>
                <Badge status="APPROVED" />
              </TableCell>
              <TableCell className="text-right text-xs text-slate-400">Processed</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
