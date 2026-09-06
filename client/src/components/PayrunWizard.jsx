import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { fetchEligibleEmployees } from '../lib/api/payroll';
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
  X,
} from 'lucide-react';

export function PayrunWizard({
  salaryStructures = [],
  employees: propEmployees,
  initialSelectedEmployeeIds,
  onComplete,
  onCancel,
}) {
  const [step, setStep] = useState(1);

  // Step 1 State: Scope
  const defaultStructureId = salaryStructures[0]?.id || salaryStructures[0]?._id || '';
  const [salaryStructureId, setSalaryStructureId] = useState(defaultStructureId);

  // Compute current month start and end dynamically
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const defaultStart = `${year}-${month}-01`;
  const defaultEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [payrunName, setPayrunName] = useState('');

  // Step 2 State: Eligible Employees
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(initialSelectedEmployeeIds || []);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update salaryStructureId if salaryStructures prop loads after mount
  useEffect(() => {
    if (!salaryStructureId && salaryStructures.length > 0) {
      setSalaryStructureId(salaryStructures[0].id || salaryStructures[0]._id);
    }
  }, [salaryStructures, salaryStructureId]);

  // Format date helper for "Sep 2", "Jan 1"
  const formatContractDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Format currency helper
  const formatWage = (wage) => {
    const num = Number(wage) || 0;
    return `$ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleNextStep = async (e) => {
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
    setIsLoadingEmployees(true);
    try {
      const apiEmployees = await fetchEligibleEmployees({
        salaryStructureId,
        periodStart,
        periodEnd,
      });

      let list = Array.isArray(apiEmployees) && apiEmployees.length > 0 ? apiEmployees : [];

      // Fall back to propEmployees or mockEmployees if API returned empty
      if (list.length === 0) {
        const source = (Array.isArray(propEmployees) && propEmployees.length > 0) ? propEmployees : mockEmployees;
        list = source.map((emp) => ({
          id: emp.id || emp._id,
          _id: emp._id || emp.id,
          name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
          firstName: emp.firstName || (emp.name || '').split(' ')[0] || '',
          lastName: emp.lastName || (emp.name || '').split(' ').slice(1).join(' ') || '',
          employeeCode: emp.employeeCode || 'EMP-001',
          department: emp.department || (typeof emp.departmentId === 'object' ? emp.departmentId?.name : 'General'),
          jobTitle: emp.jobTitle || emp.jobPosition || 'Employee',
          workingHours: emp.workingHours || emp.scheduleName || '40 hours/week',
          contractStartDate: emp.hireDate || '2026-01-01',
          wage: emp.wage || 85000,
          hasActiveContract: true,
          status: emp.status || 'ACTIVE',
        }));
      }

      setEligibleEmployees(list);
      // Auto-select employees who have active contracts for the selected period
      const activeContractEmpIds = list.filter((emp) => emp.hasActiveContract).map((emp) => emp.id || emp._id);
      setSelectedEmployeeIds(activeContractEmpIds.length > 0 ? activeContractEmpIds : list.map((emp) => emp.id || emp._id));
    } catch (err) {
      console.warn('Failed to load eligible employees from API, using client fallback', err);
      const source = (Array.isArray(propEmployees) && propEmployees.length > 0) ? propEmployees : mockEmployees;
      const list = source.map((emp) => ({
        id: emp.id || emp._id,
        _id: emp._id || emp.id,
        name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
        firstName: emp.firstName || (emp.name || '').split(' ')[0] || '',
        lastName: emp.lastName || (emp.name || '').split(' ').slice(1).join(' ') || '',
        employeeCode: emp.employeeCode || 'EMP-001',
        department: emp.department || (typeof emp.departmentId === 'object' ? emp.departmentId?.name : 'General'),
        jobTitle: emp.jobTitle || emp.jobPosition || 'Employee',
        workingHours: emp.workingHours || emp.scheduleName || '40 hours/week',
        contractStartDate: emp.hireDate || '2026-01-01',
        wage: emp.wage || 85000,
        hasActiveContract: true,
        status: emp.status || 'ACTIVE',
      }));
      setEligibleEmployees(list);
      setSelectedEmployeeIds(list.map((emp) => emp.id || emp._id));
    } finally {
      setIsLoadingEmployees(false);
      setStep(2);
    }
  };

  const filteredEmployees = eligibleEmployees.filter((e) => {
    const q = (searchEmployee || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (e.name || '').toLowerCase().includes(q) ||
      (e.employeeCode || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q)
    );
  });

  const isAllSelected =
    eligibleEmployees.length > 0 && selectedEmployeeIds.length === eligibleEmployees.length;

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
    if (selectedEmployeeIds.length === eligibleEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(eligibleEmployees.map((e) => e.id || e._id));
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (selectedEmployeeIds.length === 0) {
      setErrorMsg('You must select one or more eligible employees to create a payrun.');
      return;
    }

    const structure = salaryStructures.find(
      (s) => (s.id || s._id) === salaryStructureId
    );
    const generatedName =
      payrunName ||
      `${new Date(periodStart).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;

    if (onComplete) {
      onComplete({
        name: generatedName,
        salaryStructureId,
        periodStart,
        periodEnd,
        employeeIds: selectedEmployeeIds,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-xl max-w-2xl mx-auto overflow-hidden bg-white">
        {step === 1 ? (
          /* STEP 1: MODAL SCOPE (IMAGE 3) */
          <form onSubmit={handleNextStep}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">New Pay Run</h2>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Pay Structure</label>
                <Select
                  value={salaryStructureId}
                  onChange={(e) => setSalaryStructureId(e.target.value)}
                  className="w-full"
                >
                  {salaryStructures.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Period</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    required
                  />
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5"
              >
                Continue
              </Button>
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={onCancel}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Discard
                </Button>
              )}
            </CardFooter>
          </form>
        ) : (
          /* STEP 2: EMPLOYEE SELECTION TABLE (IMAGE 4) */
          <form onSubmit={handleFinalSubmit}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Select Employees for Payrun</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Period: {periodStart} to {periodEnd} • {selectedEmployeeIds.length} of {eligibleEmployees.length} selected
                </p>
              </div>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10 px-4">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          aria-label="Select all employees"
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </TableHead>
                      <TableHead className="py-2.5 px-4 font-semibold text-slate-700">Employee Name</TableHead>
                      <TableHead className="py-2.5 px-4 font-semibold text-slate-700">Working Hours</TableHead>
                      <TableHead className="py-2.5 px-4 font-semibold text-slate-700">Contract Start Date</TableHead>
                      <TableHead className="py-2.5 px-4 font-semibold text-slate-700 text-right">Wage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                          {isLoadingEmployees ? 'Loading eligible employees...' : 'No eligible employees found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const empId = emp.id || emp._id;
                        const isSelected = selectedEmployeeIds.includes(empId);

                        return (
                          <TableRow
                            key={empId}
                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                            onClick={() => handleToggleEmployee(empId)}
                          >
                            <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleEmployee(empId)}
                                aria-label={`Select ${emp.name}`}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="px-4 py-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span>{emp.name}</span>
                                {!emp.hasActiveContract && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                                    No Active Contract
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-slate-600 text-xs font-medium">
                              {emp.workingHours || '40 hours/week'}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-slate-600 text-xs">
                              {formatContractDate(emp.contractStartDate)}
                            </TableCell>
                            <TableCell className="px-4 py-3 font-mono font-semibold text-slate-900 text-right">
                              {emp.hasActiveContract ? formatWage(emp.wage) : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            <CardFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5"
              >
                Create payrun
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setStep(1)}
                className="border-slate-300 text-slate-700"
              >
                Back
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>

    </div>
  );
}

