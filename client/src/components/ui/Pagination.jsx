import React from 'react';

export function Pagination({
  currentPage = 1,
  totalRecords = 0,
  pageSize = 5,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startRecord = totalRecords > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(safePage * pageSize, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');

      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (safePage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
      {/* Left side: Showing info & Limit selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          Showing <strong className="font-bold text-slate-800">{startRecord}</strong> to{' '}
          <strong className="font-bold text-slate-800">{endRecord}</strong> of{' '}
          <strong className="font-bold text-slate-900">{totalRecords}</strong> records
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span className="text-slate-400 font-medium">Limit:</span>
            <select
              aria-label="Select items per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Interactive Pagination Controls matching user screenshot */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange && onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
            safePage <= 1
              ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed shadow-none'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          Previous
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-mono">
                ...
              </span>
            );
          }
          const isSelected = p === safePage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange && onPageChange(p)}
              className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                isSelected
                  ? 'bg-[#1A1D20] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange && onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
            safePage >= totalPages
              ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed shadow-none'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
