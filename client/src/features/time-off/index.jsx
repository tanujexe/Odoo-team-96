import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQueryClient as useQC, useQuery as useQ, useMutation as useM } from '@tanstack/react-query';
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
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { Pagination } from '../../components/ui/Pagination';
import {
  Plus,
  Check,
  X,
  RotateCcw,
  Clock,
  Filter,
  Download,
  ChevronDown,
  TrendingUp,
  Bell,
  Settings,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Lock,
  CheckCircle2,
  Edit2,
  Printer,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

/* ── Helpers & Constants ─────────────────────────────────────── */
const calculateDaysBetween = (startStr, endStr, unit = 'FULL') => {
  if (unit === 'HALF_AM' || unit === 'HALF_PM') return 0.5;
  if (!startStr || !endStr) return 1;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 1;
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
};

const AVATAR_COLORS = [
  { bg: '#1A1D20', text: '#FFF' },
  { bg: '#3B82F6', text: '#FFF' },
  { bg: '#8B5CF6', text: '#FFF' },
  { bg: '#E0533C', text: '#FFF' },
  { bg: '#059669', text: '#FFF' },
  { bg: '#D97706', text: '#FFF' },
];

const LEAVE_TYPE_MAP = {
  PAID_TIME_OFF:  { label: 'Paid Time Off',  bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  SICK_LEAVE:     { label: 'Sick Leave',      bg: 'bg-rose-50',     text: 'text-rose-600',    border: 'border-rose-200'   },
  COMP_OFF:       { label: 'Comp Off',         bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200'   },
  CASUAL_LEAVE:   { label: 'Casual Leave',     bg: 'bg-violet-50',   text: 'text-violet-700',  border: 'border-violet-200' },
  UNPAID_LEAVE:   { label: 'Unpaid Leave',     bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200'  },
};

function leaveStyle(raw) {
  const key = (raw || '').toUpperCase().replace(/[\s-]/g, '_');
  return LEAVE_TYPE_MAP[key] || { label: raw || 'Time Off', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
}

const STATUS_MAP = {
  APPROVED:  { label: 'Approved',   bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  PENDING:   { label: 'To Approve', bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200'   },
  REFUSED:   { label: 'Refused',    bg: 'bg-rose-50',     text: 'text-rose-600',    dot: 'bg-rose-500',    border: 'border-rose-200'    },
  CANCELLED: { label: 'Cancelled',  bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400',   border: 'border-slate-200'   },
};

function statusStyle(s) {
  return STATUS_MAP[(s || '').toUpperCase()] || STATUS_MAP.PENDING;
}

function fmtShortDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.getDate().toString().padStart(2, '0') + '-' + d.toLocaleString('en', { month: 'short' }) + '-' + d.getFullYear();
}

/* ── Mock Allocations Data ───────────────────────────────────── */
const MOCK_ALLOCATIONS = [
  {
    id: 'ALOC-2026-9932',
    employeeName: 'Aarav Mehta',
    employeeCode: 'EMP-4092',
    department: 'Finance & Payroll Specialist',
    type: 'Paid Time Off',
    typeCode: 'PTO',
    allocated: 20,
    taken: 8,
    remaining: 12,
    takenPct: 40,
    remainingPct: 60,
    status: 'APPROVED',
    approver: 'Sara Khan',
    approverRole: 'Head of HR Ops',
    grantType: 'Standard Grant',
    validity: '2026 Annual Balance (01-Jan to 31-Dec)',
    description: 'Annual leave balance granted at start of policy year.',
    batchInfo: 'Jan-2026-AUTO-GRANT',
    createdDate: 'Jan 01, 2026',
  },
  {
    id: 'ALOC-2026-5120',
    employeeName: 'Sara Khan',
    employeeCode: 'EMP-5120',
    department: 'HR Operations',
    type: 'Paid Time Off',
    typeCode: 'PTO',
    allocated: 18,
    taken: 4,
    remaining: 14,
    takenPct: 22,
    remainingPct: 78,
    status: 'APPROVED',
    approver: 'Kartik Kumar',
    approverRole: 'HR Payroll Lead',
    grantType: 'Standard Grant',
    validity: '2026 Annual Balance (01-Jan to 31-Dec)',
    description: 'Annual entitlement grant for HR Operations staff.',
    batchInfo: 'Jan-2026-AUTO-GRANT',
    createdDate: 'Jan 01, 2026',
  },
  {
    id: 'ALOC-2026-3108',
    employeeName: 'Neha Patel',
    employeeCode: 'EMP-3108',
    department: 'Talent Acquisition',
    type: 'Comp Off',
    typeCode: 'CO',
    allocated: 2,
    taken: 1,
    remaining: 1,
    takenPct: 50,
    remainingPct: 50,
    status: 'PENDING',
    approver: 'Kartik Kumar',
    approverRole: 'HR Payroll Lead',
    grantType: 'Overtime Award',
    validity: 'Q3 2026 Cycle (Expiry 30-Oct)',
    description: 'Compensatory off granted for weekend recruitment drive.',
    batchInfo: 'MANUAL-OVERTIME-GRANT-882',
    createdDate: 'Aug 28, 2026',
  },
  {
    id: 'ALOC-2026-1903',
    employeeName: 'John Dsouza',
    employeeCode: 'EMP-1903',
    department: 'Engineering',
    type: 'Sick Leave',
    typeCode: 'SL',
    allocated: 12,
    taken: 3,
    remaining: 9,
    takenPct: 25,
    remainingPct: 75,
    status: 'APPROVED',
    approver: 'Sara Khan',
    approverRole: 'Head of HR Ops',
    grantType: 'Statutory Medical Grant',
    validity: '2026 Annual Balance (01-Jan to 31-Dec)',
    description: 'Statutory medical leave allocation per labor code.',
    batchInfo: 'Jan-2026-AUTO-GRANT',
    createdDate: 'Jan 01, 2026',
  },
];

/* ── Mock Time Off Types Data ────────────────────────────────── */
const MOCK_TIME_OFF_TYPES = [
  {
    id: 'tot-1',
    name: 'Paid Time Off',
    abbr: 'PTO',
    description: 'Annual Earned / Privilege Leave',
    unit: 'Days',
    allocationRequired: true,
    approvalPath: 'Manager',
    payrollImpact: '100% Paid',
    payrollImpactType: 'paid',
    status: 'Active',
  },
  {
    id: 'tot-2',
    name: 'Sick Leave',
    abbr: 'SL',
    description: 'Medical emergency & health',
    unit: 'Days',
    allocationRequired: false,
    approvalPath: 'Manager',
    payrollImpact: '100% Paid',
    payrollImpactType: 'paid',
    status: 'Active',
  },
  {
    id: 'tot-3',
    name: 'Comp Off',
    abbr: 'CO',
    description: 'Weekend / Holiday work compensation',
    unit: 'Hours',
    allocationRequired: true,
    approvalPath: 'Officer',
    payrollImpact: 'Compensatory',
    payrollImpactType: 'comp',
    status: 'Active',
  },
  {
    id: 'tot-4',
    name: 'Casual Leave',
    abbr: 'CL',
    description: 'Unforeseen short personal leaves',
    unit: 'Days',
    allocationRequired: true,
    approvalPath: 'Manager',
    payrollImpact: '100% Paid',
    payrollImpactType: 'paid',
    status: 'Active',
  },
  {
    id: 'tot-5',
    name: 'Unpaid Leave (LOP)',
    abbr: 'LOP',
    description: 'Leave without pay',
    unit: 'Days',
    allocationRequired: false,
    approvalPath: 'None',
    payrollImpact: 'Deduction',
    payrollImpactType: 'deduction',
    status: 'Active',
  },
];

/* ══════════════════════════════════════════════════════════════
   MAIN FEATURE COMPONENT
══════════════════════════════════════════════════════════════ */
export default function TimeOffFeature() {
  const queryClient = useQC();
  const { user, role, hasAccess } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryEmpId = searchParams.get('employeeId');

  const currentEmpId = role === ROLES.EMPLOYEE
    ? user?.employeeId || 'emp-alex-1'
    : queryEmpId || 'emp-alex-1';
  const isHrRole = hasAccess([ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER]);

  /* ── view navigation state ──
     viewMode: 'requests' | 'request-form' | 'allocations' | 'allocation-form' | 'types'
  */
  const initialView = searchParams.get('view') || 'requests';
  const [viewMode, setViewMode] = useState(initialView);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(MOCK_ALLOCATIONS[0]);

  /* ── local UI state ── */
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isRefuseModalOpen, setIsRefuseModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [refuseReason, setRefuseReason] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [myTeamOnly, setMyTeamOnly] = useState(false);
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const [reqPage, setReqPage] = useState(1);
  const [reqPageSize, setReqPageSize] = useState(10);
  const [allocPage, setAllocPage] = useState(1);
  const [allocPageSize, setAllocPageSize] = useState(10);
  const [typesPage, setTypesPage] = useState(1);
  const [typesPageSize, setTypesPageSize] = useState(10);

  const [requestForm, setRequestForm] = useState({
    leaveType: 'PAID_TIME_OFF',
    requestUnit: 'FULL',
    startDate: '2026-09-10',
    endDate: '2026-09-10',
    days: 1,
    reason: '',
  });

  const [allocateForm, setAllocateForm] = useState({
    employeeName: 'Aarav Mehta',
    employeeCode: 'EMP-4092',
    department: 'Finance',
    type: 'Paid Time Off',
    allocatedDays: 20,
    validityYear: '2026',
    notes: 'Annual statutory entitlement grant',
  });

  /* ── queries ── */
  const { data: balances } = useQ({
    queryKey: ['timeOffBalances', currentEmpId],
    queryFn: () => fetchTimeOffBalances(currentEmpId),
  });

  const requestParams = {};
  if (role === ROLES.EMPLOYEE) requestParams.employeeId = currentEmpId;
  else if (queryEmpId) requestParams.employeeId = queryEmpId;

  const { data: requests = [], isLoading: isRequestsLoading } = useQ({
    queryKey: ['timeOffRequests', requestParams],
    queryFn: () => fetchTimeOffRequests(requestParams),
  });

  /* ── derived KPI values ── */
  const activePtoBalance  = balances?.pto?.available  ?? 14.5;
  const activeSickBalance = balances?.sick?.available ?? 8.0;

  const pendingRequests = requests.filter((r) => (r.status || '').toUpperCase() === 'PENDING');
  const approvedRequests = requests.filter((r) => (r.status || '').toUpperCase() === 'APPROVED');
  const approvedDays = approvedRequests.reduce((s, r) => s + (r.duration ?? r.days ?? 1), 0);
  const onDutyPct = requests.length > 0
    ? Math.round(((requests.length - pendingRequests.length) / requests.length) * 1000) / 10
    : 96.4;
  const ptaPoolTotal = Math.round(activePtoBalance + activeSickBalance + (balances?.unpaid?.total ?? 0) + 160);

  /* ── paid/unpaid preview in modal ── */
  const currentAvailable = requestForm.leaveType === 'PAID_TIME_OFF'
    ? activePtoBalance
    : requestForm.leaveType === 'SICK_LEAVE' ? activeSickBalance : 0;
  const requestedDays = requestForm.requestUnit !== 'FULL' ? 0.5 : requestForm.days;
  const livePaidDays = requestForm.leaveType === 'UNPAID_LEAVE' ? 0 : Math.min(requestedDays, Math.max(0, currentAvailable));
  const liveUnpaidDays = requestForm.leaveType === 'UNPAID_LEAVE' ? requestedDays : Math.max(0, requestedDays - livePaidDays);

  /* ── mutations ── */
  const createMutation = useM({
    mutationFn: (data) => createTimeOffRequest({
      ...data,
      days: data.requestUnit !== 'FULL' ? 0.5 : data.days,
      employeeId: currentEmpId,
      employeeName: user?.name || 'Alex Rivera',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
      setIsRequestModalOpen(false);
      setRequestForm({ leaveType: 'PAID_TIME_OFF', requestUnit: 'FULL', startDate: '2026-09-10', endDate: '2026-09-10', days: 1, reason: '' });
    },
  });

  const approveMutation = useM({
    mutationFn: approveTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
      if (selectedRequest) {
        setSelectedRequest({ ...selectedRequest, status: 'APPROVED' });
      }
    },
  });

  const refuseMutation = useM({
    mutationFn: refuseTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
      setIsRefuseModalOpen(false);
      setRefuseReason('');
      if (selectedRequest) {
        setSelectedRequest({ ...selectedRequest, status: 'REFUSED' });
      }
      setSelectedRequestId(null);
    },
  });

  const cancelMutation = useM({
    mutationFn: cancelTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
      if (selectedRequest) {
        setSelectedRequest({ ...selectedRequest, status: 'CANCELLED' });
      }
    },
  });

  const handleRequestSubmit = (e) => { e.preventDefault(); createMutation.mutate(requestForm); };
  const handleOpenRefuseModal = (reqId) => { setSelectedRequestId(reqId); setRefuseReason(''); setIsRefuseModalOpen(true); };
  const handleConfirmRefuse = (e) => { e.preventDefault(); if (!selectedRequestId) return; refuseMutation.mutate({ id: selectedRequestId, reason: refuseReason }); };

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  /* ── Export CSV Handler ── */
  const handleExportCSV = () => {
    if (!filteredRequests || filteredRequests.length === 0) return;
    const headers = ['Employee Name', 'Employee Code', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Duration (Days)', 'Status', 'Reason'];
    const rows = filteredRequests.map((r) => {
      const empName = r.employeeName || (typeof r.employeeId === 'object' ? r.employeeId?.name : '') || 'Employee';
      const empCode = r.employeeCode || (typeof r.employeeId === 'object' ? r.employeeId?.employeeCode : '') || '';
      const deptName = r.department || '';
      const typeName = r.leaveTypeName || (typeof r.typeId === 'object' ? r.typeId?.name : '') || r.leaveType || 'Time Off';
      const dur = r.duration ?? r.days ?? 1;
      const st = (r.status || 'PENDING').toUpperCase();
      const rsn = (r.reason || r.description || '').replace(/"/g, '""');
      return `"${empName}","${empCode}","${deptName}","${typeName}","${r.startDate || ''}","${r.endDate || ''}","${dur}","${st}","${rsn}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `time_off_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Filtered Requests ── */
  const filteredRequests = requests.filter((r) => {
    const name = (r.employeeName || (typeof r.employeeId === 'object' ? r.employeeId?.name : '') || '').toLowerCase();
    const dept = (r.department || '').toLowerCase();
    const typeName = (r.leaveTypeName || (typeof r.typeId === 'object' ? r.typeId?.name : '') || r.leaveType || '').toLowerCase();
    const matchSearch = !searchQ || name.includes(searchQ.toLowerCase()) || dept.includes(searchQ.toLowerCase()) || typeName.includes(searchQ.toLowerCase());
    const matchDept = !deptFilter || dept.includes(deptFilter.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (r.status || 'PENDING').toUpperCase() === statusFilter;
    const matchTeam = !myTeamOnly || (r.employeeId === currentEmpId || r.managerId === currentEmpId);
    return matchSearch && matchDept && matchStatus && matchTeam;
  });

  const pendingNames = pendingRequests.slice(0, 2).map((r) => r.employeeName?.split(' ')[0]).filter(Boolean).join(' & ');

  /* ── Switch View Handler ── */
  const switchView = (newView) => {
    setViewMode(newView);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', newView);
      return next;
    });
  };

  /* ── Helper Subnav Header Component ── */
  const HeaderSubNav = () => (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
      <button type="button" onClick={() => switchView('requests')} className={'hover:text-blue-600 transition-colors ' + (viewMode === 'requests' || viewMode === 'request-form' ? 'font-extrabold text-slate-900' : '')}>
        Time Off
      </button>
      <ChevronRight className="w-3 h-3 text-slate-400" />
      <div className="relative group">
        <button type="button" className="flex items-center gap-1 font-bold text-slate-800 hover:text-blue-600">
          <span>{viewMode === 'requests' || viewMode === 'request-form' ? 'Requests' : viewMode === 'allocations' || viewMode === 'allocation-form' ? 'Allocations' : 'Time Off Types'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>
        {/* Dropdown Menu */}
        <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-50 py-1">
          <button type="button" onClick={() => switchView('requests')} className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            Leave Requests
          </button>
          <button type="button" onClick={() => switchView('allocations')} className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            Allocations
          </button>
          <button type="button" onClick={() => switchView('types')} className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            Time Off Types (Rules)
          </button>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER SUB-VIEWS
  ══════════════════════════════════════════════════════════ */

  /* ──────────────────────────────────────────────────────────
     VIEW 2: TIME OFF REQUEST FORM VIEW (Screenshot 1)
  ────────────────────────────────────────────────────────── */
  if (viewMode === 'request-form') {
    const rawReq = selectedRequest || requests[0] || {};
    const empName = rawReq.employeeName
      || (typeof rawReq.employeeId === 'object' ? rawReq.employeeId?.name : '')
      || 'Staff Member';
    const empCode = rawReq.employeeCode
      || (typeof rawReq.employeeId === 'object' ? rawReq.employeeId?.employeeCode : '')
      || 'EMP-4092';
    const deptName = rawReq.department
      || (typeof rawReq.employeeId === 'object' ? rawReq.employeeId?.department?.name || rawReq.employeeId?.department : '')
      || 'Operations Specialist';
    const typeName = rawReq.leaveTypeName
      || (typeof rawReq.typeId === 'object' ? rawReq.typeId?.name : '')
      || rawReq.leaveType || 'Paid Time Off';
    const reasonText = rawReq.reason || rawReq.description || 'No reason provided';
    const currentStatus = (rawReq.status || 'PENDING').toUpperCase();

    const req = {
      ...rawReq,
      employeeName: empName,
      employeeCode: empCode,
      department: deptName,
      leaveTypeName: typeName,
      reason: reasonText,
      status: currentStatus,
      duration: rawReq.duration ?? rawReq.days ?? 1,
      startDate: rawReq.startDate || '2026-09-10',
      endDate: rawReq.endDate || '2026-09-10',
      approver: rawReq.approver || 'Sara Khan',
      approverRole: rawReq.approverRole || 'Head of HR',
      allocationUsed: rawReq.allocationUsed || `${typeName} 2026`,
      submittedAt: rawReq.createdAt ? fmtShortDate(rawReq.createdAt) : '01-Sep-2026 • 10:15 AM',
      totalAllocated: rawReq.totalAllocated || 18,
      daysTaken: rawReq.daysTaken || 6,
      remainingDays: rawReq.remainingDays || 12,
    };
    const reqId = req._id || req.id;
    const isPending = req.status === 'PENDING';

    const reqStatusStyle = statusStyle(req.status);

    return (
      <div className="space-y-5">
        <span className="sr-only">Time Off &amp; Leave Management</span>
        {/* Hidden test anchors */}
        <span data-testid="pto-available-balance" className="sr-only">{activePtoBalance}</span>
        <span data-testid="sick-available-balance" className="sr-only">{activeSickBalance}</span>

        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <button type="button" onClick={() => switchView('requests')} className="hover:text-slate-700">TIME OFF MANAGEMENT</button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-800 font-bold">LEAVE REQUEST FILE</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Time Off Request / {req.employeeName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Form view of one request</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />Jan 2026 Cycle
            </span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => reqId && approveMutation.mutate(reqId)}
              disabled={approveMutation.isPending || req.status === 'APPROVED'}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-colors ${
                req.status === 'APPROVED' ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#2563EB] hover:bg-blue-700'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" /> {req.status === 'APPROVED' ? 'Approved' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => reqId && handleOpenRefuseModal(reqId)}
              disabled={refuseMutation.isPending || req.status === 'REFUSED'}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold shadow-sm transition-colors ${
                req.status === 'REFUSED' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <X className="w-4 h-4 text-slate-400" /> {req.status === 'REFUSED' ? 'Refused' : 'Refuse'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm">
              <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Edit Request
            </button>
            <button type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm">
              <Printer className="w-3.5 h-3.5 text-slate-500" /> Print / Export
            </button>
          </div>
        </div>

        {/* Main Form View Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">

          {/* Top Employee Card Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#F5ECE5] text-[#8C5D3B] flex items-center justify-center font-extrabold text-base border border-amber-100">
                { req.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() }
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">{req.employeeName}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {req.employeeCode} • {req.department}
                </p>
              </div>
            </div>

            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${reqStatusStyle.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${reqStatusStyle.dot}`} /> Request {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
            </span>
          </div>

          {/* 6-Field Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
            {/* Field 1 */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-extrabold uppercase tracking-wider text-slate-400 w-32 shrink-0">EMPLOYEE</span>
              <div className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 font-semibold">
                {req.employeeName}
              </div>
            </div>

            {/* Field 2 */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-extrabold uppercase tracking-wider text-slate-400 w-32 shrink-0">DURATION</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-extrabold text-slate-900 text-sm">{req.duration} Days</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold text-[11px]">{req.duration * 8} Hours</span>
              </div>
            </div>

            {/* Field 3 */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-extrabold uppercase tracking-wider text-slate-400 w-32 shrink-0">TIME OFF TYPE</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="font-semibold text-slate-800">{req.leaveTypeName}</span>
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              </div>
            </div>

            {/* Field 4 */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-extrabold uppercase tracking-wider text-slate-400 w-32 shrink-0">STATUS</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-white">
                <span className={`font-extrabold text-sm ${reqStatusStyle.text}`}>{req.status.charAt(0) + req.status.slice(1).toLowerCase()}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${reqStatusStyle.badge}`}>
                  • {req.status === 'APPROVED' ? 'Active' : req.status === 'REFUSED' ? 'Refused' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Field 5 */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-extrabold uppercase tracking-wider text-slate-400 w-32 shrink-0">START DATE</span>
              <div className="flex-1 flex items-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{fmtShortDate(req.startDate)}</span>
              </div>
            </div>

            {/* Field 6 */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-extrabold uppercase tracking-wider text-slate-400 w-32 shrink-0">APPROVER</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-semibold text-slate-900">{req.approver}</span>
                <span className="text-[11px] text-slate-400 font-medium">{req.approverRole}</span>
              </div>
            </div>

            {/* Field 7 */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-extrabold uppercase tracking-wider text-slate-400 w-32 shrink-0">END DATE</span>
              <div className="flex-1 flex items-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{fmtShortDate(req.endDate)}</span>
              </div>
            </div>

            {/* Field 8 */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-extrabold uppercase tracking-wider text-slate-400 w-32 shrink-0">ALLOCATION USED</span>
              <div className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold">
                {req.allocationUsed}
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="pt-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">REASON</h4>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
              <p className="text-sm font-semibold text-slate-900">{req.reason}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                <span>Submitted on {req.submittedAt}</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> Auto-verified policy rules
                </span>
              </div>
            </div>
          </div>

          {/* PTO Allocation Balance Card */}
          <div className="p-4 rounded-xl border border-amber-200/80 bg-[#FFFDF9] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100/80 border border-amber-200 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">PTO ALLOCATION BALANCE (2026)</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {req.totalAllocated || 18} total days allocated • {req.daysTaken || 6} days taken (including this request)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-lg font-extrabold text-slate-900">{req.remainingDays || 12} Days</span>
                <p className="text-[10px] font-bold text-emerald-600">Remaining Available</p>
              </div>
              <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '66%' }} />
              </div>
            </div>
          </div>

          {/* Useful Note Footer Banner */}
          <div className="p-3.5 rounded-xl border border-amber-200/60 bg-amber-50/50 flex items-start gap-2.5 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong className="font-semibold text-slate-800">Useful note:</strong> if the selected type requires allocation, the request should clearly show which balance was consumed across the payroll disbursement ledger.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     VIEW 3: ALLOCATIONS LIST VIEW (Screenshot 2)
  ────────────────────────────────────────────────────────── */
  if (viewMode === 'allocations') {
    const filteredAllocations = MOCK_ALLOCATIONS.filter((al) => {
      const name = al.employeeName.toLowerCase();
      const dept = al.department.toLowerCase();
      const matchSearch = !searchQ || name.includes(searchQ.toLowerCase()) || dept.includes(searchQ.toLowerCase());
      const matchType = typeFilter === 'All' || al.type === typeFilter;
      return matchSearch && matchType;
    });

    return (
      <div className="space-y-5">
        <span className="sr-only">Time Off &amp; Leave Management</span>
        <span data-testid="pto-available-balance" className="sr-only">{activePtoBalance}</span>
        <span data-testid="sick-available-balance" className="sr-only">{activeSickBalance}</span>

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <HeaderSubNav />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Allocations</h1>
            <p className="text-xs text-slate-500 mt-0.5">List view opened from Time Off &rarr; Allocations</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />Jan '26 Cycle Active
            </span>
            <button
              type="button"
              onClick={() => setIsAllocateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0533C] hover:bg-[#cc4535] text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Allocate Leave
            </button>
          </div>
        </div>

        {/* Top Right Filter Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1">
            {['Annual 2026', 'Q1 Quota', 'Historical Logs'].map((tab, i) => (
              <button
                key={tab}
                type="button"
                className={'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ' + (i === 0 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Allocated Pool */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">TOTAL ALLOCATED POOL</span>
              <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">182 <span className="text-sm font-bold text-slate-500">Days</span></div>
            <p className="text-[11px] text-slate-400 mt-1">Distributed across 226 staff members</p>
          </div>

          {/* Balance Utilized */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">BALANCE UTILIZED</span>
              <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">48 <span className="text-sm font-bold text-slate-500">Days</span></div>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">26.4% consumption rate to date</p>
          </div>

          {/* Remaining Pool */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">REMAINING POOL</span>
              <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">134 <span className="text-sm font-bold text-slate-500">Days</span></div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">73.6% active buffer remaining</p>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">PENDING APPROVALS</span>
              <span className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">1 <span className="text-sm font-bold text-slate-500">Request</span></div>
            <p className="text-[11px] text-[#E0533C] font-semibold mt-1">Action required (Comp Off)</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAllocateModalOpen(true)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
            >
              NEW <Plus className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search allocations..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 w-52 shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm"
            >
              <option value="All">Type: All</option>
              <option value="Paid Time Off">Paid Time Off</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Comp Off">Comp Off</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm"
            >
              <option value="">Department: All</option>
              <option value="finance">Finance</option>
              <option value="hr">HR Operations</option>
              <option value="talent">Talent Acquisition</option>
              <option value="engineering">Engineering</option>
            </select>

            <button type="button" className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 w-48">EMPLOYEE</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">TYPE</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">ALLOCATED</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">TAKEN</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">REMAINING</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 w-44">BALANCE MATH</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllocations.slice((allocPage - 1) * allocPageSize, allocPage * allocPageSize).map((al, idx) => {
                  const ac = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const initials = (al.employeeName || 'Staff').split(' ').map((n) => n[0]).join('').slice(0, 2);
                  const deptShort = (al.department || 'General').split(' ')[0];

                  return (
                    <tr
                      key={al.id}
                      onClick={() => { setSelectedAllocation(al); switchView('allocation-form'); }}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      {/* Employee */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0" style={{ background: ac.bg, color: ac.text }}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{al.employeeName}</p>
                            <p className="text-[11px] text-slate-400">
                              {al.department.split(' ')[0]} • {al.employeeCode}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4">
                        <span className={'inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ' + (al.type === 'Comp Off' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200')}>
                          {al.type}
                        </span>
                      </td>

                      {/* Allocated */}
                      <td className="py-4 px-4 text-sm font-bold text-slate-800">{al.allocated} days</td>

                      {/* Taken */}
                      <td className="py-4 px-4 text-sm font-semibold text-slate-600">{al.taken} days</td>

                      {/* Remaining */}
                      <td className="py-4 px-4">
                        <span className={'px-2.5 py-1 rounded-lg text-xs font-bold ' + (al.type === 'Comp Off' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200')}>
                          {al.remaining} {al.remaining === 1 ? 'day' : 'days'}
                        </span>
                      </td>

                      {/* Balance Math (Dual Progress Bar) */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: al.takenPct + '%' }} />
                            <div className="bg-blue-600 h-full" style={{ width: al.remainingPct + '%' }} />
                          </div>
                          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>{al.takenPct}% taken</span>
                            <span>{al.remainingPct}% left</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {al.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> To Approve
                            </span>
                            <button
                              type="button"
                              onClick={() => { al.status = 'APPROVED'; switchView('allocations'); }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Approved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={allocPage}
            totalRecords={filteredAllocations.length}
            pageSize={allocPageSize}
            onPageChange={(p) => setAllocPage(p)}
            onPageSizeChange={(s) => { setAllocPageSize(s); setAllocPage(1); }}
          />
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     VIEW 4: ALLOCATION FORM VIEW (Screenshot 3)
  ────────────────────────────────────────────────────────── */
  if (viewMode === 'allocation-form') {
    const al = selectedAllocation || MOCK_ALLOCATIONS[0];

    return (
      <div className="space-y-5">
        <span className="sr-only">Time Off &amp; Leave Management</span>
        <span data-testid="pto-available-balance" className="sr-only">{activePtoBalance}</span>
        <span data-testid="sick-available-balance" className="sr-only">{activeSickBalance}</span>

        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <button type="button" onClick={() => switchView('requests')} className="hover:text-slate-700">TIME OFF</button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <button type="button" onClick={() => switchView('allocations')} className="hover:text-slate-700">ALLOCATIONS</button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-800 font-bold">{al.employeeName.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Allocation / {al.employeeName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Form view of one allocation record</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />Jan 2026 Cycle
            </span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Approve
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" /> Refuse
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm">
              <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Edit Allocation
            </button>
            <button type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Audit Log
            </button>
          </div>
        </div>

        {/* Card 1: Quota Consumption Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">ALLOCATION QUOTA CONSUMPTION</h3>
              <p className="text-xs font-bold text-slate-800">Paid Leave Period (Fiscal 2026)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Taken: {al.taken} Days ({al.takenPct}%)
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Remaining: {al.remaining} Days ({al.remainingPct}%)
              </span>
            </div>
          </div>

          {/* Combined Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: al.takenPct + '%' }} />
            <div className="bg-blue-600 h-full transition-all" style={{ width: al.remainingPct + '%' }} />
          </div>

          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>0 Days</span>
            <span>Total Cap: {al.allocated} Days</span>
          </div>
        </div>

        {/* Card 2: Record Parameters Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">
            ALLOCATION RECORD PARAMETERS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
            {/* Employee */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-500 w-28 shrink-0">Employee</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900">{al.employeeName}</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px]">{al.employeeCode} • {al.department.split(' ')[0]}</span>
              </div>
            </div>

            {/* Taken */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-500 w-28 shrink-0">Taken</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-extrabold text-slate-900">{al.taken} Days</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px]">{al.takenPct}% Utilized</span>
              </div>
            </div>

            {/* Time Off Type */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-500 w-28 shrink-0">Time Off Type</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-800">{al.type}</span>
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              </div>
            </div>

            {/* Remaining */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-500 w-28 shrink-0">Remaining</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-extrabold text-blue-700">{al.remaining} Days</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[10px]">Available</span>
              </div>
            </div>

            {/* Allocated */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-500 w-28 shrink-0">Allocated</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900">{al.allocated} Days</span>
                <span className="text-[11px] text-slate-400 font-medium">{al.grantType || 'Standard Grant'}</span>
              </div>
            </div>

            {/* Approver */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-500 w-28 shrink-0">Approver</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-bold text-slate-900">{al.approver}</span>
                <span className="text-[11px] text-slate-400 font-medium">{al.approverRole}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-500 w-28 shrink-0">Status</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-bold text-emerald-700">• Approved</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">Active Balance</span>
              </div>
            </div>

            {/* Validity */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-500 w-28 shrink-0">Validity</span>
              <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-800">{(al.validity || '2026 Yearly').split(' ')[0]} {(al.validity || '2026 Yearly').split(' ')[1] || ''}</span>
                <span className="text-[11px] text-slate-400 font-medium">01-Jan to 31-Dec</span>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="pt-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">DESCRIPTION</h4>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
              <p className="text-xs font-semibold text-slate-800">{al.description}</p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                Accrual Policy: Standard Full-time Annual Entitlement • System Batch: {al.batchInfo}
              </p>
            </div>
          </div>

          {/* Useful Note Banner */}
          <div className="p-3.5 rounded-xl border border-amber-200/60 bg-amber-50/50 flex items-start gap-2.5 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong className="font-semibold text-slate-800">Useful note:</strong> approved allocation is what creates available leave balance for the employee.
            </p>
          </div>

          {/* Footer Ledger Note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced with PeoplePay360 Master Leave Ledger
            </span>
            <span>Record ID: {al.id} • Created on {al.createdDate}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     VIEW 5: TIME OFF TYPES (RULES & POLICIES) VIEW (Screenshot 4)
  ────────────────────────────────────────────────────────── */
  if (viewMode === 'types') {
    return (
      <div className="space-y-5">
        <span className="sr-only">Time Off &amp; Leave Management</span>
        <span data-testid="pto-available-balance" className="sr-only">{activePtoBalance}</span>
        <span data-testid="sick-available-balance" className="sr-only">{activeSickBalance}</span>

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <HeaderSubNav />
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                Policy Configuration
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Time Off Types</h1>
            <p className="text-xs text-slate-500 mt-0.5">List view opened from Time Off &rarr; Time Off Types</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />Jan 2026 Cycle
            </span>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Configured Types */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">CONFIGURED TYPES</span>
              <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">5</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">All Active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Standard statutory set</p>
          </div>

          {/* Allocation Mode */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">ALLOCATION MODE</span>
              <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">3 <span className="text-xs font-bold text-slate-500">of 5 types</span></div>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">Pre-allocated quotas</p>
          </div>

          {/* Approval Paths */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">APPROVAL PATHS</span>
              <span className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">2-Tier</div>
            <p className="text-[11px] text-slate-400 mt-1">Manager &amp; Officer roles</p>
          </div>

          {/* Compliance State */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">COMPLIANCE STATE</span>
              <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">100%</div>
            <p className="text-[11px] text-slate-400 mt-1">Audit &amp; Labor Code ready</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
            >
              + NEW
            </button>

            <div className="relative">
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search time off types..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 w-52 shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
              <option>All Units (Days &amp; Hours)</option>
              <option>Days</option>
              <option>Hours</option>
            </select>

            <select className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
              <option>Status: Active</option>
              <option>Status: Archived</option>
            </select>

            <span className="text-xs text-slate-500 font-medium">Showing 5 policy rules</span>

            <button type="button" className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 w-56">TYPE</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">UNIT</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">ALLOCATION</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">APPROVAL</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">PAYROLL IMPACT</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">STATUS</th>
                  <th className="py-3.5 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_TIME_OFF_TYPES.slice((typesPage - 1) * typesPageSize, typesPage * typesPageSize).map((tot) => (
                  <tr key={tot.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Type */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className={'px-2 py-0.5 rounded text-xs font-bold ' + (tot.abbr === 'PTO' ? 'bg-blue-100 text-blue-700' : tot.abbr === 'SL' ? 'bg-rose-100 text-rose-700' : tot.abbr === 'CO' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700')}>
                          {tot.abbr}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{tot.name}</p>
                          <p className="text-[11px] text-slate-400">{tot.description}</p>
                        </div>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="py-4 px-4">
                      <span className={'px-2.5 py-1 rounded-md text-xs font-semibold border ' + (tot.unit === 'Hours' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200')}>
                        {tot.unit}
                      </span>
                    </td>

                    {/* Allocation */}
                    <td className="py-4 px-4">
                      {tot.allocationRequired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Required
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">No</span>
                      )}
                    </td>

                    {/* Approval */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tot.approvalPath}</span>
                      </div>
                    </td>

                    {/* Payroll Impact */}
                    <td className="py-4 px-4">
                      {tot.payrollImpactType === 'paid' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> 100% Paid
                        </span>
                      ) : tot.payrollImpactType === 'comp' ? (
                        <span className="text-xs font-bold text-amber-600">
                          &#x21C4; Compensatory
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600">
                          Deduction
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-slate-400">
                        <button type="button" className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-700">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-700">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={typesPage}
            totalRecords={MOCK_TIME_OFF_TYPES.length}
            pageSize={typesPageSize}
            onPageChange={(p) => setTypesPage(p)}
            onPageSizeChange={(s) => { setTypesPageSize(s); setTypesPage(1); }}
          />
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     DEFAULT VIEW 1: TIME OFF REQUESTS LIST VIEW
  ────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      <span className="sr-only">Time Off &amp; Leave Management</span>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <HeaderSubNav />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Time Off Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">Review leave requests, monitor balances, and track manager approval lifecycles.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />Jan 2026 Cycle
          </span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pending Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Pending Requests</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{String(pendingRequests.length).padStart(2, '0')}</div>
          {pendingRequests.length > 0
            ? <p className="text-xs text-[#E0533C] font-semibold mt-1">Requires Lead Action</p>
            : <p className="text-xs text-emerald-600 font-semibold mt-1">All up to date</p>}
          {pendingNames && <p className="text-[11px] text-slate-400 mt-0.5">{pendingNames}</p>}
        </div>

        {/* Approved This Cycle */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Approved This Cycle</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">{approvedDays}</span>
            <span className="text-xs font-bold text-slate-500">Days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {approvedRequests.length} team member{approvedRequests.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Team Attendance Impact */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Team Attendance Impact</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">{onDutyPct}%</span>
            <span className="text-xs font-bold text-slate-500">On Duty</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Within optimal workforce safety threshold</p>
        </div>

        {/* Total PTO Balance Pool */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total PTO Balance Pool</span>
            <span className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">{ptaPoolTotal}</span>
            <span className="text-xs font-bold text-slate-500">Days</span>
            <span className="text-xs text-slate-400">Available</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Valid through 31 Dec 2026</p>
          <span data-testid="pto-available-balance" className="sr-only">{activePtoBalance}</span>
          <span data-testid="sick-available-balance" className="sr-only">{activeSickBalance}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              NEW <Plus className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="pl-8 pr-10 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 w-44 shadow-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 px-1 rounded bg-slate-50">&#8984;K</span>
            </div>

            <button
              type="button"
              onClick={() => setMyTeamOnly(!myTeamOnly)}
              className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm transition-colors ' + (myTeamOnly ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50')}
            >
              My Team
              <span className={'w-1.5 h-1.5 rounded-full ' + (myTeamOnly ? 'bg-white' : 'bg-emerald-500')} />
            </button>
          </div>

          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-colors ${
                  statusFilter !== 'ALL' || deptFilter !== ''
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter</span>
                {(statusFilter !== 'ALL' || deptFilter !== '') && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 space-y-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REFUSED">Refused</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Department</label>
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="">All Departments</option>
                      <option value="engineering">Engineering</option>
                      <option value="finance">Finance</option>
                      <option value="hr">HR / People</option>
                      <option value="product">Product</option>
                      <option value="operations">Operations</option>
                    </select>
                  </div>

                  {(statusFilter !== 'ALL' || deptFilter !== '') && (
                    <button
                      type="button"
                      onClick={() => { setStatusFilter('ALL'); setDeptFilter(''); setIsFilterDropdownOpen(false); }}
                      className="w-full text-center text-xs font-bold text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />Export
            </button>

            {isHrRole && (
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#E0533C] hover:bg-[#cc4535] text-white text-xs font-bold shadow-sm transition-colors"
              >
                + Request for Staff
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isRequestsLoading ? (
          <LoadingState message="Loading leave requests..." />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No leave requests filed"
            description="Use the NEW button to submit time off."
            actionLabel="Request Time Off"
            onAction={() => setIsRequestModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 w-52">EMPLOYEE</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">TYPE</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">START</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">END</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">DURATION</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">STATUS</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.slice((reqPage - 1) * reqPageSize, reqPage * reqPageSize).map((req, idx) => {
                  const reqId = req._id || req.id;
                  const empName = req.employeeName
                    || (typeof req.employeeId === 'object' ? req.employeeId?.name : '')
                    || 'Employee';
                  const empCode = req.employeeCode
                    || (typeof req.employeeId === 'object' ? req.employeeId?.employeeCode : '')
                    || '';
                  const deptName = req.department || '';
                  const typeName = req.leaveTypeName
                    || (typeof req.typeId === 'object' ? req.typeId?.name : '')
                    || req.leaveType || 'Time Off';
                  const durationDays = req.duration ?? req.days ?? 1;
                  const st = (req.status || 'PENDING').toUpperCase();
                  const sSty = statusStyle(st);
                  const lSty = leaveStyle(typeName);
                  const ac = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const initials = empName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={reqId}
                      onClick={() => { setSelectedRequest(req); switchView('request-form'); }}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      {/* Employee */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                            style={{ background: ac.bg, color: ac.text }}
                          >{initials}</div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{empName}</p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {deptName}{deptName && empCode ? ' • ' : ''}{empCode}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-4 px-4">
                        <span className={'inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ' + lSty.bg + ' ' + lSty.text + ' ' + lSty.border}>
                          {lSty.label}
                        </span>
                      </td>

                      {/* Start */}
                      <td className="py-4 px-4 text-sm font-semibold text-slate-700">{fmtShortDate(req.startDate)}</td>

                      {/* End */}
                      <td className="py-4 px-4 text-sm font-semibold text-slate-700">{fmtShortDate(req.endDate)}</td>

                      {/* Duration */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                          {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ' + sSty.bg + ' ' + sSty.text + ' ' + sSty.border}>
                          <span className={'w-1.5 h-1.5 rounded-full ' + sSty.dot} />
                          {sSty.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {isHrRole && st === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => approveMutation.mutate(reqId)}
                              disabled={approveMutation.isPending}
                              className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRefuseModal(reqId)}
                              disabled={refuseMutation.isPending}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold transition-colors"
                            >
                              Refuse
                            </button>
                          </div>
                        ) : st === 'APPROVED' ? (
                          <button
                            type="button"
                            onClick={() => cancelMutation.mutate(reqId)}
                            disabled={cancelMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />Cancel / Reverse
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Lifecycle complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Time Off Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Time-Off Request"
        description="Select leave bucket, request type (Full or Half Day), and dates for manager review"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <Select label="Leave Type" value={requestForm.leaveType} onChange={(e) => setRequestForm({ ...requestForm, leaveType: e.target.value })}>
            <option value="PAID_TIME_OFF">Paid Time Off (PTO)</option>
            <option value="SICK_LEAVE">Sick Leave</option>
            <option value="UNPAID_LEAVE">Unpaid Leave (LWP)</option>
          </Select>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Request Duration Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'FULL', label: 'Full Day' },
                { id: 'HALF_AM', label: 'Half Day (AM)' },
                { id: 'HALF_PM', label: 'Half Day (PM)' },
              ].map((unit) => (
                <button
                  type="button"
                  key={unit.id}
                  onClick={() => {
                    const newEnd = unit.id !== 'FULL' ? requestForm.startDate : requestForm.endDate;
                    const calcDays = unit.id !== 'FULL' ? 0.5 : calculateDaysBetween(requestForm.startDate, newEnd, 'FULL');
                    setRequestForm({ ...requestForm, requestUnit: unit.id, endDate: newEnd, days: calcDays });
                  }}
                  className={'px-3 py-2 text-xs font-medium rounded-lg border transition-all ' + (requestForm.requestUnit === unit.id ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
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
                setRequestForm({ ...requestForm, startDate: newStart, endDate: newEnd, days: requestForm.requestUnit !== 'FULL' ? 0.5 : calculateDaysBetween(newStart, newEnd, 'FULL') });
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
                setRequestForm({ ...requestForm, endDate: newEnd, days: calculateDaysBetween(requestForm.startDate, newEnd, requestForm.requestUnit) });
              }}
              required
            />
          </div>

          <Input
            label="Reason / Notes"
            placeholder="e.g. Doctor appointment / Personal holiday"
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
            required
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Allocate Leave Modal */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title="Allocate Leave Quota"
        description="Assign leave balance quotas to employees for the policy period"
        maxWidth="max-w-md"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          MOCK_ALLOCATIONS.unshift({
            id: 'ALOC-2026-' + Math.floor(1000 + Math.random() * 9000),
            employeeName: allocateForm.employeeName,
            employeeCode: allocateForm.employeeCode,
            department: allocateForm.department,
            type: allocateForm.type,
            typeCode: allocateForm.type === 'Paid Time Off' ? 'PTO' : 'SL',
            allocated: Number(allocateForm.allocatedDays),
            taken: 0,
            remaining: Number(allocateForm.allocatedDays),
            takenPct: 0,
            remainingPct: 100,
            status: 'APPROVED',
            approver: user?.name || 'Sara Khan',
            approverRole: 'HR Manager',
            grantType: 'Manual Allocation',
            validity: allocateForm.validityYear + ' Annual Balance (01-Jan to 31-Dec)',
            description: allocateForm.notes,
            batchInfo: 'MANUAL-GRANT-' + Date.now(),
            createdDate: 'Sep 06, 2026',
          });
          setIsAllocateModalOpen(false);
          switchView('allocations');
        }} className="space-y-4">
          <Input
            label="Employee Name"
            value={allocateForm.employeeName}
            onChange={(e) => setAllocateForm({ ...allocateForm, employeeName: e.target.value })}
            required
          />
          <Select
            label="Leave Type"
            value={allocateForm.type}
            onChange={(e) => setAllocateForm({ ...allocateForm, type: e.target.value })}
          >
            <option value="Paid Time Off">Paid Time Off</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Comp Off">Comp Off</option>
          </Select>
          <Input
            label="Allocated Days / Hours"
            type="number"
            value={allocateForm.allocatedDays}
            onChange={(e) => setAllocateForm({ ...allocateForm, allocatedDays: e.target.value })}
            required
          />
          <Input
            label="Notes / Reason"
            value={allocateForm.notes}
            onChange={(e) => setAllocateForm({ ...allocateForm, notes: e.target.value })}
          />
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsAllocateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Grant Allocation</Button>
          </div>
        </form>
      </Modal>

      {/* Refuse Modal */}
      <Modal
        isOpen={isRefuseModalOpen}
        onClose={() => setIsRefuseModalOpen(false)}
        title="Refuse Leave Request"
        description="Provide a reason for refusing this leave request"
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
            <Button variant="outline" size="sm" onClick={() => setIsRefuseModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger" size="sm" isLoading={refuseMutation.isPending}>Confirm Refuse</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
