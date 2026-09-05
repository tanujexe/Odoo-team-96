import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, ROLES } from '../../app/auth/AuthContext';
import {
  fetchSalaryStructures,
  fetchSalaryRules,
  createSalaryRule,
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
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { WarningPanel } from '../../components/WarningPanel';
import { PayrunWizard } from '../../components/PayrunWizard';
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
  AlertTriangle,
  FileText,
  Sliders,
  Layers,
  Check,
} from 'lucide-react';

export default function PayrollFeature() {
  const queryClient = useQueryClient();
  const { role, hasAccess } = useAuth();

  const canEditSalaryRules = hasAccess([ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER]);
  const canOperatePayroll = hasAccess([ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER]);

  const [activeTab, setActiveTab] = useState('payruns');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedPayrunId, setSelectedPayrunId] = useState('pr-2026-09');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [bulkSendResults, setBulkSendResults] = useState(null);
  const [isBulkSendModalOpen, setIsBulkSendModalOpen] = useState(false);

  // New Rule Form State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [ruleForm, setRuleForm] = useState({
    salaryStructureId: '',
    code: '',
    name: '',
    category: 'ALW',
    computationType: 'FIXED',
    sequence: 1,
    fixedAmount: 0,
    amount: 0,
    percentage: 0,
    formula: '',
  });

  const { data: structures = [] } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: fetchSalaryStructures,
  });

  const activeStructureId =
    selectedStructureId ||
    structures[0]?._id ||
    structures[0]?.id ||
    'str-tech-1';

  const { data: rules = [] } = useQuery({
    queryKey: ['salaryRules', activeStructureId],
    queryFn: () => fetchSalaryRules(activeStructureId),
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
      // Update local delivery status to SENT
      payslips.forEach((p) => {
        p.deliveryStatus = 'SENT';
      });
      queryClient.invalidateQueries(['payslips', selectedPayrunId]);
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: createSalaryRule,
    onSuccess: () => {
      queryClient.invalidateQueries(['salaryRules']);
      queryClient.invalidateQueries(['salaryRules', activeStructureId]);
      queryClient.invalidateQueries(['salaryStructures']);
      setIsRuleModalOpen(false);
    },
    onError: (err) => {
      alert(`Failed to save salary rule: ${err.message || 'Validation error'}`);
    },
  });

  const handleOpenAddRule = () => {
    setRuleForm({
      salaryStructureId: activeStructureId,
      code: '',
      name: '',
      category: 'ALW',
      computationType: 'FIXED',
      sequence: (rules?.length || 0) + 1,
      fixedAmount: 0,
      amount: 0,
      percentage: 0,
      formula: '',
    });
    setIsRuleModalOpen(true);
  };


  const hasBlockingWarnings = currentPayrun?.warnings?.some((w) => w.severity === 'BLOCKING');

  const handleDownloadPdf = (ps) => {
    downloadPayslipPdf(ps.id, `Payslip_${ps.employeeCode}_${ps.periodStart}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Operations & Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic salary rule engine, two-step payrun wizard, blocking warnings, and PDF delivery
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canOperatePayroll && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsWizardOpen(true)}
            >
              New Payrun Wizard
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('payruns')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'payruns'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payrun Batches & Detail
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'structures'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Salary Rules & Configuration
        </button>
      </div>

      {/* Payrun Batches Tab */}
      {activeTab === 'payruns' && (
        <div className="space-y-6">
          {currentPayrun && (
            <Card className="border-emerald-200 bg-white">
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
                        ['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID'].includes(currentPayrun.status) ? 'bg-emerald-600 text-white' : 'bg-slate-300'
                      }`}>1</span>
                      <span className="text-xs font-bold text-slate-800">DRAFT</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        ['COMPUTED', 'VALIDATED', 'PAID'].includes(currentPayrun.status) ? 'bg-emerald-600 text-white' : 'bg-slate-300'
                      }`}>2</span>
                      <span className="text-xs font-bold text-slate-800">COMPUTED</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        ['VALIDATED', 'PAID'].includes(currentPayrun.status) ? 'bg-emerald-600 text-white' : 'bg-slate-300'
                      }`}>3</span>
                      <span className="text-xs font-bold text-slate-800">VALIDATED</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentPayrun.status === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-slate-300'
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
                      isLoading={computeMutation.isPending}
                      disabled={currentPayrun.status === 'PAID'}
                      onClick={() => computeMutation.mutate()}
                    >
                      {currentPayrun.status === 'DRAFT' ? 'Compute' : 'Recompute'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={CheckCircle2}
                      isLoading={validateMutation.isPending}
                      disabled={currentPayrun.status !== 'COMPUTED' || hasBlockingWarnings}
                      onClick={() => validateMutation.mutate()}
                    >
                      Validate Payrun
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={DollarSign}
                      isLoading={payMutation.isPending}
                      disabled={currentPayrun.status !== 'VALIDATED'}
                      onClick={() => payMutation.mutate()}
                    >
                      Mark as Paid
                    </Button>

                    {currentPayrun.status === 'PAID' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Send}
                        isLoading={bulkSendMutation.isPending}
                        onClick={() => bulkSendMutation.mutate()}
                      >
                        Bulk Send Payslips
                      </Button>
                    )}
                  </div>
                </div>

                {/* Financial Totals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Payroll</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency(currentPayrun.totals?.totalGross || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Deductions</p>
                    <p className="text-2xl font-bold text-rose-700 mt-1">
                      {formatCurrency(currentPayrun.totals?.totalDeductions || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Net Disbursement</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                      {formatCurrency(currentPayrun.totals?.totalNet || 0)}
                    </p>
                  </div>
                </div>

                {/* Warning Diagnostic Panel */}
                <WarningPanel warnings={currentPayrun.warnings} />

                {/* Persisted Payslips Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Calculated Payslips ({payslips.length} Employees)
                    </h3>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Base Wage</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Delivery Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslips.map((ps) => (
                        <TableRow key={ps.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-slate-900">{ps.employeeName}</p>
                              <p className="text-xs text-slate-400 font-mono">{ps.employeeCode}</p>
                            </div>
                          </TableCell>
                          <TableCell>{ps.department}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(ps.baseWage)}</TableCell>
                          <TableCell className="font-mono font-semibold text-slate-900">
                            {formatCurrency(ps.gross)}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-emerald-700">
                            {formatCurrency(ps.net)}
                          </TableCell>
                          <TableCell>
                            <Badge status={ps.deliveryStatus || 'NOT_SENT'} />
                          </TableCell>
                          <TableCell className="text-right">
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
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Salary Structures & Rules Tab */}
      {activeTab === 'structures' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Sequenced Salary Rules & Structures"
              subtitle="Ordered execution sequence: FIXED → PERCENTAGE → CONSTRAINED FORMULA"
              action={
                <div className="flex items-center gap-3">
                  {structures.length > 0 && (
                    <select
                      aria-label="Select Salary Structure"
                      value={activeStructureId}
                      onChange={(e) => setSelectedStructureId(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {structures.map((s) => {
                        const sid = s._id || s.id;
                        return (
                          <option key={sid} value={sid}>
                            {s.name} ({s.code})
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {canEditSalaryRules ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={handleOpenAddRule}
                    >
                      Add Salary Rule
                    </Button>
                  ) : (
                    <Badge status="LOCKED" variant="WARNING">
                      Read-Only (Payroll User)
                    </Badge>
                  )}
                </div>
              }
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Seq</TableHead>
                  <TableHead>Rule Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value / Formula Expression</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                      No salary rules configured for this structure yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...rules]
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((r) => {
                      const rId = r._id || r.id;
                      const rType = r.computationType || r.calculationType || 'FIXED';
                      const rCategory =
                        r.category === 'ALW'
                          ? 'ALLOWANCE'
                          : r.category === 'DED'
                          ? 'DEDUCTION'
                          : r.category;
                      return (
                        <TableRow key={rId}>
                          <TableCell className="font-mono font-bold text-slate-800">{r.sequence}</TableCell>
                          <TableCell className="font-mono font-bold text-emerald-700">[{r.code}]</TableCell>
                          <TableCell className="font-semibold text-slate-900">{r.name}</TableCell>
                          <TableCell>
                            <Badge
                              status={rCategory}
                              variant={
                                rCategory === 'BASIC'
                                  ? 'COMPUTED'
                                  : rCategory === 'ALLOWANCE'
                                  ? 'PAID'
                                  : 'REFUSED'
                              }
                            />
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 font-mono">{rType}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-800">
                            {rType === 'PERCENTAGE'
                              ? `${r.percentage}% of Base`
                              : rType === 'FORMULA'
                              ? r.formula
                              : formatCurrency(r.fixedAmount ?? r.amount ?? 0)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </Card>
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
                <p className="text-base font-bold text-emerald-600">{formatCurrency(selectedPayslip.net)}</p>
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
                    <TableCell className="font-mono font-bold text-emerald-700">[{line.code}]</TableCell>
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
              <span className="font-mono font-extrabold text-emerald-700 text-lg">
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

      {/* Create Salary Rule Modal */}
      {isRuleModalOpen && (
        <Modal
          isOpen={isRuleModalOpen}
          onClose={() => setIsRuleModalOpen(false)}
          title="Add Salary Rule"
          description="Configure formula, fixed, or percentage salary components"
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createRuleMutation.mutate({
                ...ruleForm,
                salaryStructureId: activeStructureId,
                code: ruleForm.code.trim().toUpperCase(),
                name: ruleForm.name.trim(),
                sequence: Number(ruleForm.sequence) || 1,
                computationType: ruleForm.computationType || 'FIXED',
                calculationType: ruleForm.computationType || 'FIXED',
                fixedAmount:
                  ruleForm.computationType === 'FIXED'
                    ? Number(ruleForm.fixedAmount || ruleForm.amount || 0)
                    : 0,
                amount:
                  ruleForm.computationType === 'FIXED'
                    ? Number(ruleForm.fixedAmount || ruleForm.amount || 0)
                    : 0,
                percentage:
                  ruleForm.computationType === 'PERCENTAGE'
                    ? Number(ruleForm.percentage || 0)
                    : 0,
                formula: ruleForm.computationType === 'FORMULA' ? ruleForm.formula : '',
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Rule Code"
                placeholder="e.g. BONUS, HRA"
                value={ruleForm.code}
                onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value })}
                required
              />
              <Input
                label="Sequence #"
                type="number"
                min="1"
                value={ruleForm.sequence}
                onChange={(e) => setRuleForm({ ...ruleForm, sequence: Number(e.target.value) })}
                required
              />
            </div>

            <Input
              label="Rule Name"
              placeholder="e.g. Quarterly Performance Bonus"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category"
                value={ruleForm.category}
                onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
              >
                <option value="ALW">Allowance (ALW)</option>
                <option value="DED">Deduction (DED)</option>
                <option value="BASIC">Basic Salary (BASIC)</option>
                <option value="GROSS">Gross Addition (GROSS)</option>
                <option value="NET">Net Component (NET)</option>
              </Select>
              <Select
                label="Calculation Type"
                value={ruleForm.computationType || ruleForm.calculationType || 'FIXED'}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    computationType: e.target.value,
                    calculationType: e.target.value,
                  })
                }
              >
                <option value="FIXED">FIXED</option>
                <option value="PERCENTAGE">PERCENTAGE</option>
                <option value="FORMULA">FORMULA</option>
              </Select>
            </div>

            {(ruleForm.computationType === 'FIXED' || ruleForm.calculationType === 'FIXED') && (
              <Input
                label="Fixed Amount ($)"
                type="number"
                min="0"
                step="any"
                value={ruleForm.fixedAmount ?? ruleForm.amount ?? 0}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    fixedAmount: Number(e.target.value),
                    amount: Number(e.target.value),
                  })
                }
                required
              />
            )}

            {(ruleForm.computationType === 'PERCENTAGE' ||
              ruleForm.calculationType === 'PERCENTAGE') && (
              <Input
                label="Percentage of Base (%)"
                type="number"
                min="0"
                step="any"
                value={ruleForm.percentage}
                onChange={(e) => setRuleForm({ ...ruleForm, percentage: Number(e.target.value) })}
                required
              />
            )}

            {(ruleForm.computationType === 'FORMULA' ||
              ruleForm.calculationType === 'FORMULA') && (
              <Input
                label="Constrained Formula Expression"
                placeholder="e.g. (BASIC + HRA) * 0.05"
                value={ruleForm.formula}
                onChange={(e) => setRuleForm({ ...ruleForm, formula: e.target.value })}
                required
              />
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsRuleModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={createRuleMutation.isLoading}
              >
                {createRuleMutation.isLoading ? 'Saving...' : 'Save Salary Rule'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
