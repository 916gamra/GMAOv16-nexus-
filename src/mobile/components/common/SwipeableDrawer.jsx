import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Swipeable Bottom Drawer Component.
 */
export function SwipeableDrawer({
  isOpen = false,
  onClose,
  title,
  children,
  className = '',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div
        className={`relative z-10 bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto transform transition-transform animate-in slide-in-from-bottom duration-200 ${className}`}
      >
        {/* Swipe Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 cursor-pointer" onClick={onClose} />

        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-slate-800 text-base">{title || 'Options'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="pb-safe">{children}</div>
      </div>
    </div>
  );
}

export default SwipeableDrawer;
