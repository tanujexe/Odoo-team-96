import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsersApi, createUserApi, updateUserApi } from '../../lib/api/users';
import { fetchEmployees } from '../../lib/api/employees';
import { fetchContracts } from '../../lib/api/contracts';
import { fetchSchedules } from '../../lib/api/schedules';
import { fetchSalaryStructures } from '../../lib/api/payroll';
import { isEmployeeCheckedIn } from '../../lib/api/attendance';
import { mockDepartments } from '../../lib/api/mockData';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState, EmptyState } from '../../components/ui/States';
import {
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Search,
  Edit2,
  Save,
  X,
  Sparkles,
  UserCheck,
  FileSignature,
} from 'lucide-react';
import { ROLES } from '../../app/auth/AuthContext';

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

export default function AdminFeature() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State for inline Employee Code editing
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingEmpCode, setEditingEmpCode] = useState('');

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.EMPLOYEE,
    employeeCode: '',
    jobPosition: '',
    departmentId: '',
    contractCode: '',
    wage: 85000,
    workingSchedule: '40 Hours / Week',
    startDate: '2026-01-01',
    endDate: '',
    notes: 'This running contract is the source for payroll calculation in the active period.',
    contractStatus: 'ACTIVE',
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsersApi,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
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

  // When opening modal or when employees load, auto-suggest next Employee ID & Contract Code
  const handleOpenCreateModal = () => {
    const nextCode = getNextEmployeeCode(employees);
    const nextContractCode = getNextContractCode(contracts);
    setNewUserForm({
      name: '',
      email: '',
      password: '',
      role: ROLES.EMPLOYEE,
      employeeCode: nextCode,
      jobPosition: 'Employee',
      departmentId: mockDepartments[0]?.id || '',
      contractCode: nextContractCode,
      wage: 85000,
      workingSchedule: '40 Hours / Week',
      startDate: '2026-01-01',
      endDate: '',
      notes: 'This running contract is the source for payroll calculation in the active period.',
      contractStatus: 'ACTIVE',
    });
    setIsCreateModalOpen(true);
  };

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => updateUserApi(userId, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['contracts']);
      setEditingUserId(null);
      setSuccessMsg(
        `User ${updatedUser.name} updated. Role: ${updatedUser.role}${updatedUser.employeeCode ? ` | Linked to Employee Code: ${updatedUser.employeeCode} (${updatedUser.employeeName || ''})` : ' | (Unlinked)'
        }`
      );
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to update user account');
      setSuccessMsg('');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => createUserApi(data),
    onSuccess: (createdUser) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['contracts']);
      setIsCreateModalOpen(false);
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        role: ROLES.EMPLOYEE,
        employeeCode: '',
        jobPosition: '',
        departmentId: '',
        contractCode: '',
        wage: 85000,
        workingSchedule: '40 Hours / Week',
        startDate: '2026-01-01',
        endDate: '',
        notes: '',
        contractStatus: 'ACTIVE',
      });
      setSuccessMsg(
        `User account ${createdUser.email} created. Role: ${createdUser.role}${createdUser.employeeCode ? ` | Linked to Employee ID: ${createdUser.employeeCode} (${createdUser.employeeName || createdUser.name})` : ''
        }`
      );
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to create user account');
    },
  });

  const handleRoleChange = (userId, newRole) => {
    const userToUpdate = users.find((u) => u.id === userId);
    if (userToUpdate?.email?.toLowerCase() === 'admin@peoplepay.com' || userToUpdate?.role === ROLES.SUPER_ADMIN) {
      setErrorMsg('System Super Admin role is protected and cannot be modified.');
      return;
    }
    updateUserMutation.mutate({ userId, data: { role: newRole } });
  };

  const handleSaveEmpCode = (userId) => {
    updateUserMutation.mutate({ userId, data: { employeeCode: editingEmpCode.trim() || null } });
  };

  const handleCreateUserSubmit = (e) => {
    e.preventDefault();
    createUserMutation.mutate({
      ...newUserForm,
      employeeCode: newUserForm.employeeCode.trim() || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Administration & RBAC Governance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Governance: Create users, assign new Employee IDs (or link existing), and manage 5-tier role access
          </p>
        </div>
        <Button variant="primary" size="sm" icon={UserPlus} onClick={handleOpenCreateModal}>
          Create User Account
        </Button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <Card>
        <CardHeader
          title="Authorized User Directory & Employee ID Management"
          subtitle="Assign roles and configure Employee IDs (assign new ID or link existing profile)"
        />

        {isUsersLoading ? (
          <LoadingState message="Loading user directory and permissions..." />
        ) : users.length === 0 ? (
          <EmptyState title="No registered users found" description="Users will appear here after being added by an Admin." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Account</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Assigned Role (Admin Power)</TableHead>
                <TableHead>Employee ID & Linked Profile</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isEditingThisUser = editingUserId === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {u.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">User ID: {u.id}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-600 text-xs font-medium">{u.email}</TableCell>

                    {/* Role Selector */}
                    <TableCell>
                      {u.email?.toLowerCase() === 'admin@peoplepay.com' || u.role === ROLES.SUPER_ADMIN ? (
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold w-fit cursor-not-allowed shadow-sm"
                          title="System Super Admin role is protected and cannot be modified"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                          <span>
                            {u.role === ROLES.SUPER_ADMIN ? 'SUPER_ADMIN (Protected Root)' : 'ADMIN (Full Governance - Protected)'}
                          </span>
                        </div>
                      ) : (
                        <select
                          aria-label={`Role selector for ${u.name}`}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updateUserMutation.isPending}
                          className={`text-xs border rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 ${u.role === ROLES.ADMIN
                              ? 'bg-purple-50 border-purple-300 text-purple-800'
                              : u.role === ROLES.HR_PAYROLL_MANAGER
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : u.role === ROLES.HR_PAYROLL_USER
                                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                                  : u.role === ROLES.HR_MANAGER
                                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                                    : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                        >
                          <option value={ROLES.EMPLOYEE}>EMPLOYEE (Default Access)</option>
                          <option value={ROLES.HR_MANAGER}>HR_MANAGER (Human Resources)</option>
                          <option value={ROLES.HR_PAYROLL_USER}>HR_PAYROLL_USER (Payroll Staff)</option>
                          <option value={ROLES.HR_PAYROLL_MANAGER}>HR_PAYROLL_MANAGER (Payroll Lead)</option>
                          <option value={ROLES.ADMIN}>ADMIN (Full Governance)</option>
                        </select>
                      )}
                    </TableCell>

                    {/* Employee Code Selector & Verification */}
                    <TableCell>
                      {isEditingThisUser ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            list="emp-codes-datalist"
                            placeholder="Enter or pick ID (e.g. EMP-005)"
                            value={editingEmpCode}
                            onChange={(e) => setEditingEmpCode(e.target.value)}
                            className="text-xs border border-slate-300 rounded px-2.5 py-1 font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white max-w-[210px]"
                          />
                          <datalist id="emp-codes-datalist">
                            {employees.map((emp) => {
                              const empCode = emp.employeeCode || emp.id;
                              const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                              return <option key={emp.id} value={empCode} label={`${empCode} - ${empName}`} />;
                            })}
                          </datalist>
                          <button
                            type="button"
                            onClick={() => handleSaveEmpCode(u.id)}
                            disabled={updateUserMutation.isPending}
                            title="Save Employee ID"
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            title="Cancel"
                            className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {u.employeeCode ? (
                            <div>
                              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                {u.employeeCode}
                              </span>
                              {u.employeeName && (
                                <span className="text-[11px] text-slate-500 block mt-0.5 truncate max-w-[150px]">
                                  {u.employeeName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              -- No Linked Employee ID --
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditingEmpCode(u.employeeCode || '');
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                            title="Edit / Assign Employee ID"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {(() => {
                        const isCheckedIn = isEmployeeCheckedIn(u.employeeId, u.employeeCode);
                        if (u.status === 'INACTIVE') {
                          return <Badge status="INACTIVE">ACCOUNT INACTIVE</Badge>;
                        }
                        return (
                          <Badge status={isCheckedIn ? 'ACTIVE' : 'INACTIVE'}>
                            {isCheckedIn ? 'ACTIVE (ON DUTY)' : 'INACTIVE (OFF DUTY)'}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Admin Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Admin: Create User Account & Employment Contract"
        description="Create authorized system user, assign role permissions, and provision employment contract setup"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          {/* SECTION 1: USER ACCOUNT & EMPLOYEE PROFILE */}
          <div className="space-y-3.5 p-5 bg-slate-50/70 border border-slate-200/90 rounded-2xl">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/90 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-[#00966B]" />
              <span>Section 1: User Account Credentials & Role Permissions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Full Name"
                placeholder="e.g. Marcus Vance"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />

              <Input
                label="Corporate Email"
                type="email"
                placeholder="marcus@company.com"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />

              <Select
                label="Assign Role Permission"
                value={newUserForm.role}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value={ROLES.EMPLOYEE}>EMPLOYEE (Self-Service View)</option>
                <option value={ROLES.HR_MANAGER}>HR_MANAGER (Human Resources)</option>
                <option value={ROLES.HR_PAYROLL_USER}>HR_PAYROLL_USER (Payroll Specialist)</option>
                <option value={ROLES.HR_PAYROLL_MANAGER}>HR_PAYROLL_MANAGER (Payroll Lead)</option>
                <option value={ROLES.ADMIN}>ADMIN (System Governance)</option>
              </Select>
            </div>

            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Employee ID / Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUserForm.employeeCode}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
                    placeholder="e.g. EMP-005"
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-3.5 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNewUserForm((prev) => ({
                        ...prev,
                        employeeCode: getNextEmployeeCode(employees),
                      }))
                    }
                    title="Auto-generate sequential next ID"
                    className="px-3.5 py-2 text-xs font-semibold bg-emerald-100/90 hover:bg-emerald-200 text-emerald-800 border border-emerald-200/60 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-Generate
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                  <span>✓</span> Employee profile ID <code className="font-bold">{newUserForm.employeeCode || 'EMP-xxx'}</code> will be linked to this User Account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Job Position (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Software Engineer"
                    value={newUserForm.jobPosition}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, jobPosition: e.target.value }))}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Department (Optional)
                  </label>
                  <select
                    value={newUserForm.departmentId}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
          <div className="space-y-3.5 p-5 bg-emerald-50/50 border border-emerald-200/90 rounded-2xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/90 text-emerald-950 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-[#00966B]" />
                <span>Section 2: Employment Contract Setup</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-mono font-extrabold tracking-wider border border-emerald-200/60 uppercase">
                Auto-Linked
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Contract Reference / Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUserForm.contractCode}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, contractCode: e.target.value }))}
                    placeholder="e.g. CON/2026/0043"
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-3.5 py-2 font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNewUserForm((prev) => ({
                        ...prev,
                        contractCode: getNextContractCode(contracts),
                      }))
                    }
                    title="Auto-generate next unique contract code"
                    className="px-3.5 py-2 text-xs font-semibold bg-[#00966B] hover:bg-[#007A57] text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Generate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Base Wage / Month (₹)"
                  type="number"
                  placeholder="85000"
                  value={newUserForm.wage}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, wage: e.target.value }))}
                  required
                />

                <Select
                  label="Working Schedule (Database)"
                  value={newUserForm.workingSchedule || (schedules[0]?.name || '40 Hours / Week')}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, workingSchedule: e.target.value }))}
                >
                  {schedules.map((sch) => (
                    <option key={sch.id || sch._id} value={sch.name}>
                      {sch.name} ({sch.hoursPerWeek || '40h'})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Select
                  label="Salary Structure (Database)"
                  value={newUserForm.salaryStructureId || (salaryStructures[0]?.id || '')}
                  onChange={(e) => {
                    const matchedStr = salaryStructures.find((s) => (s.id || s._id) === e.target.value);
                    setNewUserForm((prev) => ({
                      ...prev,
                      salaryStructureId: e.target.value,
                      salaryStructureName: matchedStr?.name || 'Employee Salary',
                    }));
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
                  value={newUserForm.startDate}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Contract End Date (Optional)"
                  type="date"
                  value={newUserForm.endDate || ''}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contract Notes / Terms
                  </label>
                  <input
                    type="text"
                    placeholder="Notes regarding contract terms..."
                    value={newUserForm.notes}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Salary Structure / Contract Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding contract structure, allowances or terms..."
                  value={newUserForm.notes}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="px-5 py-2.5 text-xs font-bold bg-[#00966B] hover:bg-[#007A57] text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {createUserMutation.isPending && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Create User & Contract Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
