import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchContracts, createContract, updateContract, resolveContract } from '../../lib/api/contracts';
import { fetchSchedules, createSchedule } from '../../lib/api/schedules';
import { fetchEmployees } from '../../lib/api/employees';
import { mockEmployees } from '../../lib/api/mockData';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/States';
import { Pagination } from '../../components/ui/Pagination';
import { ScheduleEditor } from '../schedules/ScheduleEditor';
import { ContractFormView } from './ContractFormView';
import { ContractFormViewModal } from './ContractFormViewModal';
import { formatCurrency } from '../../lib/utils';
import {
  Plus,
  Search,
  AlertOctagon,
  Download,
  Filter,
  Bell,
  Settings,
  Info,
} from 'lucide-react';

/* Helper to format short date string as 'Jan 9, 2026' */
function fmtContractDate(dateStr) {
  if (!dateStr) return '— (Indefinite)';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en', { month: 'short' }) + ' ' + d.getDate() + ', ' + d.getFullYear();
}

/* Avatar initial colors palette */
const AVATAR_COLORS = [
  { bg: '#DCE7FE', text: '#2563EB' },
  { bg: '#E0E7FF', text: '#4F46E5' },
  { bg: '#F3E8FF', text: '#9333EA' },
  { bg: '#FEE2E2', text: '#DC2626' },
  { bg: '#ECFDF5', text: '#059669' },
  { bg: '#FEF3C7', text: '#D97706' },
];

