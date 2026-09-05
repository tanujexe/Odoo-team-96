import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchContracts, createContract, resolveContract } from '../../lib/api/contracts';
import { fetchSchedules, createSchedule } from '../../lib/api/schedules';
import { mockEmployees } from '../../lib/api/mockData';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState } from '../../components/ui/States';
import { ScheduleEditor } from '../schedules/ScheduleEditor';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  FileSignature,
  Calendar,
  Clock,
  Plus,
  Search,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export default function ContractsFeature() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const filteredEmployeeId = searchParams.get('employeeId') || '';

  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts' | 'schedules' | 'resolver'
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Contract form
  const [contractForm, setContractForm] = useState({
    contractCode: '',
    employeeId: mockEmployees[0]?.id || '',
    employeeName: `${mockEmployees[0]?.firstName} ${mockEmployees[0]?.lastName}`,
    wage: 8000,
    wageType: 'MONTHLY',
    startDate: '2026-01-01',
    endDate: '',
    status: 'ACTIVE',
  });

  // Resolver widget state
  const [resolverEmployeeId, setResolverEmployeeId] = useState(mockEmployees[0]?.id || '');
  const [resolverStart, setResolverStart] = useState('2026-09-01');
  const [resolverEnd, setResolverEnd] = useState('2026-09-30');
  const [resolvedResult, setResolvedResult] = useState(null);

  const { data: contracts = [], isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts', { employeeId: filteredEmployeeId }],
    queryFn: () => fetchContracts({ employeeId: filteredEmployeeId }),
  });

  const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: fetchSchedules,
  });

  const contractMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
      setIsContractModalOpen(false);
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries(['schedules']);
      setIsScheduleModalOpen(false);
    },
  });

  const handleTestResolver = async () => {
    const res = await resolveContract({
      employeeId: resolverEmployeeId,
      periodStart: resolverStart,
      periodEnd: resolverEnd,
    });
    setResolvedResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Employment Contracts & Working Schedules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical contract registry, wage definitions, period contract resolution, and shift templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'contracts' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsContractModalOpen(true)}>
              New Contract
            </Button>
          )}
          {activeTab === 'schedules' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsScheduleModalOpen(true)}>
              New Schedule
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'contracts'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Contracts Registry
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'schedules'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Working Schedules
        </button>
        <button
          onClick={() => setActiveTab('resolver')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'resolver'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Period Contract Resolver
        </button>
      </div>

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <Card>
          <CardHeader
            title="Employment Contracts"
            subtitle={filteredEmployeeId ? `Filtered by Employee ID: ${filteredEmployeeId}` : 'All registered contracts'}
          />
          {isContractsLoading ? (
            <LoadingState message="Loading contracts..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract Code</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Wage / Salary</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((cnt) => {
                  const code = cnt.contractCode || (cnt.id ? `CNT-${String(cnt.id).slice(-4).toUpperCase()}` : 'CNT-001');
                  return (
                    <TableRow key={cnt.id || cnt._id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-800">{code}</TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        <div>
                          <span>{cnt.employeeName || 'Unassigned Employee'}</span>
                          {cnt.employeeCode && (
                            <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                              {cnt.employeeCode}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-emerald-700">
                        {formatCurrency(cnt.wage)} / mo
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{formatDate(cnt.startDate)}</TableCell>
                      <TableCell className="text-xs text-slate-400">{cnt.endDate ? formatDate(cnt.endDate) : 'Open-ended'}</TableCell>
                      <TableCell>
                        <Badge status={cnt.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schedules.map((sch) => (
              <Card key={sch.id} className="border-slate-200">
                <CardHeader
                  title={sch.name}
                  subtitle="Weekly work pattern"
                  action={
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {sch.calculatedWeeklyHours}h / week
                    </span>
                  }
                />
                <CardContent className="space-y-2">
                  <p className="text-xs text-slate-500">Standard working hours:</p>
                  <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Mon – Fri:</span>
                      <span className="font-mono font-semibold">09:00 - 17:30 (30m break)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Sat – Sun:</span>
                      <span>Off</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contract Resolver Tester Tab */}
      {activeTab === 'resolver' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader
              title="Test Period Contract Resolution"
              subtitle="Validates contract resolver logic against payroll periods"
            />
            <CardContent className="space-y-4">
              <Select
                label="Employee"
                value={resolverEmployeeId}
                onChange={(e) => setResolverEmployeeId(e.target.value)}
              >
                {mockEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
                <option value="emp-ambiguous-1">⚠️ Test Ambiguous Contract Employee</option>
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Period Start"
                  type="date"
                  value={resolverStart}
                  onChange={(e) => setResolverStart(e.target.value)}
                />
                <Input
                  label="Period End"
                  type="date"
                  value={resolverEnd}
                  onChange={(e) => setResolverEnd(e.target.value)}
                />
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleTestResolver}
              >
                Resolve Applicable Contract
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Resolver Diagnostic Output"
              subtitle="Live result passed to payroll engine"
            />
            <CardContent>
              {resolvedResult ? (
                resolvedResult.warning ? (
                  <div data-testid="resolver-warning-banner" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-800">
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      Blocking Resolver Warning: {resolvedResult.warning.code}
                    </div>
                    <p className="text-xs leading-relaxed text-rose-700">{resolvedResult.warning.message}</p>
                  </div>
                ) : (
                  <div data-testid="resolver-success-banner" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Contract Successfully Resolved
                    </div>
                    <div className="text-xs space-y-1 pt-1 text-slate-700">
                      <p><strong>Code:</strong> {resolvedResult.contract?.contractCode}</p>
                      <p><strong>Base Wage:</strong> {formatCurrency(resolvedResult.contract?.wage)}</p>
                      <p><strong>Status:</strong> {resolvedResult.contract?.status}</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select an employee and period to run the resolver check.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Create Working Schedule"
        maxWidth="max-w-3xl"
      >
        <ScheduleEditor
          onSave={(data) => scheduleMutation.mutate(data)}
          onCancel={() => setIsScheduleModalOpen(false)}
        />
      </Modal>

      {/* New Contract Modal */}
      <Modal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        title="Add Employment Contract"
        description="Attach wage and salary terms to an active employee record"
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            contractMutation.mutate(contractForm);
          }}
          className="space-y-4"
        >
          <Input
            label="Contract Code"
            placeholder="e.g. CNT-2026-004"
            value={contractForm.contractCode}
            onChange={(e) => setContractForm({ ...contractForm, contractCode: e.target.value })}
            required
          />

          <Select
            label="Employee"
            value={contractForm.employeeId}
            onChange={(e) => {
              const emp = mockEmployees.find((x) => x.id === e.target.value);
              setContractForm({
                ...contractForm,
                employeeId: e.target.value,
                employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Selected Employee',
              });
            }}
          >
            {mockEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Base Wage (Monthly $)"
              type="number"
              value={contractForm.wage}
              onChange={(e) => setContractForm({ ...contractForm, wage: e.target.value })}
              required
            />
            <Select
              label="Status"
              value={contractForm.status}
              onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="EXPIRED">EXPIRED</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={contractForm.startDate}
              onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={contractForm.endDate}
              onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsContractModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={contractMutation.isPending}>
              Create Contract
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
