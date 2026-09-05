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
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState, EmptyState } from '../../components/ui/States';
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
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Building2,
  UserCheck,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function AttendanceFeature() {
  const queryClient = useQueryClient();
  const { user, role, hasAccess } = useAuth();
  const [searchParams] = useSearchParams();
  const queryEmpId = searchParams.get('employeeId');

  const isHrOrAdmin = hasAccess([
    ROLES.ADMIN,
    ROLES.HR_MANAGER,
    ROLES.HR_PAYROLL_MANAGER,
    ROLES.HR_PAYROLL_USER,
  ]);

  // List filters state
  const [search, setSearch] = useState('');
  const [selectedFilterEmp, setSelectedFilterEmp] = useState(queryEmpId || '');
  const [isTodayFilterOnly, setIsTodayFilterOnly] = useState(false);

  // Selected Log state for Right Panel Form View
  const [selectedLog, setSelectedLog] = useState(null);
  const [isEditingForm, setIsEditingForm] = useState(false);

  // New Record Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newLogForm, setNewLogForm] = useState({
    employeeId: '',
    employeeName: '',
    employeeCode: '',
    department: 'Finance',
    manager: 'Sara Khan',
    date: new Date().toISOString().split('T')[0],
    checkIn: `${new Date().toISOString().split('T')[0]}T09:00`,
    checkOut: `${new Date().toISOString().split('T')[0]}T18:00`,
    status: 'PRESENT',
    notes: 'Manually logged by HR/Admin',
  });

  // Edit Form state
  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    department: '',
    manager: '',
    status: 'PRESENT',
    notes: '',
  });

  // Fetch Attendance logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => fetchAttendance(),
  });

  // Fetch Employees for dropdowns
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  // Identify current user's today log for check-in terminal
  const currentEmpId = user?.employeeId || (employees[0]?.id || 'emp-aarav-1');
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayUserLog =
    logs.find((l) => (l.employeeId === currentEmpId || l.employeeName === user?.name) && l.date === todayDateStr) ||
    logs[0];
  const isCheckedIn = !!todayUserLog && !todayUserLog.checkOut;

  // Active record displayed in Form View
  const activeRecord = selectedLog || todayUserLog || logs[0];

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: () => checkInApi(currentEmpId),
    onSuccess: (updatedLog) => {
      queryClient.invalidateQueries(['attendance']);
      setSelectedLog(updatedLog);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkOutApi(todayUserLog?.id),
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
    },
  });

  const handleEditClick = () => {
    if (!activeRecord) return;
    setEditForm({
      checkIn: activeRecord.checkIn ? activeRecord.checkIn.slice(0, 16) : '',
      checkOut: activeRecord.checkOut ? activeRecord.checkOut.slice(0, 16) : '',
      department: activeRecord.department || 'Finance',
      manager: activeRecord.manager || 'Sara Khan',
      status: activeRecord.status || 'PRESENT',
      notes: activeRecord.notes || '',
    });
    setIsEditingForm(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!activeRecord) return;
    updateLogMutation.mutate({
      id: activeRecord.id,
      data: editForm,
    });
  };

  const handleCreateNewLog = (e) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === newLogForm.employeeId || e.employeeCode === newLogForm.employeeCode);
    const payload = {
      ...newLogForm,
      employeeName: emp ? (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()) : newLogForm.employeeName || 'Aarav Mehta',
      employeeCode: emp ? (emp.employeeCode || emp.id) : newLogForm.employeeCode || 'EMP-001',
    };
    updateLogMutation.mutate({
      id: `att-${Date.now()}`,
      data: payload,
    });
    setIsNewModalOpen(false);
  };

  // Filtered Logs list for table
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

    const matchesEmp = !selectedFilterEmp || log.employeeId === selectedFilterEmp || log.employeeCode === selectedFilterEmp;
    const matchesToday = !isTodayFilterOnly || log.date === todayDateStr;

    return matchesSearch && matchesEmp && matchesToday;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            List and Form view of employee attendance records with real-time punch syncing and manager adjustments
          </p>
        </div>
      </div>

      {/* Self-Service Check-In Terminal Card */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white border-0 shadow-lg">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Employee Check-In Terminal</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  {isCheckedIn ? 'Checked In' : 'Checked Out'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {user?.name || 'Employee Portal'} {todayUserLog?.checkIn ? `• Clocked in at ${new Date(todayUserLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={LogIn}
              disabled={isCheckedIn}
              isLoading={checkInMutation.isPending}
              onClick={() => checkInMutation.mutate()}
            >
              Check In
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 disabled:opacity-40"
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

      {/* Main Dual-Panel Layout: List View (Left) & Form View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Attendance List View */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
            {/* Header Controls */}
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Attendance</h3>
                <p className="text-[11px] text-slate-500">List view of employee attendance records</p>
              </div>
              {isHrOrAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setIsNewModalOpen(true)}
                >
                  NEW
                </Button>
              )}
            </div>

            {/* Filter Controls Bar */}
            <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search attendance..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsTodayFilterOnly(!isTodayFilterOnly)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  isTodayFilterOnly
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Today
              </button>

              {isHrOrAdmin && (
                <select
                  aria-label="Filter attendance by employee"
                  value={selectedFilterEmp}
                  onChange={(e) => setSelectedFilterEmp(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Employees: All</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Attendance Table */}
            {isLoading ? (
              <LoadingState message="Loading attendance records..." />
            ) : filteredLogs.length === 0 ? (
              <EmptyState title="No attendance entries found" description="Adjust your filters or use NEW button to create a record." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-3">Check In</th>
                      <th className="py-3 px-3">Check Out</th>
                      <th className="py-3 px-3 text-right">Worked Hours</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredLogs.map((log) => {
                      const isSelected = activeRecord?.id === log.id;
                      const checkInFormatted = log.checkIn
                        ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const checkOutFormatted = log.checkOut
                        ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const statusStr = log.status || 'PRESENT';

                      return (
                        <tr
                          key={log.id}
                          onClick={() => {
                            setSelectedLog(log);
                            setIsEditingForm(false);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/80 border-l-4 border-emerald-600 text-emerald-950 font-bold'
                              : 'hover:bg-slate-50/80 text-slate-800'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div>
                              <span>{log.employeeName}</span>
                              {log.employeeCode && (
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {log.employeeCode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-700">{checkInFormatted}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-700">{checkOutFormatted}</td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {log.workedHours !== null && log.workedHours !== undefined ? Number(log.workedHours).toFixed(2) : '0.00'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                statusStr === 'PRESENT'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : statusStr === 'ABSENT'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {statusStr}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-3 bg-slate-50/60 text-[11px] text-slate-500 italic border-t border-slate-200">
              Useful note: list view should help users review raw check-in / check-out data and identify missing punches quickly.
            </div>
          </Card>
        </div>

        {/* Right Panel: Attendance Form View */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
            {/* Header matching wireframe */}
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Attendance / {activeRecord?.employeeName || 'Aarav Mehta'} / {activeRecord?.date || formatDate(new Date())}
                </h3>
                <p className="text-[11px] text-slate-500">Form view of one attendance record</p>
              </div>

              {isHrOrAdmin && (
                <div>
                  {!isEditingForm ? (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit2}
                      onClick={handleEditClick}
                      className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      EDIT
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingForm(false)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        icon={Save}
                        isLoading={updateLogMutation.isPending}
                        onClick={handleSaveForm}
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <CardContent className="p-6 space-y-6">
              {!isEditingForm ? (
                /* Form Read-Only View */
                <div className="space-y-6">
                  {/* Grid Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Employee
                      </label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900">
                        {activeRecord?.employeeName || 'Aarav Mehta'} ({activeRecord?.employeeCode || 'EMP-001'})
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Department
                      </label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                        {activeRecord?.department || 'Finance'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Check In
                      </label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900">
                        {activeRecord?.checkIn ? `${formatDate(activeRecord.date)} ${new Date(activeRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Manager
                      </label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                        {activeRecord?.manager || 'Sara Khan'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Check Out
                      </label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900">
                        {activeRecord?.checkOut ? `${formatDate(activeRecord.date)} ${new Date(activeRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Status
                      </label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-emerald-700">
                        {activeRecord?.status || 'PRESENT'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Worked Hours
                      </label>
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs font-mono font-extrabold text-emerald-800">
                        {activeRecord?.workedHours !== null && activeRecord?.workedHours !== undefined ? `${Number(activeRecord.workedHours).toFixed(2)} hrs` : '0.00 hrs'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Overtime
                      </label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
                        {activeRecord?.overtime !== undefined ? `${Number(activeRecord.overtime).toFixed(2)} hrs` : '0.00 hrs'}
                      </div>
                    </div>
                  </div>

                  {/* Notes Textarea */}
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Notes
                    </label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 min-h-[70px]">
                      {activeRecord?.notes || 'System recorded or manually corrected by an authorized user.'}
                    </div>
                  </div>
                </div>
              ) : (
                /* Form Edit View */
                <form onSubmit={handleSaveForm} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Check In Timestamp"
                      type="datetime-local"
                      value={editForm.checkIn}
                      onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                      required
                    />
                    <Input
                      label="Check Out Timestamp"
                      type="datetime-local"
                      value={editForm.checkOut}
                      onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                    />
                    <Input
                      label="Department"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    />
                    <Input
                      label="Manager"
                      value={editForm.manager}
                      onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}
                    />
                    <Select
                      label="Status"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="LATE">LATE</option>
                      <option value="EXCEPTION">EXCEPTION</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes / Reason</label>
                    <textarea
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="e.g. System recorded or manually corrected by an authorized user."
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </form>
              )}
            </CardContent>

            <div className="p-3 bg-slate-50/60 text-[11px] text-slate-500 italic border-t border-slate-200">
              Useful note: worked hours and overtime should be easy to read because they may later influence payroll or reporting.
            </div>
          </Card>
        </div>
      </div>

      {/* Admin / HR New Attendance Record Modal */}
      {isNewModalOpen && (
        <Modal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          title="Create Attendance Record"
          description="Log a new attendance entry manually for an employee"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateNewLog} className="space-y-4">
            <Select
              label="Select Employee"
              value={newLogForm.employeeId}
              onChange={(e) => setNewLogForm({ ...newLogForm, employeeId: e.target.value })}
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} ({emp.employeeCode || emp.id})
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Check In"
                type="datetime-local"
                value={newLogForm.checkIn}
                onChange={(e) => setNewLogForm({ ...newLogForm, checkIn: e.target.value })}
                required
              />
              <Input
                label="Check Out"
                type="datetime-local"
                value={newLogForm.checkOut}
                onChange={(e) => setNewLogForm({ ...newLogForm, checkOut: e.target.value })}
              />
            </div>

            <Select
              label="Status"
              value={newLogForm.status}
              onChange={(e) => setNewLogForm({ ...newLogForm, status: e.target.value })}
            >
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
              <option value="LATE">LATE</option>
              <option value="EXCEPTION">EXCEPTION</option>
            </Select>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={newLogForm.notes}
                onChange={(e) => setNewLogForm({ ...newLogForm, notes: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsNewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={updateLogMutation.isPending}
              >
                Create Record
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
