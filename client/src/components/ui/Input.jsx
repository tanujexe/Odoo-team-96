import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  className,
  labelClassName,
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className={cn("block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1", labelClassName)}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={cn(
          'w-full px-3.5 py-2 text-xs bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600',
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
  labelClassName,
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={selectId} className={cn("block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1", labelClassName)}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'w-full px-3.5 py-2 text-xs bg-white border rounded-lg text-slate-800 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600',
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
