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
        wage: contract.wage ?? 8500,
        department: contract.department || 'Finance',
        jobPosition: contract.jobPosition || contract.position || 'Payroll Specialist',
        workingSchedule: contract.workingSchedule || '40 Hours / Week',
        salaryStructureName: contract.salaryStructureName || 'Employee Salary',
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
  const formattedEndDate = formData.endDate ? formatDate(formData.endDate) : '—';
  const displayWage = formatCurrency(formData.wage || contract.wage);
  const isRunning =
    (formData.status || contract.status || '').toUpperCase() === 'ACTIVE' ||
    (formData.status || contract.status || '').toUpperCase() === 'RUNNING';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Custom Header matching Image 1 UX with Image 2 theme */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Contract</span>
                  <span className="text-slate-400 font-normal">/</span>
                  <span className="text-emerald-700 font-mono tracking-normal">
                    {contract.contractCode || 'CON/2026/0042'}
                  </span>
                </h3>
                {isRunning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Running
                  </span>
                ) : (
                  <Badge status={formData.status || contract.status} />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Form view of one contract
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isEditing
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Form Fields View / Edit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Employee Field */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Employee
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 text-sm font-semibold flex items-center justify-between shadow-sm">
                <span>{formData.employeeName || contract.employeeName || 'Aarav Mehta'}</span>
                {formData.employeeCode && (
                  <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {formData.employeeCode}
                  </span>
                )}
              </div>
            </div>

            {/* Start Date Field */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Start Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 text-sm font-medium shadow-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formattedStartDate}</span>
                </div>
              )}
            </div>

            {/* End Date Field */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                End Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  placeholder="Open-ended"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 text-sm font-medium shadow-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className={formattedEndDate === '—' ? 'text-slate-400 font-mono text-base' : 'text-slate-800'}>
                    {formattedEndDate}
                  </span>
                </div>
              )}
            </div>

            {/* Status Field */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Status
              </label>
              {isEditing ? (
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ACTIVE">Running (Active)</option>
                  <option value="DRAFT">Draft</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 text-sm font-medium shadow-sm flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {formData.status === 'ACTIVE' ? 'Running' : formData.status}
                  </span>
                  <Badge status={formData.status || 'ACTIVE'} />
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Department Field */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Department
              </label>
              {isEditing ? (
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 text-sm font-medium shadow-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{formData.department || 'Finance'}</span>
                </div>
              )}
            </div>

            {/* Job Position Field */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Job Position
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.jobPosition}
                  onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 text-sm font-medium shadow-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>{formData.jobPosition || 'Payroll Specialist'}</span>
                </div>
              )}
            </div>

            {/* Wage / Month Field */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Wage / Month
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-emerald-800 text-sm font-mono font-bold shadow-sm flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>{displayWage}</span>
                </div>
              )}
            </div>

            {/* Working Schedule Field */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Working Schedule
              </label>
              {isEditing ? (
                <select
                  value={formData.workingSchedule}
                  onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 text-sm font-medium shadow-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{formData.workingSchedule || '40 Hours / Week'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Salary Structure / Notes Box matching Image 1 UX */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Salary Structure / Notes
          </h4>
          <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
            <p className="font-semibold text-slate-900">
              Structure Type: <span className="text-emerald-700 font-medium">{formData.salaryStructureName || 'Employee Salary'}</span>
            </p>
            <p className="text-slate-600">
              {formData.notes || 'This running contract is the source for payroll calculation in the active period.'}
            </p>
          </div>
        </div>

        {/* Helpful Note matching Image 1 UX */}
        <div className="flex items-start gap-2 pt-1 text-xs text-slate-500 italic">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Useful note: for the problem statement, one employee should not have multiple Running contracts for the same period.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
