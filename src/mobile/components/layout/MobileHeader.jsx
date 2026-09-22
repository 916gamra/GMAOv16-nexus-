import React from 'react';
import { ChevronRight, Search, Bell, Menu } from 'lucide-react';

/**
 * Top Navigation Header optimized for mobile screens.
 */
export function MobileHeader({
  title = 'GMAO Nexus Mobile',
  onBack,
  onMenuToggle,
  onSearchToggle,
  unreadCount = 0,
  rightAction,
  className = '',
}) {
  return (
    <header className={`sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800 h-14 px-4 flex items-center justify-between transition-all ${className}`}>
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-1 text-slate-300 hover:text-white active:bg-slate-800 rounded-full transition-colors"
            aria-label="Retour"
          >
            <ChevronRight className="w-6 h-6 transform rotate-180" />
          </button>
        ) : onMenuToggle ? (
          <button
            type="button"
            onClick={onMenuToggle}
            className="p-2 -ml-1 text-slate-300 hover:text-white active:bg-slate-800 rounded-full transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        ) : null}

        <h1 className="text-base font-bold text-slate-100 truncate tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {onSearchToggle && (
          <button
            type="button"
            onClick={onSearchToggle}
            className="p-2 text-slate-300 hover:text-white active:bg-slate-800 rounded-full transition-colors"
            aria-label="Recherche"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {unreadCount !== undefined && (
          <div className="relative">
            <button
              type="button"
              className="p-2 text-slate-300 hover:text-white active:bg-slate-800 rounded-full transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}

        {rightAction}
      </div>
    </header>
  );
}

export default MobileHeader;
