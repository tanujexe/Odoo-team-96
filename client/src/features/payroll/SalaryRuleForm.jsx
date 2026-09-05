import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Save, Edit, Trash2, Code2, Percent, DollarSign, Info } from 'lucide-react';

export function SalaryRuleForm({
  rule,
  structures = [],
  defaultStructureId,
  onBack,
  onSave,
  onDelete,
  canEdit = true,
}) {
  const isNew = !rule || (!rule._id && !rule.id);
  const [isEditing, setIsEditing] = useState(isNew);

  const [formData, setFormData] = useState({
    name: rule?.name || '',
    code: rule?.code || '',
    salaryStructureId:
      rule?.salaryStructureId?._id ||
      rule?.salaryStructureId?.id ||
      rule?.salaryStructureId ||
      defaultStructureId ||
      structures[0]?._id ||
      structures[0]?.id ||
      '',
    category: rule?.category || 'BASIC',
    computationType: rule?.computationType || rule?.calculationType || 'PERCENTAGE',
    percentage: rule?.percentage ?? (rule?.category === 'BASIC' ? 50 : 0),
    fixedAmount: rule?.fixedAmount ?? rule?.amount ?? 0,
    formula: rule?.formula || '',
    sequence: rule?.sequence ?? 1,
    quantity: rule?.quantity ?? 1,
    active: rule?.active !== false,
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        code: rule.code || '',
        salaryStructureId:
          rule.salaryStructureId?._id ||
          rule.salaryStructureId?.id ||
          rule.salaryStructureId ||
          defaultStructureId ||
          structures[0]?._id ||
          structures[0]?.id ||
          '',
        category: rule.category || 'BASIC',
        computationType: rule.computationType || rule.calculationType || 'PERCENTAGE',
        percentage: rule.percentage ?? (rule.category === 'BASIC' ? 50 : 0),
        fixedAmount: rule.fixedAmount ?? rule.amount ?? 0,
        formula: rule.formula || '',
        sequence: rule.sequence ?? 1,
        quantity: rule.quantity ?? 1,
        active: rule.active !== false,
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [rule, defaultStructureId, structures]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Rule name is required');
      return;
    }
    if (!formData.code.trim()) {
      alert('Rule code is required');
      return;
    }
    if (!formData.salaryStructureId) {
      alert('Salary Structure is required');
      return;
    }

    onSave({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      sequence: Number(formData.sequence) || 1,
      quantity: Number(formData.quantity) || 1,
      fixedAmount: Number(formData.fixedAmount) || 0,
      amount: Number(formData.fixedAmount) || 0,
      percentage: Number(formData.percentage) || 0,
    });
  };

  const selectedStructure = structures.find(
    (s) => (s._id || s.id) === formData.salaryStructureId
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb (Wireframe Image 4: Salary Rule / Basic Salary) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Salary Rule <span className="text-slate-400 font-normal">/</span>{' '}
              <span className="text-blue-600">{formData.name || (isNew ? 'New Rule' : 'Untitled')}</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium ml-7 mt-0.5">Form view — Configure formula, fixed, or percentage salary components</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
          {!isNew && onDelete && canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => onDelete(rule._id || rule.id)}
            >
              Delete
            </Button>
          )}
          {!isNew && !isEditing && canEdit && (
            <Button
              variant="primary"
              size="sm"
              icon={Edit}
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              EDIT
            </Button>
          )}
          {(isNew || isEditing) && canEdit && (
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Save Rule
            </Button>
          )}
        </div>
      </div>

      {/* Main Salary Rule Form Card (Wireframe Image 4) */}
      <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Two-Column Grid matching Wireframe Image 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* Left Column: Rule Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rule Name
              </label>
              <input
                type="text"
                placeholder="e.g. Basic Salary"
                value={formData.name}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-900 disabled:bg-slate-100/70 disabled:text-slate-700"
              />
            </div>

            {/* Right Column: Salary Structure */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Salary Structure
              </label>
              <select
                value={formData.salaryStructureId}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 disabled:bg-slate-100/70"
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
            </div>

            {/* Left Column: Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Code
              </label>
              <input
                type="text"
                placeholder="e.g. BASIC"
                value={formData.code}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold text-slate-800 disabled:bg-slate-100/70"
              />
            </div>

            {/* Right Column: Computation Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Computation
              </label>
              <select
                value={formData.computationType}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, computationType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 disabled:bg-slate-100/70"
              >
                <option value="PERCENTAGE">Percentage of Wage</option>
                <option value="FIXED">Fixed Amount</option>
                <option value="FORMULA">Python Code / Formula</option>
              </select>
            </div>

            {/* Left Column: Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 disabled:bg-slate-100/70"
              >
                <option value="BASIC">Basic (BASIC)</option>
                <option value="ALW">Allowance (ALW)</option>
                <option value="GROSS">Gross (GROSS)</option>
                <option value="DED">Deduction (DED)</option>
                <option value="NET">Net (NET)</option>
              </select>
            </div>

            {/* Right Column: Percentage (if Percentage of Wage) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="50%"
                  value={formData.percentage}
                  disabled={!isEditing || formData.computationType !== 'PERCENTAGE'}
                  onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-900 disabled:bg-slate-100/70 disabled:text-slate-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>

            {/* Left Column: Sequence */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sequence
              </label>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={formData.sequence}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, sequence: Number(e.target.value) })}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold text-slate-800 disabled:bg-slate-100/70"
              />
            </div>

            {/* Right Column: Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="1"
                value={formData.quantity}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 disabled:bg-slate-100/70"
              />
            </div>
          </div>

          {/* Section: Computation Options from the Source (Wireframe Image 4) */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-blue-600 mb-3 tracking-tight">
              Computation options from the source
            </h3>

            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-6 border-b border-slate-200 pb-3 text-xs font-semibold">
                <span
                  className={
                    formData.computationType === 'FIXED'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1 font-bold'
                      : 'text-slate-500'
                  }
                >
                  Fixed Amount
                </span>
                <span
                  className={
                    formData.computationType === 'PERCENTAGE'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1 font-bold'
                      : 'text-slate-500'
                  }
                >
                  Percentage of Wage
                </span>
                <span
                  className={
                    formData.computationType === 'FORMULA'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1 font-bold'
                      : 'text-slate-500'
                  }
                >
                  Python Code / Formula
                </span>
              </div>

              {/* Dynamic details based on computation type */}
              {formData.computationType === 'FIXED' && (
                <div className="space-y-3">
                  <div className="max-w-xs">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Fixed Amount ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.fixedAmount}
                        disabled={!isEditing}
                        onChange={(e) => setFormData({ ...formData, fixedAmount: Number(e.target.value) })}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-semibold"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    A static amount added or deducted uniformly per pay period.
                  </p>
                </div>
              )}

              {formData.computationType === 'PERCENTAGE' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-blue-900 space-y-1">
                    <p className="font-semibold">
                      Calculation Formula: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-blue-700">{formData.percentage}% × Contract Base Wage</code>
                    </p>
                    <p className="text-slate-600">
                      Evaluated directly from the employee's active contract wage.
                    </p>
                  </div>
                </div>
              )}

              {formData.computationType === 'FORMULA' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Formula Expression / Python Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BASIC + HRA or (BASIC + HRA) * 0.10 or GROSS - PF"
                      value={formData.formula}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-semibold"
                    />
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>
                      Example expressions: <code className="font-mono text-slate-700 font-semibold">result = categories['BASIC']</code> or <code className="font-mono text-slate-700 font-semibold">BASIC * 0.4</code> or <code className="font-mono text-slate-700 font-semibold">GROSS - PF - ESIC</code>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Useful Note Footer matching Image 4 wireframe */}
      <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-600">
        <p className="italic">
          <strong className="font-semibold not-italic text-slate-800">Useful note:</strong> a Salary Rule needs a clear computation method and category because these drive the lines displayed on the final payslip.
        </p>
      </div>
    </div>
  );
}
