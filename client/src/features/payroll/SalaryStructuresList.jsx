import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Plus, Search, Layers, ChevronRight } from 'lucide-react';

export function SalaryStructuresList({
  structures = [],
  onSelectStructure,
  onNewStructure,
  canEdit = true,
}) {
  const [search, setSearch] = useState('');

  const filteredStructures = useMemo(() => {
    return structures.filter((s) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q)
      );
    });
  }, [structures, search]);

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumb Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Salary Structures</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">List view</p>
        </div>
      </div>

      {/* Action Bar & Search Filter (Wireframe Image 1: NEW + Search structures...) */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {canEdit && (
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={onNewStructure}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm"
          >
            NEW
          </Button>
        )}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search structures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Structures Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl">
        <Table padding="p-0">
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-200">
              <TableHead className="py-3.5 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Structure Name
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Rules
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Employees
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Active
              </TableHead>
              <TableHead className="w-12 py-3.5 px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStructures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Layers className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No salary structures found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? 'Try adjusting your search criteria' : 'Click NEW to create the first salary structure'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStructures.map((s) => {
                const sId = s._id || s.id;
                const ruleCount = s.ruleCount ?? (s.ruleIds ? s.ruleIds.length : 0);
                const employeeCount = s.employeeCount ?? 0;
                const isActive = s.active !== false;

                return (
                  <TableRow
                    key={sId}
                    onClick={() => onSelectStructure(sId)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {s.name}
                        </div>
                        {s.code && (
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {s.code}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-slate-600 font-medium">
                      {ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-slate-600 font-medium">
                      {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
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

    </div>
  );
}
