import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/auth/AuthContext';
import { fetchEmployees, fetchEmployeeById } from '../../lib/api/employees';
import { fetchAttendance, checkInApi, checkOutApi } from '../../lib/api/attendance';
import { fetchTimeOffBalances, fetchTimeOffRequests, createTimeOffRequest } from '../../lib/api/timeOff';
import { mockEmployees, mockContracts, mockWorkingSchedules } from '../../lib/api/mockData';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState } from '../../components/ui/States';
import { formatDate } from '../../lib/utils';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  FileSignature,
  Layers,
  Sparkles,
  HeartPulse,
  Ban,
  CheckCircle2,
  LogIn,
  LogOut,
  Plus,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  CalendarCheck,
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
  const [timeOffForm, setTimeOffForm] = useState({
    leaveType: 'PAID_TIME_OFF',
    startDate: '2026-09-10',
    endDate: '2026-09-12',
    days: 3,
    reason: '',
  });

  // 1. Fetch Employee Profile Details
  const { data: employeesList = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(),
  });

  const matchedEmployee =
    employeesList.find(
      (e) =>
        e.id === user?.employeeId ||
        e._id === user?.employeeId ||
        (user?.email && e.email?.toLowerCase() === user.email.toLowerCase()) ||
        (user?.employeeCode && e.employeeCode === user.employeeCode)
    ) ||
    mockEmployees.find((e) => e.id === user?.employeeId || e.email === user?.email) ||
    mockEmployees[0];

  // Effective employee MongoDB ObjectId or string identifier for API queries
  const employeeId = matchedEmployee?._id || matchedEmployee?.id || user?.employeeId || 'emp-john-1';

  const contractInfo =
    mockContracts.find((c) => c.employeeId === matchedEmployee?.id) || mockContracts[0];

  // 2. Fetch Attendance Records
  const { data: attendanceLogs = [], isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['attendance', { employeeId }],
    queryFn: () => fetchAttendance({ employeeId }),
  });

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayRecord =
    attendanceLogs.find((l) => (l.employeeId === employeeId || l.employeeId === matchedEmployee?.id || l.employeeId === matchedEmployee?._id) && l.date === todayDateStr);
  const isCheckedIn = !!todayRecord && !todayRecord.checkOut;

  // 3. Fetch Time Off Balances & Requests
  const { data: leaveBalances, isLoading: isBalancesLoading } = useQuery({
    queryKey: ['timeOffBalances', employeeId],
    queryFn: () => fetchTimeOffBalances(employeeId),
  });

  const { data: leaveRequests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ['timeOffRequests', { employeeId }],
    queryFn: () => fetchTimeOffRequests({ employeeId }),
  });

  // Check-In / Check-Out Mutations
  const checkInMutation = useMutation({
    mutationFn: () => checkInApi(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkOutApi(todayRecord?.id, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
    },
  });

  // Submit Time Off Mutation
  const timeOffMutation = useMutation({
    mutationFn: (formData) =>
      createTimeOffRequest({
        ...formData,
        employeeId,
        employeeName: `${matchedEmployee.firstName} ${matchedEmployee.lastName}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOffRequests']);
      queryClient.invalidateQueries(['timeOffBalances']);
      setIsTimeOffModalOpen(false);
      setTimeOffForm({
        leaveType: 'PAID_TIME_OFF',
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        days: 3,
        reason: '',
      });
    },
  });

  const handleTimeOffSubmit = (e) => {
    e.preventDefault();
    timeOffMutation.mutate(timeOffForm);
  };

  // Calculated attendance stats
  const completedLogs = attendanceLogs.filter((l) => l.workedHours !== null && l.workedHours !== undefined);
  const totalHoursWorked = completedLogs.reduce((acc, curr) => acc + Number(curr.workedHours || 0), 0);
  const presentDaysCount = attendanceLogs.filter((l) => l.status === 'PRESENT' || l.status === 'CORRECTED').length;

  const isLoading = isEmployeesLoading && isAttendanceLoading && isBalancesLoading;

  if (isLoading) {
    return <LoadingState message="Loading your employee workspace..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Greeting */}
      {/* Top Header with Upper-Right Corner Check-In / Check-Out Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {matchedEmployee?.firstName || 'Employee'}!
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personal employment details, live attendance records, and leave allocations
          </p>
        </div>

        {/* Upper Right Corner Attendance Terminal Controls */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">
              {isCheckedIn ? 'Checked In' : 'Checked Out'}
            </span>
          </div>

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
            icon={LogOut}
            disabled={!isCheckedIn}
            isLoading={checkOutMutation.isPending}
            onClick={() => checkOutMutation.mutate()}
          >
            Check Out
          </Button>
        </div>
      </div>

      {/* 1. EMPLOYEE PROFILE & DETAILS */}
      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center border-2 border-emerald-400/40 shadow-lg shrink-0">
                {matchedEmployee?.firstName?.[0]}
                {matchedEmployee?.lastName?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    {matchedEmployee?.firstName} {matchedEmployee?.lastName}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isCheckedIn
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-700/80 text-slate-300 border border-slate-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCheckedIn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {isCheckedIn ? 'ACTIVE (ON DUTY)' : 'INACTIVE (CHECKED OUT)'}
                  </span>
                </div>
                <p className="text-xs text-emerald-300 font-medium mt-0.5">
                  {matchedEmployee?.jobTitle} • {matchedEmployee?.department}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Employee Code: {matchedEmployee?.employeeCode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-white/10 backdrop-blur px-3.5 py-2 rounded-xl border border-white/10 text-right">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-semibold">
                  Working Schedule
                </span>
                <span className="text-xs font-semibold text-white">
                  {matchedEmployee?.scheduleName || 'Standard Full-Time (40h)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            Employment & Contract Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500" /> Work Email
              </span>
              <p className="font-semibold text-slate-800 truncate">{matchedEmployee?.email}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" /> Department
              </span>
              <p className="font-semibold text-slate-800">{matchedEmployee?.department}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-500" /> Employment Type
              </span>
              <p className="font-semibold text-slate-800">{matchedEmployee?.employmentType}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" /> Hire Date
              </span>
              <p className="font-semibold text-slate-800">
                {matchedEmployee?.hireDate ? formatDate(matchedEmployee.hireDate) : 'January 15, 2023'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-slate-500" /> Job Position
              </span>
              <p className="font-semibold text-slate-800">{matchedEmployee?.jobTitle}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <FileSignature className="w-3 h-3 text-slate-500" /> Active Contract
              </span>
              <p className="font-semibold text-slate-800 font-mono">
                {contractInfo?.contractCode || 'CNT-2024-001'} ({contractInfo?.status || 'ACTIVE'})
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Shift Hours
              </span>
              <p className="font-semibold text-slate-800">Mon - Fri • 09:00 - 17:30</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" /> Contact Phone
              </span>
              <p className="font-semibold text-slate-800">{matchedEmployee?.phone || '+1 (555) 019-2834'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. ATTENDANCE TERMINAL & RECENT RECORDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Card */}
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border-0 shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                Attendance Terminal
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isCheckedIn ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isCheckedIn ? '● Checked In' : '○ Checked Out'}
              </span>
            </div>

            <div>
              <h4 className="text-xl font-bold tracking-tight">
                {isCheckedIn ? 'Currently on Shift' : 'Off-Duty / Ready to Clock In'}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {isCheckedIn && todayRecord?.checkIn && (
              <div className="p-3 bg-white/10 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Clocked In At:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Scheduled Shift:</span>
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

        {/* Attendance Summary KPIs */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Days Present</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {presentDaysCount} <span className="text-xs font-medium text-slate-500">Days</span>
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Recorded in current cycle
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Worked Hours</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {totalHoursWorked.toFixed(1)} <span className="text-xs font-medium text-slate-500">hrs</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Calculated from verified check-outs</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Attendance History Snippet */}
          <Card className="sm:col-span-2">
            <CardHeader
              title="Recent Attendance History"
              subtitle="Your latest daily check-ins and verified worked hours"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => navigate('/attendance')}
                >
                  View All
                </Button>
              }
            />
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Worked Hours</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceLogs.slice(0, 3).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-semibold text-slate-800">{formatDate(log.date)}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">
                        {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">
                        {log.checkOut ? (
                          new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-emerald-600 font-semibold">In Progress</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-slate-900">
                        {log.workedHours !== null ? `${log.workedHours}h` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge status={log.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. TIME OFF & LEAVE BALANCES */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Time Off & Leave Balances</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time balance breakdown across leave categories and recent request tracking
          </p>
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
              <span data-testid="emp-pto-available" className="text-3xl font-extrabold text-slate-900">
                {leaveBalances?.pto?.available ?? 16.0}
              </span>
              <span className="text-xs font-medium text-slate-500">days available</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((leaveBalances?.pto?.available ?? 16.0) / (leaveBalances?.pto?.total || 20)) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {leaveBalances?.pto?.consumed ?? 4.0} days used out of {leaveBalances?.pto?.total ?? 20} total
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
              <span data-testid="emp-sick-available" className="text-3xl font-extrabold text-slate-900">
                {leaveBalances?.sick?.available ?? 9.0}
              </span>
              <span className="text-xs font-medium text-slate-500">days available</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((leaveBalances?.sick?.available ?? 9.0) / (leaveBalances?.sick?.total || 10)) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {leaveBalances?.sick?.consumed ?? 1.0} days used out of {leaveBalances?.sick?.total ?? 10} total
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
                {leaveBalances?.unpaid?.consumed ?? 0}
              </span>
              <span className="text-xs font-medium text-slate-500">days taken</span>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Available for unpaid leaves with manager approval.
            </p>
          </Card>
        </div>

        {/* Recent Leave Requests Table */}
        <Card>
          <CardHeader
            title="My Time-Off Requests"
            subtitle="Recent leave applications and approval statuses"
            action={
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/time-off')}
              >
                View Full Leave Calendar
              </Button>
            }
          />
          <CardContent className="p-0">
            {leaveRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No time-off requests filed yet. Click "Request Time Off" above to submit a request.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.slice(0, 4).map((req) => {
                    const reqId = req._id || req.id;
                    const typeName = req.leaveTypeName || (typeof req.typeId === 'object' ? req.typeId?.name : req.leaveType) || 'Time Off';
                    const durationDays = req.duration ?? req.days ?? 1;

                    return (
                      <TableRow key={reqId}>
                        <TableCell className="font-semibold text-slate-800 text-xs">
                          {typeName}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {formatDate(req.startDate)} {req.startDate !== req.endDate ? `– ${formatDate(req.endDate)}` : ''}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 font-mono text-xs">
                          {durationDays} {durationDays === 1 ? 'day' : 'days'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                          {req.reason || req.description || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge status={req.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Time Off Modal */}
      {isTimeOffModalOpen && (
        <Modal
          isOpen={isTimeOffModalOpen}
          onClose={() => setIsTimeOffModalOpen(false)}
          title="Submit Time-Off Request"
          description="Select leave bucket and dates to submit for manager review"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleTimeOffSubmit} className="space-y-4">
            <Select
              label="Leave Type"
              value={timeOffForm.leaveType}
              onChange={(e) => setTimeOffForm({ ...timeOffForm, leaveType: e.target.value })}
            >
              <option value="PAID_TIME_OFF">Paid Time Off (PTO)</option>
              <option value="SICK_LEAVE">Sick Leave</option>
              <option value="UNPAID_LEAVE">Unpaid Leave</option>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                value={timeOffForm.startDate}
                onChange={(e) => setTimeOffForm({ ...timeOffForm, startDate: e.target.value })}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={timeOffForm.endDate}
                onChange={(e) => setTimeOffForm({ ...timeOffForm, endDate: e.target.value })}
                required
              />
            </div>

            <Input
              label="Number of Days"
              type="number"
              min="0.5"
              step="0.5"
              value={timeOffForm.days}
              onChange={(e) => setTimeOffForm({ ...timeOffForm, days: Number(e.target.value) })}
              required
            />

            <Input
              label="Reason / Notes"
              placeholder="e.g. Annual summer vacation or medical appointment"
              value={timeOffForm.reason}
              onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
              required
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsTimeOffModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={timeOffMutation.isPending}
              >
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
