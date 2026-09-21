import { useState, useEffect } from 'react';
import { Settings, LogOut, Sun, Moon } from 'lucide-react';
import { PARENT_MODULES, getParentModuleForTab } from './navConfig';

export default function FloatingSidebar({
  currentTab,
  setCurrentTab,
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

  const activeParent = getParentModuleForTab(currentTab);
  const isDark = sidebarTheme === 'dark';

  const handleSelectParent = (module) => {
    const firstChild = module.children[0]?.id || module.id;
    setCurrentTab(firstChild);
  };

  return (
    <aside className="hidden lg:flex fixed left-4 top-4 z-40 w-[72px] h-[calc(100vh-32px)] select-none">
      <div
        className={`w-full h-full rounded-[28px] border flex flex-col items-center justify-between py-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-colors duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#F2F2F2] border-[#E8E8E8]'
        }`}
      >
        {/* Top Brand Logo & 8 Vertical Module Icons */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo Badge */}
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-[13px] tracking-tight shadow-xs cursor-pointer transition transform hover:scale-105 ${
              isDark ? 'bg-white text-slate-900' : 'bg-black text-white'
            }`}
            title="GMAO Light V5"
          >
            G
          </button>

          {/* 8 Primary Vertical Icons with Signature Vivid Colors */}
          <div className="flex flex-col gap-2 w-full px-2.5">
            {PARENT_MODULES.map((module) => {
              const isActive = activeParent.id === module.id;
              const IconComponent = module.icon;

              return (
                <button
                  key={module.id}
                  onClick={() => handleSelectParent(module)}
                  className={`group relative w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-white shadow-[0_4px_16px_rgba(255,255,255,0.2)] scale-105'
                        : 'bg-black shadow-[0_4px_16px_rgba(0,0,0,0.18)] scale-105'
                      : isDark
                      ? 'hover:bg-slate-800'
                      : 'hover:bg-white hover:shadow-xs'
                  }`}
                  title={module.label}
                >
                  <IconComponent
                    size={20}
                    strokeWidth={isActive ? 2.3 : 1.9}
                    className={
                      isActive
                        ? isDark
                          ? module.color
                          : module.colorDark
                        : isDark
                        ? module.colorDark
                        : module.color
                    }
                  />

                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-md">
                    {module.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Controls (Settings & Theme / Logout) */}
        <div
          className={`w-[56px] rounded-[20px] border p-1.5 flex flex-col gap-1.5 shadow-xs transition-colors duration-200 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-black text-amber-400'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Paramètres System"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={toggleSidebarTheme}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDark
                ? 'text-amber-400 hover:bg-slate-800'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title={isDark ? 'Mode Light' : 'Mode Dark'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Déconnexion"
            >
              <LogOut size={17} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
