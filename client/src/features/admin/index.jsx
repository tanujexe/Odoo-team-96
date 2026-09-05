import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsersApi, createUserApi, updateUserApi } from '../../lib/api/users';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { ShieldCheck, UserPlus, CheckCircle2, AlertCircle, Search, Edit2, Save, X } from 'lucide-react';
import { ROLES } from '../../app/auth/AuthContext';

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
    password: 'Password123!',
    role: ROLES.EMPLOYEE,
    employeeCode: '',
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsersApi,
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => updateUserApi(userId, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries(['users']);
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
      setIsCreateModalOpen(false);
      setNewUserForm({
        name: '',
        email: '',
        password: 'Password123!',
        role: ROLES.EMPLOYEE,
        employeeCode: '',
      });
      setSuccessMsg(
        `User account ${createdUser.email} created. Role: ${createdUser.role}${
          createdUser.employeeCode ? ` | Linked to Employee Code: ${createdUser.employeeCode}` : ''
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
    updateUserMutation.mutate({ userId, data: { employeeCode: editingEmpCode } });
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
            Admin Governance: Create users, assign employee codes (validated against database), and manage 5-tier role access
          </p>
        </div>
        <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setIsCreateModalOpen(true)}>
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
          title="Authorized User Directory & Employee Code Verification"
          subtitle="Assign roles and enter Employee Codes directly (existence verified in database)"
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
                <TableHead>Employee Code & Profile Verification</TableHead>
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

                    {/* Employee Code Direct Input & Verification */}
                    <TableCell>
                      {isEditingThisUser ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="e.g. EMP001"
                            value={editingEmpCode}
                            onChange={(e) => setEditingEmpCode(e.target.value)}
                            className="text-xs border border-slate-300 rounded px-2 py-1 font-mono font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-28"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEmpCode(u.id)}
                            disabled={updateUserMutation.isPending}
                            title="Save & Validate Employee Code"
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            title="Cancel"
                            className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
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
                                <span className="text-[11px] text-slate-500 block mt-0.5 truncate max-w-[140px]">
                                  {u.employeeName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No Employee Code</span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditingEmpCode(u.employeeCode || '');
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                            title="Edit Employee Code"
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
        title="Admin: Create User Account"
        description="Create an authorized system user with assigned role and validated Employee Code"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
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

          <div>
            <Input
              label="Employee Code (Checked against Database)"
              placeholder="e.g. EMP001"
              value={newUserForm.employeeCode}
              onChange={(e) => setNewUserForm({ ...newUserForm, employeeCode: e.target.value })}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Enter an existing Employee Code (e.g. <code>EMP001</code>). The database will verify that the Employee Code exists before saving.
            </p>
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
