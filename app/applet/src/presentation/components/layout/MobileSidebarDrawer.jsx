import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowUpDown,
  Package,
  Tag,
  CheckCircle2,
  Factory,
  Share2,
  Boxes,
  Fingerprint,
  Warehouse,
  Layers,
  Info,
  MapPin,
  Users,
  GitBranch,
  BookOpen,
  Settings,
  LogOut,
  Sun,
  Moon,
  X,
  Lightbulb,
  FileSpreadsheet
} from 'lucide-react';

export default function MobileSidebarDrawer({
  currentTab,
  setCurrentTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  counts = {},
  currentUser,
  onLogout,
}) {
  const [sidebarTheme, setSidebarTheme] = useState(() => {
    return localStorage.getItem('gmao_sidebar_theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('gmao_sidebar_theme', sidebarTheme);
  }, [sidebarTheme]);

  const toggleSidebarTheme = () => {
    setSidebarTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (!mobileMenuOpen) return null;

  const isDark = sidebarTheme === 'dark';

  const navGroups = [
    {
      groupTitle: null,
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          badge: 'KPI',
          icon: LayoutDashboard,
          color: 'text-blue-500',
        },
        {
          id: 'sortie',
          label: 'Sortie & Entrée Rapide',
          badge: 'Mvt',
          icon: ArrowUpDown,
          color: 'text-emerald-500',
        },
      ],
    },
    {
      groupTitle: 'STOCK & ARTICLES',
      items: [
        {
          id: 'stock',
          label: 'Stock (Articles)',
          count: counts.stock ?? counts.spareParts ?? 873,
          icon: Package,
          color: 'text-cyan-500',
        },
        {
          id: 'types',
          label: 'Types',
          count: counts.types ?? 170,
          icon: Tag,
          color: 'text-cyan-500',
        },
        {
          id: 'designations',
          label: 'Désignations',
          count: counts.designations ?? 873,
          icon: CheckCircle2,
          color: 'text-cyan-500',
        },
      ],
    },
    {
      groupTitle: 'PARC MACHINES',
      items: [
        {
          id: 'machines',
          label: 'Machines Registered',
          count: counts.machines ?? 89,
          icon: Factory,
          color: 'text-emerald-500',
        },
        {
          id: 'families',
          label: 'Familles Machines',
          count: counts.families ?? 14,
          icon: Share2,
          color: 'text-cyan-500',
        },
        {
          id: 'templates',
          label: 'Templates Machines',
          count: counts.templates ?? 19,
          icon: Boxes,
          color: 'text-amber-500',
        },
        {
          id: 'blueprints',
          label: 'Blueprint Machine',
          count: counts.blueprints ?? 19,
          icon: Fingerprint,
          color: 'text-indigo-500',
        },
      ],
    },
    {
      groupTitle: 'GROUPE ENTREPÔT',
      items: [
        {
          id: 'entrepot',
          label: 'Entrepôt (Inventaire)',
          count: counts.entrepot ?? counts.warehouse ?? 7,
          icon: Warehouse,
          color: 'text-indigo-500',
        },
        {
          id: 'comp_families',
          label: 'Familles (Composants)',
          count: counts.compFamilies ?? 6,
          icon: Share2,
          color: 'text-amber-500',
        },
        {
          id: 'comp_templates',
          label: 'Templates (Composants)',
          count: counts.compTemplates ?? 7,
          icon: Boxes,
          color: 'text-purple-500',
        },
        {
          id: 'part_types',
          label: 'Types (Parts)',
          count: counts.partTypes ?? 5,
          icon: Layers,
          color: 'text-teal-500',
        },
        {
          id: 'part_designations',
          label: 'Désignations (Parts)',
          count: counts.partDesignations ?? 5,
          icon: Info,
          color: 'text-blue-500',
        },
      ],
    },
    {
      groupTitle: 'ZONES & ÉQUIPES',
      items: [
        {
          id: 'zones',
          label: 'Zones & Ateliers',
          count: counts.zones ?? 14,
          icon: MapPin,
          color: 'text-purple-500',
        },
        {
          id: 'utilisateurs',
          label: 'Utilisateurs (Membres)',
          count:
            (counts.technicians || 0) + (counts.operations || 0) || 7,
          icon: Users,
          color: 'text-violet-500',
        },
      ],
    },
    {
      groupTitle: null,
      items: [
        {
          id: 'nexus',
          label: 'Nexus Matrix',
          icon: GitBranch,
          color: 'text-teal-500',
        },
        {
          id: 'guide',
          label: "Guide d'utilisation",
          icon: BookOpen,
          color: 'text-amber-500',
        },
      ],
    },
  ];

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Full Original Drawer Panel */}
      <div
        className={`relative w-80 max-w-[85vw] h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto transition-colors duration-200 select-none ${
          isDark
            ? 'bg-[#0F172A] text-slate-100 border-r border-slate-800'
            : 'bg-white text-slate-900 border-r border-slate-200'
        }`}
      >
        <div className="p-4 space-y-5">
          {/* Header Logo & Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/20">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/90 text-white flex items-center justify-center shadow-md">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight">
                    Ciob PDR
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    XLS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Pièces de Rechange & GMAO
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Groups & Items */}
          <nav className="space-y-4">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {group.groupTitle && (
                  <div
                    className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {group.groupTitle}
                  </div>
                )}

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = currentTab === item.id;
                    const ItemIcon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? isDark
                              ? 'bg-slate-900 text-white shadow-md border border-slate-700/60'
                              : 'bg-slate-950 text-white shadow-md'
                            : isDark
                            ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <ItemIcon
                            size={18}
                            className={isActive ? 'text-white' : item.color}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {/* Badge or Count */}
                        {item.badge ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isActive
                                ? 'bg-slate-800 text-white'
                                : isDark
                                ? 'bg-slate-800/80 text-slate-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : item.count !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isActive
                                ? 'bg-slate-800 text-white'
                                : isDark
                                ? 'bg-slate-800/80 text-slate-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.count}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Astuce Excel Twin Card */}
          <div
            className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-colors ${
              isDark
                ? 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                : 'bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-amber-500">
              <Lightbulb size={16} />
              <span>Astuce Excel Twin</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pl-1">
              • Cliquez sur n'importe quel code (Zone, Famille, Type) pour
              filtrer les tables associées.
            </p>
          </div>
        </div>

        {/* Footer Controls: Settings, Theme Toggle & User Account */}
        <div
          className={`p-4 border-t space-y-3 ${
            isDark ? 'border-slate-800 bg-[#0B1120]' : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          {/* Settings & Theme Switcher Row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentTab('settings');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-black text-amber-400'
                  : isDark
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Settings size={18} />
              <span>Paramètres</span>
            </button>

            <button
              onClick={toggleSidebarTheme}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title={isDark ? 'Mode Light' : 'Mode Dark'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* User Account Row */}
          {currentUser && (
            <div
              className={`p-2.5 rounded-2xl border flex items-center justify-between transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.avatar || 'RM'}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight truncate max-w-[130px]">
                    {currentUser.name || 'Administrateur'}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    {currentUser.role || 'ADMIN'}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
