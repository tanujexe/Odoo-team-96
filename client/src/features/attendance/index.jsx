import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuth, ROLES } from '../../app/auth/AuthContext';
import {
  fetchAttendance,
  checkInApi,
  checkOutApi,
  correctAttendanceApi,
} from '../../lib/api/attendance';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState, EmptyState } from '../../components/ui/States';
import {
  Clock,
  LogIn,
  LogOut,
  AlertTriangle,
  FileEdit,
  CheckCircle,
  Calendar,
  Filter,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function AttendanceFeature() {
  const queryClient = useQueryClient();
  const { user, role, hasAccess } = useAuth();
  const [searchParams] = useSearchParams();
  const queryEmpId = searchParams.get('employeeId');

  // Employee only sees self; HR managers can see all or filtered
  const effectiveEmployeeId = role === ROLES.EMPLOYEE ? user?.employeeId || 'emp-alex-1' : queryEmpId || '';

  const isHrRole = hasAccess([ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER]);

  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    checkIn: '',
    checkOut: '',
    reason: '',
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['attendance', { employeeId: effectiveEmployeeId }],
    queryFn: () => fetchAttendance({ employeeId: effectiveEmployeeId }),
  });

  // Today's active log for current user
  const currentEmpId = user?.employeeId || 'emp-alex-1';
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayRecord = logs.find((l) => l.employeeId === currentEmpId && l.date === todayDateStr) || logs[0];
  const isCheckedIn = !!todayRecord && !todayRecord.checkOut;

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: () => checkInApi(currentEmpId),
    onSuccess: () => queryClient.invalidateQueries(['attendance']),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkOutApi(todayRecord?.id),
    onSuccess: () => queryClient.invalidateQueries(['attendance']),
  });

  const correctionMutation = useMutation({
    mutationFn: (data) => correctAttendanceApi(selectedRecord.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
      setIsCorrectionModalOpen(false);
      setSelectedRecord(null);
    },
  });

  const openCorrectionModal = (record) => {
    setSelectedRecord(record);
    setCorrectionForm({
      checkIn: record.checkIn ? record.checkIn.slice(0, 16) : '',
      checkOut: record.checkOut ? record.checkOut.slice(0, 16) : '',
      reason: record.correctionReason || '',
    });
    setIsCorrectionModalOpen(true);
  };

  const handleCorrectionSubmit = (e) => {
    e.preventDefault();
    correctionMutation.mutate(correctionForm);
  };

  const exceptionRecord = logs.find((l) => l.status === 'EXCEPTION');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Attendance & Time Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time check-in/out terminal, worked hours validation, and authorized manager corrections
          </p>
        </div>
      </div>

      {/* Terminal & Exception Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Self-Service Card */}
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border-0 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Self-Service Terminal
              </span>
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight">
                {isCheckedIn ? 'Status: Checked In' : 'Status: Checked Out'}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {user?.name} ({role})
              </p>
            </div>

            {isCheckedIn && (
              <div className="p-3 bg-white/10 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Check In Time:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Daily Shift:</span>
                  <span className="font-mono">8.0 hrs planned</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                icon={LogIn}
                disabled={isCheckedIn}
                isLoading={checkInMutation.isPending}
                onClick={() => checkInMutation.mutate()}
              >
                Check In
              </Button>
              <Button
                variant="outline"
                size="md"
                className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20 disabled:opacity-40"
                icon={LogOut}
                disabled={!isCheckedIn}
                isLoading={checkOutMutation.isPending}
                onClick={() => checkOutMutation.mutate()}
              >
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Exceptions Banner */}
        <div className="lg:col-span-2">
          {exceptionRecord ? (
            <Card className="h-full border-amber-200 bg-amber-50/50">
              <CardHeader
                title="Active Attendance Exceptions"
                subtitle="Missing check-outs or worked hour variances requiring review"
              />
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {exceptionRecord.employeeName} ({exceptionRecord.employeeCode})
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {exceptionRecord.exceptionReason} on {formatDate(exceptionRecord.date)}
                      </p>
                    </div>
                  </div>
                  {isHrRole ? (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={FileEdit}
                      className="shrink-0 bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                      onClick={() => openCorrectionModal(exceptionRecord)}
                    >
                      Correct Record
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded">
                      Pending HR Review
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-6 text-center border-slate-200">
              <div>
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Zero Attendance Exceptions</h4>
                <p className="text-xs text-slate-500 mt-1">All daily check-ins and check-outs are reconciled.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Attendance Logs Table */}
      <Card>
        <CardHeader
          title="Attendance History"
          subtitle={effectiveEmployeeId ? `Displaying records for employee (${effectiveEmployeeId})` : 'All organizational attendance entries'}
        />
        {isLoading ? (
          <LoadingState message="Loading attendance records..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No attendance entries recorded"
            description="Use the self-service terminal above to record daily check-in."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Worked Hours</TableHead>
                <TableHead>Status</TableHead>
                {isHrRole && <TableHead className="text-right">HR Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">{log.employeeName}</p>
                      <p className="text-xs text-slate-400 font-mono">{log.employeeCode}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-600">{formatDate(log.date)}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">
                    {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">
                    {log.checkOut ? (
                      new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : (
                      <span className="text-amber-600 font-medium">In Progress</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-slate-900">
                    {log.workedHours !== null ? `${log.workedHours}h` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge status={log.status} />
                  </TableCell>
                  {isHrRole && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={FileEdit}
                        onClick={() => openCorrectionModal(log)}
                      >
                        Correct
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Attendance Correction Modal */}
      {isCorrectionModalOpen && selectedRecord && (
        <Modal
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
          title="Attendance Record Correction"
          description={`Update timestamps with mandatory audit reason for ${selectedRecord.employeeName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCorrectionSubmit} className="space-y-4">
            <Input
              label="Check In Timestamp"
              type="datetime-local"
              value={correctionForm.checkIn}
              onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })}
              required
            />
            <Input
              label="Check Out Timestamp"
              type="datetime-local"
              value={correctionForm.checkOut}
              onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })}
              required
            />
            <Input
              label="Audit Correction Reason"
              placeholder="e.g. Employee forgot to clock out before offsite meeting"
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              required
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsCorrectionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={correctionMutation.isPending}
              >
                Save Correction
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
