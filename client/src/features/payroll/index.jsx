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
  AlertTriangle,
  FileText,
  Sliders,
  Layers,
} from 'lucide-react';

export default function PayrollFeature() {
  const queryClient = useQueryClient();
  const { role, hasAccess } = useAuth();

  const canEditSalaryRules = hasAccess([ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER]);
  const canOperatePayroll = hasAccess([ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER]);

  const [activeTab, setActiveTab] = useState('payruns'); // 'payruns' | 'structures' | 'payslips'
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedPayrunId, setSelectedPayrunId] = useState('pr-2026-09');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // New Rule Form State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    code: 'BONUS',
    name: 'Quarterly Performance Bonus',
    category: 'ALLOWANCE',
    calculationType: 'FIXED',
    sequence: 6,
    amount: 500,
    percentage: 0,
    formula: '',
  });

  const { data: structures = [] } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: fetchSalaryStructures,
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['salaryRules'],
    queryFn: () => fetchSalaryRules('str-tech-1'),
  });

  const { data: payruns = [], isLoading: isPayrunsLoading } = useQuery({
    queryKey: ['payruns'],
    queryFn: fetchPayruns,
  });

  const { data: currentPayrun, isLoading: isCurrentPayrunLoading } = useQuery({
    queryKey: ['payrunDetail', selectedPayrunId],
    queryFn: () => fetchPayrunById(selectedPayrunId),
    enabled: !!selectedPayrunId,
  });

  const { data: payslips = [], isLoading: isPayslipsLoading } = useQuery({
    queryKey: ['payslips', selectedPayrunId],
    queryFn: () => fetchPayslipsByPayrun(selectedPayrunId),
    enabled: !!selectedPayrunId,
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

  const createRuleMutation = useMutation({
    mutationFn: createSalaryRule,
    onSuccess: () => {
      queryClient.invalidateQueries(['salaryRules']);
      setIsRuleModalOpen(false);
    },
  });

  const hasBlockingWarnings = currentPayrun?.warnings?.some((w) => w.severity === 'BLOCKING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Operations & Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic salary rule engine, two-step payrun wizard, blocking warnings, and payslips
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
          {/* Active Payrun Banner & Actions */}
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
                  <div className="flex items-center gap-2">
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
                      disabled={
                        currentPayrun.status !== 'COMPUTED' || hasBlockingWarnings
                      }
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
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    Calculated Payslips ({payslips.length} Employees)
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Base Wage</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead className="text-right">Breakdown</TableHead>
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
                          <TableCell className="font-mono text-rose-600">
                            -{formatCurrency(ps.deductions)}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-emerald-700">
                            {formatCurrency(ps.net)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={FileText}
                              onClick={() => setSelectedPayslip(ps)}
                            >
                              View Lines
                            </Button>
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
              title="Sequenced Salary Rules (Standard Tech Structure)"
              subtitle="Ordered execution sequence: FIXED → PERCENTAGE → CONSTRAINED FORMULA"
              action={
                canEditSalaryRules ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={() => setIsRuleModalOpen(true)}
                  >
                    Add Salary Rule
                  </Button>
                ) : (
                  <Badge status="LOCKED" variant="WARNING">
                    Read-Only (Payroll User)
                  </Badge>
                )
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
                {rules
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-bold text-slate-800">{r.sequence}</TableCell>
                      <TableCell className="font-mono font-bold text-emerald-700">[{r.code}]</TableCell>
                      <TableCell className="font-semibold text-slate-900">{r.name}</TableCell>
                      <TableCell>
                        <Badge
                          status={r.category}
                          variant={
                            r.category === 'BASIC'
                              ? 'COMPUTED'
                              : r.category === 'ALLOWANCE'
                              ? 'PAID'
                              : 'REFUSED'
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{r.calculationType}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-800">
                        {r.calculationType === 'PERCENTAGE'
                          ? `${r.percentage}% of Base`
                          : r.calculationType === 'FORMULA'
                          ? r.formula
                          : formatCurrency(r.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Line</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Computed Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPayslip.ruleLines?.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <p className="font-semibold text-slate-900 leading-tight">{line.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">[{line.code}]</p>
                    </TableCell>
                    <TableCell>
                      <Badge status={line.category} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{line.calculationType}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-900">
                      {formatCurrency(line.total)}
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
              createRuleMutation.mutate(ruleForm);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Rule Code"
                value={ruleForm.code}
                onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value })}
                required
              />
              <Input
                label="Sequence #"
                type="number"
                value={ruleForm.sequence}
                onChange={(e) => setRuleForm({ ...ruleForm, sequence: Number(e.target.value) })}
                required
              />
            </div>

            <Input
              label="Rule Name"
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
                <option value="ALLOWANCE">ALLOWANCE</option>
                <option value="DEDUCTION">DEDUCTION</option>
              </Select>
              <Select
                label="Calculation Type"
                value={ruleForm.calculationType}
                onChange={(e) => setRuleForm({ ...ruleForm, calculationType: e.target.value })}
              >
                <option value="FIXED">FIXED</option>
                <option value="PERCENTAGE">PERCENTAGE</option>
                <option value="FORMULA">FORMULA</option>
              </Select>
            </div>

            {ruleForm.calculationType === 'FIXED' && (
              <Input
                label="Fixed Amount ($)"
                type="number"
                value={ruleForm.amount}
                onChange={(e) => setRuleForm({ ...ruleForm, amount: Number(e.target.value) })}
                required
              />
            )}

            {ruleForm.calculationType === 'PERCENTAGE' && (
              <Input
                label="Percentage of Base (%)"
                type="number"
                value={ruleForm.percentage}
                onChange={(e) => setRuleForm({ ...ruleForm, percentage: Number(e.target.value) })}
                required
              />
            )}

            {ruleForm.calculationType === 'FORMULA' && (
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
              <Button type="submit" variant="primary" size="sm">
                Save Salary Rule
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
