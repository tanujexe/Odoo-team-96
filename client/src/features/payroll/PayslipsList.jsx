import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { ChevronDown } from 'lucide-react';

export function PayslipsList({
  payslips = [],
  onSelectPayslip,
  onNewPayslip,
  canCreate = true,
  isLoading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Feb 2026');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  const periodsList = ['All Periods', 'Feb 2026', 'Jan 2026', 'Dec 2025', 'Sep 2026'];

  const formatShortCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1000) {
      const k = num / 1000;
      return `₹${k % 1 === 0 ? k : k.toFixed(1)}k`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatFullCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDateRange = (pStart, pEnd) => {
    if (!pStart && !pEnd) return '01-Feb — 28-Feb';
    try {
      const s = pStart ? new Date(pStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '01-Feb';
      const e = pEnd ? new Date(pEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '28-Feb';
      return `${s} — ${e}`;
    } catch {
      return '01-Feb — 28-Feb';
    }
  };

  const filteredPayslips = payslips.filter((ps) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (ps.employeeName && ps.employeeName.toLowerCase().includes(q)) ||
      (ps.employeeCode && ps.employeeCode.toLowerCase().includes(q)) ||
      (ps.warningLabel && ps.warningLabel.toLowerCase().includes(q)) ||
      (ps.structureName && ps.structureName.toLowerCase().includes(q)) ||
      (ps.status && ps.status.toLowerCase().includes(q));

    const matchesPeriod =
      selectedPeriod === 'All Periods' ||
      !selectedPeriod ||
      (ps.periodStart && (
        (selectedPeriod.includes('Feb') && new Date(ps.periodStart).getMonth() === 1) ||
        (selectedPeriod.includes('Jan') && new Date(ps.periodStart).getMonth() === 0) ||
        (selectedPeriod.includes('Dec') && new Date(ps.periodStart).getMonth() === 11) ||
        (selectedPeriod.includes('Sep') && new Date(ps.periodStart).getMonth() === 8)
      )) ||
      (ps.payrunName && ps.payrunName.includes(selectedPeriod));

    return matchesSearch && matchesPeriod;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Title & Subtitle matching Image 1 */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          Payslips
        </h1>
        <p className="text-sm text-slate-500 font-normal mt-0.5">
          List view of employee payslips
        </p>
      </div>

      {/* Action Bar (NEW button, Search bar, Period filter) */}
      <div className="flex flex-wrap items-center gap-3">
        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            onClick={onNewPayslip}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-xs tracking-wider uppercase shadow-xs transition-all cursor-pointer"
          >
            NEW
          </Button>
        )}

        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input
            type="text"
            placeholder="Search payslips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Period Selector / Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Period: {selectedPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
          </button>

          {isPeriodDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
              {periodsList.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSelectedPeriod(p);
                    setIsPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                    selectedPeriod === p ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-200/80">
              <TableHead className="py-3.5 px-5 font-bold text-xs text-slate-700">Employee</TableHead>
              <TableHead className="py-3.5 px-4 font-bold text-xs text-slate-700">Warning</TableHead>
              <TableHead className="py-3.5 px-4 font-bold text-xs text-slate-700">Period</TableHead>
              <TableHead className="py-3.5 px-4 font-bold text-xs text-slate-700">Basic</TableHead>
              <TableHead className="py-3.5 px-4 font-bold text-xs text-slate-700">Gross</TableHead>
              <TableHead className="py-3.5 px-4 font-bold text-xs text-slate-700">Net</TableHead>
              <TableHead className="py-3.5 px-4 font-bold text-xs text-slate-700">Structure</TableHead>
              <TableHead className="py-3.5 px-5 font-bold text-xs text-slate-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-slate-400 text-xs font-medium">
                  Loading payslips...
                </TableCell>
              </TableRow>
            ) : filteredPayslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <p className="text-slate-600 text-sm font-semibold">No payslips found</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {searchQuery ? 'Try changing your search query or period filter.' : 'Click "NEW" above to generate a new employee payslip.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayslips.map((ps) => {
                const psId = ps.id || ps._id;
                const isWarning = ps.warningLabel && ps.warningLabel !== '—';
                const isDone = ps.status === 'Done' || ps.status === 'PAID' || ps.status === 'VALIDATED';

                return (
                  <TableRow
                    key={psId}
                    onClick={() => onSelectPayslip(psId)}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer border-b border-slate-100 last:border-0 group"
                  >
                    {/* Employee Name */}
                    <TableCell className="py-4 px-5 font-semibold text-slate-900 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{ps.employeeName || 'Employee'}</span>
                      </div>
                    </TableCell>

                    {/* Warning Column (orange/amber font matching image 1) */}
                    <TableCell className="py-4 px-4 text-xs">
                      {isWarning ? (
                        <span className="font-semibold text-amber-600">
                          {ps.warningLabel}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </TableCell>

                    {/* Period Column */}
                    <TableCell className="py-4 px-4 text-xs text-slate-600 font-medium">
                      {formatDateRange(ps.periodStart, ps.periodEnd)}
                    </TableCell>

                    {/* Basic Column */}
                    <TableCell className="py-4 px-4 text-xs font-medium text-slate-700" title={formatFullCurrency(ps.basic)}>
                      {formatShortCurrency(ps.basic)}
                    </TableCell>

                    {/* Gross Column */}
                    <TableCell className="py-4 px-4 text-xs font-medium text-slate-800" title={formatFullCurrency(ps.gross)}>
                      {formatShortCurrency(ps.gross)}
                    </TableCell>

                    {/* Net Column */}
                    <TableCell className="py-4 px-4 text-xs font-bold text-slate-900" title={formatFullCurrency(ps.net)}>
                      {formatShortCurrency(ps.net)}
                    </TableCell>

                    {/* Structure Column */}
                    <TableCell className="py-4 px-4 text-xs text-slate-600 font-medium">
                      {ps.structureName || ps.salaryStructureName || 'Regular'}
                    </TableCell>

                    {/* Status Column (Done in green matching image 1) */}
                    <TableCell className="py-4 px-5 text-xs">
                      <span className={`font-bold ${isDone ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {isDone ? 'Done' : (ps.status || 'Draft')}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Informative Footer Note */}
      <p className="text-xs text-slate-500 font-medium italic mt-6">
        Useful note: selecting any payslip opens the detailed salary computation and PDF action for that employee.
      </p>
    </div>
  );
}
