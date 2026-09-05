import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Plus, Search, Filter, Sliders, ChevronRight } from 'lucide-react';

export function SalaryRulesList({
  rules = [],
  structures = [],
  selectedStructureId = '',
  onSelectStructureFilter,
  onSelectRule,
  onNewRule,
  canEdit = true,
}) {
  const [search, setSearch] = useState('');

  const structureMap = useMemo(() => {
    const map = {};
    structures.forEach((s) => {
      map[s._id || s.id] = s.name;
    });
    return map;
  }, [structures]);

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      // Structure filter
      if (selectedStructureId && selectedStructureId !== 'ALL') {
        const rStructId = r.salaryStructureId?._id || r.salaryStructureId?.id || r.salaryStructureId;
        if (rStructId !== selectedStructureId) return false;
      }
      // Search filter
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const structName = structureMap[r.salaryStructureId?._id || r.salaryStructureId] || '';
      return (
        r.name?.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        structName.toLowerCase().includes(q)
      );
    });
  }, [rules, selectedStructureId, search, structureMap]);

  const sortedRules = useMemo(() => {
    return [...filteredRules].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [filteredRules]);

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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Salary Rules</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">List view</p>
        </div>
      </div>

      {/* Action Bar & Search Filter (Wireframe Image 3: NEW + Search salary rules... + Structure Filter pill) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          {canEdit && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={onNewRule}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm"
            >
              NEW
            </Button>
          )}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search salary rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Structure Selector Pill / Dropdown (Wireframe Image 3) */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 hidden md:inline">Structure:</label>
          <select
            value={selectedStructureId || 'ALL'}
            onChange={(e) => onSelectStructureFilter(e.target.value)}
            className="px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50/70 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Structures</option>
            {structures.map((s) => {
              const sid = s._id || s.id;
              return (
                <option key={sid} value={sid}>
                  {s.name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Salary Rules Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl">
        <Table padding="p-0">
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-200">
              <TableHead className="py-3.5 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Rule Name
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Code
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Category
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Structure
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Sequence
              </TableHead>
              <TableHead className="w-12 py-3.5 px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Sliders className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No salary rules found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? 'Try adjusting your search query' : 'Click NEW to create a new salary rule'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedRules.map((rule) => {
                const rId = rule._id || rule.id;
                const catBadge = formatCategoryBadge(rule.category);
                const structId = rule.salaryStructureId?._id || rule.salaryStructureId;
                const structName =
                  rule.salaryStructureId?.name ||
                  structureMap[structId] ||
                  'Regular Salary';

                return (
                  <TableRow
                    key={rId}
                    onClick={() => onSelectRule(rId)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                  >
                    <TableCell className="py-4 px-6 font-semibold text-slate-900 group-hover:text-blue-600">
                      {rule.name}
                    </TableCell>
                    <TableCell className="py-4 px-6 font-mono font-bold text-slate-700 text-xs">
                      {rule.code}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge status={catBadge.label} variant={catBadge.variant} />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm font-medium text-slate-600">
                      {structName}
                    </TableCell>
                    <TableCell className="py-4 px-6 font-mono font-bold text-slate-800 text-sm">
                      {rule.sequence}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors inline-block" />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Useful Note Footer matching Image 3 wireframe */}
      <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-600">
        <p className="italic">
          <strong className="font-semibold not-italic text-slate-800">Useful note:</strong> List view should expose name, code, category, structure and sequence — the fields needed to understand a payroll rule quickly.
        </p>
      </div>
    </div>
  );
}
