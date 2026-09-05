import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuth, ROLES } from '../../app/auth/AuthContext';
import {
  fetchTimeOffBalances,
  fetchTimeOffRequests,
  createTimeOffRequest,
  approveTimeOffRequest,
  refuseTimeOffRequest,
  cancelTimeOffRequest,
} from '../../lib/api/timeOff';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState, EmptyState } from '../../components/ui/States';
import {
  CalendarDays,
  Plus,
  Check,
  X,
  RotateCcw,
  Sparkles,
  HeartPulse,
  Ban,
  Clock,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

const calculateDaysBetween = (startStr, endStr, unit = 'FULL') => {
  if (unit === 'HALF_AM' || unit === 'HALF_PM') return 0.5;
  if (!startStr || !endStr) return 1;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 1;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

export default function TimeOffFeature() {
  const queryClient = useQueryClient();
  const { user, role, hasAccess } = useAuth();
  const [searchParams] = useSearchParams();
  const queryEmpId = searchParams.get('employeeId');

  const currentEmpId = role === ROLES.EMPLOYEE ? user?.employeeId || 'emp-alex-1' : queryEmpId || 'emp-alex-1';
  const isHrRole = hasAccess([ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRefuseModalOpen, setIsRefuseModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [refuseReason, setRefuseReason] = useState('');

  const [requestForm, setRequestForm] = useState({
    leaveType: 'PAID_TIME_OFF',
    requestUnit: 'FULL',
    startDate: '2026-09-10',
    endDate: '2026-09-10',
    days: 1,
    reason: '',
  });

  const { data: balances, isLoading: isBalancesLoading } = useQuery({
    queryKey: ['timeOffBalances', currentEmpId],
    queryFn: () => fetchTimeOffBalances(currentEmpId),
  });

  const requestParams = {};
  if (role === ROLES.EMPLOYEE) {
    requestParams.employeeId = currentEmpId;
  } else if (queryEmpId) {
    requestParams.employeeId = queryEmpId;
  }

  const { data: requests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ['timeOffRequests', requestParams],
    queryFn: () => fetchTimeOffRequests(requestParams),
  });

  // Calculate live paid vs unpaid breakdown based on balance
  const activePtoBalance = balances?.pto?.available ?? 14.5;
  const activeSickBalance = balances?.sick?.available ?? 8.0;

  const currentAvailable =
    requestForm.leaveType === 'PAID_TIME_OFF'
      ? activePtoBalance
      : requestForm.leaveType === 'SICK_LEAVE'
      ? activeSickBalance
      : 0;

  const requestedDays = requestForm.requestUnit !== 'FULL' ? 0.5 : requestForm.days;
  const livePaidDays =
    requestForm.leaveType === 'UNPAID_LEAVE' ? 0 : Math.min(requestedDays, Math.max(0, currentAvailable));
  const liveUnpaidDays =
    requestForm.leaveType === 'UNPAID_LEAVE' ? requestedDays : Math.max(0, requestedDays - livePaidDays);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) =>
      createTimeOffRequest({
        ...data,
        days: data.requestUnit !== 'FULL' ? 0.5 : data.days,
        employeeId: currentEmpId,
        employeeName: user?.name || 'Alex Rivera',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
      setIsRequestModalOpen(false);
      setRequestForm({
        leaveType: 'PAID_TIME_OFF',
        requestUnit: 'FULL',
        startDate: '2026-09-10',
        endDate: '2026-09-10',
        days: 1,
        reason: '',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
    },
  });

  const refuseMutation = useMutation({
    mutationFn: refuseTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
      setIsRefuseModalOpen(false);
      setRefuseReason('');
      setSelectedRequestId(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
    },
  });

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(requestForm);
  };

  const handleOpenRefuseModal = (reqId) => {
    setSelectedRequestId(reqId);
    setRefuseReason('');
    setIsRefuseModalOpen(true);
  };

  const handleConfirmRefuse = (e) => {
    e.preventDefault();
    if (!selectedRequestId) return;
    refuseMutation.mutate({ id: selectedRequestId, reason: refuseReason });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Time Off & Leave Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Idempotent leave allocation ledger, half-day tracking, automatic unpaid overflow, and manager approvals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsRequestModalOpen(true)}
          >
            Request Time Off
          </Button>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* PTO Card */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Paid Time Off (PTO)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span data-testid="pto-available-balance" className="text-3xl font-extrabold text-slate-900">
              {balances?.pto?.available ?? 14.5}
            </span>
            <span className="text-xs font-medium text-slate-500">days available</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((balances?.pto?.available ?? 14.5) / (balances?.pto?.total || 20)) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {balances?.pto?.consumed ?? 5.5} days used out of {balances?.pto?.total ?? 20} total
          </p>
        </Card>

        {/* Sick Leave Card */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sick Leave
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span data-testid="sick-available-balance" className="text-3xl font-extrabold text-slate-900">
              {balances?.sick?.available ?? 8.0}
            </span>
            <span className="text-xs font-medium text-slate-500">days available</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((balances?.sick?.available ?? 8.0) / (balances?.sick?.total || 10)) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {balances?.sick?.consumed ?? 2.0} days used out of {balances?.sick?.total ?? 10} total
          </p>
        </Card>

        {/* Unpaid Leave Card */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Unpaid Leave (LWP)
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Ban className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {balances?.unpaid?.consumed ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500">days taken</span>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Deducts from payroll calculations automatically without consuming annual paid quota.
          </p>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader
          title="Leave Requests & Approval Workflow"
          subtitle="Idempotent consumption ledger with manager approval workflow"
        />
        {isRequestsLoading ? (
          <LoadingState message="Loading leave requests..." />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No leave requests filed"
            description="Use the button above to submit your planned time off."
            actionLabel="Request Time Off"
            onAction={() => setIsRequestModalOpen(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Duration / Split</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => {
                const reqId = req._id || req.id;
                const empName = req.employeeName || (typeof req.employeeId === 'object' ? req.employeeId?.name : '') || 'Employee';
                const typeName = req.leaveTypeName || (typeof req.typeId === 'object' ? req.typeId?.name : '') || 'Time Off';
                const durationDays = req.duration ?? req.days ?? 1;

                return (
                  <TableRow key={reqId}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{empName}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-700">{typeName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {req.requestUnit === 'HALF_AM'
                          ? 'Half Day (AM)'
                          : req.requestUnit === 'HALF_PM'
                          ? 'Half Day (PM)'
                          : 'Full Day'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatDate(req.startDate)} {req.startDate !== req.endDate ? `– ${formatDate(req.endDate)}` : ''}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-bold text-slate-900 font-mono">
                        {durationDays} {durationDays === 1 ? 'day' : 'days'}
                      </div>
                      {req.unpaidDuration > 0 && (
                        <div className="text-[11px] text-amber-600 font-medium">
                          ({req.paidDuration}d Paid + {req.unpaidDuration}d Unpaid)
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {req.reason || req.description || '—'}
                      {req.refusalReason && (
                        <div className="text-[11px] text-red-600 mt-0.5 italic">
                          Reason: {req.refusalReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge status={req.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {/* HR Approval Actions */}
                      {isHrRole && req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Check}
                            isLoading={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(reqId)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={X}
                            isLoading={refuseMutation.isPending}
                            onClick={() => handleOpenRefuseModal(reqId)}
                          >
                            Refuse
                          </Button>
                        </div>
                      ) : req.status === 'APPROVED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={RotateCcw}
                          className="text-xs text-slate-600"
                          isLoading={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(reqId)}
                        >
                          Cancel / Reverse
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Request Time Off Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Time-Off Request"
        description="Select leave bucket, request type (Full or Half Day), and dates for manager review"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <Select
            label="Leave Type"
            value={requestForm.leaveType}
            onChange={(e) => setRequestForm({ ...requestForm, leaveType: e.target.value })}
          >
            <option value="PAID_TIME_OFF">Paid Time Off (PTO)</option>
            <option value="SICK_LEAVE">Sick Leave</option>
            <option value="UNPAID_LEAVE">Unpaid Leave (LWP)</option>
          </Select>

          {/* Unit selection: Full Day vs Half Day */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Request Duration Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'FULL', label: 'Full Day' },
                { id: 'HALF_AM', label: 'Half Day (Morning)' },
                { id: 'HALF_PM', label: 'Half Day (Afternoon)' },
              ].map((unit) => (
                <button
                  type="button"
                  key={unit.id}
                  onClick={() => {
                    const newUnit = unit.id;
                    const newEnd = newUnit !== 'FULL' ? requestForm.startDate : requestForm.endDate;
                    const calcDays = newUnit !== 'FULL' ? 0.5 : calculateDaysBetween(requestForm.startDate, newEnd, 'FULL');
                    setRequestForm({
                      ...requestForm,
                      requestUnit: newUnit,
                      endDate: newEnd,
                      days: calcDays,
                    });
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                    requestForm.requestUnit === unit.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={requestForm.startDate}
              onChange={(e) => {
                const newStart = e.target.value;
                const newEnd = requestForm.requestUnit !== 'FULL' ? newStart : (newStart > requestForm.endDate ? newStart : requestForm.endDate);
                const calcDays = requestForm.requestUnit !== 'FULL' ? 0.5 : calculateDaysBetween(newStart, newEnd, 'FULL');
                setRequestForm({
                  ...requestForm,
                  startDate: newStart,
                  endDate: newEnd,
                  days: calcDays,
                });
              }}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={requestForm.endDate}
              disabled={requestForm.requestUnit !== 'FULL'}
              onChange={(e) => {
                const newEnd = e.target.value;
                const calcDays = calculateDaysBetween(requestForm.startDate, newEnd, requestForm.requestUnit);
                setRequestForm({
                  ...requestForm,
                  endDate: newEnd,
                  days: calcDays,
                });
              }}
              required
            />
          </div>

          {requestForm.requestUnit === 'FULL' && (
            <div>
              <Input
                label="Number of Days"
                type="number"
                min="0.5"
                step="0.5"
                value={requestForm.days}
                onChange={(e) => setRequestForm({ ...requestForm, days: Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * Auto-calculated from date range ({requestForm.startDate} to {requestForm.endDate})
              </p>
            </div>
          )}

          {/* Live Paid vs Unpaid Breakdown Preview */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Total Requested:</span>
              <span>{requestedDays} {requestedDays === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700">
              <span>Paid Portion:</span>
              <span className="font-semibold">{livePaidDays} days</span>
            </div>
            {liveUnpaidDays > 0 && (
              <div className="flex justify-between text-xs text-amber-700">
                <span>Unpaid Overflow (LWP):</span>
                <span className="font-semibold">{liveUnpaidDays} days</span>
              </div>
            )}
            {liveUnpaidDays > 0 && (
              <p className="text-[11px] text-amber-600 mt-1 italic">
                * Note: Your requested leave exceeds your available paid limit ({currentAvailable} days). Excess days will automatically convert to Unpaid Leave.
              </p>
            )}
          </div>

          <Input
            label="Reason / Notes"
            placeholder="e.g. Doctor appointment / Personal holiday"
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
            required
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Refuse Reason Modal */}
      <Modal
        isOpen={isRefuseModalOpen}
        onClose={() => setIsRefuseModalOpen(false)}
        title="Refuse Leave Request"
        description="Provide a reason for refusing this leave request for the employee's records"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmRefuse} className="space-y-4">
          <Input
            label="Refusal Reason"
            placeholder="e.g. Critical project deadline / Staff shortage"
            value={refuseReason}
            onChange={(e) => setRefuseReason(e.target.value)}
            required
          />
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsRefuseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={refuseMutation.isPending}
            >
              Confirm Refuse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
