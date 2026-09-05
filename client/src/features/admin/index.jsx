import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { ShieldCheck, UserPlus, Key } from 'lucide-react';
import { ROLES } from '../../app/auth/AuthContext';

export default function AdminFeature() {
  const users = [
    { id: '1', name: 'Eleanor Vance', email: 'admin@peoplepay360.com', role: ROLES.ADMIN, status: 'ACTIVE' },
    { id: '2', name: 'Sarah Connor', email: 'sarah.payroll@peoplepay360.com', role: ROLES.HR_PAYROLL_MANAGER, status: 'ACTIVE' },
    { id: '3', name: 'David Miller', email: 'david.payroll@peoplepay360.com', role: ROLES.HR_PAYROLL_USER, status: 'ACTIVE' },
    { id: '4', name: 'Rachel Green', email: 'rachel.hr@peoplepay360.com', role: ROLES.HR_MANAGER, status: 'ACTIVE' },
    { id: '5', name: 'Alex Rivera', email: 'alex.rivera@peoplepay360.com', role: ROLES.EMPLOYEE, status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Administration & RBAC</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage user accounts, 5-tier role assignments, and security audit settings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" icon={UserPlus}>
            Create User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Authorized User Directory"
          subtitle="Strict RBAC roles mapped to employee profiles and capability matrices"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Assigned Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold text-slate-900">{u.name}</TableCell>
                <TableCell className="text-slate-500 text-xs">{u.email}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                    {u.role}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge status={u.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" icon={Key}>
                    Reset Key
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
