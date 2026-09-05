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
  Download,
  Send,
  FileText,
} from 'lucide-react';

export default function PayrollFeature() {
  const queryClient = useQueryClient();
  const { role, hasAccess } = useAuth();

  const canEditSalaryRules = hasAccess([ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER]);
  const canOperatePayroll = hasAccess([ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER]);

  const [activeTab, setActiveTab] = useState('payruns'); // 'payruns' | 'structures' | 'rules'
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedPayrunId, setSelectedPayrunId] = useState('pr-2026-09');
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

  const { data: currentPayrun } = useQuery({
    queryKey: ['payrunDetail', selectedPayrunId],
    queryFn: () => fetchPayrunById(selectedPayrunId),
    enabled: !!selectedPayrunId,
  });

  const { data: payslips = [] } = useQuery({
    queryKey: ['payslips', selectedPayrunId],
    queryFn: () => fetchPayslipsByPayrun(selectedPayrunId),
    enabled: !!selectedPayrunId,
  });

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
      setSelectedPayrunId(newRun.id);
      setIsWizardOpen(false);
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
      payslips.forEach((p) => {
        p.deliveryStatus = 'SENT';
      });
      queryClient.invalidateQueries(['payslips', selectedPayrunId]);
    },
  });

  const handleDownloadPdf = (ps) => {
    downloadPayslipPdf(ps.id, `Payslip_${ps.employeeCode}_${ps.periodStart}.pdf`);
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

  return (
    <div className="space-y-6">
      {/* Module Title & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <Calculator className="w-5 h-5" />
            </span>
            Payroll Configuration & Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Salary structures, sequenced rule computations, and two-step payrun execution
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'payruns' && canOperatePayroll && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsWizardOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
            >
              New Payrun Wizard
            </Button>
          )}
        </div>
      </div>

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
          Payrun Batches & Detail
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

      {/* 1. PAYRUN BATCHES TAB */}
      {activeTab === 'payruns' && (
        <div className="space-y-6">
          {currentPayrun && (
            <Card className="border-blue-200 bg-white">
              <CardHeader
                title={currentPayrun.name}
                subtitle={`${currentPayrun.salaryStructureName} • Period: ${formatDate(currentPayrun.periodStart)} – ${formatDate(currentPayrun.periodEnd)}`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge status={currentPayrun.status} className="text-sm px-3 py-1" />
                  </div>
                }
              />
              <CardContent className="space-y-6">
                {/* State Transition Flow Bar */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        ['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID'].includes(currentPayrun.status) ? 'bg-blue-600 text-white' : 'bg-slate-300'
                      }`}>1</span>
                      <span className="text-xs font-bold text-slate-800">DRAFT</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        ['COMPUTED', 'VALIDATED', 'PAID'].includes(currentPayrun.status) ? 'bg-blue-600 text-white' : 'bg-slate-300'
                      }`}>2</span>
                      <span className="text-xs font-bold text-slate-800">COMPUTED</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        ['VALIDATED', 'PAID'].includes(currentPayrun.status) ? 'bg-blue-600 text-white' : 'bg-slate-300'
                      }`}>3</span>
                      <span className="text-xs font-bold text-slate-800">VALIDATED</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentPayrun.status === 'PAID' ? 'bg-blue-600 text-white' : 'bg-slate-300'
                      }`}>4</span>
                      <span className="text-xs font-bold text-slate-800">PAID</span>
                    </div>
                  </div>

                  {/* Operational Action Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Play}
                      onClick={() => computeMutation.mutate()}
                      disabled={currentPayrun.status === 'PAID' || computeMutation.isPending}
                    >
                      {computeMutation.isPending ? 'Computing...' : 'Compute Salary Rules'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => validateMutation.mutate()}
                      disabled={currentPayrun.status !== 'COMPUTED' || validateMutation.isPending}
                    >
                      {validateMutation.isPending ? 'Validating...' : 'Validate & Lock'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={DollarSign}
                      onClick={() => payMutation.mutate()}
                      disabled={currentPayrun.status !== 'VALIDATED' || payMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {payMutation.isPending ? 'Processing...' : 'Mark as Paid'}
                    </Button>
                    {currentPayrun.status === 'PAID' && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Send}
                        onClick={() => bulkSendMutation.mutate()}
                        disabled={bulkSendMutation.isPending}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        Bulk Send Payslips
                      </Button>
                    )}
                  </div>
                </div>

                {/* Warnings Banner */}
                {currentPayrun.warnings && currentPayrun.warnings.length > 0 && (
                  <WarningPanel warnings={currentPayrun.warnings} />
                )}

                {/* Payrun Totals Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Gross Pay</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {formatCurrency(currentPayrun.totals?.totalGross || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Deductions</p>
                    <p className="text-2xl font-black text-rose-600 mt-1">
                      -{formatCurrency(currentPayrun.totals?.totalDeductions || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                    <p className="text-xs uppercase font-bold text-blue-800 tracking-wider">Total Net Disbursement</p>
                    <p className="text-2xl font-black text-blue-700 mt-1">
                      {formatCurrency(currentPayrun.totals?.totalNet || 0)}
                    </p>
                  </div>
                </div>

                {/* Payslip Lines Table */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    Payslips in Batch ({payslips.length})
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="py-3 px-4">Employee</TableHead>
                          <TableHead className="py-3 px-4">Department</TableHead>
                          <TableHead className="py-3 px-4">Base Contract</TableHead>
                          <TableHead className="py-3 px-4">Gross</TableHead>
                          <TableHead className="py-3 px-4">Net</TableHead>
                          <TableHead className="py-3 px-4">Status</TableHead>
                          <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payslips.map((ps) => (
                          <TableRow key={ps.id}>
                            <TableCell className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{ps.employeeName}</div>
                              <div className="text-xs font-mono text-slate-400">{ps.employeeCode}</div>
                            </TableCell>
                            <TableCell className="text-slate-600 text-xs">{ps.department}</TableCell>
                            <TableCell className="font-mono text-xs">{formatCurrency(ps.baseWage)}</TableCell>
                            <TableCell className="font-mono font-semibold text-slate-900">
                              {formatCurrency(ps.gross)}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-blue-700">
                              {formatCurrency(ps.net)}
                            </TableCell>
                            <TableCell>
                              <Badge status={ps.deliveryStatus || 'NOT_SENT'} />
                            </TableCell>
                            <TableCell className="text-right py-3 px-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={FileText}
                                  onClick={() => setSelectedPayslip(ps)}
                                >
                                  Lines
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Download}
                                  title="Download Payslip PDF"
                                  onClick={() => handleDownloadPdf(ps)}
                                >
                                  PDF
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
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
