import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Plus, UserPlus, Filter, Search } from 'lucide-react';
import { mockEmployees } from '../../lib/api/mockData';

export default function EmployeesFeature() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage employee master data, linked contracts, and department assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Filter}>
            Filter
          </Button>
          <Button variant="primary" size="sm" icon={UserPlus}>
            New Employee
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, or role..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEmployees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={emp.avatar} alt={emp.firstName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-slate-400">{emp.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">{emp.employeeCode}</TableCell>
                <TableCell>{emp.department}</TableCell>
                <TableCell>{emp.jobTitle}</TableCell>
                <TableCell>
                  <span className="text-xs font-medium text-slate-600">{emp.employmentType}</span>
                </TableCell>
                <TableCell>
                  <Badge status={emp.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    View
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
