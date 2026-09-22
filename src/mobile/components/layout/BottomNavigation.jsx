import React from 'react';
import { Home, Package, Cpu, Wrench, Settings } from 'lucide-react';

/**
 * Bottom Navigation Bar for touchscreens with active states and badges.
 */
export function BottomNavigation({
  activeTab = 'dashboard',
  onTabChange,
  items,
  className = '',
}) {
  const defaultItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: Home },
    { id: 'stock', label: 'المخزون', icon: Package },
    { id: 'machines', label: 'المعدات', icon: Cpu },
    { id: 'preventive', label: 'الصيانة', icon: Wrench },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const navItems = items || defaultItems;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg pb-safe flex items-center justify-around ${className}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange && onTabChange(item.id)}
            className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center transition-all min-h-[48px] rounded-lg ${
              isActive
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800 active:bg-slate-100'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {item.badge ? (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] px-1 rounded-full font-bold">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[11px] mt-1 tracking-tight truncate max-w-[64px]">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavigation;
