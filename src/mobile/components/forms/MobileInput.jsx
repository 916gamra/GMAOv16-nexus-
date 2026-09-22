import React from 'react';

/**
 * Touch-friendly Input Field.
 */
export function MobileInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  icon: Icon,
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
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full min-h-[48px] px-4 py-3 bg-white text-slate-900 border rounded-xl text-sm font-medium transition-all
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

export default MobileInput;
