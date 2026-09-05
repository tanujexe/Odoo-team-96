import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchContracts, createContract, updateContract, resolveContract } from '../../lib/api/contracts';
import { fetchSchedules, createSchedule, updateSchedule } from '../../lib/api/schedules';
import { fetchEmployees } from '../../lib/api/employees';
import { mockEmployees } from '../../lib/api/mockData';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState } from '../../components/ui/States';
import { ScheduleEditor } from '../schedules/ScheduleEditor';
import { ContractFormView } from './ContractFormView';
import { ContractFormViewModal } from './ContractFormViewModal';
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
  ExternalLink,
  LayoutList,
  FileText,
} from 'lucide-react';

export default function ContractsFeature() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const filteredEmployeeId = searchParams.get('employeeId') || '';

  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts' | 'schedules' | 'resolver'
  const [contractSubView, setContractSubView] = useState('list'); // 'list' | 'form'
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const { data: serverEmployees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(),
  });

  const allEmployees = React.useMemo(() => {
    const combined = [...serverEmployees];
    const existingIds = new Set(combined.map((e) => e.id));
    mockEmployees.forEach((m) => {
      if (!existingIds.has(m.id)) {
        combined.push(m);
      }
    });
    return combined;
  }, [serverEmployees]);

  // Contract form state
  const [contractForm, setContractForm] = useState({
    contractCode: '',
    employeeId: '',
    employeeName: '',
    department: 'Finance',
    position: 'Payroll Specialist',
    wage: 85000,
    wageType: 'MONTHLY',
    workingSchedule: '40 Hours / Week',
    startDate: '2026-01-01',
    endDate: '',
    salaryStructure: 'Employee Salary',
    notes: 'This running contract is the source for payroll calculation in the active period.',
    status: 'ACTIVE',
  });

  // Helper to generate next unique contract code in CON/2026/0042 format
  const generateNextContractCode = (contractList) => {
    const year = new Date().getFullYear();
    let maxNum = 42;
    (contractList || []).forEach((c) => {
      const code = c.contractCode || '';
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

  const handleOpenNewContractForm = () => {
    const defaultEmp = allEmployees[0] || mockEmployees[0];
    const autoCode = generateNextContractCode(contracts);
    const newForm = {
      contractCode: autoCode,
      employeeId: defaultEmp?.id || defaultEmp?._id || '',
      employeeName: defaultEmp ? `${defaultEmp.firstName || defaultEmp.name || ''} ${defaultEmp.lastName || ''}`.trim() : 'Aarav Mehta',
      department: defaultEmp?.department || 'Finance',
      position: defaultEmp?.jobTitle || 'Payroll Specialist',
      wage: 85000,
      wageType: 'MONTHLY',
      workingSchedule: '40 Hours / Week',
      startDate: '2026-01-01',
      endDate: '',
      salaryStructure: 'Employee Salary',
      notes: 'This running contract is the source for payroll calculation in the active period.',
      status: 'ACTIVE',
    };
    setContractForm(newForm);
    setSelectedContract(null);
    setContractSubView('form');
  };

  const handleOpenContractModal = () => {
    handleOpenNewContractForm();
    setIsContractModalOpen(true);
  };

  // Working Schedule State
  const [scheduleSubTab, setScheduleSubTab] = useState('list'); // 'list' | 'calendar'
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Resolver widget state
  const [resolverEmployeeId, setResolverEmployeeId] = useState(mockEmployees[0]?.id || '');
  const [resolverStart, setResolverStart] = useState('2026-09-01');
  const [resolverEnd, setResolverEnd] = useState('2026-09-30');
  const [resolvedResult, setResolvedResult] = useState(null);

  const { data: contracts = [], isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts', { employeeId: filteredEmployeeId }],
    queryFn: () => fetchContracts({ employeeId: filteredEmployeeId }),
  });

  React.useEffect(() => {
    if (filteredEmployeeId && contracts.length > 0 && !selectedContract) {
      const match =
        contracts.find(
          (c) =>
            c.employeeId === filteredEmployeeId ||
            c.employeeId?._id === filteredEmployeeId ||
            c.employeeCode === filteredEmployeeId
        ) || contracts[0];
      if (match) {
        setSelectedContract(match);
        setContractSubView('form');
      }
    }
  }, [filteredEmployeeId, contracts]);

  const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: fetchSchedules,
  });

  const contractMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['payslips']);
      setIsContractModalOpen(false);
      setContractSubView('list');
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: (data) => updateContract(data.id || data._id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries(['contracts']);
      setSelectedContract(updated);
      setContractSubView('list');
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: (newSch) => {
      queryClient.invalidateQueries(['schedules']);
      setIsScheduleModalOpen(false);
      setSelectedSchedule(newSch);
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (data) => updateSchedule(data.id || data._id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries(['schedules']);
      setSelectedSchedule(updated);
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
            <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenNewContractForm}>
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

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'contracts'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Contracts Registry
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'schedules'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Working Schedules
        </button>
        <button
          onClick={() => setActiveTab('resolver')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'resolver'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Period Contract Resolver
        </button>
      </div>

      {/* Contracts Tab Container */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {/* Sub-view toggle bar: List View | Form View */}
          <div className="flex items-center justify-between bg-slate-50/80 p-2 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setContractSubView('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  contractSubView === 'list'
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Contracts List
              </button>
            </div>

            {contractSubView === 'list' && (
              <Button variant="subtle" size="sm" icon={Plus} onClick={handleOpenNewContractForm}>
                Create New Contract
              </Button>
            )}
          </div>

          {/* Render List View or Form View */}
          {contractSubView === 'list' ? (
            <Card>
              <CardHeader
                title="Employment Contracts"
                subtitle={filteredEmployeeId ? `Filtered by Employee ID: ${filteredEmployeeId}` : 'All registered contracts (click any row to open in Form View)'}
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
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((cnt) => {
                      const code = cnt.contractCode || (cnt.id ? `CON/2026/00${String(cnt.id).slice(-2)}` : 'CON/2026/0042');
                      return (
                        <TableRow
                          key={cnt.id || cnt._id}
                          onClick={() => {
                            setSelectedContract(cnt);
                            setContractSubView('form');
                          }}
                          className="cursor-pointer hover:bg-emerald-50/50 transition-colors group"
                        >
                          <TableCell className="font-mono text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                            <span className="flex items-center gap-1.5">
                              {code}
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </TableCell>
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
                            ₹{Number(cnt.wage || 85000).toLocaleString('en-IN')} / mo
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">{formatDate(cnt.startDate)}</TableCell>
                          <TableCell className="text-xs text-slate-400">{cnt.endDate ? formatDate(cnt.endDate) : '--'}</TableCell>
                          <TableCell>
                            <Badge status={cnt.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedContract(cnt);
                                setContractSubView('form');
                              }}
                            >
                              Open Form
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          ) : (
            /* Form View of One Contract matching exact wireframe design */
            <ContractFormView
              contract={selectedContract || contractForm}
              allEmployees={allEmployees}
              schedules={schedules}
              onSave={(formData) => {
                if (selectedContract?._id || selectedContract?.id) {
                  updateContractMutation.mutate({ ...formData, id: selectedContract.id || selectedContract._id });
                } else {
                  contractMutation.mutate(formData);
                }
              }}
              onCancel={() => setContractSubView('list')}
              onNewContract={handleOpenNewContractForm}
              isPending={contractMutation.isPending || updateContractMutation.isPending}
            />
          )}
        </div>
      )}

      {/* Schedules Tab: List & Form Views matching exact wireframe design */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Schedules List / Calendar View */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="border-slate-200 bg-white text-slate-900 shadow-sm rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={() =>
                      setSelectedSchedule({
                        id: `sch-${Date.now()}`,
                        name: 'New Working Schedule',
                        company: 'My Company',
                        timezone: 'Company timezone',
                        status: 'Active',
                        workDays: [
                          { day: 'Monday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
                          { day: 'Tuesday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
                          { day: 'Wednesday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
                          { day: 'Thursday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
                          { day: 'Friday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
                        ],
                      })
                    }
                  >
                    New Schedule
                  </Button>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Working Schedules</h3>
                </div>
              </div>

              {/* Sub-tabs: List | Calendar */}
              <div className="px-4 pt-3 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setScheduleSubTab('list')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${scheduleSubTab === 'list'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleSubTab('calendar')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${scheduleSubTab === 'calendar'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    Calendar
                  </button>
                </div>
              </div>

              {/* Search & Actions Bar */}
              <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search schedules..."
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Filter
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Columns
                </button>
              </div>

              {/* SubTab Content */}
              {scheduleSubTab === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Schedule Name</th>
                        <th className="py-3 px-3">Days / Week</th>
                        <th className="py-3 px-3">Hours / Week</th>
                        <th className="py-3 px-3">Company</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {schedules
                        .filter((s) => (s.name || '').toLowerCase().includes(scheduleSearch.toLowerCase()))
                        .map((sch) => {
                          const schId = sch.id || sch._id;
                          const isSelected = (selectedSchedule?.id || selectedSchedule?._id) === schId;
                          const activeDays = (sch.days || sch.workDays || []).filter((d) => d && d.isWorkDay !== false);
                          const daysCount = sch.daysPerWeek || (activeDays.length > 0 ? activeDays.length : 5);
                          const hoursVal = sch.weeklyHours ?? sch.calculatedWeeklyHours ?? (activeDays.length * 8);
                          const hoursText = sch.hoursPerWeek || `${hoursVal}h`;
                          const statusStr = sch.status ? (sch.status.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive') : 'Active';

                          return (
                            <tr
                              key={schId}
                              onClick={() => setSelectedSchedule(sch)}
                              className={`cursor-pointer transition-colors ${isSelected
                                  ? 'bg-emerald-50/80 border-l-4 border-emerald-600 text-emerald-950 font-bold'
                                  : 'hover:bg-slate-50/80 text-slate-800'
                                }`}
                            >
                              <td className="py-3.5 px-4 font-semibold text-slate-900">{sch.name}</td>
                              <td className="py-3.5 px-3 font-mono">{daysCount}</td>
                              <td className="py-3.5 px-3 font-mono text-emerald-700 font-bold">{hoursText}</td>
                              <td className="py-3.5 px-3 text-slate-500">{sch.company || 'My Company'}</td>
                              <td className="py-3.5 px-4 text-right">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${statusStr === 'Active'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                                >
                                  {statusStr}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  <div className="p-3 bg-slate-50/60 text-[11px] text-slate-500 italic border-t border-slate-200">
                    Select a schedule to open to Form view
                  </div>
                </div>
              ) : (
                /* Calendar Grid View */
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-600 font-medium">Weekly Shift Schedule Calendar View</p>
                  <div className="grid grid-cols-7 gap-2 text-center text-xs">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="font-bold text-emerald-700 block uppercase text-[10px]">{day}</span>
                        <span className="text-[11px] text-slate-800 font-mono mt-1 block">09:00 - 18:00</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">8h work</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Panel: Form View / Schedule Editor */}
          <div className="lg:col-span-6">
            <ScheduleEditor
              key={selectedSchedule?.id || selectedSchedule?._id || 'default-schedule'}
              initialSchedule={selectedSchedule || schedules[0]}
              onSave={(updated) => {
                const targetId = selectedSchedule?._id || selectedSchedule?.id;
                if (targetId && !String(targetId).startsWith('sch-')) {
                  updateScheduleMutation.mutate({ ...updated, id: targetId });
                } else if (targetId && String(targetId).startsWith('sch-')) {
                  // For mock / newly added
                  updateScheduleMutation.mutate({ ...updated, id: targetId });
                } else {
                  scheduleMutation.mutate(updated);
                }
              }}
              onCancel={() => setSelectedSchedule(null)}
            />
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
                {allEmployees.map((emp) => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.firstName || emp.name} {emp.lastName || ''} ({emp.employeeCode || 'EMP'})
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
          key={isScheduleModalOpen ? 'modal-open' : 'modal-closed'}
          initialSchedule={null}
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
              const selectedId = e.target.value;
              const emp = allEmployees.find((x) => (x.id || x._id) === selectedId);
              const fullName = emp ? `${emp.firstName || emp.name || ''} ${emp.lastName || ''}`.trim() : 'Selected Employee';
              setContractForm({
                ...contractForm,
                employeeId: selectedId,
                employeeName: fullName,
              });
            }}
          >
            {allEmployees.map((emp) => {
              const empId = emp.id || emp._id;
              const empName = `${emp.firstName || emp.name || ''} ${emp.lastName || ''}`.trim();
              const code = emp.employeeCode ? ` (${emp.employeeCode})` : '';
              return (
                <option key={empId} value={empId}>
                  {empName}{code}
                </option>
              );
            })}
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
              <option value="CANCELLED">CANCELLED</option>
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

      {/* Form View of One Contract Modal (Popup) */}
      <ContractFormViewModal
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        contract={selectedContract}
        onSave={(data) => updateContractMutation.mutate(data)}
        isSaving={updateContractMutation.isPending}
      />
    </div>
  );
}
