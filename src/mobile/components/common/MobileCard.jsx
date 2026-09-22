import React from 'react';

/**
 * Responsive Mobile Card Component with elevation and touch feedback.
 */
export function MobileCard({
  children,
  onClick,
  title,
  subtitle,
  icon: Icon,
  badge,
  className = '',
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm mb-3 transition-all
        ${onClick ? 'cursor-pointer active:scale-[0.99] active:bg-slate-50 hover:border-slate-300' : ''}
        ${className}
      `}
    >
      {(title || subtitle || Icon || badge) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
            )}
            <div>
              {title && <h3 className="font-bold text-slate-800 text-sm leading-snug">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {badge && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="text-slate-700 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default MobileCard;
