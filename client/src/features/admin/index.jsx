import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsersApi, createUserApi, updateUserApi } from '../../lib/api/users';
import { fetchEmployees } from '../../lib/api/employees';
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
  Link2,
  User,
  PlusCircle,
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

export default function AdminFeature() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State for inline Employee Code editing
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingEmpCode, setEditingEmpCode] = useState('');

  // Mode for Employee ID link in Create User Modal: 'new' | 'existing' | 'none'
  const [empLinkMode, setEmpLinkMode] = useState('new');

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: ROLES.EMPLOYEE,
    employeeCode: '',
    jobPosition: '',
    departmentId: '',
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsersApi,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  // When opening modal or when employees load, auto-suggest next Employee ID if in 'new' mode
  const handleOpenCreateModal = () => {
    const nextCode = getNextEmployeeCode(employees);
    setEmpLinkMode('new');
    setNewUserForm({
      name: '',
      email: '',
      password: 'Password123!',
      role: ROLES.EMPLOYEE,
      employeeCode: nextCode,
      jobPosition: 'Employee',
      departmentId: mockDepartments[0]?.id || '',
    });
    setIsCreateModalOpen(true);
  };

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => updateUserApi(userId, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['employees']);
      setEditingUserId(null);
      setSuccessMsg(
        `User ${updatedUser.name} updated. Role: ${updatedUser.role}${
          updatedUser.employeeCode ? ` | Linked to Employee Code: ${updatedUser.employeeCode} (${updatedUser.employeeName || ''})` : ' | (Unlinked)'
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
    mutationFn: createUserApi,
    onSuccess: (createdUser) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['employees']);
      setIsCreateModalOpen(false);
      setNewUserForm({
        name: '',
        email: '',
        password: 'Password123!',
        role: ROLES.EMPLOYEE,
        employeeCode: '',
        jobPosition: '',
        departmentId: '',
      });
      setSuccessMsg(
        `User account ${createdUser.email} created. Role: ${createdUser.role}${
          createdUser.employeeCode ? ` | Linked to Employee ID: ${createdUser.employeeCode} (${createdUser.employeeName || createdUser.name})` : ''
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
    updateUserMutation.mutate({ userId, data: { role: newRole } });
  };

  const handleSaveEmpCode = (userId) => {
    updateUserMutation.mutate({ userId, data: { employeeCode: editingEmpCode.trim() || null } });
  };

  const handleCreateUserSubmit = (e) => {
    e.preventDefault();
    let empCodeToSubmit = null;
    if (empLinkMode === 'new' || empLinkMode === 'existing') {
      empCodeToSubmit = newUserForm.employeeCode.trim() || null;
    }

    createUserMutation.mutate({
      ...newUserForm,
      employeeCode: empCodeToSubmit,
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
                      <select
                        aria-label={`Role selector for ${u.name}`}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updateUserMutation.isPending}
                        className={`text-xs border rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 ${
                          u.role === ROLES.ADMIN
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
                      <Badge status={u.status || 'ACTIVE'} />
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
        title="Admin: Create User & Assign Employee ID"
        description="Create an authorized system user with assigned role and provision a new or existing Employee ID"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              placeholder="e.g. Marcus Vance"
              value={newUserForm.name}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              required
            />

            <Input
              label="Corporate Email"
              type="email"
              placeholder="marcus@company.com"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Password"
              type="password"
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              required
            />

            <Select
              label="Assign Role"
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
            >
              <option value={ROLES.EMPLOYEE}>EMPLOYEE (Self-Service)</option>
              <option value={ROLES.HR_MANAGER}>HR_MANAGER (Human Resources)</option>
              <option value={ROLES.HR_PAYROLL_USER}>HR_PAYROLL_USER (Payroll Staff)</option>
              <option value={ROLES.HR_PAYROLL_MANAGER}>HR_PAYROLL_MANAGER (Payroll Lead)</option>
              <option value={ROLES.ADMIN}>ADMIN (System Governance)</option>
            </Select>
          </div>

          {/* Employee ID Assignment Mode Selection */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Employee Profile & ID Assignment
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setEmpLinkMode('new');
                    if (!newUserForm.employeeCode) {
                      setNewUserForm((prev) => ({ ...prev, employeeCode: getNextEmployeeCode(employees) }));
                    }
                  }}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    empLinkMode === 'new'
                      ? 'bg-white shadow text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Assign New ID
                </button>

                <button
                  type="button"
                  onClick={() => setEmpLinkMode('existing')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    empLinkMode === 'existing'
                      ? 'bg-white shadow text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Link Existing
                </button>

                <button
                  type="button"
                  onClick={() => setEmpLinkMode('none')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    empLinkMode === 'none'
                      ? 'bg-white shadow text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  No Employee ID
                </button>
              </div>
            </div>

            {empLinkMode === 'new' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    New Employee ID / Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUserForm.employeeCode}
                      onChange={(e) => setNewUserForm({ ...newUserForm, employeeCode: e.target.value })}
                      placeholder="e.g. EMP-005"
                      className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
                      className="px-3 py-2 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Auto-Generate
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                    <span>✓</span> An employee profile with ID <code className="font-bold">{newUserForm.employeeCode || 'EMP-xxx'}</code> will be automatically created in the Employee Directory.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Job Position (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={newUserForm.jobPosition}
                      onChange={(e) => setNewUserForm({ ...newUserForm, jobPosition: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Department (Optional)
                    </label>
                    <select
                      value={newUserForm.departmentId}
                      onChange={(e) => setNewUserForm({ ...newUserForm, departmentId: e.target.value })}
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
            )}

            {empLinkMode === 'existing' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Select Existing Employee from Database
                </label>
                <select
                  value={newUserForm.employeeCode}
                  onChange={(e) => setNewUserForm({ ...newUserForm, employeeCode: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                >
                  <option value="">-- Choose Employee Record --</option>
                  {employees.map((emp) => {
                    const empCode = emp.employeeCode || emp.id;
                    const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                    const empJob = emp.jobTitle || emp.jobPosition || '';
                    return (
                      <option key={emp.id} value={empCode}>
                        {empCode} - {empName} {empJob ? `(${empJob})` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Links this new user login account to an already existing employee record in the database.
                </p>
              </div>
            )}

            {empLinkMode === 'none' && (
              <p className="text-[11px] text-slate-600 bg-slate-100 p-2.5 rounded-lg">
                Creates a standalone system account with no linked employee profile (suitable for external administrators).
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createUserMutation.isPending}>
              Create & Assign User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
