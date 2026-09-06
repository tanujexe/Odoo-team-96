import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function PayslipCreateModal({
  isOpen,
  onClose,
  onSave,
  employees = [],
  salaryStructures = [],
  payruns = [],
  isSubmitting = false,
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [selectedPayrunId, setSelectedPayrunId] = useState('');
  const [periodStart, setPeriodStart] = useState('2026-02-01');
  const [periodEnd, setPeriodEnd] = useState('2026-02-28');
  const [workedDays, setWorkedDays] = useState(22);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0]._id || employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    if (salaryStructures.length > 0 && !selectedStructureId) {
      setSelectedStructureId(salaryStructures[0]._id || salaryStructures[0].id);
    }
  }, [salaryStructures, selectedStructureId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert('Please select an employee.');
      return;
    }

    const selectedEmp = employees.find(
      (emp) => (emp._id || emp.id) === selectedEmployeeId
    );
    const selectedStruct = salaryStructures.find(
      (s) => (s._id || s.id) === selectedStructureId
    );
    const selectedPr = payruns.find(
      (pr) => (pr._id || pr.id) === selectedPayrunId
    );

    onSave({
      employeeId: selectedEmployeeId,
      employeeName: selectedEmp?.name || 'Employee',
      employeeCode: selectedEmp?.employeeCode || 'EMP-001',
      department: selectedEmp?.departmentId?.name || (typeof selectedEmp?.department === 'string' ? selectedEmp?.department : 'General'),
      salaryStructureId: selectedStructureId,
      salaryStructureName: selectedStruct?.name || 'Regular Salary',
      payrunId: selectedPayrunId || undefined,
      payrunName: selectedPr?.name || 'Standalone',
      periodStart,
      periodEnd,
      workedDays: Number(workedDays) || 22,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Payslip"
      description="Compute and generate an employee payslip for a specific period"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Employee Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Employee <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            required
            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="" disabled>
              Select employee...
            </option>
            {employees.map((emp) => {
              const empId = emp._id || emp.id;
              return (
                <option key={empId} value={empId}>
                  {emp.name} ({emp.employeeCode || 'EMP'}) — {emp.departmentId?.name || (typeof emp.department === 'string' ? emp.department : 'General')}
                </option>
              );
            })}
          </select>
        </div>

        {/* Salary Structure & Optional Payrun */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Salary Structure
            </label>
            <select
              value={selectedStructureId}
              onChange={(e) => setSelectedStructureId(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {salaryStructures.map((struct) => {
                const sId = struct._id || struct.id;
                return (
                  <option key={sId} value={sId}>
                    {struct.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payrun Batch (Optional)
            </label>
            <select
              value={selectedPayrunId}
              onChange={(e) => setSelectedPayrunId(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Standalone Payslip (No Payrun)</option>
              {payruns.map((pr) => {
                const prId = pr._id || pr.id;
                return (
                  <option key={prId} value={prId}>
                    {pr.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Period & Worked Days */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Period Start
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Period End
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Worked Days
            </label>
            <input
              type="number"
              min="0"
              max="31"
              value={workedDays}
              onChange={(e) => setWorkedDays(e.target.value)}
              required
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl px-5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl px-6"
          >
            {isSubmitting ? 'Computing...' : 'Compute & Create Payslip'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
