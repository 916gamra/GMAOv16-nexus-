import { LayoutDashboard, Package, Factory, Calendar, Menu } from 'lucide-react';
import { useTranslation } from '../../../i18n/I18nContext';
import { getParentModuleForTab } from '../../../presentation/components/layout/navConfig';

/**
 * Enterprise Mobile Bottom Navigation Bar
 * Ergonomic, industrial design with auto-active parent module detection and real badges.
 */
export function BottomNavigation({
  activeTab = 'dashboard',
  onTabChange,
  onOpenMenu,
  counts = {},
  className = '',
}) {
  const { t } = useTranslation();
  const parentModule = getParentModuleForTab(activeTab);
  const activeParentId = parentModule?.id || activeTab;

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard') || 'Dashboard',
      icon: LayoutDashboard,
      active: activeParentId === 'dashboard',
      onClick: () => onTabChange?.('dashboard'),
    },
    {
      id: 'stock',
      label: t('nav.stock') || 'Stock PDR',
      icon: Package,
      badge: counts.stock ? (counts.stock > 999 ? '999+' : counts.stock) : null,
      active: activeParentId === 'stock',
      onClick: () => onTabChange?.('stock'),
    },
    {
      id: 'machines',
      label: t('nav.machines') || 'Machines',
      icon: Factory,
      badge: counts.machines ? counts.machines : null,
      active: activeParentId === 'machines',
      onClick: () => onTabChange?.('machines'),
    },
    {
      id: 'preventive',
      label: t('nav.preventive') || 'Préventif',
      icon: Calendar,
      badge: counts.preventive ? counts.preventive : null,
      active: activeParentId === 'preventive',
      onClick: () => onTabChange?.('preventive'),
    },
    {
      id: 'menu',
      label: t('common.menu') || 'Menu',
      icon: Menu,
      active: ['entrepot', 'zones', 'utilisateurs', 'operations', 'comp_groups', 'comp_families', 'comp_templates', 'part_types', 'part_designations'].includes(activeParentId),
      onClick: () => onOpenMenu?.(),
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Navigation principale mobile"
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-zinc-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] px-2 py-1 flex items-center justify-around select-none safe-area-pb ${className}`}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.active;

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center transition-all duration-150 min-h-[50px] rounded-xl cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 ${
              isActive
                ? 'text-emerald-700 font-bold'
                : 'text-zinc-500 hover:text-zinc-800 active:bg-zinc-100/80'
            }`}
          >
            <div className="relative">
              <div
                className={`p-1 rounded-full transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs ring-1 ring-emerald-200'
                    : 'text-zinc-500'
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-transform ${isActive ? 'stroke-[2.25px]' : 'stroke-[1.75px]'}`}
                  aria-hidden="true"
                />
              </div>

              {item.badge != null && (
                <span className="absolute -top-1 -right-2.5 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 min-w-[16px] text-center rounded-full shadow-xs border border-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[68px] ${isActive ? 'font-bold text-emerald-800' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavigation;
