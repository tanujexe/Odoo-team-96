import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, createEmployee, updateEmployee, fetchEmployeeById } from '../../lib/api/employees';
import { fetchContracts } from '../../lib/api/contracts';
import { fetchSchedules } from '../../lib/api/schedules';
import { fetchSalaryStructures } from '../../lib/api/payroll';
import { createUserApi } from '../../lib/api/users';
import { mockDepartments } from '../../lib/api/mockData';
import { useAuth, ROLES } from '../../app/auth/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { Pagination } from '../../components/ui/Pagination';
import { cn } from '../../lib/utils';
import {
  UserPlus,
  Filter,
  Search,
  LayoutGrid,
  List,
  Mail,
  FileSignature,
  Clock,
  CalendarDays,
  ChevronRight,
  UserCheck,
  Sparkles,
  Edit3,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle,
  Bell,
  Settings,
  Plus,
  MoreVertical,
  Lightbulb,
  Pencil,
  ChevronDown,
  MapPin,
  Phone,
} from 'lucide-react';

const getNextEmployeeCode = (employeeList = []) => {
  let maxNum = 0;
  employeeList.forEach((emp) => {
    const code = emp.employeeCode || emp.id || '';
    const match = code.match(/EMP[^\d]*(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  return `EMP-${String(maxNum + 1).padStart(3, '0')}`;
};

const getNextContractCode = (contractList = []) => {
  const year = new Date().getFullYear();
  let maxNum = 42;
  (contractList || []).forEach((c) => {
    const code = c.contractCode || c.code || '';
    const match = code.match(/\d+/g);
    if (match) {
      const lastNum = parseInt(match[match.length - 1], 10);
      if (!isNaN(lastNum) && lastNum > maxNum) maxNum = lastNum;
    }
  });
  return `CON/${year}/${String(maxNum + 1).padStart(4, '0')}`;
};

const getAvatarStyle = (index, name = '') => {
  const styles = [
    'bg-blue-100 text-blue-800 border-blue-200/60',
    'bg-purple-100 text-purple-800 border-purple-200/60',
    'bg-amber-100 text-amber-800 border-amber-200/60',
    'bg-emerald-100 text-emerald-800 border-emerald-200/60',
    'bg-orange-100 text-orange-800 border-orange-200/60',
    'bg-cyan-100 text-cyan-800 border-cyan-200/60',
    'bg-rose-100 text-rose-800 border-rose-200/60',
  ];
  let charCode = 0;
  for (let i = 0; i < name.length; i++) charCode += name.charCodeAt(i);
  return styles[charCode % styles.length] || styles[index % styles.length];
};

const getDeptBadgeStyle = (deptName = '') => {
  const lower = (deptName || '').toLowerCase();
  if (lower.includes('finance')) return 'bg-blue-50 text-blue-700 border-blue-200/80';
  if (lower.includes('hr') || lower.includes('human')) return 'bg-pink-50 text-pink-700 border-pink-200/80';
  if (lower.includes('eng') || lower.includes('dev') || lower.includes('tech')) return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  if (lower.includes('op') || lower.includes('service')) return 'bg-amber-50 text-amber-700 border-amber-200/80';
  return 'bg-stone-100 text-slate-700 border-stone-200';
};

export default function EmployeesFeature() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const canManageEmployees = [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER].includes(role);

  const [viewMode, setViewMode] = useState('kanban');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);
  const [activeDetailTab, setActiveDetailTab] = useState('work');

  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employeeCode: '',
    jobTitle: '',
    department: 'Engineering',
    departmentId: 'dept-eng',
    workingSchedule: '40 Hours / Week',
    wage: 85000,
    startDate: '2026-01-01',
    endDate: '',
    notes: 'This running contract is the source for payroll calculation in the active period.',
    contractCode: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    personalEmail: '',
    emergencyContact: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', { search, departmentId: selectedDept, status: selectedStatus }],
    queryFn: () => fetchEmployees({ search, departmentId: selectedDept, status: selectedStatus }),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: fetchSchedules,
  });

  const { data: salaryStructures = [] } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: fetchSalaryStructures,
  });

  const isEmployeeRole = role === ROLES.EMPLOYEE;
  const currentEmpId = user?.employeeId;

  const visibleEmployees = isEmployeeRole
    ? employees.filter(
        (e) =>
          (currentEmpId && (e.id === currentEmpId || e._id === currentEmpId)) ||
          (user?.email && e.email?.toLowerCase() === user.email.toLowerCase()) ||
          (user?.employeeCode && e.employeeCode === user.employeeCode)
      )
    : employees;

  const finalEmployeesList =
    isEmployeeRole && visibleEmployees.length === 0
      ? [
          {
            id: currentEmpId || 'emp-self',
            firstName: user?.name ? user.name.split(' ')[0] : 'My',
            lastName: user?.name ? user.name.split(' ').slice(1).join(' ') || 'Profile' : 'Profile',
            name: user?.name || 'My Employee Profile',
            email: user?.email || 'employee@company.com',
            employeeCode: user?.employeeCode || 'EMP-SELF',
            jobTitle: 'Team Member',
            department: 'General',
            status: 'ACTIVE',
          },
        ]
      : visibleEmployees;

  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['employeeDetail', selectedEmployeeId],
    queryFn: () => fetchEmployeeById(selectedEmployeeId),
    enabled: !!selectedEmployeeId,
  });

  const selectedEmployee = selectedEmployeeId
    ? finalEmployeesList.find((emp) => (emp.id || emp._id) === selectedEmployeeId) || detailData?.employee || detailData || {}
    : {};

  const employeeDetail = detailData?.employee || detailData || selectedEmployee;

  const handleOpenCreateModal = () => {
    const nextCode = getNextEmployeeCode(employees);
    const nextContractCode = getNextContractCode(contracts);
    setFormData({
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      employeeCode: nextCode,
      jobTitle: 'Software Engineer',
      department: mockDepartments[0]?.name || 'Engineering',
      departmentId: mockDepartments[0]?.id || 'dept-eng',
      workingSchedule: '40 Hours / Week',
      wage: 85000,
      startDate: '2026-01-01',
      endDate: '',
      notes: 'This running contract is the source for payroll calculation in the active period.',
      contractCode: nextContractCode,
      bankName: '',
      accountNumber: '',
      ifscCode: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    const target = emp || detailData?.employee || detailData || selectedEmployee;
    if (!target) return;
    setEditSuccessMsg('');
    setEditFormData({
      name: target.name || `${target.firstName || ''} ${target.lastName || ''}`.trim(),
      phone: target.phone || '',
      personalEmail: target.personalEmail || target.email || '',
      emergencyContact: target.emergencyContact || '',
      bankName: target.bankDetails?.bankName || '',
      accountNumber: target.bankDetails?.accountNumber || '',
      ifscCode: target.bankDetails?.ifscCode || '',
    });
    setIsEditModalOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['employeeDetail', selectedEmployeeId]);
      setEditSuccessMsg('Details updated successfully!');
      setTimeout(() => {
        setEditSuccessMsg('');
        setIsEditModalOpen(false);
      }, 700);
    },
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const empId = selectedEmployeeId || detailData?.employee?._id || detailData?.employee?.id || selectedEmployee?.id || selectedEmployee?._id;
    if (!empId) return;
    updateMutation.mutate({
      id: empId,
      data: {
        name: editFormData.name,
        phone: editFormData.phone,
        personalEmail: editFormData.personalEmail,
        emergencyContact: editFormData.emergencyContact,
        bankDetails: {
          bankName: editFormData.bankName,
          accountNumber: editFormData.accountNumber,
          ifscCode: editFormData.ifscCode,
        },
      },
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const fullName = (data.name || `${data.firstName || ''} ${data.lastName || ''}`).trim() || 'New Employee';
      return createEmployee({
        ...data,
        name: fullName,
        bankDetails: {
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['contracts']);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        employeeCode: '',
        jobTitle: '',
        department: 'Engineering',
        departmentId: 'dept-eng',
        workingSchedule: '40 Hours / Week',
        wage: 85000,
        startDate: '2026-01-01',
        endDate: '',
        notes: '',
        contractCode: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
      });
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const tabButtons = [
    { id: 'work', label: 'Work Information' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'timeoff', label: 'Time Off' },
    { id: 'payroll', label: 'Payroll & Payslips' },
  ];

  const renderTabContent = () => {
    const emp = employeeDetail || selectedEmployee || {};
    switch (activeDetailTab) {
      case 'work':
        return (
          <div className="grid grid-cols-2 gap-4 text-xs py-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Work Email</span>
              <p className="font-mono font-bold text-slate-900 text-sm">{emp.email || 'employee@company.com'}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Code</span>
              <p className="font-mono font-bold text-slate-900 text-sm">{emp.employeeCode || 'EMP-001'}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Department & Position</span>
              <p className="font-bold text-slate-800 text-sm">{emp.department || 'Engineering'} • {emp.jobTitle || 'Staff'}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Employment Status</span>
              <span className="inline-block font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">Active Staff</span>
            </div>
          </div>
        );
      case 'contracts':
        return (
          <div className="space-y-3 py-2">
            {(() => {
              const empCode = emp.employeeCode || emp.id;
              const empContracts = contracts.filter((c) => c.employeeId === selectedEmployeeId || c.employeeCode === empCode);
              if (empContracts.length === 0) {
                return (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Primary Active Contract</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">Running</span>
                    </div>
                    <p className="text-slate-500">Wage: ₹85,000 / month • Working Schedule: 40 Hours / Week</p>
                    <p className="text-slate-400 text-[11px]">Start Date: 2026-01-01 • End Date: Indefinite</p>
                  </div>
                );
              }
              return empContracts.map((c) => (
                <div key={c.id || c._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Contract Reference: {c.contractCode || c.code || 'CON/2026/0042'}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] uppercase font-bold">
                      {c.status || 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-medium">
                    <p><span className="text-slate-400">Monthly Wage:</span> <strong className="text-slate-900 font-mono">₹{Number(c.wage || 85000).toLocaleString('en-IN')}</strong></p>
                    <p><span className="text-slate-400">Schedule:</span> <strong>{c.workingSchedule || '40 Hours / Week'}</strong></p>
                    <p><span className="text-slate-400">Start Date:</span> <strong>{c.startDate ? String(c.startDate).slice(0, 10) : '2026-01-01'}</strong></p>
                    <p><span className="text-slate-400">End Date:</span> <strong>{c.endDate ? String(c.endDate).slice(0, 10) : '— (Open-ended)'}</strong></p>
                  </div>
                </div>
              ));
            })()}
          </div>
        );
      case 'attendance':
        return (
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">Duty Status</span>
                <span className="text-sm font-extrabold text-emerald-900">ON DUTY</span>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-blue-600 uppercase block">Attendance Rate</span>
                <span className="text-sm font-extrabold text-blue-900">98.5%</span>
              </div>
              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-purple-600 uppercase block">Weekly Shift</span>
                <span className="text-sm font-extrabold text-purple-900">40 Hours</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-900 block">Today's Check-In Telemetry</span>
              <p className="text-slate-600 mt-1">Standard shift 09:00 AM – 06:00 PM • Automatic biometric verification active.</p>
            </div>
          </div>
        );
      case 'timeoff':
        return (
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">Paid Time Off</span>
                  <span className="text-lg font-extrabold text-emerald-900">14 Days</span>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">20 Total</span>
              </div>
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase block">Sick Leave</span>
                  <span className="text-lg font-extrabold text-blue-900">8 Days</span>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">10 Total</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200" >
              <span className="font-bold text-slate-900 block mb-1">Recent Time Off Requests</span>
              <p className="text-slate-500 italic">No pending leave requests awaiting approval for this employee.</p>
            </div>
          </div>
        );
      case 'payroll':
      default:
        return (
          <div className="space-y-3 py-2 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Monthly Payroll Record</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">Computed</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                <div><span className="text-slate-400 text-[10px] block">GROSS WAGE</span><strong className="text-slate-900 text-sm">₹85,000</strong></div>
                <div><span className="text-slate-400 text-[10px] block">DEDUCTIONS</span><strong className="text-rose-600 text-sm">₹17,000</strong></div>
                <div><span className="text-slate-400 text-[10px] block">NET PAYABLE</span><strong className="text-emerald-700 text-sm">₹68,000</strong></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Employees</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {finalEmployeesList.length} Active Staff
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1">List view for sort, filter and bulk scanning • Employee Directory & Workspace</p>
        </div>
        {/* Header buttons removed as requested */}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {canManageEmployees && (
            <button type="button" onClick={handleOpenCreateModal} className="bg-[#E0533C] hover:bg-[#CD442E] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New</span>
            </button>
          )}
          <div className="relative min-w-[260px] sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setEmpPage(1); }}
              className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00966B]/20 focus:border-[#00966B] transition-all"
            />
            <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">⌘K</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shrink-0">
            <button type="button" onClick={() => setViewMode('kanban')} className={cn('px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer', viewMode === 'kanban' ? 'bg-slate-900 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900')}>Kanban</button>
            <button type="button" onClick={() => setViewMode('list')} className={cn('px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer', viewMode === 'list' ? 'bg-slate-900 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900')}>List</button>
          </div>
          <button type="button" title="Filter options" className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:bg-stone-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"><Filter className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono shrink-0 mr-1">DEPARTMENT:</span>
        <button type="button" onClick={() => { setSelectedDept(''); setEmpPage(1); }} className={cn('px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border', selectedDept === '' ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>All ({employees.length})</button>
        <button type="button" onClick={() => { setSelectedDept(selectedDept === 'dept-fin' ? '' : 'dept-fin'); setEmpPage(1); }} className={cn('px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border', selectedDept === 'dept-fin' ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>Finance ({employees.filter((e) => (e.department || '').toLowerCase().includes('fin')).length})</button>
        <button type="button" onClick={() => { setSelectedDept(selectedDept === 'dept-hr' ? '' : 'dept-hr'); setEmpPage(1); }} className={cn('px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border', selectedDept === 'dept-hr' ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>HR & Admin ({employees.filter((e) => (e.department || '').toLowerCase().includes('hr') || (e.department || '').toLowerCase().includes('human')).length})</button>
        <button type="button" onClick={() => { setSelectedDept(selectedDept === 'dept-eng' ? '' : 'dept-eng'); setEmpPage(1); }} className={cn('px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border', selectedDept === 'dept-eng' ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>Engineering ({employees.filter((e) => (e.department || '').toLowerCase().includes('eng') || (e.department || '').toLowerCase().includes('dev')).length})</button>
        <button type="button" onClick={() => { setSelectedDept(selectedDept === 'dept-ops' ? '' : 'dept-ops'); setEmpPage(1); }} className={cn('px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border', selectedDept === 'dept-ops' ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>Operations ({employees.filter((e) => (e.department || '').toLowerCase().includes('op')).length})</button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading employee directory..." />
      ) : finalEmployeesList.length === 0 ? (
        <EmptyState title="No employees found" description="Try adjusting your search criteria or add a new employee profile." actionLabel="Add Employee" onAction={handleOpenCreateModal} />
      ) : viewMode === 'list' ? (
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 border-b border-slate-200/80">
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">EMPLOYEE</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">WORK EMAIL</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">JOB POSITION</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">DEPARTMENT</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">STATUS</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 tracking-wider text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalEmployeesList.slice((empPage - 1) * empPageSize, empPage * empPageSize).map((emp, idx) => {
                const empId = emp.id || emp._id || idx;
                const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                const initials = `${(emp.firstName?.[0] || emp.name?.[0] || 'E').toUpperCase()}${(emp.lastName?.[0] || (emp.name?.trim().split(/\s+/)?.[1]?.[0]) || '').toUpperCase()}`;
                const workEmail = emp.email || `${name.toLowerCase().replace(/\s+/g, '.')}@oxp.com`;
                const empCode = emp.employeeCode || `EMP-${1000 + idx}`;
                return (
                  <TableRow key={empId} isSelected={selectedEmployeeId === empId} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">

                        <div className={cn('w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs', getAvatarStyle(idx, name))}>{initials}</div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight hover:text-[#E0533C] transition-colors cursor-pointer" onClick={() => setSelectedEmployeeId(empId)}>{name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{empCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-mono">{workEmail}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-800">{emp.jobTitle || 'Staff Member'}</TableCell>
                    <TableCell><span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100/80 text-slate-700 border border-slate-200/50">{emp.department || 'Engineering'}</span></TableCell>
                    <TableCell><span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => setSelectedEmployeeId(empId)} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 transition-colors cursor-pointer">Workspace</button>
                        <button type="button" onClick={() => setSelectedEmployeeId(empId)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination currentPage={empPage} totalRecords={finalEmployeesList.length} pageSize={empPageSize} onPageChange={(p) => setEmpPage(p)} onPageSizeChange={(s) => { setEmpPageSize(s); setEmpPage(1); }} />
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {finalEmployeesList.slice((empPage - 1) * empPageSize, empPage * empPageSize).map((emp, idx) => {
              const empId = emp.id || emp._id || `emp-${idx}`;
              const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
              const initials = `${(emp.firstName?.[0] || emp.name?.[0] || 'E').toUpperCase()}${(emp.lastName?.[0] || (emp.name?.trim().split(/\s+/)?.[1]?.[0]) || '').toUpperCase()}`;
              const empContracts = contracts.filter((c) => c.employeeId === empId || c.employee === empId || c.employeeCode === emp.employeeCode);
              const contractsCount = empContracts.length > 0 ? empContracts.length : (idx % 2 === 0 ? 2 : 1);
              const attendanceRate = idx % 3 === 0 ? '100%' : idx % 2 === 0 ? '98.2%' : '96.5%';
              const leaveBal = idx % 3 === 0 ? '14 Days' : idx % 2 === 0 ? '8 Days' : '12 Days';

              return (
                <div key={empId} onClick={() => setSelectedEmployeeId(empId)} className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-stone-300 transition-all cursor-pointer group relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-12 h-12 rounded-full font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs', getAvatarStyle(idx, name))}>{initials}</div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-[#E0533C] transition-colors">{name}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{emp.jobTitle || 'Staff Member'}</p>
                        </div>
                      </div>
                      <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0', getDeptBadgeStyle(emp.department))}>{emp.department || 'Engineering'}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-stone-100 text-center my-3 bg-stone-50/50 rounded-xl">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contracts</span>
                        <span className="text-xs font-extrabold text-slate-800">{contractsCount} Active</span>
                      </div>
                      <div className="border-x border-stone-200/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Attendance</span>
                        <span className="text-xs font-extrabold text-emerald-600">{attendanceRate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">PTO Bal</span>
                        <span className="text-xs font-extrabold text-blue-600">{leaveBal}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate font-mono text-[11px]">{emp.email || `${name.toLowerCase().replace(/\s+/g, '.')}@oxp.com`}</span></div>
                      <div className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="font-mono text-[11px]">{emp.employeeCode || `EMP-${1000 + idx}`}</span></div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium group-hover:text-slate-600 transition-colors flex items-center gap-1">View Profile <ChevronRight className="w-3.5 h-3.5" /></span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedEmployeeId(empId); }} className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold transition-colors">Workspace</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6"><Pagination currentPage={empPage} totalRecords={finalEmployeesList.length} pageSize={empPageSize} onPageChange={(p) => setEmpPage(p)} onPageSizeChange={(s) => { setEmpPageSize(s); setEmpPage(1); }} /></div>
        </div>
      )}

      {selectedEmployeeId && (
        <Modal isOpen={!!selectedEmployeeId} onClose={() => setSelectedEmployeeId(null)} title="Employee Workspace" description="Main employee form with related HR actions" maxWidth="max-w-4xl">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{employeeDetail?.name || `${employeeDetail?.firstName || ''} ${employeeDetail?.lastName || ''}`.trim() || 'Employee Workspace'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{employeeDetail?.jobTitle || 'Staff Member'} • {employeeDetail?.department || 'Engineering'} • {employeeDetail?.employeeCode || 'EMP-001'}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">Active</span>
            </div>

            <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold text-slate-500 pb-1 overflow-x-auto scrollbar-none">
              {tabButtons.map((t) => (
                <button key={t.id} type="button" onClick={() => setActiveDetailTab(t.id)} className={cn('pb-2 transition-all cursor-pointer whitespace-nowrap', activeDetailTab === t.id ? 'text-slate-900 border-b-2 border-[#E0533C] font-extrabold' : 'hover:text-slate-700')}>{t.label}</button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/90 rounded-xl border border-slate-200">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                  {(employeeDetail?.firstName?.[0] || employeeDetail?.name?.[0] || 'E').toUpperCase()}
                  {(employeeDetail?.lastName?.[0] || (employeeDetail?.name?.trim().split(/\s+/)?.[1]?.[0]) || '').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 truncate">{employeeDetail?.name || `${employeeDetail?.firstName || ''} ${employeeDetail?.lastName || ''}`.trim() || 'Employee'}</h3>
                    <Badge status={employeeDetail?.status} />
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{employeeDetail?.jobTitle || 'Staff'} • {employeeDetail?.department || 'General'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{employeeDetail?.email || 'employee@company.com'}</span>
                    <span>•</span>
                    <span>{employeeDetail?.phone || 'No phone set'}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-emerald-700">{employeeDetail?.employeeCode || 'EMP-001'}</span>
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" icon={Edit3} onClick={() => handleOpenEditModal(employeeDetail)} className="border-slate-300 hover:bg-slate-100 text-xs font-semibold shrink-0">Edit Profile & Bank Info</Button>
            </div>

            {renderTabContent()}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedEmployeeId(null)}>Close Workspace</Button>
            </div>
          </div>
        </Modal>
      )}

      {isCreateModalOpen && (
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="New Employee Account & Contract Setup" description="Provision employee credentials and generate initial running contract." maxWidth="max-w-2xl">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="e.g. house"
                value={formData.firstName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    firstName: val,
                    name: `${val} ${prev.lastName || ''}`.trim(),
                  }));
                }}
                required
              />
              <Input
                label="Last Name (Optional)"
                placeholder="e.g. Vance"
                value={formData.lastName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    lastName: val,
                    name: `${prev.firstName || ''} ${val}`.trim(),
                  }));
                }}
              />
              <Input
                label="Work Email"
                type="email"
                placeholder="employee@company.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <Input
                label="Initial Password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Employee ID / Code</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.employeeCode} onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })} placeholder="e.g. EMP-005" className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" required />
                  <button type="button" onClick={() => setFormData((prev) => ({ ...prev, employeeCode: getNextEmployeeCode(employees) }))} title="Auto-generate sequential next ID" className="px-3 py-2 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"><Sparkles className="w-3.5 h-3.5 text-emerald-600" />Auto-Generate</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Job Position (Optional)</label>
                  <input type="text" placeholder="e.g. Software Engineer" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Department (Optional)</label>
                  <select value={formData.departmentId} onChange={(e) => { const d = mockDepartments.find((x) => x.id === e.target.value); setFormData({ ...formData, departmentId: e.target.value, department: d ? d.name : 'Engineering' }); }} className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
                    <option value="">-- Select Department --</option>
                    {mockDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2"><FileSignature className="w-4 h-4 text-emerald-700" /><span>Section 2: Employment Contract Setup</span></div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">Auto-Linked</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contract Reference / Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.contractCode} onChange={(e) => setFormData({ ...formData, contractCode: e.target.value })} placeholder="e.g. CON/2026/0043" className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" required />
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, contractCode: getNextContractCode(contracts) }))} title="Auto-generate next unique contract code" className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"><Sparkles className="w-3.5 h-3.5" />Auto-Generate</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Base Wage / Month (₹)" type="number" placeholder="85000" value={formData.wage} onChange={(e) => setFormData({ ...formData, wage: e.target.value })} required />
                  <Select label="Working Schedule (Database)" value={formData.workingSchedule || (schedules[0]?.name || '40 Hours / Week')} onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}>
                    {schedules.map((sch) => <option key={sch.id || sch._id} value={sch.name}>{sch.name} ({sch.hoursPerWeek || '40h'})</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select label="Salary Structure (Database)" value={formData.salaryStructureId || (salaryStructures[0]?.id || '')} onChange={(e) => { const matchedStr = salaryStructures.find((s) => (s.id || s._id) === e.target.value); setFormData({ ...formData, salaryStructureId: e.target.value, salaryStructureName: matchedStr?.name || 'Employee Salary' }); }}>
                    {salaryStructures.map((str) => <option key={str.id || str._id} value={str.id || str._id}>{str.name} ({str.code})</option>)}
                  </Select>
                  <Input label="Contract Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Contract End Date (Optional)" type="date" value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contract Notes / Terms</label>
                    <input type="text" placeholder="Notes regarding contract terms..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/80 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-700" /><span>Section 3: Bank Account & Payout Settlement Details</span></div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">Direct Deposit</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Bank Name" placeholder="e.g. HDFC Bank, Chase" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} />
                <Input label="Account Number" placeholder="e.g. 501004928172" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} />
                <Input label="IFSC / Routing Code" placeholder="e.g. HDFC0001234" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>Create Employee & Contract Account</Button>
            </div>
          </form>
        </Modal>
      )}

      {isEditModalOpen && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Profile & Bank Settlement Details" description="Edit personal contact info and bank account details for payroll direct deposit" maxWidth="max-w-xl">
          <form onSubmit={handleEditSubmit} className="space-y-5">
            {editSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Personal Contact Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Full Name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />
                <Input label="Phone Number" placeholder="e.g. +91 98765 43210" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Personal Email" type="email" placeholder="personal@gmail.com" value={editFormData.personalEmail} onChange={(e) => setEditFormData({ ...editFormData, personalEmail: e.target.value })} />
                <Input label="Emergency Contact" placeholder="e.g. +1 555-019-9988 (Family)" value={editFormData.emergencyContact} onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })} />
              </div>
            </div>

            <div className="space-y-3 p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-700" /><span>Bank Account for Payroll & Payouts</span></div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">Settlement</span>
              </div>
              <div className="space-y-3">
                <Input label="Bank Name" placeholder="e.g. HDFC Bank, Chase, State Bank of India" value={editFormData.bankName} onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Bank Account Number" placeholder="e.g. 5010049281729" value={editFormData.accountNumber} onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })} required />
                  <Input label="IFSC / Branch Routing Code" placeholder="e.g. HDFC0001234" value={editFormData.ifscCode} onChange={(e) => setEditFormData({ ...editFormData, ifscCode: e.target.value })} />
                </div>
              </div>
              <p className="text-[11px] text-blue-700 bg-blue-100/50 p-2.5 rounded-lg border border-blue-200/60">💡 <strong>Payroll Tip:</strong> Providing a valid bank account number resolves the <code>[MISSING_BANK_DETAILS]</code> informational warning in payroll batches.</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" isLoading={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5">Save Bank & Profile Details</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
