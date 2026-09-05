import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import { ArrowLeft, Save, Plus, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function ContractFormView({
  contract,
  allEmployees = [],
  schedules = [],
  onSave,
  onCancel,
  isPending = false,
  onNewContract,
}) {
  const [formData, setFormData] = useState({
    contractCode: contract?.contractCode || 'CON/2026/0042',
    employeeId: contract?.employeeId || allEmployees[0]?.id || '',
    employeeName: contract?.employeeName || (allEmployees[0] ? `${allEmployees[0].firstName || allEmployees[0].name} ${allEmployees[0].lastName || ''}`.trim() : 'Aarav Mehta'),
    department: contract?.department || contract?.departmentId?.name || 'Finance',
    position: contract?.position || contract?.jobPosition || 'Payroll Specialist',
    startDate: contract?.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : '2026-01-01',
    endDate: contract?.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : '',
    wage: contract?.wage || 85000,
    workingSchedule: contract?.workingSchedule || '40 Hours / Week',
    salaryStructure: contract?.salaryStructure || 'Employee Salary',
    notes: contract?.notes || 'This running contract is the source for payroll calculation in the active period.',
    status: contract?.status || 'ACTIVE',
  });

  useEffect(() => {
    if (contract) {
      const emp = allEmployees.find((e) => (e.id || e._id) === contract.employeeId);
      setFormData({
        contractCode: contract.contractCode || 'CON/2026/0042',
        employeeId: contract.employeeId || emp?.id || '',
        employeeName: contract.employeeName || (emp ? `${emp.firstName || emp.name} ${emp.lastName || ''}`.trim() : 'Aarav Mehta'),
        department: contract.department || emp?.department || 'Finance',
        position: contract.position || emp?.jobTitle || 'Payroll Specialist',
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : '2026-01-01',
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : '',
        wage: contract.wage || 85000,
        workingSchedule: contract.workingSchedule || '40 Hours / Week',
        salaryStructure: contract.salaryStructure || 'Employee Salary',
        notes: contract.notes || 'This running contract is the source for payroll calculation in the active period.',
        status: contract.status || 'ACTIVE',
      });
    }
  }, [contract, allEmployees]);

  const handleEmployeeChange = (e) => {
    const selectedId = e.target.value;
    const emp = allEmployees.find((x) => (x.id || x._id) === selectedId);
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        employeeId: selectedId,
        employeeName: `${emp.firstName || emp.name || ''} ${emp.lastName || ''}`.trim(),
        department: emp.department || emp.departmentId?.name || prev.department || 'Finance',
        position: emp.jobTitle || emp.jobPosition || prev.position || 'Payroll Specialist',
      }));
    } else {
      setFormData((prev) => ({ ...prev, employeeId: selectedId }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb Bar matching exact wireframe text */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Contract / <span className="text-emerald-700 font-mono">{formData.contractCode}</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              formData.status === 'ACTIVE' || formData.status === 'Running'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : formData.status === 'DRAFT'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {formData.status === 'ACTIVE' ? 'Running' : formData.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">Form view of one contract</p>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onCancel}>
              Back to List
            </Button>
          )}
          {onNewContract && (
            <Button variant="subtle" size="sm" icon={Plus} onClick={onNewContract}>
              New Contract
            </Button>
          )}
          <Button variant="primary" size="sm" icon={Save} isLoading={isPending} onClick={handleSubmit}>
            Save Contract
          </Button>
        </div>
      </div>

      {/* Main 2-Column Form Card matching the reference wireframe layout */}
      <Card className="p-6 space-y-6 border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* Left Column */}
            <div className="space-y-4">
              <Select
                label="Employee"
                value={formData.employeeId}
                onChange={handleEmployeeChange}
                required
              >
                {allEmployees.map((emp) => {
                  const empId = emp.id || emp._id;
                  const name = `${emp.firstName || emp.name || ''} ${emp.lastName || ''}`.trim();
                  return (
                    <option key={empId} value={empId}>
                      {name} {emp.employeeCode ? `(${emp.employeeCode})` : ''}
                    </option>
                  );
                })}
              </Select>

              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />

              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                helperText="Leave blank or '--' for open-ended contracts"
              />

              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Running (Active)</option>
                <option value="DRAFT">Draft</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Input
                label="Department"
                placeholder="e.g. Finance"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />

              <Input
                label="Job Position"
                placeholder="e.g. Payroll Specialist"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              />

              <div className="w-full space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Wage / Month
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <Select
                label="Working Schedule"
                value={formData.workingSchedule}
                onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
              >
                <option value="40 Hours / Week">40 Hours / Week</option>
                <option value="Night Shift">Night Shift</option>
                <option value="Retail Weekend">Retail Weekend</option>
                <option value="Flexible Hybrid">Flexible Hybrid</option>
                <option value="Part-time 20h">Part-time 20h</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Salary Structure / Notes Container Box */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Salary Structure / Notes
            </h4>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Structure Type:
                </label>
                <input
                  type="text"
                  value={formData.salaryStructure}
                  onChange={(e) => setFormData({ ...formData, salaryStructure: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Contract Notes:
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Useful Note Footer matching exact wireframe text */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 italic">
            <span>Useful note: for the problem statement, one employee should not have multiple Running contracts for the same period.</span>
            <span className="font-mono text-[11px] text-slate-400 font-normal">PeoplePay HR v2.4</span>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm" isLoading={isPending} icon={Save}>
              Save Contract
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
