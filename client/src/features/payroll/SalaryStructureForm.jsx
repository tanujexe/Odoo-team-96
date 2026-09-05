import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { ArrowLeft, Plus, Save, Trash2, Edit, ChevronRight, Sliders } from 'lucide-react';

export function SalaryStructureForm({
  structure,
  rules = [],
  onBack,
  onSave,
  onAddRule,
  onSelectRule,
  onDeleteRule,
  onDeleteStructure,
  canEdit = true,
}) {
  const isNew = !structure || !structure._id && !structure.id;

  const [formData, setFormData] = useState({
    name: structure?.name || '',
    code: structure?.code || '',
    active: structure?.active !== false,
  });

  useEffect(() => {
    if (structure) {
      setFormData({
        name: structure.name || '',
        code: structure.code || '',
        active: structure.active !== false,
      });
    }
  }, [structure]);

  const sortedRules = [...rules].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Structure name is required');
      return;
    }
    const code =
      formData.code.trim().toUpperCase() ||
      formData.name.trim().toUpperCase().replace(/\s+/g, '_').slice(0, 10);
    onSave({
      ...formData,
      code,
    });
  };

  const formatCategoryBadge = (cat) => {
    const upper = (cat || '').toUpperCase();
    if (upper === 'BASIC') return { label: 'Basic', variant: 'COMPUTED' };
    if (upper === 'ALW' || upper === 'ALLOWANCE') return { label: 'Allowance', variant: 'PAID' };
    if (upper === 'GROSS') return { label: 'Gross', variant: 'ACTIVE' };
    if (upper === 'DED' || upper === 'DEDUCTION') return { label: 'Deduction', variant: 'REFUSED' };
    if (upper === 'NET') return { label: 'Net', variant: 'COMPUTED' };
    return { label: cat, variant: 'DEFAULT' };
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb (Wireframe Image 2: Salary Structure / Regular Salary) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
              title="Back to structures"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Salary Structure <span className="text-slate-400 font-normal">/</span>{' '}
              <span className="text-blue-600">{formData.name || (isNew ? 'New Structure' : 'Untitled')}</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium ml-7 mt-0.5">
            Form view with its salary rules
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
          {!isNew && onDeleteStructure && canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => onDeleteStructure(structure._id || structure.id)}
            >
              Delete
            </Button>
          )}
          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Structure
            </Button>
          )}
        </div>
      </div>

      {/* Main Structure Form Card */}
      <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Structure Name
              </label>
              <input
                type="text"
                placeholder="e.g. Regular Salary, Executive Structure"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Structure Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. REG_SAL"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Active
                </label>
                <select
                  value={formData.active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                >
                  <option value="true">True (Active)</option>
                  <option value="false">False (Inactive)</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Embedded Salary Rules Section (Wireframe Image 2) */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-blue-600 tracking-tight flex items-center gap-2">
                Salary Rules
              </h3>
              <p className="text-xs text-slate-500">
                Sequenced computation rules evaluated in order ({sortedRules.length} configured)
              </p>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={onAddRule}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Add Rule
              </Button>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <Table padding="p-0">
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="py-3 px-5 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                    Rule Name
                  </TableHead>
                  <TableHead className="py-3 px-5 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                    Code
                  </TableHead>
                  <TableHead className="py-3 px-5 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                    Category
                  </TableHead>
                  <TableHead className="py-3 px-5 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                    Sequence
                  </TableHead>
                  <TableHead className="w-20 py-3 px-4 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Sliders className="w-8 h-8 text-slate-300 mb-1.5" />
                        <p className="text-sm font-medium text-slate-600">No salary rules added yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Click "Add Rule" to configure calculation rules for this structure
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRules.map((rule) => {
                    const ruleId = rule._id || rule.id;
                    const catBadge = formatCategoryBadge(rule.category);
                    return (
                      <TableRow
                        key={ruleId}
                        onClick={() => onSelectRule(ruleId)}
                        className="cursor-pointer hover:bg-blue-50/40 transition-colors group"
                      >
                        <TableCell className="py-3.5 px-5 font-semibold text-slate-900 group-hover:text-blue-600">
                          {rule.name}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 font-mono font-bold text-slate-700 text-xs">
                          {rule.code}
                        </TableCell>
                        <TableCell className="py-3.5 px-5">
                          <Badge status={catBadge.label} variant={catBadge.variant} />
                        </TableCell>
                        <TableCell className="py-3.5 px-5 font-mono font-bold text-slate-800 text-sm">
                          {rule.sequence}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectRule(ruleId);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                              title="Edit rule"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {onDeleteRule && canEdit && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteRule(ruleId);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                title="Delete rule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors ml-1" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Useful Note Footer matching Image 2 wireframe */}
      <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-600">
        <p className="italic">
          <strong className="font-semibold not-italic text-slate-800">Useful note:</strong> rule order matters. Keep sequence visible so participants understand the calculation order. Rules created here are used for payslip computation.
        </p>
      </div>
    </div>
  );
}
