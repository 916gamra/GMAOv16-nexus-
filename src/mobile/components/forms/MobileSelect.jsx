import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Touch-friendly Select Field.
 */
export function MobileSelect({
  label,
  value,
  onChange,
  options = [],
  error,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          value={value}
          onChange={onChange}
          className={`
            w-full min-h-[48px] px-4 py-3 bg-white text-slate-900 border rounded-xl text-sm font-medium appearance-none transition-all
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10
            ${error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
        <ChevronDown className="w-5 h-5 absolute right-3 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

export default MobileSelect;
