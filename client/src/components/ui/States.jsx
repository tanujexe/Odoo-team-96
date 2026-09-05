import React from 'react';
import { Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function LoadingState({ message = 'Loading records...' }) {
  return (
    <div data-testid="loading-state" className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

export function EmptyState({
  title = 'No records found',
  description = 'There are no items to display matching your criteria.',
  actionLabel,
  onAction,
  icon: Icon = Inbox
}) {
  return (
    <div data-testid="empty-state" className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-dashed border-slate-300">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching data.',
  onRetry
}) {
  return (
    <div data-testid="error-state" className="flex flex-col items-center justify-center py-12 px-4 text-center bg-rose-50/50 rounded-xl border border-rose-200">
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-3 text-rose-600">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-rose-700 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
