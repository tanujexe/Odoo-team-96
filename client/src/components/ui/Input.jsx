import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  className,
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={cn(
          'w-full px-3.5 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
          error ? 'border-rose-400 focus:ring-rose-400 focus:border-rose-400 bg-rose-50/20' : 'border-slate-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export const Select = React.forwardRef(({
  label,
  error,
  helperText,
  options = [],
  className,
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'w-full px-3.5 py-2 text-sm bg-white border rounded-lg text-slate-900 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
          error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

Select.displayName = 'Select';
