import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, createEmployee, fetchEmployeeById } from '../../lib/api/employees';
import { mockDepartments } from '../../lib/api/mockData';
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
} from 'lucide-react';

export default function EmployeesFeature() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeCode: '',
    jobTitle: '',
    department: 'Engineering',
    departmentId: 'dept-eng',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', { search, departmentId: selectedDept, status: selectedStatus }],
    queryFn: () => fetchEmployees({ search, departmentId: selectedDept, status: selectedStatus }),
  });

  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['employeeDetail', selectedEmployeeId],
    queryFn: () => fetchEmployeeById(selectedEmployeeId),
    enabled: !!selectedEmployeeId,
  });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setIsCreateModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        employeeCode: '',
        jobTitle: '',
        department: 'Engineering',
        departmentId: 'dept-eng',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
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
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              aria-label="Kanban view"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'kanban' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setIsCreateModalOpen(true)}>
            Add Employee
          </Button>
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
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Try adjusting your search criteria or add a new employee profile."
          actionLabel="Add Employee"
          onAction={() => setIsCreateModalOpen(true)}
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
              {employees.map((emp) => (
                <TableRow key={emp.id} isSelected={selectedEmployeeId === emp.id}>
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
                    <Badge status={emp.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmployeeId(emp.id)}
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
          {employees.map((emp) => (
            <Card key={emp.id} className="hover:border-slate-300 transition-all hover:shadow-md">
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
                  <Badge status={emp.status} />
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
                  onClick={() => setSelectedEmployeeId(emp.id)}
                >
                  Open Employee Hub
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Detail & Smart Actions Modal */}
      {selectedEmployeeId && (
        <Modal
          isOpen={!!selectedEmployeeId}
          onClose={() => setSelectedEmployeeId(null)}
          title="Employee Workspace & Smart Actions"
          description="Direct navigation links to filtered related records"
          maxWidth="max-w-2xl"
        >
          {isDetailLoading || !detailData ? (
            <LoadingState message="Loading employee workspace..." />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-base flex items-center justify-center">
                  {detailData.employee?.firstName?.[0]}
                  {detailData.employee?.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {detailData.employee?.firstName} {detailData.employee?.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {detailData.employee?.jobTitle} • {detailData.employee?.department} ({detailData.employee?.employeeCode})
                  </p>
                </div>
                <Badge status={detailData.employee?.status} className="ml-auto" />
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Smart Related Modules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSelectedEmployeeId(null);
                      navigate(`/contracts?employeeId=${detailData.employee.id}`);
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <FileSignature className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Contracts</p>
                        <p className="text-[11px] text-slate-500">{detailData.smartCounts.contracts} records found</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEmployeeId(null);
                      navigate(`/attendance?employeeId=${detailData.employee.id}`);
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Attendance History</p>
                        <p className="text-[11px] text-slate-500">{detailData.smartCounts.attendance} days recorded</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEmployeeId(null);
                      navigate(`/time-off?employeeId=${detailData.employee.id}`);
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Time Off & Balances</p>
                        <p className="text-[11px] text-slate-500">
                          {detailData.smartCounts.requests} requests ({detailData.smartCounts.allocations} allocations)
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Create Employee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Employee"
        description="Create an employee master record linked to organizational units"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Work Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Employee Code"
              placeholder="e.g. EMP-009"
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Job Title"
              placeholder="e.g. Senior Software Engineer"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              required
            />
            <Select
              label="Department"
              value={formData.departmentId}
              onChange={(e) => {
                const d = mockDepartments.find((x) => x.id === e.target.value);
                setFormData({
                  ...formData,
                  departmentId: e.target.value,
                  department: d ? d.name : 'Engineering',
                });
              }}
            >
              {mockDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Employment Type"
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
            >
              <option value="FULL_TIME">FULL_TIME</option>
              <option value="PART_TIME">PART_TIME</option>
              <option value="CONTRACTOR">CONTRACTOR</option>
            </Select>
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </Select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
            >
              Create Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
