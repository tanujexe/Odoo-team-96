import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, ROLES } from '../../app/auth/AuthContext';
import {
  fetchSalaryStructures,
  fetchSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
  fetchSalaryRules,
  fetchSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
  fetchPayruns,
  fetchPayrunById,
  createPayrunApi,
  computePayrunApi,
  validatePayrunApi,
  markPayrunPaidApi,
  fetchPayslipsByPayrun,
} from '../../lib/api/payroll';
import { fetchEmployees } from '../../lib/api/employees';
import { mockPayruns } from '../../lib/api/mockData';
import { downloadPayslipPdf, bulkSendPayslipsApi } from '../../lib/api/dashboard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { WarningPanel } from '../../components/WarningPanel';
import { PayrunWizard } from '../../components/PayrunWizard';
import { SalaryStructuresList } from './SalaryStructuresList';
import { SalaryStructureForm } from './SalaryStructureForm';
import { SalaryRulesList } from './SalaryRulesList';
import { SalaryRuleForm } from './SalaryRuleForm';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Calculator,
  Play,
  CheckCircle2,
  DollarSign,
  Plus,
  ArrowRight,
  ArrowLeft,
  Download,
  Send,
  FileText,
  Search,
  SquarePen,
  Calendar,
} from 'lucide-react';