export default function ContractsFeature() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const filteredEmployeeId = searchParams.get('employeeId') || '';

  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts' | 'schedules' | 'resolver'
  const [contractSubView, setContractSubView] = useState('list'); // 'list' | 'form'
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractStatusFilter, setContractStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'EXPIRED'
  const [contractSearchTerm, setContractSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: contracts = [], isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts', { employeeId: filteredEmployeeId }],
    queryFn: () => fetchContracts({ employeeId: filteredEmployeeId }),
  });

  const activeCount = React.useMemo(() => {
    return contracts.filter((c) => c.status === 'ACTIVE' || c.status === 'RUNNING' || !c.status).length;
  }, [contracts]);

  const expiredCount = React.useMemo(() => {
    return contracts.filter((c) => c.status === 'EXPIRED' || c.status === 'SUPERSEDED' || c.isPrior).length;
  }, [contracts]);

  React.useEffect(() => { setCurrentPage(1); }, [contractSearchTerm, contractStatusFilter]);

  const filteredContractsList = React.useMemo(() => {
    return contracts.filter((c) => {
      const codeStr = (c.contractCode || c.id || '').toLowerCase();
      const empStr = (c.employeeName || c.employeeCode || '').toLowerCase();
      const search = contractSearchTerm.toLowerCase();
      const matchesSearch = !search || codeStr.includes(search) || empStr.includes(search);

      if (!matchesSearch) return false;

      if (contractStatusFilter === 'ACTIVE') {
        return c.status === 'ACTIVE' || c.status === 'RUNNING' || !c.status;
      }
      if (contractStatusFilter === 'EXPIRED') {
        return c.status === 'EXPIRED' || c.status === 'SUPERSEDED' || c.isPrior;
      }
      return true;
    });
  }, [contracts, contractSearchTerm, contractStatusFilter]);

  const { data: serverEmployees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(),
  });

  const paginatedContracts = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContractsList.slice(start, start + pageSize);
  }, [filteredContractsList, currentPage, pageSize]);

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

  // Working Schedule State
  const [scheduleSubTab, setScheduleSubTab] = useState('list'); // 'list' | 'calendar'
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Resolver widget state
  const [resolverEmployeeId, setResolverEmployeeId] = useState(mockEmployees[0]?.id || '');
  const [resolverStart, setResolverStart] = useState('2026-09-01');
  const [resolverEnd, setResolverEnd] = useState('2026-09-30');
  const [resolvedResult, setResolvedResult] = useState(null);

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
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Contracts</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-100/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            List view of employee contracts and period-aware governance
            <span className="hidden"> • Employment Contracts &amp; Working Schedules</span>
          </p>
        </div>

        {/* Top Right Controls & Cycle Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Jan 2026 Cycle</span>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-slate-500" />
            <span>Alerts</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#E0533C] text-white text-[10px] font-bold">2</span>
          </button>

          <button
            type="button"
            className="p-2 rounded-full bg-white border border-slate-200/80 text-slate-600 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tabs (Contracts Registry, Working Schedules, Period Contract Resolver) */}
      <div className="flex border-b border-slate-200/80 gap-6 text-xs font-bold text-slate-400 pb-0.5">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 transition-all relative cursor-pointer ${
            activeTab === 'contracts'
              ? 'text-slate-900 font-extrabold border-b-2 border-slate-900 -mb-0.5'
              : 'hover:text-slate-700'
          }`}
        >
          Contracts Registry
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 transition-all relative cursor-pointer ${
            activeTab === 'schedules'
              ? 'text-slate-900 font-extrabold border-b-2 border-slate-900 -mb-0.5'
              : 'hover:text-slate-700'
          }`}
        >
          Working Schedules
        </button>
        <button
          onClick={() => setActiveTab('resolver')}
          className={`pb-3 transition-all relative cursor-pointer ${
            activeTab === 'resolver'
              ? 'text-slate-900 font-extrabold border-b-2 border-slate-900 -mb-0.5'
              : 'hover:text-slate-700'
          }`}
        >
          Period Contract Resolver
        </button>
      </div>

      {/* Contracts Tab Container */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Left Primary Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenNewContractForm}
                className="px-4 py-2 rounded-full bg-[#E0533C] hover:bg-[#CD442E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <span className="font-extrabold text-sm">+</span>
                <span>+ New Contract</span>
              </button>
            </div>

            {/* Right Status Filter Pills */}
            <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-100/60 p-1 rounded-full border border-slate-200/60">
              <button
                type="button"
                onClick={() => setContractStatusFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  contractStatusFilter === 'ALL'
                    ? 'bg-[#1A1D20] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Contracts ({contracts.length})
              </button>
              <button
                type="button"
                onClick={() => setContractStatusFilter('ACTIVE')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  contractStatusFilter === 'ACTIVE'
                    ? 'bg-[#1A1D20] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setContractStatusFilter('EXPIRED')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  contractStatusFilter === 'EXPIRED'
                    ? 'bg-[#1A1D20] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expired ({expiredCount})
              </button>
            </div>
          </div>

          {/* Search, Filter & Export Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search contracts by code, employee..."
                value={contractSearchTerm}
                onChange={(e) => setContractSearchTerm(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-slate-200/80 rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-400 border border-slate-200 px-1 rounded">⌘K</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 shadow-2xs cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter</span>
              </button>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table or Form Subview */}
          {contractSubView === 'list' ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
              {isContractsLoading ? (
                <LoadingState message="Loading contracts..." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#FAF8F5]/60 text-slate-400 text-[10px] font-extrabold tracking-wider uppercase">
                        <th className="py-3.5 px-4 w-10">
                          <input type="checkbox" className="rounded border-slate-300 text-slate-900 focus:ring-0" />
                        </th>
                        <th className="py-3.5 px-4">CONTRACT CODE</th>
                        <th className="py-3.5 px-4">EMPLOYEE</th>
                        <th className="py-3.5 px-4">DEPARTMENT &amp; ROLE</th>
                        <th className="py-3.5 px-4">START DATE</th>
                        <th className="py-3.5 px-4">END DATE</th>
                        <th className="py-3.5 px-4">WAGE / MONTH</th>
                        <th className="py-3.5 px-4">SALARY STRUCTURE</th>
                        <th className="py-3.5 px-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-xs">
                      {paginatedContracts.map((cnt, idx) => {
                        const code = cnt.contractCode || (cnt.id ? `CON/2026/00${String(cnt.id).slice(-2)}` : 'CON/2026/0042');
                        const isPrior = cnt.status === 'EXPIRED' || cnt.status === 'SUPERSEDED' || cnt.isPrior;
                        const ac = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const empName = cnt.employeeName || 'Unassigned Employee';
                        const initials = empName.split(' ').map((n) => n[0]).join('').slice(0, 3);
                        
                        return (
                          <tr
                            key={cnt.id || cnt._id || idx}
                            onClick={() => {
                              setSelectedContract(cnt);
                              setContractSubView('form');
                            }}
                            className={`cursor-pointer transition-colors ${
                              isPrior ? 'bg-slate-50/40 text-slate-400 hover:bg-slate-50' : 'hover:bg-slate-50/80 text-slate-800'
                            }`}
                          >
                            <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="rounded border-slate-300 text-slate-900 focus:ring-0" />
                            </td>

                            {/* Contract Code */}
                            <td className="py-4 px-4 font-mono font-bold text-[#2563EB]">
                              <span className="flex items-center gap-1.5">
                                <span>{code}</span>
                                {isPrior && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[10px] font-normal">
                                    Prior
                                  </span>
                                )}
                              </span>
                            </td>

                            {/* Employee */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                                  style={isPrior ? { background: '#E2E8F0', color: '#64748B' } : { background: ac.bg, color: ac.text }}
                                >
                                  {initials}
                                </div>
                                <div>
                                  <p className={`font-bold ${isPrior ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                    {empName}
                                  </p>
                                  <p className="text-[11px] text-slate-400 font-mono">
                                    {cnt.employeeCode || 'EMP-0418'}
                                    {isPrior && <span className="ml-1 italic text-slate-400 font-sans">(Superseded on promotion)</span>}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Department & Role */}
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-800">{cnt.department || 'Finance'}</p>
                              <p className="text-slate-500 text-[11px]">{cnt.jobPosition || cnt.position || 'Payroll Specialist'}</p>
                            </td>

                            {/* Start Date */}
                            <td className="py-4 px-4 font-medium text-slate-700">
                              {fmtContractDate(cnt.startDate)}
                            </td>

                            {/* End Date */}
                            <td className="py-4 px-4 text-slate-500">
                              {fmtContractDate(cnt.endDate)}
                            </td>

                            {/* Wage / Month */}
                            <td className="py-4 px-4 font-mono font-extrabold text-slate-900">
                              ₹{Number(cnt.wage || 85000).toLocaleString('en-IN')}
                            </td>

                            {/* Salary Structure */}
                            <td className="py-4 px-4 font-medium text-slate-700">
                              {cnt.salaryStructure || cnt.salaryStructureName || 'Standard Executive Structure'}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedContract(cnt);
                                  setContractSubView('form');
                                }}
                                className="px-3.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Open Form
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination
                currentPage={currentPage}
                totalRecords={filteredContractsList.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : (
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

          {/* Period Governance Callout Note */}
          <div className="p-4 bg-[#FAF5ED] border border-amber-200/60 rounded-2xl flex items-center gap-3 text-xs text-slate-700 mt-4">
            <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-800 flex items-center justify-center text-xs font-extrabold shrink-0">
              i
            </span>
            <div>
              <strong className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block mb-0.5">
                PERIOD GOVERNANCE NOTE
              </strong>
              <p className="leading-relaxed">
                Retain contract history, but make the active <strong className="font-bold text-emerald-700">Running</strong> contract obvious because payroll depends on it for statutory salary calculation and active pay run disbursals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <Card className="border-slate-200 bg-white text-slate-900 shadow-sm rounded-xl overflow-hidden">
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
                          const isSelected = selectedSchedule?.id === sch.id;
                          const daysCount = sch.daysPerWeek || sch.workDays?.filter((d) => d.isWorkDay !== false).length || 5;
                          const hoursText = sch.hoursPerWeek || `${sch.calculatedWeeklyHours || 40}h`;
                          const statusStr = sch.status || 'Active';

                          return (
                            <tr
                              key={sch.id}
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

          <div className="lg:col-span-6">
            <ScheduleEditor
              initialSchedule={selectedSchedule || schedules[0]}
              onSave={(updated) => {
                scheduleMutation.mutate(updated);
                setSelectedSchedule(updated);
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
                    <p className="text-xs text-rose-700">{resolvedResult.warning.message}</p>
                    <p className="text-[11px] text-rose-600">Action: {resolvedResult.warning.actionRequired}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                    <p className="font-bold text-xs uppercase tracking-wider text-emerald-800">✓ Contract Successfully Resolved</p>
                    <p className="text-xs font-mono text-emerald-700">Contract ID: {resolvedResult.contractId}</p>
                    <p className="text-xs text-emerald-800 font-semibold">Wage: {formatCurrency(resolvedResult.wage)}</p>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Click 'Resolve Applicable Contract' to test resolution.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
