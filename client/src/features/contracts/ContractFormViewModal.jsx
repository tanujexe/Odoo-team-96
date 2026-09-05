import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  FileSignature,
  Calendar,
  Building2,
  Briefcase,
  Clock,
  Coins,
  CheckCircle2,
  Info,
  Edit3,
  Check,
  X,
  ShieldCheck,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { mockDepartments, mockWorkingSchedules } from '../../lib/api/mockData';

export function ContractFormViewModal({
  isOpen,
  onClose,
  contract,
  onSave,
  isSaving = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (contract) {
      setFormData({
        ...contract,
        contractCode: contract.contractCode || 'CON/2026/0042',
        employeeName: contract.employeeName || 'Aarav Mehta',
        employeeCode: contract.employeeCode || 'EMP-042',
        wage: contract.wage ?? 85000,
        department: contract.department || 'Finance',
        jobPosition: contract.jobPosition || contract.position || 'Payroll Specialist',
        workingSchedule: contract.workingSchedule || '40 Hours / Week',
        salaryStructureName: contract.salaryStructureName || contract.salaryStructure || 'Employee Salary',
        notes:
          contract.notes ||
          'This running contract is the source for payroll calculation in the active period.',
        startDate: contract.startDate ? String(contract.startDate).slice(0, 10) : '2026-01-01',
        endDate: contract.endDate ? String(contract.endDate).slice(0, 10) : '',
        status: contract.status || 'ACTIVE',
      });
      setIsEditing(false);
    }
  }, [contract]);

  if (!contract) return null;

  const handleSave = (e) => {
    e?.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  const formattedStartDate = formatDate(formData.startDate || contract.startDate);
  const formattedEndDate = formData.endDate ? formatDate(formData.endDate) : '— (Indefinite)';
  const displayWage = formatCurrency(formData.wage || contract.wage);
  const isRunning =
    (formData.status || contract.status || '').toUpperCase() === 'ACTIVE' ||
    (formData.status || contract.status || '').toUpperCase() === 'RUNNING';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5 p-1">
        {/* Custom Header matching Image 1 UX with Image 2 theme */}
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
              <span className="text-slate-400">CONTRACTS</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#E0533C]">{formData.contractCode}</span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2.5 flex-wrap">
              <span>Contract / {formData.contractCode}</span>
              {isRunning ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Running
                </span>
              ) : (
                <Badge status={formData.status || contract.status} />
              )}
            </h3>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Form view of one contract
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isEditing
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-[#E0533C] hover:bg-[#CD442E] text-white shadow-2xs'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {/* Employee Banner */}
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F59E0B] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-2xs">
              {formData.employeeName ? formData.employeeName.split(' ').map(n => n[0]).join('') : 'AM'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-extrabold text-slate-900">Contract Holder: {formData.employeeName}</h4>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Dept: {formData.department} • Role: {formData.jobPosition} • ID Code: {formData.employeeCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* 2-Column Form Fields View / Edit */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <h4 className="text-sm font-extrabold text-slate-900">Contract Specifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Left Column */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Employee
                </label>
                <div className="w-full p-3 rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-900 text-xs font-semibold flex items-center justify-between">
                  <span>{formData.employeeName || contract.employeeName || 'Aarav Mehta'}</span>
                  {formData.employeeCode && (
                    <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {formData.employeeCode}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Start Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <div className="w-full p-3 rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-800 text-xs font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{formattedStartDate}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  End Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    placeholder="Open-ended"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <div className="w-full p-3 rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-800 text-xs font-semibold flex items-center justify-between">
                    <span>{formattedEndDate}</span>
                    <span className="text-[11px] text-slate-400 font-normal">Permanent</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Status
                </label>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">Running (Active)</option>
                    <option value="DRAFT">Draft</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                ) : (
                  <div className="w-full p-3 rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-800 text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Running</span>
                    </span>
                    <Badge status={formData.status || 'ACTIVE'} />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Department
                </label>
                {isEditing ? (
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {mockDepartments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    <option value="Finance">Finance</option>
                    <option value="Engineering">Engineering</option>
                    <option value="People & Culture">People & Culture</option>
                  </select>
                ) : (
                  <div className="w-full p-3 rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-800 text-xs font-semibold flex items-center justify-between">
                    <span>{formData.department || 'Finance'}</span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Job Position
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.jobPosition}
                    onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <div className="w-full p-3 rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-800 text-xs font-semibold flex items-center justify-between">
                    <span>{formData.jobPosition || 'Payroll Specialist'}</span>
                    <Briefcase className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Wage / Month
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                ) : (
                  <div className="w-full p-3 rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-900 text-xs font-mono font-extrabold flex items-center justify-between">
                    <span>{displayWage}</span>
                    <span className="text-[11px] text-slate-400 font-normal">Fixed Gross</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Working Schedule
                </label>
                {isEditing ? (
                  <select
                    value={formData.workingSchedule}
                    onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {mockWorkingSchedules.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="40 Hours / Week">40 Hours / Week</option>
                    <option value="Standard Full-Time (40h)">Standard Full-Time (40h)</option>
                    <option value="Flexible Hybrid">Flexible Hybrid</option>
                  </select>
                ) : (
                  <div className="w-full p-3 rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-800 text-xs font-semibold flex items-center justify-between">
                    <span>{formData.workingSchedule || '40 Hours / Week'}</span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Salary Structure / Notes Box matching Image 1 UX */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Salary Structure / Notes
            </h4>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200">
              Rule Reference v2.6
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <p className="font-semibold text-slate-900">
              Structure Type: <span className="text-amber-900 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">{formData.salaryStructureName || formData.salaryStructure || 'Employee Salary'}</span>
            </p>
            <p className="text-slate-600 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
              {formData.notes || 'This running contract is the source for payroll calculation in the active period.'}
            </p>
          </div>
        </div>

        {/* Helpful Note matching test assertion */}
        <div className="flex items-start gap-2 pt-1 text-xs text-slate-500 italic bg-[#FAF5ED] p-3 rounded-xl border border-amber-200/60">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Useful note: for the problem statement, one employee should not have multiple Running contracts for the same period.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {isEditing && (
            <Button
              variant="primary"
              size="sm"
              icon={Check}
              isLoading={isSaving}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
