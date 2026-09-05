import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Badge } from './ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { mockEmployees } from '../lib/api/mockData';
import {
  Calendar,
  Layers,
  Users,
  Check,
  ChevronRight,
  ChevronLeft,
  Search,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react';

export function PayrunWizard({
  salaryStructures = [],
  employees: propEmployees,
  initialSelectedEmployeeIds,
  onComplete,
  onCancel,
}) {
  const [step, setStep] = useState(1);

  // Step 1 State
  const [name, setName] = useState('September 2026 Regular Payrun');
  const [salaryStructureId, setSalaryStructureId] = useState(salaryStructures[0]?.id || 'str-tech-1');
  const [periodStart, setPeriodStart] = useState('2026-09-01');
  const [periodEnd, setPeriodEnd] = useState('2026-09-30');

  const rawEmployees =
    propEmployees && propEmployees.length > 0
      ? propEmployees
      : mockEmployees;

  const activeEmployees = (rawEmployees || []).filter((e) => (e.status ? e.status === 'ACTIVE' : true));

  // Step 2 State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(
    initialSelectedEmployeeIds || ['emp-alex-1', 'emp-sarah-1']
  );
  const [searchEmployee, setSearchEmployee] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredEmployees = activeEmployees.filter((e) => {
    const q = (searchEmployee || '').toLowerCase().trim();
    if (!q) return true;
    const fullName = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
    const code = (e.employeeCode || '').toLowerCase();
    const dept = (e.department || '').toLowerCase();
    const title = (e.jobTitle || '').toLowerCase();
    return fullName.includes(q) || code.includes(q) || dept.includes(q) || title.includes(q);
  });

  const isAllSelected = activeEmployees.length > 0 && selectedEmployeeIds.length === activeEmployees.length;

  const handleToggleEmployee = (id) => {
    setErrorMsg('');
    if (selectedEmployeeIds.includes(id)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter((x) => x !== id));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, id]);
    }
  };

  const handleSelectAll = () => {
    setErrorMsg('');
    if (selectedEmployeeIds.length === activeEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(activeEmployees.map((e) => e.id));
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!periodStart || !periodEnd) {
      setErrorMsg('Please select both period start and end dates.');
      return;
    }
    if (new Date(periodEnd) <= new Date(periodStart)) {
      setErrorMsg('Period end date must be strictly after period start date.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (selectedEmployeeIds.length === 0) {
      setErrorMsg('You must explicitly select at least 1 employee to create a payrun.');
      return;
    }

    if (onComplete) {
      onComplete({
        name,
        salaryStructureId,
        periodStart,
        periodEnd,
        employeeIds: selectedEmployeeIds,
      });
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader
        title="Create Payrun Batch Wizard"
        subtitle={`Step ${step} of 2 — ${
          step === 1 ? 'Configure Payrun Cycle & Structure' : 'Explicit Employee Selection'
        }`}
      />

      {errorMsg && (
        <div data-testid="wizard-error-banner" className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleNextStep}>
          <CardContent className="space-y-4">
            <Input
              label="Payrun Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. September 2026 Regular Payrun"
              required
            />

            <Select
              label="Salary Structure"
              value={salaryStructureId}
              onChange={(e) => setSalaryStructureId(e.target.value)}
            >
              {salaryStructures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Period Start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
              <Input
                label="Period End"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter>
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm" icon={ChevronRight} className="ml-auto">
              Proceed to Employee Selection
            </Button>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleFinalSubmit}>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Selected Employees: <span className="font-bold text-emerald-700">{selectedEmployeeIds.length}</span> / {activeEmployees.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  type="button"
                >
                  {selectedEmployeeIds.length === activeEmployees.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter eligible employees by name or code..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Job Title</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        No eligible employees found matching "{searchEmployee}"
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = selectedEmployeeIds.includes(emp.id);
                      const displayName =
                        emp.firstName || emp.lastName
                          ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
                          : emp.name || 'Unknown Employee';

                      return (
                        <TableRow
                          key={emp.id}
                          isSelected={isSelected}
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => handleToggleEmployee(emp.id)}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              aria-label={`Select ${displayName}`}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">
                            {displayName}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {emp.employeeCode}
                          </TableCell>
                          <TableCell className="text-slate-700">{emp.department}</TableCell>
                          <TableCell className="text-slate-700">{emp.jobTitle}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              onClick={() => setStep(1)}
              type="button"
            >
              Back to Step 1
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Check}
              className="ml-auto"
            >
              Create Draft Payrun Batch ({selectedEmployeeIds.length} Selected)
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