export default function PayrollFeature() {
  const queryClient = useQueryClient();
  const { role, hasAccess } = useAuth();

  const canEditSalaryRules = hasAccess([ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER]);
  const canOperatePayroll = hasAccess([ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER]);

  const [activeTab, setActiveTab] = useState('payruns'); // 'payruns' | 'structures' | 'rules'
  const [payrunViewMode, setPayrunViewMode] = useState('list'); // 'list' | 'detail'
  const [searchPayrunsQuery, setSearchPayrunsQuery] = useState('');
  const [selectedPayrunYear, setSelectedPayrunYear] = useState('2026');

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedPayrunId, setSelectedPayrunId] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [bulkSendResults, setBulkSendResults] = useState(null);
  const [isBulkSendModalOpen, setIsBulkSendModalOpen] = useState(false);

  // Salary Structure View State
  const [structureViewMode, setStructureViewMode] = useState('list'); // 'list' | 'form'
  const [activeStructureId, setActiveStructureId] = useState(null);

  // Salary Rule View State
  const [ruleViewMode, setRuleViewMode] = useState('list'); // 'list' | 'form'
  const [activeRuleId, setActiveRuleId] = useState(null);
  const [rulesStructureFilter, setRulesStructureFilter] = useState('ALL');
  const [previousNavigation, setPreviousNavigation] = useState(null);

  // Queries
  const { data: structures = [] } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: fetchSalaryStructures,
  });

  const { data: allRules = [] } = useQuery({
    queryKey: ['allSalaryRules'],
    queryFn: () => fetchSalaryRules(),
  });

  const { data: currentStructureRules = [] } = useQuery({
    queryKey: ['salaryRules', activeStructureId],
    queryFn: () => fetchSalaryRules(activeStructureId),
    enabled: !!activeStructureId,
  });

  const { data: payruns = [] } = useQuery({
    queryKey: ['payruns'],
    queryFn: fetchPayruns,
  });

  const { data: currentPayrunData } = useQuery({
    queryKey: ['payrunDetail', selectedPayrunId],
    queryFn: () => fetchPayrunById(selectedPayrunId),
    enabled: !!selectedPayrunId,
  });

  const currentPayrun = currentPayrunData?.payrun || currentPayrunData;
  const payslips = currentPayrunData?.payslips || [];
  const activePayrun = currentPayrun || payruns.find((p) => p.id === selectedPayrunId) || mockPayruns[0];

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(),
  });

  // Structure Mutations
  const createStructureMutation = useMutation({
    mutationFn: createSalaryStructure,
    onSuccess: (newStruct) => {
      queryClient.invalidateQueries(['salaryStructures']);
      setActiveStructureId(newStruct._id || newStruct.id);
      setStructureViewMode('form');
    },
    onError: (err) => {
      alert(`Failed to create structure: ${err.message || 'Validation error'}`);
    },
  });

  const updateStructureMutation = useMutation({
    mutationFn: ({ id, data }) => updateSalaryStructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['salaryStructures']);
      alert('Salary structure updated successfully');
    },
    onError: (err) => {
      alert(`Failed to update structure: ${err.message || 'Validation error'}`);
    },
  });

  const deleteStructureMutation = useMutation({
    mutationFn: deleteSalaryStructure,
    onSuccess: () => {
      queryClient.invalidateQueries(['salaryStructures']);
      setActiveStructureId(null);
      setStructureViewMode('list');
    },
    onError: (err) => {
      alert(`Cannot delete structure: ${err.message || 'Error occurred'}`);
    },
  });

  // Rule Mutations
  const createRuleMutation = useMutation({
    mutationFn: createSalaryRule,
    onSuccess: (newRule) => {
      queryClient.invalidateQueries(['allSalaryRules']);
      queryClient.invalidateQueries(['salaryRules']);
      queryClient.invalidateQueries(['salaryStructures']);
      if (previousNavigation?.tab === 'structures') {
        setActiveTab('structures');
        setStructureViewMode('form');
        setActiveStructureId(previousNavigation.structureId);
      } else {
        setRuleViewMode('list');
        setActiveRuleId(null);
      }
    },
    onError: (err) => {
      alert(`Failed to save salary rule: ${err.message || 'Validation error'}`);
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => updateSalaryRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allSalaryRules']);
      queryClient.invalidateQueries(['salaryRules']);
      queryClient.invalidateQueries(['salaryStructures']);
      alert('Salary rule updated successfully');
      if (previousNavigation?.tab === 'structures') {
        setActiveTab('structures');
        setStructureViewMode('form');
        setActiveStructureId(previousNavigation.structureId);
      } else {
        setRuleViewMode('list');
        setActiveRuleId(null);
      }
    },
    onError: (err) => {
      alert(`Failed to update rule: ${err.message || 'Validation error'}`);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteSalaryRule,
    onSuccess: () => {
      queryClient.invalidateQueries(['allSalaryRules']);
      queryClient.invalidateQueries(['salaryRules']);
      queryClient.invalidateQueries(['salaryStructures']);
      if (previousNavigation?.tab === 'structures') {
        setActiveTab('structures');
        setStructureViewMode('form');
        setActiveStructureId(previousNavigation.structureId);
      } else {
        setRuleViewMode('list');
        setActiveRuleId(null);
      }
    },
    onError: (err) => {
      alert(`Failed to delete rule: ${err.message || 'Error occurred'}`);
    },
  });

  // Payrun Operations Mutations
  const createPayrunMutation = useMutation({
    mutationFn: createPayrunApi,
    onSuccess: (newRun) => {
      queryClient.invalidateQueries(['payruns']);
      setSelectedPayrunId(newRun.id || newRun._id);
      setIsWizardOpen(false);
      setPayrunViewMode('detail');
    },
    onError: (err) => {
      alert(`Failed to create payrun: ${err.message || 'Error occurred'}`);
    },
  });

  const computeMutation = useMutation({
    mutationFn: () => computePayrunApi(selectedPayrunId),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrunDetail', selectedPayrunId]);
      queryClient.invalidateQueries(['payslips', selectedPayrunId]);
      queryClient.invalidateQueries(['payruns']);
    },
  });

  const validateMutation = useMutation({
    mutationFn: () => validatePayrunApi(selectedPayrunId),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrunDetail', selectedPayrunId]);
      queryClient.invalidateQueries(['payruns']);
    },
    onError: (err) => {
      alert(`Validation Blocked: ${err.message}`);
    },
  });

  const payMutation = useMutation({
    mutationFn: () => markPayrunPaidApi(selectedPayrunId),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrunDetail', selectedPayrunId]);
      queryClient.invalidateQueries(['payslips', selectedPayrunId]);
      queryClient.invalidateQueries(['payruns']);
    },
  });

  const bulkSendMutation = useMutation({
    mutationFn: () => bulkSendPayslipsApi(selectedPayrunId),
    onSuccess: (res) => {
      setBulkSendResults(res);
      setIsBulkSendModalOpen(true);
      queryClient.invalidateQueries(['payrunDetail', selectedPayrunId]);
      queryClient.invalidateQueries(['payslips', selectedPayrunId]);
    },
  });

  const handleDownloadPdf = (ps) => {
    downloadPayslipPdf(ps.id || ps._id, `Payslip_${ps.employeeCode || 'EMP'}_${ps.periodStart || 'period'}.pdf`);
  };

  const currentSelectedStructure = structures.find(
    (s) => (s._id || s.id) === activeStructureId
  );

  const currentSelectedRule = allRules.find(
    (r) => (r._id || r.id) === activeRuleId
  );

  // Navigation handlers
  const handleOpenStructureForm = (structureId) => {
    setActiveStructureId(structureId);
    setStructureViewMode('form');
  };

  const handleOpenNewStructure = () => {
    setActiveStructureId(null);
    setStructureViewMode('form');
  };

  const handleSaveStructure = (formData) => {
    if (activeStructureId) {
      updateStructureMutation.mutate({ id: activeStructureId, data: formData });
    } else {
      createStructureMutation.mutate(formData);
    }
  };

  const handleOpenRuleFromStructure = (ruleId) => {
    setPreviousNavigation({ tab: 'structures', structureId: activeStructureId });
    setActiveRuleId(ruleId);
    setActiveTab('rules');
    setRuleViewMode('form');
  };

  const handleAddRuleFromStructure = () => {
    setPreviousNavigation({ tab: 'structures', structureId: activeStructureId });
    setActiveRuleId(null);
    setActiveTab('rules');
    setRuleViewMode('form');
  };

  const handleOpenRuleForm = (ruleId) => {
    setPreviousNavigation({ tab: 'rules' });
    setActiveRuleId(ruleId);
    setRuleViewMode('form');
  };

  const handleOpenNewRule = () => {
    setPreviousNavigation({ tab: 'rules' });
    setActiveRuleId(null);
    setRuleViewMode('form');
  };

  const handleSaveRule = (formData) => {
    if (activeRuleId) {
      updateRuleMutation.mutate({ id: activeRuleId, data: formData });
    } else {
      createRuleMutation.mutate(formData);
    }
  };

  const handleBackFromRuleForm = () => {
    if (previousNavigation?.tab === 'structures' && previousNavigation?.structureId) {
      setActiveTab('structures');
      setStructureViewMode('form');
      setActiveStructureId(previousNavigation.structureId);
    } else {
      setRuleViewMode('list');
      setActiveRuleId(null);
    }
  };

  // Payruns list filter
  const displayPayruns = payruns || [];

  const filteredPayruns = displayPayruns.filter((pr) => {
    const q = searchPayrunsQuery.toLowerCase().trim();
    const matchesQuery = !q || (pr.name || '').toLowerCase().includes(q);
    const matchesYear = !selectedPayrunYear || (pr.periodStart && pr.periodStart.startsWith(selectedPayrunYear)) || (pr.name || '').includes(selectedPayrunYear);
    return matchesQuery && matchesYear;
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => {
            setActiveTab('payruns');
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'payruns'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payruns
        </button>
        <button
          onClick={() => {
            setActiveTab('structures');
            setStructureViewMode('list');
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'structures'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Salary Structures
        </button>
        <button
          onClick={() => {
            setActiveTab('rules');
            setRuleViewMode('list');
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Salary Rules & Configuration
        </button>
      </div>

      {/* 1. PAYRUNS TAB */}
      {activeTab === 'payruns' && (
        <div className="space-y-6">
          {isWizardOpen && (
            <Modal
              isOpen={isWizardOpen}
              onClose={() => setIsWizardOpen(false)}
              size="2xl"
            >
              <PayrunWizard
                salaryStructures={structures}
                employees={employees}
                onCancel={() => setIsWizardOpen(false)}
                onComplete={(formData) => createPayrunMutation.mutate(formData)}
              />
            </Modal>
          )}

          {payrunViewMode === 'list' ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payruns</h1>
                <p className="text-sm text-slate-500 mt-0.5">Payrun view for payroll periods</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsWizardOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-lg text-xs tracking-wider"
                >
                  NEW
                </Button>

                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <input
                    type="text"
                    placeholder="Search payruns..."
                    value={searchPayrunsQuery}
                    onChange={(e) => setSearchPayrunsQuery(e.target.value)}
                    className="w-full px-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="px-3.5 py-1.5 bg-blue-50/70 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold">
                  {selectedPayrunYear}
                </div>
              </div>

              <div className="space-y-4">
                {filteredPayruns.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
                    <p className="text-slate-600 text-sm font-semibold">No payruns found.</p>
                    <p className="text-slate-400 text-xs mt-1">Click "NEW" above to start a new pay run batch.</p>
                  </div>
                ) : (
                  filteredPayruns.map((pr) => {
                    const prId = pr.id || pr._id;
                    const isPaid = pr.status === 'PAID';
                    const isValidated = pr.status === 'VALIDATED';
                    const warningsCount = pr.warningsCount !== undefined ? pr.warningsCount : (pr.warnings?.length || 0);
                    const startFormatted = pr.periodStart ? new Date(pr.periodStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '—';
                    const endFormatted = pr.periodEnd ? new Date(pr.periodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '—';

                    return (
                      <div
                        key={prId}
                        onClick={() => {
                          setSelectedPayrunId(prId);
                          setPayrunViewMode('detail');
                        }}
                        className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="min-w-[200px]">
                          <h3 className="text-lg font-bold text-slate-900">{pr.name}</h3>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {startFormatted} — {endFormatted}
                          </p>
                        </div>

                        <div className="text-xs font-semibold text-slate-700">
                          {pr.employeeCount !== undefined ? pr.employeeCount : (pr.employeeIds?.length || 0)} employees
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <div className={`text-xs font-bold ${
                              isPaid ? 'text-emerald-600' : isValidated ? 'text-blue-600' : 'text-slate-600'
                            }`}>
                              {isPaid ? 'Paid' : isValidated ? 'Validated' : 'Draft'}
                            </div>
                            <div className={`text-xs mt-0.5 font-medium ${warningsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                              {warningsCount > 0 ? `${warningsCount} warning${warningsCount > 1 ? 's' : ''}` : 'No warnings'}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Open Payrun"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPayrunId(prId);
                              setPayrunViewMode('detail');
                            }}
                          >
                            <SquarePen className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <p className="text-xs text-slate-600 font-medium italic mt-8">
                Useful note: each Payrun represents one payroll period and groups the payslips generated for that period.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPayrunViewMode('list')}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Back to Payruns List"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Payrun / {currentPayrun?.name || 'February 2026'}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 ml-7">
                    Open one Payrun to compute and manage its payslips
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => computeMutation.mutate()}
                    disabled={currentPayrun?.status === 'PAID' || computeMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 text-xs uppercase tracking-wider"
                  >
                    {computeMutation.isPending ? 'Computing...' : 'COMPUTE'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => validateMutation.mutate()}
                    disabled={currentPayrun?.status !== 'COMPUTED' || validateMutation.isPending}
                    className="border-slate-300 text-slate-800 font-bold px-5 text-xs uppercase tracking-wider hover:bg-slate-50"
                  >
                    {validateMutation.isPending ? 'Validating...' : 'VALIDATE'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => payMutation.mutate()}
                    disabled={currentPayrun?.status !== 'VALIDATED' || payMutation.isPending}
                    className="border-slate-300 text-slate-800 font-bold px-5 text-xs uppercase tracking-wider hover:bg-slate-50"
                  >
                    {payMutation.isPending ? 'Processing...' : 'MARK PAID'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => bulkSendMutation.mutate()}
                    disabled={bulkSendMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 text-xs uppercase tracking-wider shadow-sm"
                  >
                    {bulkSendMutation.isPending ? 'Sending...' : 'SEND PAYSLIPS'}
                  </Button>
                </div>
              </div>

              <Card className="border-slate-200 bg-white">
                <CardContent className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          ['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID'].includes(activePayrun?.status) ? 'bg-blue-600 text-white' : 'bg-slate-300'
                        }`}>1</span>
                        <span className="text-xs font-bold text-slate-800">DRAFT</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          ['COMPUTED', 'VALIDATED', 'PAID'].includes(activePayrun?.status) ? 'bg-blue-600 text-white' : 'bg-slate-300'
                        }`}>2</span>
                        <span className="text-xs font-bold text-slate-800">COMPUTED</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          ['VALIDATED', 'PAID'].includes(activePayrun?.status) ? 'bg-blue-600 text-white' : 'bg-slate-300'
                        }`}>3</span>
                        <span className="text-xs font-bold text-slate-800">VALIDATED</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          activePayrun?.status === 'PAID' ? 'bg-blue-600 text-white' : 'bg-slate-300'
                        }`}>4</span>
                        <span className="text-xs font-bold text-slate-800">PAID</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shadow-sm">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</label>
                      <div className="mt-1 text-xs font-semibold text-slate-800 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200">
                        {currentPayrun?.name || 'February 2026'}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Salary Structure</label>
                      <div className="mt-1 text-xs font-semibold text-slate-800 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200">
                        {currentPayrun?.salaryStructureId?.name || currentPayrun?.salaryStructureName || 'Regular Salary'}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Period</label>
                      <div className="mt-1 text-xs font-semibold text-slate-800 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200">
                        {currentPayrun?.periodStart ? new Date(currentPayrun.periodStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '01-Feb'} — {currentPayrun?.periodEnd ? new Date(currentPayrun.periodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '28-Feb'}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                      <div className="mt-1 text-xs font-semibold text-slate-800 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span>{currentPayrun?.status === 'PAID' ? 'Paid' : currentPayrun?.status === 'VALIDATED' ? 'Validated' : currentPayrun?.status === 'COMPUTED' ? 'Computed' : 'Draft'}</span>
                      </div>
                    </div>
                  </div>

                  {activePayrun?.warnings?.length > 0 && (
                    <WarningPanel warnings={activePayrun.warnings} />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Gross Pay</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">
                        {formatCurrency(activePayrun?.totals?.totalGross || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Deductions</p>
                      <p className="text-2xl font-black text-rose-600 mt-1">
                        -{formatCurrency(activePayrun?.totals?.totalDeductions || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                      <p className="text-xs uppercase font-bold text-blue-800 tracking-wider">Total Net Disbursement</p>
                      <p className="text-2xl font-black text-blue-700 mt-1">
                        {formatCurrency(activePayrun?.totals?.totalNet || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Payslips in this Payrun</h3>
                      <span className="text-xs text-slate-500 font-medium">
                        {payslips.length} payslip{payslips.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="py-3 px-5 font-semibold text-slate-700">Employee</TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-slate-700">Warning</TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-slate-700">Worked</TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-slate-700">Basic</TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-slate-700">Gross</TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-slate-700">Net</TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-slate-700">Status</TableHead>
                          <TableHead className="py-3 px-5 font-semibold text-slate-700 text-right">PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payslips.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                              No payslips generated yet. Click <span className="font-bold text-blue-600">COMPUTE</span> above to calculate payslips for eligible employees.
                            </TableCell>
                          </TableRow>
                        ) : (
                          payslips.map((ps) => (
                            <TableRow key={ps.id || ps._id} className="hover:bg-slate-50/80 transition-colors">
                              <TableCell className="py-3.5 px-5 font-semibold text-slate-900">
                                {ps.employeeName || ps.employeeId?.name || 'Employee'}
                              </TableCell>
                              <TableCell className="py-3.5 px-4">
                                {ps.warningLabel && ps.warningLabel !== '—' ? (
                                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    {ps.warningLabel}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="py-3.5 px-4 text-slate-700 font-medium">
                                {ps.workedDays ?? 0}
                              </TableCell>
                              <TableCell className="py-3.5 px-4 font-mono text-slate-800">
                                {formatCurrency(ps.basic || 0)}
                              </TableCell>
                              <TableCell className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                                {formatCurrency(ps.gross || 0)}
                              </TableCell>
                              <TableCell className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                {formatCurrency(ps.net || 0)}
                              </TableCell>
                              <TableCell className="py-3.5 px-4">
                                <span className={`text-xs font-bold ${
                                  ps.status === 'Done' || ps.status === 'PAID' ? 'text-emerald-600' : 'text-slate-500'
                                }`}>
                                  {ps.status === 'Done' || ps.status === 'PAID' ? 'Done' : (ps.status || 'Draft')}
                                </span>
                              </TableCell>
                              <TableCell className="py-3.5 px-5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPdf(ps)}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-bold hover:underline"
                                >
                                  PDF
                                </button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <p className="text-xs text-slate-600 font-medium italic mt-8">
                    Useful note: warnings such as missing account data or duplicate payslips should be visible before payroll is finalized.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* 2. SALARY STRUCTURES TAB */}
      {activeTab === 'structures' && (
        <div>
          {structureViewMode === 'list' ? (
            <SalaryStructuresList
              structures={structures}
              onSelectStructure={handleOpenStructureForm}
              onNewStructure={handleOpenNewStructure}
              canEdit={canEditSalaryRules}
            />
          ) : (
            <SalaryStructureForm
              structure={currentSelectedStructure}
              rules={currentStructureRules}
              onBack={() => setStructureViewMode('list')}
              onSave={handleSaveStructure}
              onAddRule={handleAddRuleFromStructure}
              onSelectRule={handleOpenRuleFromStructure}
              onDeleteRule={(ruleId) => deleteRuleMutation.mutate(ruleId)}
              onDeleteStructure={(structId) => deleteStructureMutation.mutate(structId)}
              canEdit={canEditSalaryRules}
            />
          )}
        </div>
      )}

      {/* 3. SALARY RULES TAB */}
      {activeTab === 'rules' && (
        <div>
          {ruleViewMode === 'list' ? (
            <SalaryRulesList
              rules={allRules}
              structures={structures}
              selectedStructureId={rulesStructureFilter}
              onSelectStructureFilter={setRulesStructureFilter}
              onSelectRule={handleOpenRuleForm}
              onNewRule={handleOpenNewRule}
              canEdit={canEditSalaryRules}
            />
          ) : (
            <SalaryRuleForm
              rule={currentSelectedRule}
              structures={structures}
              defaultStructureId={previousNavigation?.structureId || structures[0]?._id || structures[0]?.id}
              onBack={handleBackFromRuleForm}
              onSave={handleSaveRule}
              onDelete={(ruleId) => deleteRuleMutation.mutate(ruleId)}
              canEdit={canEditSalaryRules}
            />
          )}
        </div>
      )}

      {/* Payslip Rule Lines Modal */}
      {selectedPayslip && (
        <Modal
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          title={`Payslip Breakdown: ${selectedPayslip.employeeName}`}
          description={`Period: ${formatDate(selectedPayslip.periodStart)} – ${formatDate(selectedPayslip.periodEnd)} • ${selectedPayslip.employeeCode}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Pay</p>
                <p className="text-base font-bold text-slate-900">{formatCurrency(selectedPayslip.gross)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deductions</p>
                <p className="text-base font-bold text-rose-600">-{formatCurrency(selectedPayslip.deductions)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Payable</p>
                <p className="text-base font-bold text-blue-700">{formatCurrency(selectedPayslip.net)}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Rate / Base</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPayslip.ruleLines?.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono font-bold text-blue-700">[{line.code}]</TableCell>
                    <TableCell className="font-medium text-slate-900">{line.name}</TableCell>
                    <TableCell>
                      <Badge
                        status={line.category}
                        variant={
                          line.category === 'BASIC'
                            ? 'COMPUTED'
                            : line.category === 'ALLOWANCE' || line.category === 'ALW'
                            ? 'PAID'
                            : 'REFUSED'
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-slate-500">{line.rate || '-'}</TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${
                        line.category === 'DEDUCTION' || line.category === 'DED' ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {formatCurrency(line.amount || line.total || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-800">Final Net Disbursement:</span>
              <span className="font-mono font-extrabold text-blue-700 text-lg">
                {formatCurrency(selectedPayslip.net)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => handleDownloadPdf(selectedPayslip)}
              >
                Download PDF
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedPayslip(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Send Feedback Modal */}
      {isBulkSendModalOpen && bulkSendResults && (
        <Modal
          isOpen={isBulkSendModalOpen}
          onClose={() => setIsBulkSendModalOpen(false)}
          title="Bulk Payslip Dispatch Complete"
          description={`Delivery report for Payrun batch: ${selectedPayrunId}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  {bulkSendResults.sentCount} of {bulkSendResults.totalCount} Delivered
                </p>
                <p className="text-xs text-emerald-700">
                  All payslips dispatched via direct secure document delivery
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setIsBulkSendModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payrun Wizard Modal */}
      {isWizardOpen && (
        <Modal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          title="Create Scoped Payrun Batch"
          maxWidth="max-w-2xl"
        >
          <PayrunWizard
            salaryStructures={structures}
            employees={employees}
            onCancel={() => setIsWizardOpen(false)}
            onComplete={(payload) => createPayrunMutation.mutate(payload)}
          />
        </Modal>
      )}
    </div>
  );
}
