import React from 'react';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export function WarningPanel({ warnings = [] }) {
  if (!warnings || warnings.length === 0) {
    return (
      <div data-testid="no-warnings-banner" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-emerald-800">Zero Integrity Warnings</p>
          <p className="text-emerald-700 mt-0.5">All payroll inputs, contracts, and rule evaluations are clean.</p>
        </div>
      </div>
    );
  }

  const blockingCount = warnings.filter((w) => w.severity === 'BLOCKING').length;
  const nonBlockingCount = warnings.filter((w) => w.severity === 'WARNING').length;

  return (
    <div data-testid="warning-panel" className="space-y-3">
      {blockingCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
              {blockingCount} Blocking Calculation Warning(s)
            </h4>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            These errors violate financial or contractual integrity and must be resolved before validating or marking the payrun paid.
          </p>
          <div className="space-y-2 pt-1">
            {warnings
              .filter((w) => w.severity === 'BLOCKING')
              .map((w, idx) => (
                <div
                  key={idx}
                  data-testid="blocking-warning-item"
                  className="p-3 bg-white/90 rounded-lg border border-rose-200 text-xs flex items-start gap-2.5"
                >
                  <span className="font-mono font-bold text-rose-700 shrink-0">[{w.code}]</span>
                  <span className="text-slate-800 flex-1">{w.message}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {nonBlockingCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              {nonBlockingCount} Informational Warning(s)
            </h4>
          </div>
          <div className="space-y-2">
            {warnings
              .filter((w) => w.severity === 'WARNING')
              .map((w, idx) => (
                <div
                  key={idx}
                  data-testid="info-warning-item"
                  className="p-3 bg-white/90 rounded-lg border border-amber-200 text-xs flex items-start gap-2.5"
                >
                  <span className="font-mono font-bold text-amber-700 shrink-0">[{w.code}]</span>
                  <span className="text-slate-800 flex-1">{w.message}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
