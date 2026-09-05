import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LogIn, LogOut, Clock, AlertTriangle } from 'lucide-react';

export default function AttendanceFeature() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Attendance & Time Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">Self-service check-in/out, worked hours calculation, and authorized corrections</p>
        </div>
      </div>

      {/* Self-service Check-in / Out Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-gradient-to-br from-emerald-900 to-slate-900 text-white border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Self-Service Terminal</span>
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold font-mono tracking-tight">09:14 AM</p>
              <p className="text-xs text-slate-300 mt-1">Today: Friday, September 5, 2026</p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <Button variant="primary" size="md" className="flex-1" icon={LogIn}>
                Check In
              </Button>
              <Button variant="outline" size="md" className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20" icon={LogOut}>
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader
            title="Attendance Exceptions & Alerts"
            subtitle="Missing check-outs or worked hour variances requiring manager review"
          />
          <CardContent>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Missing Check-out: EMP-003 (Marcus Vance)</p>
                <p className="text-xs text-amber-700 mt-0.5">Check-in recorded at 09:05 AM yesterday with no checkout recorded.</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 bg-white border-amber-300 text-amber-900 hover:bg-amber-100">
                Correct Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Logs Table */}
      <Card>
        <CardHeader title="Daily Attendance Records" subtitle="Worked hours computed from server-validated timestamps" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Worked Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold text-slate-900">Alex Rivera (EMP-001)</TableCell>
              <TableCell>2026-09-05</TableCell>
              <TableCell className="font-mono text-xs text-emerald-700 font-semibold">08:58 AM</TableCell>
              <TableCell className="font-mono text-xs text-slate-400">— (In Progress)</TableCell>
              <TableCell className="font-semibold text-slate-700">In Progress</TableCell>
              <TableCell>
                <Badge status="PRESENT" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold text-slate-900">Sarah Connor (EMP-002)</TableCell>
              <TableCell>2026-09-04</TableCell>
              <TableCell className="font-mono text-xs text-slate-600">09:02 AM</TableCell>
              <TableCell className="font-mono text-xs text-slate-600">05:31 PM</TableCell>
              <TableCell className="font-semibold text-slate-900">8.0 hrs</TableCell>
              <TableCell>
                <Badge status="PRESENT" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
