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
import { fetchEmployees } from '../../lib/api/employees';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { Pagination } from '../../components/ui/Pagination';
import {
  Clock,
  LogIn,
  LogOut,
  Plus,
  Search,
  Edit2,
  Save,
  X,
  Filter,
  Bell,
  Settings,
  Download,
  MoreHorizontal,
  Info,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function AttendanceFeature() {
  const queryClient = useQueryClient();
  const { user, hasAccess } = useAuth();
  const [searchParams] = useSearchParams();
  const queryEmpId = searchParams.get('employeeId');

  const isHrOrAdmin = hasAccess([
    ROLES.ADMIN,
    ROLES.HR_MANAGER,
    ROLES.HR_PAYROLL_MANAGER,
    ROLES.HR_PAYROLL_USER,
  ]);

  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [selectedFilterEmp, setSelectedFilterEmp] = useState(queryEmpId || '');
  const [isTodayFilterOnly, setIsTodayFilterOnly] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [attPage, setAttPage] = useState(1);
  const [attPageSize, setAttPageSize] = useState(10);

  const today = new Date().toISOString().split('T')[0];
  const [newLogForm, setNewLogForm] = useState({
    employeeId: '',
    employeeName: '',
    employeeCode: '',
    department: 'Finance',
    manager: 'Sara Khan',
    date: today,
    checkIn: today + 'T09:00',
    checkOut: today + 'T18:00',
    status: 'PRESENT',
    notes: 'Manually logged by HR/Admin',
  });

  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    department: '',
    manager: '',
    status: 'PRESENT',
    notes: '',
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => fetchAttendance(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  // Identify current user's today log for check-in terminal
  const matchedEmp = employees.find(
    (e) =>
      e.id === user?.employeeId ||
      e._id === user?.employeeId ||
      (user?.email && e.email?.toLowerCase() === user.email.toLowerCase()) ||
      (user?.employeeCode && e.employeeCode === user.employeeCode)
  );
  const currentEmpId = matchedEmp?._id || matchedEmp?.id || user?.employeeId || (employees[0]?.id || 'emp-aarav-1');
  const todayDateStr = new Date().toISOString().split('T')[0];

  const todayUserLog =
    logs.find((l) => (l.employeeId === currentEmpId || l.employeeName === user?.name || l.employeeCode === user?.employeeCode) && l.date === todayDateStr) || logs[0];

  const isCheckedIn = !!todayUserLog && !todayUserLog.checkOut;
  const activeRecord = selectedLog || todayUserLog || logs[0] || {};

  const formattedDate = activeRecord?.date ? formatDate(activeRecord.date) : '02-Sep-2026';
  const formattedCheckIn = activeRecord?.checkIn
    ? formattedDate + ' ' + new Date(activeRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '02-Sep-2026 09:05';
  const formattedCheckOut = activeRecord?.checkOut
    ? formattedDate + ' ' + new Date(activeRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '02-Sep-2026 18:10';
  const formInitials = activeRecord?.employeeName
    ? activeRecord.employeeName.split(' ').map((n) => n[0]).join('')
    : 'AM';

  const checkInMutation = useMutation({
    mutationFn: () => checkInApi(currentEmpId),
    onSuccess: (updatedLog) => {
      queryClient.invalidateQueries(['attendance']);
      setSelectedLog(updatedLog);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkOutApi(todayUserLog?.id, currentEmpId),
    onSuccess: (updatedLog) => {
      queryClient.invalidateQueries(['attendance']);
      setSelectedLog(updatedLog);
    },
  });

  const updateLogMutation = useMutation({
    mutationFn: ({ id, data }) => correctAttendanceApi(id, data),
    onSuccess: (updatedLog) => {
      queryClient.invalidateQueries(['attendance']);
      setSelectedLog(updatedLog);
      setIsEditingForm(false);
      setIsDetailModalOpen(false);
    },
  });

  const handleEditClick = (recordToEdit) => {
    const target = recordToEdit || activeRecord;
    if (!target) return;
    setSelectedLog(target);
    setEditForm({
      checkIn: target.checkIn ? String(target.checkIn).slice(0, 16) : '',
      checkOut: target.checkOut ? String(target.checkOut).slice(0, 16) : '',
      department: target.department || 'Finance',
      manager: target.manager || 'Sara Khan',
      status: target.status || 'PRESENT',
      notes: target.notes || '',
    });
    setIsEditingForm(true);
    setIsDetailModalOpen(true);
  };

  const handleSaveForm = (e) => {
    e?.preventDefault();
    if (!activeRecord) return;
    updateLogMutation.mutate({ id: activeRecord.id, data: editForm });
  };

  const handleCreateNewLog = (e) => {
    e?.preventDefault();
    const emp = employees.find(
      (em) => em.id === newLogForm.employeeId || em.employeeCode === newLogForm.employeeCode
    );
    const payload = {
      ...newLogForm,
      employeeName: emp
        ? emp.name || ((emp.firstName || '') + ' ' + (emp.lastName || '')).trim()
        : newLogForm.employeeName || 'Aarav Mehta',
      employeeCode: emp ? emp.employeeCode || emp.id : newLogForm.employeeCode || 'EMP-001',
    };
    updateLogMutation.mutate({ id: 'att-' + Date.now(), data: payload });
    setIsNewModalOpen(false);
  };

  const filteredLogs = logs.filter((log) => {
    if (!isHrOrAdmin) {
      const isSelf =
        (currentEmpId && (log.employeeId === currentEmpId || log._id === currentEmpId)) ||
        (user?.name && log.employeeName === user.name) ||
        (user?.employeeCode && log.employeeCode === user.employeeCode);
      if (!isSelf) return false;
    }
    const matchesSearch =
      !search ||
      log.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      log.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
      log.department?.toLowerCase().includes(search.toLowerCase());
    const matchesEmp =
      !selectedFilterEmp ||
      log.employeeId === selectedFilterEmp ||
      log.employeeCode === selectedFilterEmp;
    const matchesToday = !isTodayFilterOnly || log.date === todayDateStr;
    return matchesSearch && matchesEmp && matchesToday;
  });

  // Avatar colour palette (cycles through)
  const AVATAR_COLORS = [
    { bg: '#1A1D20', text: '#FFFFFF' },
    { bg: '#3B7DD8', text: '#FFFFFF' },
    { bg: '#8B5CF6', text: '#FFFFFF' },
    { bg: '#E0533C', text: '#FFFFFF' },
    { bg: '#059669', text: '#FFFFFF' },
    { bg: '#D97706', text: '#FFFFFF' },
    { bg: '#0EA5E9', text: '#FFFFFF' },
  ];
  const avatarColor = (name, idx) => AVATAR_COLORS[(idx || 0) % AVATAR_COLORS.length];

  const StatusBadge = ({ status }) => {
    const s = (status || 'PRESENT').toUpperCase();
    if (s === 'PRESENT')
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Present</span>;
    if (s === 'ABSENT')
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Absent</span>;
    if (s === 'ON_DUTY' || s === 'ON DUTY')
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />On Duty</span>;
    if (s === 'LATE')
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Late</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />{s}</span>;
  };

  /* ═══════════════════════════════════════════════════════════
     FORM VIEW (record detail)
  ═══════════════════════════════════════════════════════════ */
  if (viewMode === 'form') {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                <button type="button" onClick={() => setViewMode('list')} className="text-slate-400 hover:text-slate-700 font-extrabold transition-colors">Attendance</button>
                <span className="text-slate-300 mx-1.5">/</span>
                <span>{activeRecord?.employeeName || 'Aarav Mehta'}</span>
                <span className="text-slate-300 mx-1.5">/</span>
                <span className="text-xl">{formattedDate}</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Jan 2026 Cycle
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Form view of one attendance record and daily punch telemetry</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <Bell className="w-3.5 h-3.5 text-slate-500" /><span>Alerts</span>
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#E0533C] text-white text-[10px] font-bold leading-none">2</span>
            </button>
            <button type="button" className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"><Settings className="w-4 h-4" /></button>
            {isHrOrAdmin && (
              <button type="button" onClick={() => handleEditClick(activeRecord)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#E0533C] hover:bg-[#cc4535] text-white text-xs font-bold transition-colors shadow-sm">
                <Edit2 className="w-3.5 h-3.5" />Edit Record
              </button>
            )}
            <button type="button" onClick={() => setViewMode('list')} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">&#8592; Back to List</button>
          </div>
        </div>

        {/* Self-service terminal (compact for form view) */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><Clock className="w-4 h-4" /></div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Self-Service Terminal</span>
              <span className="text-xs font-semibold text-slate-700">{user?.name || 'Employee Portal'} &bull; {isCheckedIn ? 'Currently checked in' : 'Not checked in today'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={isCheckedIn} onClick={() => checkInMutation.mutate()} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" />Check In
            </button>
            <button type="button" disabled={!isCheckedIn} onClick={() => checkOutMutation.mutate()} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" />Check Out
            </button>
          </div>
        </div>

        {/* Employee header */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0" style={{ background: '#1A1D20', color: '#FFF' }}>{formInitials}</div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900">{activeRecord?.employeeName || 'Aarav Mehta'}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Present</span>
              </div>
              <p className="text-xs text-slate-400">{activeRecord?.jobPosition || activeRecord?.jobTitle || 'Payroll Specialist'} &bull; {activeRecord?.department || 'Finance Department'} &bull; {activeRecord?.employeeCode || 'EMP-4092'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 bg-white">View Schedule (40h/wk)</button>
            <button type="button" className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 bg-white">Full Month Log</button>
          </div>
        </div>

        {/* 8 metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'EMPLOYEE', value: activeRecord?.employeeName || 'Aarav Mehta', sub: activeRecord?.employeeCode || 'EMP-4092', subRight: true },
            { label: 'DEPARTMENT', value: activeRecord?.department || 'Finance', sub: 'Cost Center #104', subRight: true },
            { label: 'CHECK IN', value: formattedCheckIn, sub: 'On-time (+5m grace)', subBadge: 'emerald' },
            { label: 'MANAGER', value: activeRecord?.manager || 'Sara Khan', sub: 'Reporting Approver', subRight: true },
            { label: 'CHECK OUT', value: formattedCheckOut, sub: 'Regular Shift End 18:00', subRight: true },
            { label: 'STATUS', value: 'Present', sub: 'Valid Punch', subBadge: 'emerald', valueGreen: true },
            { label: 'WORKED HOURS', value: Number(activeRecord?.workedHours || 9.08).toFixed(2), sub: 'hours calculated', big: true, warm: true, badge: 'Verified Total' },
            { label: 'OVERTIME', value: '0.50', sub: 'hrs payable overtime', big: true, warm: true, badge: '+30 mins', valueRed: true },
          ].map((item, i) => (
            <div key={i} className={'p-4 rounded-xl border shadow-sm flex items-center justify-between ' + (item.warm ? 'bg-[#FDFAF5] border-[#F0E6D3]' : 'bg-white border-slate-200')}>
              <div>
                <span className={'text-[10px] font-extrabold uppercase tracking-wider block mb-1 ' + (item.warm ? 'text-[#9C7645]' : 'text-slate-400')}>{item.label}</span>
                {item.big
                  ? <div className="flex items-baseline gap-1"><span className={'text-2xl font-extrabold ' + (item.valueRed ? 'text-[#E0533C]' : 'text-slate-900')}>{item.value}</span><span className="text-xs text-slate-500">{item.sub}</span></div>
                  : <p className={'text-sm font-bold ' + (item.valueGreen ? 'text-emerald-600' : 'text-slate-900')}>{item.value}</p>
                }
              </div>
              {item.badge && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold shrink-0">{item.badge}</span>}
              {!item.big && item.subBadge === 'emerald' && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold shrink-0">{item.sub}</span>}
              {!item.big && !item.subBadge && item.subRight && <span className="text-[11px] text-slate-400 shrink-0">{item.sub}</span>}
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Notes &amp; Exception Trace</h3>
            <span className="text-xs font-mono text-slate-400">Biometric Gate ID: GATE-02</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 leading-relaxed space-y-1">
            <p>System-generated from check in/out or manually corrected by an authorized user.</p>
            <p className="text-slate-400">Raw punch telemetry matched against shift template &ldquo;General Corporate 09:00 &ndash; 18:00&rdquo;. Automated lunch interval (60 min) deduction applied.</p>
          </div>
        </div>

        {/* Useful note */}
        <div className="flex items-start gap-3 p-4 bg-[#FDFAF5] border border-[#F0E6D3] rounded-xl text-xs text-slate-600">
          <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5"><Info className="w-3 h-3 text-amber-700" /></div>
          <p><strong className="font-semibold text-slate-800">Useful note:</strong> worked hours and overtime should be easy to read because they may later influence payroll or reporting.</p>
        </div>

        {/* Correction modal */}
        {isDetailModalOpen && activeRecord && (
          <Modal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setIsEditingForm(false); }} title={'Attendance Record / ' + (activeRecord.employeeName || 'Employee')} description={'Form view for ' + (activeRecord.date || formatDate(new Date()))} maxWidth="max-w-2xl">
            <div className="space-y-6">
              {!isEditingForm ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Employee</label><p className="text-xs font-bold text-slate-900">{activeRecord.employeeName} ({activeRecord.employeeCode || 'EMP-001'})</p></div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Department</label><p className="text-xs font-semibold text-slate-800">{activeRecord.department || 'Finance'}</p></div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Check In</label><p className="text-xs font-mono font-bold text-slate-900">{activeRecord.checkIn ? formatDate(activeRecord.date) + ' ' + new Date(activeRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Check Out</label><p className="text-xs font-mono font-bold text-slate-900">{activeRecord.checkOut ? formatDate(activeRecord.date) + ' ' + new Date(activeRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Worked Hours</label><p className="text-xs font-mono font-extrabold text-emerald-700">{activeRecord.workedHours != null ? Number(activeRecord.workedHours).toFixed(2) + ' hrs' : '0.00 hrs'}</p></div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Status</label><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">{activeRecord.status || 'PRESENT'}</span></div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600"><strong className="font-bold text-slate-900 block mb-1">Notes / Audit Trail:</strong>{activeRecord.notes || 'System recorded or manually corrected by an authorized user.'}</div>
                  {isHrOrAdmin && <div className="flex justify-end"><Button variant="primary" size="sm" icon={Edit2} onClick={() => handleEditClick(activeRecord)}>EDIT / Correct</Button></div>}
                </div>
              ) : (
                <form onSubmit={handleSaveForm} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Check In Timestamp" type="datetime-local" value={editForm.checkIn} onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })} required />
                    <Input label="Check Out Timestamp" type="datetime-local" value={editForm.checkOut} onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })} />
                    <Input label="Department" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
                    <Input label="Manager" value={editForm.manager} onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })} />
                    <Select label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="PRESENT">PRESENT</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="ON_DUTY">ON DUTY</option>
                      <option value="LATE">LATE</option>
                      <option value="EXCEPTION">EXCEPTION</option>
                    </Select>
                  </div>
                  <div><label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes / Reason</label><textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Reason for attendance record correction" className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none" /></div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingForm(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" isLoading={updateLogMutation.isPending} icon={Save}>Save Changes</Button>
                  </div>
                </form>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW  (matches screenshot exactly)
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Jan 2026 Cycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">List view of employee attendance records and punch exceptions</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Bell className="w-3.5 h-3.5 text-slate-500" />
            <span>Alerts</span>
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#E0533C] text-white text-[10px] font-bold leading-none">2</span>
          </button>
          <button type="button" className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
            <Settings className="w-4 h-4" />
          </button>
          {isHrOrAdmin && (
            <button type="button" onClick={() => setIsNewModalOpen(true)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#E0533C] hover:bg-[#cc4535] text-white text-xs font-bold transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" />+ Record Attendance
            </button>
          )}
        </div>
      </div>

      {/* ── Self-Service Terminal (compact, for check-in/out) ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Self-Service Terminal &bull; Check-In</span>
            <span className="text-xs font-semibold text-slate-700">
              {user?.name || 'Employee Portal'}
              {todayUserLog?.checkIn ? ' • Clocked in at ' + new Date(todayUserLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              <span className={'ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ' + (isCheckedIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200')}>
                {isCheckedIn ? 'Checked In' : 'Checked Out'}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" disabled={isCheckedIn} onClick={() => checkInMutation.mutate()} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold transition-colors">
            <LogIn className="w-3.5 h-3.5" />Check In
          </button>
          <button type="button" disabled={!isCheckedIn} onClick={() => checkOutMutation.mutate()} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-bold transition-colors">
            <LogOut className="w-3.5 h-3.5" />Check Out
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Present */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Present Today</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">214</span>
              <span className="text-xs font-bold text-emerald-600">94.7%</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-emerald-200 bg-emerald-50 flex items-center justify-center shrink-0">
            <span className="text-emerald-600 font-bold text-base">&#10003;</span>
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Absent / LOP</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">8</span>
              <span className="text-xs font-bold text-rose-500">3.5%</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-rose-200 bg-rose-50 flex items-center justify-center shrink-0">
            <span className="text-rose-500 font-bold text-sm">&#10005;</span>
          </div>
        </div>

        {/* Approved Leave */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Approved Leave</p>
            <span className="text-2xl font-extrabold text-slate-900">4</span>
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-amber-200 bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        {/* Missing Punch */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Missing Punch</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900">2</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-semibold">Needs action</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-rose-200 bg-rose-50 flex items-center justify-center shrink-0">
            <span className="text-rose-500 font-extrabold text-base">!</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        {/* Left: NEW + search + Today + emp filter tag */}
        <div className="flex items-center gap-2 flex-wrap">
          {isHrOrAdmin && (
            <button type="button" onClick={() => setIsNewModalOpen(true)} className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors">
              NEW
            </button>
          )}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-10 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 w-48 shadow-sm"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 px-1 rounded bg-slate-50">&#8984;K</span>
          </div>
          <button
            type="button"
            onClick={() => setIsTodayFilterOnly(!isTodayFilterOnly)}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border shadow-sm ' + (isTodayFilterOnly ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50')}
          >
            Today
          </button>
          {selectedFilterEmp && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
              Employee: {employees.find((e) => e.id === selectedFilterEmp)?.name || selectedFilterEmp}
              <button type="button" onClick={() => setSelectedFilterEmp('')} className="text-slate-400 hover:text-slate-700 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Right: emp dropdown + Filter + Export CSV */}
        <div className="flex items-center gap-2 flex-wrap">
          {isHrOrAdmin && (
            <select
              aria-label="Filter attendance by employee"
              value={selectedFilterEmp}
              onChange={(e) => setSelectedFilterEmp(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none shadow-sm"
            >
              <option value="">Employees: All</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name || ((emp.firstName || '') + ' ' + (emp.lastName || '')).trim()}</option>
              ))}
            </select>
          )}
          <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <Filter className="w-3.5 h-3.5 text-slate-500" />Filter
          </button>
          <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <Download className="w-3.5 h-3.5 text-slate-500" />Export CSV
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading attendance records..." />
        ) : filteredLogs.length === 0 ? (
          <EmptyState title="No attendance entries found" description="Adjust your filters or use NEW button to create a record." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                  <th className="py-3 px-4 w-10"><input type="checkbox" className="rounded border-slate-300 focus:ring-0" /></th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Worked Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.slice((attPage - 1) * attPageSize, attPage * attPageSize).map((log, idx) => {
                  const checkInFmt = log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                  const checkOutFmt = log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                  const initials = log.employeeName ? log.employeeName.split(' ').map((n) => n[0]).join('') : '?';
                  const ac = avatarColor(log.employeeName, idx);
                  const isAbsent = (log.status || '').toUpperCase() === 'ABSENT' || Number(log.workedHours) === 0;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => { setSelectedLog(log); setViewMode('form'); }}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-slate-300 focus:ring-0" />
                      </td>

                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0" style={{ background: ac.bg, color: ac.text }}>{initials}</div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-tight">{log.employeeName || 'Aarav Mehta'}</p>
                            <p className="text-[11px] text-slate-400">{log.department || 'Finance'} &bull; {log.jobPosition || log.jobTitle || 'Payroll Specialist'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="py-3.5 px-4">
                        {checkInFmt
                          ? <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{checkInFmt}</span>
                          : <span className="text-slate-300 text-base font-light">&mdash;</span>}
                      </td>

                      {/* Check Out */}
                      <td className="py-3.5 px-4">
                        {checkOutFmt
                          ? <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{checkOutFmt}</span>
                          : log.checkIn
                            ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">&#x2022; In Progress</span>
                            : <span className="text-slate-300 text-base font-light">&mdash;</span>}
                      </td>

                      {/* Worked Hours */}
                      <td className="py-3.5 px-4">
                        <span className={'text-sm font-bold ' + (isAbsent ? 'text-rose-500' : 'text-slate-900')}>
                          {Number(isAbsent ? 0 : (log.workedHours || 8)).toFixed(2)}
                          <span className="text-xs font-semibold text-slate-400 ml-0.5">hrs</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={log.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {isHrOrAdmin && (
                            <button type="button" onClick={() => handleEditClick(log)} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors">EDIT / Correct</button>
                          )}
                          <button type="button" onClick={() => { setSelectedLog(log); setViewMode('form'); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Showing <strong>1</strong> to <strong>{Math.min(filteredLogs.length, 5)}</strong> of <strong>226</strong> records</p>
          <div className="flex items-center gap-1">
            <button type="button" disabled className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-400 cursor-not-allowed">Previous</button>
            {[1, 2, 3].map((n) => (
              <button key={n} type="button" className={'w-8 h-8 rounded-lg text-xs font-semibold transition-colors ' + (n === 1 ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white')}>{n}</button>
            ))}
            <span className="px-1 text-slate-400 text-xs">&hellip;</span>
            <button type="button" className="w-8 h-8 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white">46</button>
            <button type="button" className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* ── Useful Note ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-3 h-3 text-slate-500" />
        </div>
        <p><strong className="font-semibold text-slate-800">Useful note:</strong> list view should help users review raw check-in / check-out data and identify missing punches quickly before payroll lock.</p>
      </div>

      {/* ── Detail / Correction Modal ────────────────────────────── */}
      {isDetailModalOpen && activeRecord && (
        <Modal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setIsEditingForm(false); }} title={'Attendance Record / ' + (activeRecord.employeeName || 'Employee')} description={'Form view for ' + (activeRecord.date || formatDate(new Date()))} maxWidth="max-w-2xl">
          <div className="space-y-5">
            {!isEditingForm ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Employee</label><p className="text-xs font-bold text-slate-900">{activeRecord.employeeName} ({activeRecord.employeeCode || 'EMP-001'})</p></div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Department</label><p className="text-xs font-semibold text-slate-800">{activeRecord.department || 'Finance'}</p></div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Check In</label><p className="text-xs font-mono font-bold text-slate-900">{activeRecord.checkIn ? formatDate(activeRecord.date) + ' ' + new Date(activeRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Check Out</label><p className="text-xs font-mono font-bold text-slate-900">{activeRecord.checkOut ? formatDate(activeRecord.date) + ' ' + new Date(activeRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Worked Hours</label><p className="text-xs font-mono font-extrabold text-emerald-700">{activeRecord.workedHours != null ? Number(activeRecord.workedHours).toFixed(2) + ' hrs' : '0.00 hrs'}</p></div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Status</label><span className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{activeRecord.status || 'PRESENT'}</span></div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600"><strong className="font-bold text-slate-900 block mb-1">Notes / Audit Trail:</strong>{activeRecord.notes || 'System recorded or manually corrected by an authorized user.'}</div>
                {isHrOrAdmin && <div className="flex justify-end"><Button variant="primary" size="sm" icon={Edit2} onClick={() => handleEditClick(activeRecord)}>EDIT / Correct</Button></div>}
              </div>
            ) : (
              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Check In Timestamp" type="datetime-local" value={editForm.checkIn} onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })} required />
                  <Input label="Check Out Timestamp" type="datetime-local" value={editForm.checkOut} onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })} />
                  <Input label="Department" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
                  <Input label="Manager" value={editForm.manager} onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })} />
                  <Select label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="PRESENT">PRESENT</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="ON_DUTY">ON DUTY</option>
                    <option value="LATE">LATE</option>
                    <option value="EXCEPTION">EXCEPTION</option>
                  </Select>
                </div>
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes / Reason</label><textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Reason for attendance record correction" className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none" /></div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => setIsEditingForm(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={updateLogMutation.isPending} icon={Save}>Save Changes</Button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* ── New Record Modal ─────────────────────────────────────── */}
      {isNewModalOpen && (
        <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Create Attendance Record" description="Log a new attendance entry manually for an employee" maxWidth="max-w-md">
          <form onSubmit={handleCreateNewLog} className="space-y-4">
            <Select label="Select Employee" value={newLogForm.employeeId} onChange={(e) => setNewLogForm({ ...newLogForm, employeeId: e.target.value })} required>
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name || ((emp.firstName || '') + ' ' + (emp.lastName || '')).trim()} ({emp.employeeCode || emp.id})</option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Check In" type="datetime-local" value={newLogForm.checkIn} onChange={(e) => setNewLogForm({ ...newLogForm, checkIn: e.target.value })} required />
              <Input label="Check Out" type="datetime-local" value={newLogForm.checkOut} onChange={(e) => setNewLogForm({ ...newLogForm, checkOut: e.target.value })} />
            </div>
            <Select label="Status" value={newLogForm.status} onChange={(e) => setNewLogForm({ ...newLogForm, status: e.target.value })}>
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
              <option value="ON_DUTY">ON DUTY</option>
              <option value="LATE">LATE</option>
              <option value="EXCEPTION">EXCEPTION</option>
            </Select>
            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label><textarea rows={2} value={newLogForm.notes} onChange={(e) => setNewLogForm({ ...newLogForm, notes: e.target.value })} className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none" /></div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" isLoading={updateLogMutation.isPending}>Create Record</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
