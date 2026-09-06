import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, createEmployee, updateEmployee, fetchEmployeeById } from '../../lib/api/employees';
import { isEmployeeCheckedIn } from '../../lib/api/attendance';
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
} from 'lucide-react';

// Helper function to calculate next Employee ID from list of employees
const getNextEmployeeCode = (employeeList = []) => {
  let maxNum = 0;
  employeeList.forEach((emp) => {
    const code = emp.employeeCode || emp.id || '';
    const match = code.match(/EMP[^\d]*(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `EMP-${String(nextNum).padStart(3, '0')}`;
};

// Helper function to calculate next Contract Code from list of contracts
const getNextContractCode = (contractList = []) => {
  const year = new Date().getFullYear();
  let maxNum = 42;
  (contractList || []).forEach((c) => {
    const code = c.contractCode || c.code || '';
    const match = code.match(/\d+/g);
    if (match) {
      const lastNum = parseInt(match[match.length - 1], 10);
      if (!isNaN(lastNum) && lastNum > maxNum) {
        maxNum = lastNum;
      }
    }
  });
  const nextSeq = maxNum + 1;
  return `CON/${year}/${String(nextSeq).padStart(4, '0')}`;
};

export default function EmployeesFeature() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const canManageEmployees = [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER].includes(role);

  const [viewMode, setViewMode] = useState('kanban'); // Default view: 'kanban' | 'list'
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  const [activeDetailTab, setActiveDetailTab] = useState('work');

  // Create Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employeeCode: '',
    jobTitle: '',
    department: 'Engineering',
    departmentId: 'dept-eng',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    contractCode: '',
    wage: 85000,
    workingSchedule: '40 Hours / Week',
    startDate: '2026-01-01',
    endDate: '',
    contractStatus: 'ACTIVE',
    notes: 'This running contract is the source for payroll calculation in the active period.',
  });

  // Edit Profile & Bank Details State
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
    queryFn: () => fetchContracts(),
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
        (user?.employeeCode && e.employeeCode === user.employeeCode) ||
        (user?.name && e.name?.toLowerCase() === user.name.toLowerCase())
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

  const handleOpenCreateModal = () => {
    const nextCode = getNextEmployeeCode(employees);
    const nextContractCode = getNextContractCode(contracts);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      employeeCode: nextCode,
      jobTitle: 'Software Engineer',
      department: mockDepartments[0]?.name || 'Engineering',
      departmentId: mockDepartments[0]?.id || 'dept-eng',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      contractCode: nextContractCode,
      wage: 85000,
      workingSchedule: '40 Hours / Week',
      startDate: '2026-01-01',
      endDate: '',
      contractStatus: 'ACTIVE',
      notes: 'This running contract is the source for payroll calculation in the active period.',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    const target = emp || detailData?.employee;
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
    mutationFn: async ({ id, data }) => {
      return updateEmployee(id, data);
    },
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
    const empId = selectedEmployeeId || detailData?.employee?._id || detailData?.employee?.id;
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
      try {
        await createUserApi({
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'New Employee',
          email: data.email,
          password: data.password,
          role: ROLES.EMPLOYEE,
          employeeCode: data.employeeCode,
          jobPosition: data.jobTitle,
          departmentId: data.departmentId,
          contractCode: data.contractCode,
          wage: data.wage,
          workingSchedule: data.workingSchedule,
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes,
        });
      } catch (err) {
        console.warn('[Employees] createUserApi fallback:', err);
      }
      return createEmployee({
        ...data,
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
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        employeeCode: '',
        jobTitle: '',
        department: 'Engineering',
        departmentId: 'dept-eng',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        contractCode: '',
        wage: 85000,
        workingSchedule: '40 Hours / Week',
        startDate: '2026-01-01',
        endDate: '',
        contractStatus: 'ACTIVE',
        notes: '',
      });
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory & Workspace</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository for employee records, smart action links, and departmental hierarchy
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-200/80 rounded-lg p-0.5">
            <button
              aria-label="List view"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              aria-label="Kanban view"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          {canManageEmployees && (
            <Button variant="primary" size="sm" icon={UserPlus} onClick={handleOpenCreateModal}>
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name, code, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="">All Departments</option>
            {mockDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </Card>

      {/* Content Rendering */}
      {isLoading ? (
        <LoadingState message="Loading employee directory..." />
      ) : finalEmployeesList.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Try adjusting your search criteria or add a new employee profile."
          actionLabel="Add Employee"
          onAction={handleOpenCreateModal}
        />
      ) : viewMode === 'list' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Smart Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalEmployeesList.map((emp, idx) => (
                <TableRow key={emp.id || emp._id || idx} isSelected={selectedEmployeeId === (emp.id || emp._id)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {emp.firstName?.[0]}
                        {emp.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{emp.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-slate-700">{emp.employeeCode}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{emp.jobTitle}</TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-600">{emp.employmentType}</span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const active = isEmployeeCheckedIn(emp.id || emp._id, emp.employeeCode);
                      return (
                        <Badge status={active ? 'ACTIVE' : 'INACTIVE'}>
                          {active ? 'ACTIVE (ON DUTY)' : 'INACTIVE (OFF DUTY)'}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmployeeId(emp.id || emp._id)}
                    >
                      Workspace
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Kanban Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {finalEmployeesList.map((emp, idx) => {
            const active = isEmployeeCheckedIn(emp.id || emp._id, emp.employeeCode);
            return (
              <Card key={emp.id || emp._id || idx} className="hover:border-slate-300 transition-all hover:shadow-md">

                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                        {emp.firstName?.[0]}
                        {emp.lastName?.[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </h4>
                        <p className="text-xs text-slate-500">{emp.jobTitle}</p>
                      </div>
                    </div>
                    <Badge status={active ? 'ACTIVE' : 'INACTIVE'}>
                      {active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
                    <span className="font-medium text-slate-700">{emp.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Code</span>
                    <span className="font-mono font-medium text-slate-700">{emp.employeeCode}</span>
                  </div>
                </div>

                <Button
                  variant="subtle"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setSelectedEmployeeId(emp.id || emp._id)}
                >
                  Workspace
                </Button>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Employee Detail & Smart Actions Modal */}
      {selectedEmployeeId && (
        <Modal
          isOpen={!!selectedEmployeeId}
          onClose={() => setSelectedEmployeeId(null)}
          maxWidth="max-w-4xl"
        >
          {isDetailLoading || !detailData ? (
            <LoadingState message="Loading employee form..." />
          ) : (
            <div className="space-y-5">
              {/* Header row: Breadcrumb + Smart Action Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span>Employee</span>
                    <span>/</span>
                    <span className="font-bold text-slate-900">
                      {detailData.employee?.firstName} {detailData.employee?.lastName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Main employee form with related HR actions
                  </p>
                </div>

                {/* Smart Action Buttons (Time Off, Contracts, Attendance) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const empId = detailData?.employee?.id || detailData?.employee?._id;
                      setSelectedEmployeeId(null);
                      navigate(`/time-off?employeeId=${empId}`);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-all flex items-center gap-2 shadow-2xs"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Time Off</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {detailData?.smartCounts?.requests ?? detailData?.smartCounts?.timeOff ?? detailData?.smartCounts?.allocations ?? 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const empId = detailData?.employee?.id || detailData?.employee?._id;
                      setSelectedEmployeeId(null);
                      navigate(`/contracts?employeeId=${empId}`);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-all flex items-center gap-2 shadow-2xs"
                  >
                    <FileSignature className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Contracts</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {detailData?.smartCounts?.contracts ?? 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const empId = detailData?.employee?.id || detailData?.employee?._id;
                      setSelectedEmployeeId(null);
                      navigate(`/attendance?employeeId=${empId}`);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-all flex items-center gap-2 shadow-2xs"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attendance</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {detailData?.smartCounts?.attendance ?? 0}
                    </span>
                  </button>
                </div>
              </div>

              {/* Employee Profile Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/90 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                    {detailData.employee?.firstName?.[0]}
                    {detailData.employee?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 truncate">
                        {detailData.employee?.firstName} {detailData.employee?.lastName}
                      </h3>
                      <Badge status={detailData.employee?.status} />
                    </div>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {detailData.employee?.jobTitle || detailData.employee?.jobPosition || 'Staff'} • {detailData.employee?.department || 'General'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{detailData.employee?.email}</span>
                      <span>•</span>
                      <span>{detailData.employee?.phone || 'No phone set'}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-emerald-700">{detailData.employee?.employeeCode}</span>
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit3}
                  onClick={() => handleOpenEditModal(detailData.employee)}
                  className="border-slate-300 hover:bg-slate-100 text-xs font-semibold shrink-0"
                >
                  Edit Profile & Bank Info
                </Button>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-slate-200 flex gap-6 text-xs font-semibold text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('work')}
                  className={`pb-2.5 transition-all relative ${activeDetailTab === 'work'
                    ? 'text-emerald-700 font-bold border-b-2 border-emerald-600'
                    : 'hover:text-slate-900'
                    }`}
                >
                  Work Information
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('private')}
                  className={`pb-2.5 transition-all relative ${activeDetailTab === 'private'
                    ? 'text-emerald-700 font-bold border-b-2 border-emerald-600'
                    : 'hover:text-slate-900'
                    }`}
                >
                  Private Information
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('hr')}
                  className={`pb-2.5 transition-all relative ${activeDetailTab === 'hr'
                    ? 'text-emerald-700 font-bold border-b-2 border-emerald-600'
                    : 'hover:text-slate-900'
                    }`}
                >
                  HR Settings
                </button>
              </div>

              {/* Tab Contents */}
              {activeDetailTab === 'work' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.department || 'General'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Job Position</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.jobTitle || detailData.employee?.jobPosition || 'Staff'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Manager</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.manager || 'Sara Khan'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Location</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.workLocation || 'Mumbai / Headquarters'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Working Schedule</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.scheduleName || '40 Hours / Week'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                    <div className="pt-0.5">
                      <Badge status={detailData.employee?.status} />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.company || 'OXP Pvt Ltd'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Email</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.email}</p>
                  </div>
                </div>
              )}

              {activeDetailTab === 'private' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.phone || 'Not provided'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal Email</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.personalEmail || detailData.employee?.email}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Emergency Contact</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.emergencyContact || 'Not provided'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employment Type</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.employmentType || 'FULL_TIME'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date of Joining</span>
                    <p className="text-xs font-semibold text-slate-800">{detailData.employee?.hireDate || '2023-01-15'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bank Account & Settlement Details</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(detailData.employee)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit Bank Info
                      </button>
                    </div>
                    {detailData.employee?.bankDetails?.accountNumber ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Bank Name</span>
                          <span className="font-semibold text-slate-800">{detailData.employee?.bankDetails?.bankName || 'Standard Bank'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Account Number</span>
                          <span className="font-mono font-bold text-slate-900">{detailData.employee?.bankDetails?.accountNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">IFSC / Routing Code</span>
                          <span className="font-mono font-semibold text-slate-800">{detailData.employee?.bankDetails?.ifscCode || '—'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-800">Missing Bank Account Number</p>
                            <p className="text-[11px] text-amber-600">Add account details so payroll runs can transfer salary without warnings.</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(detailData.employee)}
                          className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-bold"
                        >
                          Add Details
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'hr' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee Code</span>
                    <p className="text-xs font-bold font-mono text-emerald-800">{detailData.employee?.employeeCode}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Contract ID</span>
                    <p className="text-xs font-semibold text-slate-800 font-mono">{detailData.employee?.activeContractId || 'cnt-001'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Working Schedule ID</span>
                    <p className="text-xs font-semibold text-slate-800 font-mono">{detailData.employee?.workingScheduleId || 'sch-1'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Role Permission</span>
                    <p className="text-xs font-semibold text-slate-800">EMPLOYEE</p>
                  </div>
                </div>
              )}

              {/* Footer Note */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span>Useful note: smart buttons should open related Contracts, Attendance and Time Off records filtered for the current employee.</span>
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Create Employee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Employee & Contract Account"
        description="Provision employee profile, login credentials, and initial employment contract setup"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {/* SECTION 1: EMPLOYEE PROFILE & USER ACCOUNT */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Section 1: Employee Profile & Login Account Setup</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="e.g. Marcus"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                placeholder="e.g. Vance"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Corporate Email"
                type="email"
                placeholder="marcus@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Employee ID / Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="e.g. EMP-005"
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        employeeCode: getNextEmployeeCode(employees),
                      }))
                    }
                    title="Auto-generate sequential next ID"
                    className="px-3 py-2 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-Generate
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                  <span>✓</span> Employee profile ID <code className="font-bold">{formData.employeeCode || 'EMP-xxx'}</code> will be linked in Employee Directory.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Job Position (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Department (Optional)
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => {
                      const d = mockDepartments.find((x) => x.id === e.target.value);
                      setFormData({
                        ...formData,
                        departmentId: e.target.value,
                        department: d ? d.name : 'Engineering',
                      });
                    }}
                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Department --</option>
                    {mockDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: EMPLOYMENT CONTRACT SETUP */}
          <div className="space-y-3 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-emerald-700" />
                <span>Section 2: Employment Contract Setup</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                Auto-Linked
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Contract Reference / Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.contractCode}
                    onChange={(e) => setFormData({ ...formData, contractCode: e.target.value })}
                    placeholder="e.g. CON/2026/0043"
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        contractCode: getNextContractCode(contracts),
                      }))
                    }
                    title="Auto-generate next unique contract code"
                    className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Generate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Base Wage / Month (₹)"
                  type="number"
                  placeholder="85000"
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  required
                />

                <Select
                  label="Working Schedule (Database)"
                  value={formData.workingSchedule || (schedules[0]?.name || '40 Hours / Week')}
                  onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
                >
                  {schedules.map((sch) => (
                    <option key={sch.id || sch._id} value={sch.name}>
                      {sch.name} ({sch.hoursPerWeek || '40h'})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Salary Structure (Database)"
                  value={formData.salaryStructureId || (salaryStructures[0]?.id || '')}
                  onChange={(e) => {
                    const matchedStr = salaryStructures.find((s) => (s.id || s._id) === e.target.value);
                    setFormData({
                      ...formData,
                      salaryStructureId: e.target.value,
                      salaryStructureName: matchedStr?.name || 'Employee Salary',
                    });
                  }}
                >
                  {salaryStructures.map((str) => (
                    <option key={str.id || str._id} value={str.id || str._id}>
                      {str.name} ({str.code})
                    </option>
                  ))}
                </Select>

                <Input
                  label="Contract Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Contract End Date (Optional)"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contract Notes / Terms
                  </label>
                  <input
                    type="text"
                    placeholder="Notes regarding contract terms..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: BANK ACCOUNT & SETTLEMENT SETUP */}
          <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200/80 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <span>Section 3: Bank Account & Payout Settlement Details</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                Direct Deposit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Bank Name"
                placeholder="e.g. HDFC Bank, Chase"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
              <Input
                label="Account Number"
                placeholder="e.g. 501004928172"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
              <Input
                label="IFSC / Routing Code"
                placeholder="e.g. HDFC0001234"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
            >
              Create Employee & Contract Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Profile & Bank Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Profile & Bank Settlement Details"
        description="Edit personal contact info and bank account details for payroll direct deposit"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-5">
          {editSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{editSuccessMsg}</span>
            </div>
          )}

          {/* Personal Contact Info */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Personal Contact Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                placeholder="e.g. +91 98765 43210"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Personal Email"
                type="email"
                placeholder="personal@gmail.com"
                value={editFormData.personalEmail}
                onChange={(e) => setEditFormData({ ...editFormData, personalEmail: e.target.value })}
              />
              <Input
                label="Emergency Contact"
                placeholder="e.g. +1 555-019-9988 (Family)"
                value={editFormData.emergencyContact}
                onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
              />
            </div>
          </div>

          {/* Bank Settlement Info */}
          <div className="space-y-3 p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <span>Bank Account for Payroll & Payouts</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                Settlement
              </span>
            </div>

            <div className="space-y-3">
              <Input
                label="Bank Name"
                placeholder="e.g. HDFC Bank, Chase, State Bank of India"
                value={editFormData.bankName}
                onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Bank Account Number"
                  placeholder="e.g. 5010049281729"
                  value={editFormData.accountNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
                  required
                />
                <Input
                  label="IFSC / Branch Routing Code"
                  placeholder="e.g. HDFC0001234"
                  value={editFormData.ifscCode}
                  onChange={(e) => setEditFormData({ ...editFormData, ifscCode: e.target.value })}
                />
              </div>
            </div>

            <p className="text-[11px] text-blue-700 bg-blue-100/50 p-2.5 rounded-lg border border-blue-200/60">
              💡 <strong>Payroll Tip:</strong> Providing a valid bank account number resolves the <code>[MISSING_BANK_DETAILS]</code> informational warning in payroll batches.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5"
            >
              Save Bank & Profile Details
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
