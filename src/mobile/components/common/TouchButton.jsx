import React from 'react';

/**
 * Mobile-optimised touch button with minimum 44px height and ripple effect.
 */
export function TouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-[0.98] select-none touch-manipulation focus:outline-none min-h-[44px]';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-500/20',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 active:bg-slate-400',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-500/20',
    ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[38px]',
    md: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]',
    lg: 'px-6 py-3 text-base rounded-2xl min-h-[50px]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full flex' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5 mr-2 -ml-1 stroke-[2]" />}
      <span>{children}</span>
    </button>
  );
}

export default TouchButton;
