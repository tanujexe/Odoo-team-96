import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsersApi, createUserApi, updateUserApi } from '../../lib/api/users';
import { fetchEmployees } from '../../lib/api/employees';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { ShieldCheck, UserPlus, CheckCircle2, AlertCircle, Link, UserCheck } from 'lucide-react';
import { ROLES } from '../../app/auth/AuthContext';

export default function AdminFeature() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: ROLES.EMPLOYEE,
    employeeId: '',
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsersApi,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => updateUserApi(userId, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries(['users']);
      setSuccessMsg(`User account for ${updatedUser.name} updated successfully (Role: ${updatedUser.role})`);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
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
        employeeId: '',
      });
      setSuccessMsg(`User account ${createdUser.email} created successfully with role ${createdUser.role}`);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to create user account');
    },
  });

  const handleRoleChange = (userId, newRole) => {
    updateUserMutation.mutate({ userId, data: { role: newRole } });
  };

  const handleEmployeeLinkChange = (userId, newEmpId) => {
    updateUserMutation.mutate({ userId, data: { employeeId: newEmpId || null } });
  };

  const handleCreateUserSubmit = (e) => {
    e.preventDefault();
    createUserMutation.mutate({
      ...newUserForm,
      employeeId: newUserForm.employeeId || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Administration & RBAC Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Governance: Create users, assign employee IDs, and manage 5-tier role access permissions
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
          title="Authorized User Directory & Employee ID Linking"
          subtitle="Assign roles and map user accounts to employee master records"
        />

        {isUsersLoading ? (
          <LoadingState message="Loading user directory and permissions..." />
        ) : users.length === 0 ? (
          <EmptyState title="No registered users found" description="Users will appear here after registering or being added." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Account</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Assigned Role (Admin Power)</TableHead>
                <TableHead>Linked Employee ID & Profile</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const linkedEmp = employees.find((e) => (e.id || e._id) === u.employeeId);
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

                    {/* Employee Profile Linking Selector */}
                    <TableCell>
                      <select
                        aria-label={`Employee profile linker for ${u.name}`}
                        value={u.employeeId || ''}
                        onChange={(e) => handleEmployeeLinkChange(u.id, e.target.value)}
                        disabled={updateUserMutation.isPending}
                        className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[200px] truncate"
                      >
                        <option value="">-- No Linked Employee ID --</option>
                        {employees.map((emp) => (
                          <option key={emp.id || emp._id} value={emp.id || emp._id}>
                            {emp.employeeCode} - {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                      </select>
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
        description="Create an authorized system user with role and optional employee profile link"
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

          <Select
            label="Link Employee Profile (Optional)"
            value={newUserForm.employeeId}
            onChange={(e) => setNewUserForm({ ...newUserForm, employeeId: e.target.value })}
          >
            <option value="">-- No Linked Employee ID --</option>
            {employees.map((emp) => (
              <option key={emp.id || emp._id} value={emp.id || emp._id}>
                {emp.employeeCode} - {emp.firstName} {emp.lastName} ({emp.jobTitle})
              </option>
            ))}
          </Select>

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
