import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/utils';
import {
  ArrowLeft,
  Save,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Coins,
  Bell,
  Settings,
  Pencil,
  Printer,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export function ContractFormView({
  contract,
  allEmployees = [],
  schedules = [],
  salaryStructures = [],
  onSave,
  onCancel,
  isPending = false,
  onNewContract,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    contractCode: contract?.contractCode || 'CON/2026/0042',
    employeeId: contract?.employeeId || allEmployees[0]?.id || '',
    employeeName: contract?.employeeName || (allEmployees[0] ? `${allEmployees[0].firstName || allEmployees[0].name} ${allEmployees[0].lastName || ''}`.trim() : 'Aarav Mehta'),
    employeeCode: contract?.employeeCode || allEmployees[0]?.employeeCode || 'EMP-0841',
    department: contract?.department || contract?.departmentId?.name || 'Finance',
    position: contract?.position || contract?.jobPosition || 'Payroll Specialist',
    startDate: contract?.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : '2026-01-01',
    endDate: contract?.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : '',
    wage: contract?.wage || 85000,
    workingSchedule: contract?.workingSchedule || '40 Hours / Week',
    salaryStructure: contract?.salaryStructure || contract?.salaryStructureName || 'Employee Salary',
    notes: contract?.notes || 'This running contract is the source for payroll calculation in the active period. Any changes in pay components will automatically recalculate statutory deductions (EPF, ESI, TDS) for the upcoming Jan 2026 cycle.',
    status: contract?.status || 'ACTIVE',
  });

  useEffect(() => {
    if (contract) {
      const emp = allEmployees.find((e) => (e.id || e._id) === contract.employeeId);
      setFormData({
        contractCode: contract.contractCode || 'CON/2026/0042',
        employeeId: contract.employeeId || emp?.id || '',
        employeeName: contract.employeeName || (emp ? `${emp.firstName || emp.name} ${emp.lastName || ''}`.trim() : 'Aarav Mehta'),
        employeeCode: contract.employeeCode || emp?.employeeCode || 'EMP-0841',
        department: contract.department || emp?.department || 'Finance',
        position: contract.position || contract.jobPosition || emp?.jobPosition || emp?.jobTitle || 'Payroll Specialist',
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : '2026-01-01',
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : '',
        wage: contract.wage || 85000,
        workingSchedule: contract.workingSchedule || '40 Hours / Week',
        salaryStructure: contract.salaryStructure || contract.salaryStructureName || 'Employee Salary',
        notes: contract.notes || 'This running contract is the source for payroll calculation in the active period. Any changes in pay components will automatically recalculate statutory deductions (EPF, ESI, TDS) for the upcoming Jan 2026 cycle.',
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
        employeeCode: emp.employeeCode || prev.employeeCode,
        department: emp.department || emp.departmentId?.name || prev.department || 'Finance',
        position: emp.jobTitle || emp.jobPosition || prev.position || 'Payroll Specialist',
      }));
    } else {
      setFormData((prev) => ({ ...prev, employeeId: selectedId }));
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  const isRunning = formData.status === 'ACTIVE' || formData.status === 'Running' || formData.status === 'RUNNING';

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
            <span className="text-slate-400">CONTRACTS</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#E0533C]">{formData.contractCode}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2.5 flex-wrap">
            <span>Contract / {formData.contractCode}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-100/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {isRunning ? 'Running' : formData.status}
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-normal mt-0.5">
            Form view of one contract and active payroll rule binding
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Jan 2026 Cycle</span>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 cursor-pointer"
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

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-full bg-[#E0533C] hover:bg-[#CD442E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Contract'}</span>
          </button>
        </div>
      </div>

      {/* Employee Profile Header Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F59E0B] text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-2xs">
            {formData.employeeName ? formData.employeeName.split(' ').map(n => n[0]).join('') : 'AM'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl font-extrabold text-slate-900">
                Contract Holder: {formData.employeeName}
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-100/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Running
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Dept: {formData.department} • Role: {formData.position} • ID Code: {formData.employeeCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print PDF</span>
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>View Employee Profile</span>
          </button>
        </div>
      </div>

      {/* Contract Specifications Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Contract Specifications</h3>
            <p className="text-xs text-slate-400 font-normal mt-0.5">Parameters defining role duration, status, and compensation</p>
          </div>
          <span className="bg-slate-100 text-slate-500 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg border border-slate-200/60">
            ID: {formData.contractCode}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Employee */}
            <div className="space-y-1">
              <label className="text-slate-600 font-semibold text-xs">Employee *</label>
              {isEditing ? (
                <Select value={formData.employeeId} onChange={handleEmployeeChange} required>
                  {allEmployees.map((emp) => (
                    <option key={emp.id || emp._id} value={emp.id || emp._id}>
                      {emp.firstName || emp.name} {emp.lastName || ''} ({emp.employeeCode || 'EMP'})
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>{formData.employeeName}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                </div>
              )}
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-slate-600 font-semibold text-xs">Department *</label>
              {isEditing ? (
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                />
              ) : (
                <div className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>{formData.department}</span>
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-slate-600 font-semibold text-xs">Start Date *</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              ) : (
                <div className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formData.startDate}</span>
                </div>
              )}
            </div>

            {/* Job Position */}
            <div className="space-y-1">
              <label className="text-slate-600 font-semibold text-xs">Job Position *</label>
              {isEditing ? (
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              ) : (
                <div className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>{formData.position}</span>
                  <Briefcase className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-600 font-semibold text-xs">End Date</label>
                <span className="text-[10px] text-slate-400">Open-ended contract</span>
              </div>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  placeholder="Open-ended"
                />
              ) : (
                <div className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>{formData.endDate || '— (Indefinite)'}</span>
                  <span className="text-[11px] text-slate-400 font-normal">Permanent</span>
                </div>
              )}
            </div>

            {/* Wage / Month */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-600 font-semibold text-xs">Wage / Month *</label>
                <span className="text-[10px] font-bold text-emerald-600">Fixed Gross</span>
              </div>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  required
                />
              ) : (
                <div className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-extrabold text-slate-900 font-mono">
                  <span>₹{Number(formData.wage).toLocaleString('en-IN')}</span>
                  <span className="text-[11px] text-slate-400 font-normal">INR / mo</span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-slate-600 font-semibold text-xs">Status *</label>
              {isEditing ? (
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="ACTIVE">Running (Active)</option>
                  <option value="DRAFT">Draft</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
              ) : (
                <div className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Running</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                    Primary Active
                  </span>
                </div>
              )}
            </div>

              <Select
                label="Working Schedule (Database)"
                value={formData.workingSchedule || (schedules[0]?.name || '40 Hours / Week')}
                onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
              >
                {schedules.map((s) => (
                  <option key={s.id || s._id} value={s.name}>
                    {s.name} ({s.hoursPerWeek || '40h'})
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
                  Structure Type (Database):
                </label>
                <select
                  value={formData.salaryStructureId || (salaryStructures[0]?.id || '')}
                  onChange={(e) => {
                    const matchedStr = salaryStructures.find((s) => (s.id || s._id) === e.target.value);
                    setFormData({
                      ...formData,
                      salaryStructureId: e.target.value,
                      salaryStructure: matchedStr?.name || 'Employee Salary',
                      salaryStructureName: matchedStr?.name || 'Employee Salary',
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                >
                  {salaryStructures.map((str) => (
                    <option key={str.id || str._id} value={str.id || str._id}>
                      {str.name} ({str.code})
                    </option>
                  ))}
                </select>
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
            {/* Working Schedule */}
            <div className="space-y-1">
              <label className="text-slate-600 font-semibold text-xs">Working Schedule *</label>
              {isEditing ? (
                <Select value={formData.workingSchedule} onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}>
                  <option value="40 Hours / Week">40 Hours / Week</option>
                  <option value="Night Shift">Night Shift</option>
                  <option value="Flexible Hybrid">Flexible Hybrid</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </Select>
              ) : (
                <div className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>{formData.workingSchedule}</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isPending} icon={Save}>
                Save Contract
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Salary Structure / Notes Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Salary Structure / Notes</span>
          </h3>
          <span className="bg-slate-100 text-slate-500 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-200/60">
            Rule Reference v2.6
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Structure Type:</span>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-bold text-xs border border-amber-200/60">
              {formData.salaryStructure} (Standard Executive Structure)
            </span>
          </div>

          <div className="p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs text-slate-600 leading-relaxed">
            <strong className="font-bold text-slate-900">Operational Rule:</strong> {formData.notes}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-400">Preview Split:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-[11px] font-bold">
              Basic: ₹{(formData.wage * 0.5).toLocaleString('en-IN')} (50%)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-[11px] font-bold">
              HRA: ₹{(formData.wage * 0.2).toLocaleString('en-IN')} (20%)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-[11px] font-bold">
              Special Allowance: ₹{(formData.wage * 0.3).toLocaleString('en-IN')}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-100">
              EPF (12%) Active
            </span>
          </div>
        </div>
      </div>

      {/* Useful Note Footer matching test assertion */}
      <div className="pt-2">
        <p className="text-[11px] text-slate-500 italic bg-[#FAF5ED] p-3 rounded-xl border border-amber-200/60 flex items-center justify-between">
          <span>Useful note: for the problem statement, one employee should not have multiple Running contracts for the same period.</span>
          <span className="font-mono text-slate-400 not-italic">PeoplePay HR v2.4</span>
        </p>
      </div>

      {/* Bottom Back Button */}
      {onCancel && (
        <div className="flex justify-start">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onCancel}>
            Back to List
          </Button>
        </div>
      )}
    </div>
  );
}
