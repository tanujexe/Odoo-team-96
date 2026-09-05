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

export default function TimeOffFeature() {
  const queryClient = useQueryClient();
  const { user, role, hasAccess } = useAuth();
  const [searchParams] = useSearchParams();
  const queryEmpId = searchParams.get('employeeId');

  const currentEmpId = role === ROLES.EMPLOYEE ? user?.employeeId || 'emp-alex-1' : queryEmpId || 'emp-alex-1';
  const isHrRole = hasAccess([ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    leaveType: 'PAID_TIME_OFF',
    startDate: '2026-09-10',
    endDate: '2026-09-12',
    days: 3,
    reason: '',
  });

  const { data: balances, isLoading: isBalancesLoading } = useQuery({
    queryKey: ['timeOffBalances', currentEmpId],
    queryFn: () => fetchTimeOffBalances(currentEmpId),
  });

  const { data: requests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ['timeOffRequests', { employeeId: role === ROLES.EMPLOYEE ? currentEmpId : queryEmpId }],
    queryFn: () => fetchTimeOffRequests({ employeeId: role === ROLES.EMPLOYEE ? currentEmpId : queryEmpId }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) =>
      createTimeOffRequest({
        ...data,
        employeeId: currentEmpId,
        employeeName: user?.name || 'Alex Rivera',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
      setIsRequestModalOpen(false);
      setRequestForm({
        leaveType: 'PAID_TIME_OFF',
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        days: 3,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Time Off & Leave Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Idempotent leave allocation ledger, automated balance deductions, and manager approvals
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
                width: `${((balances?.pto?.available ?? 14.5) / (balances?.pto?.total || 20)) * 100}%`,
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
                width: `${((balances?.sick?.available ?? 8.0) / (balances?.sick?.total || 10)) * 100}%`,
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
              Unpaid Leave
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
            Deducts from payroll gross calculations without consuming annual allocation buckets.
          </p>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader
          title="Leave Requests & Approval Workflow"
          subtitle="Idempotent consumption ledger with transaction verification"
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
                <TableHead>Dates</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <p className="font-semibold text-slate-900">{req.employeeName}</p>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-700">{req.leaveTypeName}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(req.startDate)} {req.startDate !== req.endDate ? `– ${formatDate(req.endDate)}` : ''}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 font-mono">
                    {req.days} {req.days === 1 ? 'day' : 'days'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                    {req.reason || '—'}
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
                          onClick={() => approveMutation.mutate(req.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={X}
                          isLoading={refuseMutation.isPending}
                          onClick={() => refuseMutation.mutate(req.id)}
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
                        onClick={() => cancelMutation.mutate(req.id)}
                      >
                        Cancel / Reverse
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Processed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Request Time Off Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Time-Off Request"
        description="Select leave bucket and dates to submit for manager review"
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
            <option value="UNPAID_LEAVE">Unpaid Leave</option>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={requestForm.startDate}
              onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={requestForm.endDate}
              onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Number of Days"
            type="number"
            min="0.5"
            step="0.5"
            value={requestForm.days}
            onChange={(e) => setRequestForm({ ...requestForm, days: Number(e.target.value) })}
            required
          />

          <Input
            label="Reason / Notes"
            placeholder="e.g. Annual summer vacation"
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
    </div>
  );
}
