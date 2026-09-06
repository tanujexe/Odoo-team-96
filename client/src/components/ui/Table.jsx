import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-left text-sm text-slate-700', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn('bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn('divide-y divide-slate-100 bg-white', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, isSelected, children, ...props }) {
  return (
    <tr
      className={cn(
        'hover:bg-slate-50/80 transition-colors',
        isSelected && 'bg-emerald-50/50 hover:bg-emerald-50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th className={cn('px-3 py-3 whitespace-nowrap text-left', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn('px-3 py-3 align-middle', className)} {...props}>
      {children}
    </td>
  );
}

export function TablePagination({ currentPage = 1, totalPages = 1, onPageChange, totalItems, pageSize = 10 }) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems || 0);

  return (
    <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
      <div>
        Showing <span className="font-semibold text-slate-900">{from}</span> to{' '}
        <span className="font-semibold text-slate-900">{to}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalItems || 0}</span> results
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 font-medium text-slate-700">
          Page {currentPage} of {Math.max(totalPages, 1)}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
