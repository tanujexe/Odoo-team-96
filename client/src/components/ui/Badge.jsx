import React from 'react';
import { cn } from '../../lib/utils';

const statusStyles = {
  // Payrun & Payslip states
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  COMPUTED: 'bg-blue-50 text-blue-700 border-blue-200',
  VALIDATED: 'bg-purple-50 text-purple-700 border-purple-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  
  // Leave / Time off states
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUSED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',

  // Delivery states
  NOT_SENT: 'bg-slate-100 text-slate-600 border-slate-200',
  SENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',

  // Employee/Contract status
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  EXPIRED: 'bg-amber-50 text-amber-700 border-amber-200',
  TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200',

  // Attendance states
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXCEPTION: 'bg-amber-50 text-amber-700 border-amber-200',
  CORRECTED: 'bg-blue-50 text-blue-700 border-blue-200',

  // Warning severities
  BLOCKING: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
  WARNING: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
};

const dotColors = {
  DRAFT: 'bg-slate-400',
  COMPUTED: 'bg-blue-500',
  VALIDATED: 'bg-purple-500',
  PAID: 'bg-emerald-500',
  PENDING: 'bg-amber-500',
  APPROVED: 'bg-emerald-500',
  REFUSED: 'bg-rose-500',
  CANCELLED: 'bg-slate-400',
  NOT_SENT: 'bg-slate-400',
  SENT: 'bg-emerald-500',
  FAILED: 'bg-rose-500',
  ACTIVE: 'bg-emerald-500',
  INACTIVE: 'bg-slate-400',
  EXPIRED: 'bg-amber-500',
  TERMINATED: 'bg-rose-500',
  PRESENT: 'bg-emerald-500',
  EXCEPTION: 'bg-amber-500',
  CORRECTED: 'bg-blue-500',
  BLOCKING: 'bg-rose-600',
  WARNING: 'bg-amber-600',
};

export function Badge({ status, variant, dot = true, children, className }) {
  const key = (status || '').toUpperCase();
  const appliedStyle = statusStyles[key] || (variant ? statusStyles[variant] : 'bg-slate-100 text-slate-700 border-slate-200');
  const dotColor = dotColors[key] || 'bg-slate-400';

  return (
    <span
      data-testid="status-badge"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase',
        appliedStyle,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />}
      {children || status || '—'}
    </span>
  );
}
