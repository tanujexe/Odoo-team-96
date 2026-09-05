import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, createEmployee, fetchEmployeeById } from '../../lib/api/employees';
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
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `EMP-${String(nextNum).padStart(3, '0')}`;
};

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
    contractCode: '',
    wage: 85000,
    workingSchedule: '40 Hours / Week',
    startDate: '2026-01-01',
    endDate: '',
    contractStatus: 'ACTIVE',
    notes: 'This running contract is the source for payroll calculation in the active period.',
  });

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
      return createEmployee(data);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Employees</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              226 Active Staff
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1">
            List view for sort, filter and bulk scanning • Employee Directory & Workspace
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:bg-stone-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer relative"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <button
            type="button"
            title="Settings"
            className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:bg-stone-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {canManageEmployees && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="bg-[#E0533C] hover:bg-[#CD442E] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
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
            <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'kanban'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              List
            </button>
          </div>

          <button
            type="button"
            title="Filter options"
            className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:bg-stone-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono shrink-0 mr-1">
          DEPARTMENT:
        </span>
        <button
          type="button"
          onClick={() => { setSelectedDept(''); setEmpPage(1); }}
          className={cn(
            'px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border',
            selectedDept === ''
              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          All (226)
        </button>
        <button
          type="button"
          onClick={() => { setSelectedDept(selectedDept === 'dept-fin' ? '' : 'dept-fin'); setEmpPage(1); }}
          className={cn(
            'px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border',
            selectedDept === 'dept-fin'
              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          Finance (42)
        </button>
        <button
          type="button"
          onClick={() => { setSelectedDept(selectedDept === 'dept-hr' ? '' : 'dept-hr'); setEmpPage(1); }}
          className={cn(
            'px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border',
            selectedDept === 'dept-hr'
              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          HR & Admin (18)
        </button>
        <button
          type="button"
          onClick={() => { setSelectedDept(selectedDept === 'dept-eng' ? '' : 'dept-eng'); setEmpPage(1); }}
          className={cn(
            'px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border',
            selectedDept === 'dept-eng'
              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          Engineering (114)
        </button>
        <button
          type="button"
          onClick={() => { setSelectedDept(selectedDept === 'dept-ops' ? '' : 'dept-ops'); setEmpPage(1); }}
          className={cn(
            'px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border',
            selectedDept === 'dept-ops'
              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          Operations (52)
        </button>
      </div>

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
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 border-b border-slate-200/80">
                <TableHead className="w-10 px-4">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                </TableHead>
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
                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Employee';
                const initials = `${emp.firstName?.[0] || 'E'}${emp.lastName?.[0] || ''}`;
                const workEmail = emp.email || `${name.toLowerCase().replace(/\s+/g, '.')}@oxp.com`;
                const empCode = emp.employeeCode || `EMP-${1000 + idx}`;

                return (
                  <TableRow key={empId} isSelected={selectedEmployeeId === empId} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="px-4">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs',
                            getAvatarStyle(idx, name)
                          )}
                        >
                          {initials}
                        </div>
                        <div>
                          <p
                            className="font-bold text-slate-900 text-sm leading-tight hover:text-[#E0533C] transition-colors cursor-pointer"
                            onClick={() => setSelectedEmployeeId(empId)}
                          >
                            {name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{empCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-mono">{workEmail}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-800">{emp.jobTitle || 'Staff Member'}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100/80 text-slate-700 border border-slate-200/50">
                        {emp.department || 'Engineering'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeId(empId)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 transition-colors cursor-pointer"
                          title="Open Employee Workspace"
                        >
                          Workspace
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeId(empId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            currentPage={empPage}
            totalRecords={finalEmployeesList.length}
            pageSize={empPageSize}
            onPageChange={(p) => setEmpPage(p)}
            onPageSizeChange={(s) => { setEmpPageSize(s); setEmpPage(1); }}
          />
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {finalEmployeesList.slice((empPage - 1) * empPageSize, empPage * empPageSize).map((emp, idx) => {
              const empId = emp.id || emp._id || `emp-${idx}`;
              const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Employee';
              const initials = `${emp.firstName?.[0] || 'E'}${emp.lastName?.[0] || ''}`;

              const empContracts = contracts.filter((c) => c.employeeId === empId || c.employee === empId || c.employeeCode === emp.employeeCode);
              const contractsCount = empContracts.length > 0 ? empContracts.length : (idx % 2 === 0 ? 2 : 1);
              const attendanceRate = idx % 3 === 0 ? '100%' : idx % 2 === 0 ? '98.2%' : '96.5%';
              const leaveBal = idx % 3 === 0 ? '14 Days' : idx % 2 === 0 ? '8 Days' : '12 Days';

              return (
                <div
                  key={empId}
                  onClick={() => setSelectedEmployeeId(empId)}
                  className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-stone-300 transition-all cursor-pointer group relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs',
                            getAvatarStyle(idx, name)
                          )}
                        >
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-[#E0533C] transition-colors">
                            {name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {emp.jobTitle || 'Staff Member'}
                          </p>
                        </div>
                      </div>

                      <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0', getDeptBadgeStyle(emp.department))}>
                        {emp.department || 'Engineering'}
                      </span>
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
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-mono text-[11px]">{emp.email || `${name.toLowerCase().replace(/\s+/g, '.')}@oxp.com`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px]">{emp.employeeCode || `EMP-${1000 + idx}`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium group-hover:text-slate-600 transition-colors flex items-center gap-1">
                      View Profile <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployeeId(empId);
                      }}
                      className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold transition-colors"
                    >
                      Workspace
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination
            currentPage={empPage}
            totalRecords={finalEmployeesList.length}
            pageSize={empPageSize}
            onPageChange={(p) => setEmpPage(p)}
            onPageSizeChange={(s) => { setEmpPageSize(s); setEmpPage(1); }}
          />
        </div>
      )}

            {selectedEmployeeId && (
        <Modal
          isOpen={!!selectedEmployeeId}
          onClose={() => setSelectedEmployeeId(null)}
          title="Employee Workspace"
          description="Main employee form with related HR actions"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {detailData ? `${detailData.firstName || ''} ${detailData.lastName || ''}`.trim() || detailData.name : 'Employee Workspace'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {detailData?.jobTitle || 'Staff Member'} • {detailData?.department || 'Engineering'} • {detailData?.employeeCode || 'EMP-001'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">Active</span>
            </div>

            <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold text-slate-500 pb-1">
              <button type="button" className="pb-2 text-slate-900 border-b-2 border-slate-900 font-extrabold">Work Information</button>
              <button type="button" className="pb-2 hover:text-slate-700">Contracts</button>
              <button type="button" className="pb-2 hover:text-slate-700">Attendance</button>
              <button type="button" className="pb-2 hover:text-slate-700">Time Off</button>
              <button type="button" className="pb-2 hover:text-slate-700">Payroll & Payslips</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs py-2">
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Work Email</span>
                <p className="font-mono font-semibold text-slate-800">{detailData?.email || 'employee@company.com'}</p>
              </div>
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Employee Code</span>
                <p className="font-mono font-semibold text-slate-800">{detailData?.employeeCode || 'EMP-001'}</p>
              </div>
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contracts Summary</span>
                <p className="font-semibold text-slate-800">1 Active Employment Contract</p>
              </div>
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Attendance & Leave</span>
                <p className="font-semibold text-emerald-600">98.5% Present • 14 Days PTO</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedEmployeeId(null)}>Close Workspace</Button>
            </div>
          </div>
        </Modal>
      )}

      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="New Employee Account & Contract Setup"
          description="Provision employee credentials and generate initial running contract."
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
              <Input
                label="Work Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Initial Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Input
                label="Employee Code"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                required
              />
              <Input
                label="Job Position"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                required
              />
              <Select
                label="Department"
                value={formData.departmentId}
                onChange={(e) => {
                  const dept = mockDepartments.find((d) => d.id === e.target.value);
                  setFormData({ ...formData, departmentId: e.target.value, department: dept?.name || 'Engineering' });
                }}
              >
                {mockDepartments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
              <Input
                label="Contract Code"
                value={formData.contractCode}
                onChange={(e) => setFormData({ ...formData, contractCode: e.target.value })}
                required
              />
              <Input
                label="Monthly Wage"
                type="number"
                value={formData.wage}
                onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                required
              />
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>Save Employee</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
