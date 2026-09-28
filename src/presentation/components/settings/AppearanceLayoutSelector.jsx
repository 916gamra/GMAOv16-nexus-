import { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  PanelLeft,
  Layers,
  RefreshCw,
  Palette,
  Eye,
  CheckCircle2,
  Laptop,
  FileSpreadsheet,
} from 'lucide-react';

export function AppearanceLayoutSelector({
  initialValues,
  initialTheme = 'light',
  initialStyle = 'floating',
  initialBehavior = 'push',
  onChange,
  showToast,
  className = '',
}) {
  const [theme, setTheme] = useState(() => {
    try {
      return (
        initialValues?.theme ||
        localStorage.getItem('gmao_theme') ||
        initialTheme
      );
    } catch {
      return initialValues?.theme || initialTheme;
    }
  });

  const [sidebarStyle, setSidebarStyle] = useState(() => {
    try {
      return (
        initialValues?.sidebarStyle ||
        localStorage.getItem('gmao_sidebar_style') ||
        initialStyle
      );
    } catch {
      return initialValues?.sidebarStyle || initialStyle;
    }
  });

  const [sidebarBehavior, setSidebarBehavior] = useState(() => {
    try {
      return (
        initialValues?.sidebarBehavior ||
        localStorage.getItem('gmao_sidebar_behavior') ||
        initialBehavior
      );
    } catch {
      return initialValues?.sidebarBehavior || initialBehavior;
    }
  });

  useEffect(() => {
    const activeDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (activeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateSettings = (newTheme, newStyle, newBehavior) => {
    setTheme(newTheme);
    setSidebarStyle(newStyle);
    setSidebarBehavior(newBehavior);

    try {
      localStorage.setItem('gmao_theme', newTheme);
      localStorage.setItem('gmao_sidebar_theme', newTheme);
      localStorage.setItem('gmao_sidebar_style', newStyle);
      localStorage.setItem('gmao_sidebar_behavior', newBehavior);

      window.dispatchEvent(new Event('gmao_appearance_changed'));
    } catch {
      /* ignore storage error */
    }

    const activeDark =
      newTheme === 'dark' ||
      (newTheme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (activeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (onChange) {
      onChange({
        theme: newTheme,
        sidebarStyle: newStyle,
        sidebarBehavior: newBehavior,
      });
    }

    if (showToast) {
      showToast('Paramètres d\'apparence mis à jour avec succès', 'success');
    }
  };

  const handleResetDefaults = () => {
    updateSettings('light', 'floating', 'push');
  };

  return (
    <div className={`space-y-5 max-w-5xl mx-auto p-1 sm:p-2 dir-rtl ${className}`}>
      {/* 1. HEADER BANNER (Light UI Excel Supervision Style) */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 p-4 rounded-2xl border border-indigo-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-indigo-950">
                تخصيص المظهر والهيكل البصري (Appearance & Layout)
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-100/80 text-indigo-800 border border-indigo-200">
                <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
                <span>Light UI Excel Grade</span>
              </span>
            </div>
            <p className="text-xs text-indigo-900/70 mt-0.5">
              تحديد ثيم الألوان المفضل، أسلوب الشريط الجانبي وسلوك التفاعل مع مصنفات الواجهة في النظام.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition cursor-pointer shrink-0 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>إعادة ضبط الافتراضي</span>
        </button>
      </div>

      {/* 2. LIVE INTERACTIVE MOCKUP CARD (Supervision Metric Style) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              معاينة بصرية مباشرة ومفتوحة (Live Layout Interactive Simulation)
            </h4>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
              Theme: {theme.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              Sidebar: {sidebarStyle.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Behavior: {sidebarBehavior.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Excel Light Simulation Container */}
        <div
          className={`h-40 w-full rounded-xl p-2.5 transition-all duration-300 relative overflow-hidden border ${
            theme === 'dark' ||
            (theme === 'system' &&
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-color-scheme: dark)').matches)
              ? 'bg-slate-950 border-slate-800 text-slate-100'
              : 'bg-slate-100/80 border-slate-200/90 text-slate-900'
          }`}
        >
          {/* Topbar Simulation */}
          <div
            className={`h-7 w-full rounded-lg px-2.5 flex items-center justify-between mb-2 text-[10px] font-bold border transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-slate-300'
                : 'bg-white border-slate-200/90 text-slate-800 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold">GMAO Workstation Workspace</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[9px]">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                Excel Engine 100%
              </span>
            </div>
          </div>

          {/* Body Flex Simulation */}
          <div className="flex h-[calc(100%-2.25rem)] gap-2 relative">
            {/* Sidebar Mockup */}
            <div
              className={`transition-all duration-300 flex flex-col justify-between p-2 shrink-0 ${
                sidebarStyle === 'floating'
                  ? 'w-24 rounded-xl border m-0.5 shadow-xs ' +
                    (theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-indigo-400'
                      : 'bg-white border-indigo-200 text-indigo-700 shadow-indigo-50')
                  : 'w-20 rounded-none border-l ' +
                    (theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-slate-200/90 border-slate-300 text-slate-800')
              } ${
                sidebarBehavior === 'overlay' ? 'absolute top-0 right-0 bottom-0 z-20 shadow-xl' : ''
              }`}
            >
              <div className="space-y-1.5">
                <div className="h-2 w-3/4 rounded bg-indigo-600/80" />
                <div className="h-1.5 w-full rounded bg-slate-300 dark:bg-slate-700" />
                <div className="h-1.5 w-5/6 rounded bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="h-2.5 w-full rounded bg-indigo-100 dark:bg-indigo-950 border border-indigo-200/60 dark:border-indigo-800" />
            </div>

            {/* Backdrop Blur Overlay Effect Simulation */}
            {sidebarBehavior === 'overlay' && (
              <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-xs z-10 rounded-xl" />
            )}

            {/* Main Content Workspace Mockup */}
            <div
              className={`flex-1 rounded-xl p-2.5 space-y-2 border transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-white border-slate-200/90 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                <div className="h-2.5 w-28 rounded bg-slate-300 dark:bg-slate-700" />
                <div className="h-2.5 w-12 rounded bg-emerald-500/80" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="h-9 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-1.5 space-y-1">
                  <div className="h-1.5 w-1/2 rounded bg-indigo-500" />
                  <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="h-9 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-1.5 space-y-1">
                  <div className="h-1.5 w-1/2 rounded bg-amber-500" />
                  <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="h-9 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-1.5 space-y-1">
                  <div className="h-1.5 w-1/2 rounded bg-emerald-500" />
                  <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION 1: COLOR THEME CARDS (Light UI Excel Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                1. ثيم الواجهة والألوان (Color Scheme / Theme)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد الوضع البصري المناسب لعينيك ولبيئة العمل النهارية والليلية.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => updateSettings('light', sidebarStyle, sidebarBehavior)}
            className={`group relative rounded-xl border-2 p-3.5 text-right transition-all duration-200 cursor-pointer ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            {theme === 'light' && (
              <div className="absolute top-2.5 left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="mb-2.5 space-y-1.5 rounded-lg border border-slate-200 bg-[#f8fafc] p-2 shadow-inner">
              <div className="space-y-1 rounded bg-white p-2 shadow-2xs border border-slate-200">
                <div className="h-1.5 w-16 rounded-full bg-slate-300" />
                <div className="h-1.5 w-24 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center gap-1.5 rounded bg-white p-1.5 shadow-2xs border border-slate-200">
                <div className="h-3 w-3 rounded-full bg-indigo-500" />
                <div className="h-1.5 w-20 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-xs text-slate-900">
                الوضع الفاتح (Light)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              خلفيات ناصعة مع تباين ممتاز ورؤية مريحة في العمل النهاري
            </p>
          </button>

          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => updateSettings('dark', sidebarStyle, sidebarBehavior)}
            className={`group relative rounded-xl border-2 p-3.5 text-right transition-all duration-200 cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            {theme === 'dark' && (
              <div className="absolute top-2.5 left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="mb-2.5 space-y-1.5 rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-inner">
              <div className="space-y-1 rounded bg-slate-900 p-2 shadow-2xs border border-slate-800">
                <div className="h-1.5 w-16 rounded-full bg-slate-700" />
                <div className="h-1.5 w-24 rounded-full bg-slate-700" />
              </div>
              <div className="flex items-center gap-1.5 rounded bg-slate-900 p-1.5 shadow-2xs border border-slate-800">
                <div className="h-3 w-3 rounded-full bg-indigo-400" />
                <div className="h-1.5 w-20 rounded-full bg-slate-700" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-xs text-slate-900">
                الوضع الداكن (Dark)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              خلفيات داكنة Slate-950 تقي العينين من الإجهاد في الإضاءة الخافتة
            </p>
          </button>

          {/* System Mode Card */}
          <button
            type="button"
            onClick={() => updateSettings('system', sidebarStyle, sidebarBehavior)}
            className={`group relative rounded-xl border-2 p-3.5 text-right transition-all duration-200 cursor-pointer ${
              theme === 'system'
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            {theme === 'system' && (
              <div className="absolute top-2.5 left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="mb-2.5 space-y-1.5 rounded-lg border border-slate-300 bg-gradient-to-r from-[#f8fafc] to-slate-950 p-2 shadow-inner">
              <div className="space-y-1 rounded bg-white/90 p-2 shadow-2xs border border-slate-200">
                <div className="h-1.5 w-16 rounded-full bg-slate-400" />
                <div className="h-1.5 w-24 rounded-full bg-slate-300" />
              </div>
              <div className="flex items-center gap-1.5 rounded bg-white/90 p-1.5 shadow-2xs border border-slate-200">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <div className="h-1.5 w-20 rounded-full bg-slate-300" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-xs text-slate-900">
                حسب النظام (System)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              المطابقة التلقائية الذكية مع تفضيلات نظام التشغيل الخاص بك
            </p>
          </button>
        </div>
      </div>

      {/* 4. SECTION 2: SIDEBAR & LAYOUT CUSTOMIZATION */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
              <PanelLeft className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                2. تخصيص الهيكل والشريط الجانبي (Sidebar & Layout Style)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد شكل وتفاعل القائمة الجانبية مع المحتوى الرئيسي للشاشة.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Sub-Section A: Sidebar Style */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <PanelLeft className="h-3.5 w-3.5 text-indigo-600" />
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                تصميم الشريط (Style)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Standard Style */}
              <button
                type="button"
                onClick={() => updateSettings(theme, 'standard', sidebarBehavior)}
                className={`group relative rounded-xl border-2 p-2.5 text-right transition-all duration-200 cursor-pointer ${
                  sidebarStyle === 'standard'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {sidebarStyle === 'standard' && (
                  <div className="absolute top-2 left-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <div className="flex h-20 w-full rounded-lg bg-slate-100 overflow-hidden border border-slate-200/80">
                  <div className="w-1/3 bg-indigo-600/20 border-l border-slate-200 p-1 flex flex-col gap-1">
                    <div className="h-1.5 w-full rounded bg-indigo-600/40" />
                    <div className="h-1.5 w-2/3 rounded bg-indigo-600/30" />
                  </div>
                  <div className="flex-1 p-1.5 flex flex-col gap-1">
                    <div className="h-2 w-full rounded bg-slate-200" />
                    <div className="flex-1 rounded bg-slate-100" />
                  </div>
                </div>
                <span className="block w-full pt-1.5 text-center text-xs font-bold text-slate-800">
                  معياري (Standard)
                </span>
              </button>

              {/* Floating Style */}
              <button
                type="button"
                onClick={() => updateSettings(theme, 'floating', sidebarBehavior)}
                className={`group relative rounded-xl border-2 p-2.5 text-right transition-all duration-200 cursor-pointer ${
                  sidebarStyle === 'floating'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {sidebarStyle === 'floating' && (
                  <div className="absolute top-2 left-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <div className="relative h-20 w-full rounded-lg bg-slate-100 p-1 border border-slate-200/80 overflow-hidden">
                  <div className="absolute inset-y-1 right-1 w-1/3 rounded-md bg-indigo-600/25 border border-indigo-400/40 shadow-2xs p-1" />
                  <div className="absolute top-1 left-1 right-[calc(33.33%+10px)] h-4 rounded bg-slate-200 border border-slate-300/50" />
                  <div className="absolute bottom-1 left-1 right-[calc(33.33%+10px)] top-6 rounded bg-slate-100 border border-slate-300/50" />
                </div>
                <span className="block w-full pt-1.5 text-center text-xs font-bold text-slate-800">
                  عائم (Floating Glass)
                </span>
              </button>
            </div>
          </div>

          {/* Sub-Section B: Sidebar Behavior */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Layers className="h-3.5 w-3.5 text-purple-600" />
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                سلوك التفاعل (Behavior)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Push Behavior */}
              <button
                type="button"
                onClick={() => updateSettings(theme, sidebarStyle, 'push')}
                className={`group relative rounded-xl border-2 p-2.5 text-right transition-all duration-200 cursor-pointer ${
                  sidebarBehavior === 'push'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {sidebarBehavior === 'push' && (
                  <div className="absolute top-2 left-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <div className="relative h-20 w-full rounded-lg bg-slate-100 p-1 flex gap-1 border border-slate-200/80 overflow-hidden">
                  <div className="w-1/3 rounded bg-indigo-600/30 border border-indigo-400/30 group-hover:w-1/2 transition-all duration-300 p-1">
                    <div className="h-1 w-full bg-indigo-500/40 rounded" />
                  </div>
                  <div className="flex-1 rounded bg-slate-200/80 border border-slate-300/40 p-1">
                    <div className="h-1.5 w-3/4 bg-slate-300 rounded" />
                  </div>
                </div>
                <span className="block w-full pt-1.5 text-center text-xs font-bold text-slate-800">
                  دفع (Push Content)
                </span>
              </button>

              {/* Overlay Behavior */}
              <button
                type="button"
                onClick={() => updateSettings(theme, sidebarStyle, 'overlay')}
                className={`group relative rounded-xl border-2 p-2.5 text-right transition-all duration-200 cursor-pointer ${
                  sidebarBehavior === 'overlay'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {sidebarBehavior === 'overlay' && (
                  <div className="absolute top-2 left-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <div className="relative h-20 w-full rounded-lg bg-slate-100 p-1 border border-slate-200/80 overflow-hidden">
                  <div className="absolute inset-1 rounded bg-slate-200/80 p-1">
                    <div className="h-1.5 w-full bg-slate-300 rounded" />
                  </div>
                  <div className="absolute top-1 bottom-1 right-1 w-1/3 rounded bg-indigo-600/40 backdrop-blur-xs border border-indigo-400/60 z-10 shadow-sm group-hover:w-1/2 transition-all duration-300 p-1">
                    <div className="h-1 w-full bg-white/60 rounded" />
                  </div>
                </div>
                <span className="block w-full pt-1.5 text-center text-xs font-bold text-slate-800">
                  طفو (Overlay)
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppearanceLayoutSelector;
