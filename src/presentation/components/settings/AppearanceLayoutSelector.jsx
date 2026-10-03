import { useState, useCallback } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  PanelLeft,
  Layers,
  RefreshCw,
  Palette,
  Eye,
  CheckCircle2,
  Table,
  Sliders,
  Clock,
  Sparkles,
  Zap,
  FileSpreadsheet,
} from 'lucide-react';

/**
 * Composant de sélection et personnalisation de l'apparence
 * Design 100% Light UI Excel, conforme aux autres onglets du poste de travail GMAO
 * Langue : Français pur (fr)
 */
export function AppearanceLayoutSelector({
  onChange,
  showToast,
  className = '',
}) {
  // 1. Thème visuel (Par défaut Light UI Excel)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('gmao_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  // 2. Style du menu latéral : 'floating' (flottant) | 'standard' (fixe ancré)
  const [sidebarStyle, setSidebarStyle] = useState(() => {
    try {
      return localStorage.getItem('gmao_sidebar_style') || 'floating';
    } catch {
      return 'floating';
    }
  });

  // 3. Comportement du menu : 'push' (décale le contenu) | 'overlay' (superposition)
  const [sidebarBehavior, setSidebarBehavior] = useState(() => {
    try {
      return localStorage.getItem('gmao_sidebar_behavior') || 'push';
    } catch {
      return 'push';
    }
  });

  // 4. Densité d'affichage : 'comfortable' (standard) | 'compact' (haute densité)
  const [density, setDensity] = useState(() => {
    try {
      return localStorage.getItem('gmao_density') || 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  // 5. Couleur d'accentuation : 'emerald' | 'blue' | 'indigo' | 'slate'
  const [accentColor, setAccentColor] = useState(() => {
    try {
      return localStorage.getItem('gmao_accent_color') || 'emerald';
    } catch {
      return 'emerald';
    }
  });

  // 6. Options ergonomiques additionnelles
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    try {
      return localStorage.getItem('gmao_animations') !== 'false';
    } catch {
      return true;
    }
  });

  const [headerClockEnabled, setHeaderClockEnabled] = useState(() => {
    try {
      return localStorage.getItem('gmao_header_clock') !== 'false';
    } catch {
      return true;
    }
  });

  // Mise à jour des attributs DOM (Densité et Couleur d'accentuation) en mode Light
  const applyDOMPreferences = useCallback((currentDensity, currentAccent) => {
    if (typeof document === 'undefined') return;
    // L'application reste en Light UI Excel conformément à la charte actuelle
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-density', currentDensity);
    document.documentElement.setAttribute('data-accent', currentAccent);
  }, []);

  // Sauvegarde globale et notification des composants (Header, Sidebar, MainLayout)
  const persistAndDispatch = (newTheme, newStyle, newBehavior, newDensity, newAccent, newAnims, newClock) => {
    try {
      localStorage.setItem('gmao_theme', newTheme);
      localStorage.setItem('gmao_sidebar_theme', newTheme);
      localStorage.setItem('gmao_sidebar_style', newStyle);
      localStorage.setItem('gmao_sidebar_behavior', newBehavior);
      localStorage.setItem('gmao_density', newDensity);
      localStorage.setItem('gmao_accent_color', newAccent);
      localStorage.setItem('gmao_animations', String(newAnims));
      localStorage.setItem('gmao_header_clock', String(newClock));

      applyDOMPreferences(newDensity, newAccent);

      window.dispatchEvent(
        new CustomEvent('gmao_appearance_changed', {
          detail: {
            theme: newTheme,
            sidebarStyle: newStyle,
            sidebarBehavior: newBehavior,
            density: newDensity,
            accentColor: newAccent,
            animationsEnabled: newAnims,
            headerClockEnabled: newClock,
          },
        })
      );
    } catch {
      // Ignorer erreurs de quota localStorage
    }

    if (onChange) {
      onChange({
        theme: newTheme,
        sidebarStyle: newStyle,
        sidebarBehavior: newBehavior,
        density: newDensity,
        accentColor: newAccent,
        animationsEnabled: newAnims,
        headerClockEnabled: newClock,
      });
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    persistAndDispatch(newTheme, sidebarStyle, sidebarBehavior, density, accentColor, animationsEnabled, headerClockEnabled);
    if (showToast) {
      if (newTheme === 'dark') {
        showToast('Mode Clair maintenu (le Mode Sombre global est réservé pour une prochaine mise à jour)', 'info');
      } else {
        showToast('Thème Light UI Excel actif', 'info');
      }
    }
  };

  const handleSidebarStyleChange = (newStyle) => {
    setSidebarStyle(newStyle);
    persistAndDispatch(theme, newStyle, sidebarBehavior, density, accentColor, animationsEnabled, headerClockEnabled);
    if (showToast) {
      showToast(newStyle === 'floating' ? 'Menu latéral flottant sélectionné' : 'Barre latérale fixe standard sélectionnée', 'info');
    }
  };

  const handleSidebarBehaviorChange = (newBehavior) => {
    setSidebarBehavior(newBehavior);
    persistAndDispatch(theme, sidebarStyle, newBehavior, density, accentColor, animationsEnabled, headerClockEnabled);
    if (showToast) {
      showToast(newBehavior === 'push' ? 'Mode décalage du contenu actif' : 'Mode superposition actif', 'info');
    }
  };

  const handleDensityChange = (newDensity) => {
    setDensity(newDensity);
    persistAndDispatch(theme, sidebarStyle, sidebarBehavior, newDensity, accentColor, animationsEnabled, headerClockEnabled);
    if (showToast) {
      showToast(newDensity === 'compact' ? 'Densité compacte (haute lisibilité tableur) activée' : 'Densité confortable activée', 'info');
    }
  };

  const handleAccentChange = (newAccent) => {
    setAccentColor(newAccent);
    persistAndDispatch(theme, sidebarStyle, sidebarBehavior, density, newAccent, animationsEnabled, headerClockEnabled);
    if (showToast) {
      showToast("Couleur d'accentuation mise à jour", 'info');
    }
  };

  const handleToggleAnimations = () => {
    const nextVal = !animationsEnabled;
    setAnimationsEnabled(nextVal);
    persistAndDispatch(theme, sidebarStyle, sidebarBehavior, density, accentColor, nextVal, headerClockEnabled);
    if (showToast) {
      showToast(nextVal ? 'Animations d’interface activées' : 'Animations réduites', 'info');
    }
  };

  const handleToggleClock = () => {
    const nextVal = !headerClockEnabled;
    setHeaderClockEnabled(nextVal);
    persistAndDispatch(theme, sidebarStyle, sidebarBehavior, density, accentColor, animationsEnabled, nextVal);
    if (showToast) {
      showToast(nextVal ? 'Horloge de poste affichée' : 'Horloge de poste masquée', 'info');
    }
  };

  const handleResetDefaults = () => {
    setTheme('light');
    setSidebarStyle('floating');
    setSidebarBehavior('push');
    setDensity('comfortable');
    setAccentColor('emerald');
    setAnimationsEnabled(true);
    setHeaderClockEnabled(true);

    persistAndDispatch('light', 'floating', 'push', 'comfortable', 'emerald', true, true);

    if (showToast) {
      showToast("Préférences réinitialisées au standard Light UI Excel", 'success');
    }
  };

  return (
    <div className={`space-y-5 max-w-5xl mx-auto p-1 sm:p-2 text-slate-800 ${className}`}>
      {/* 1. EN-TÊTE PRINCIPAL (Format Light UI Excel) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">
                Personnalisation de l'Apparence
              </h3>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Light UI Excel Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Configurez le style de navigation, la densité des grilles de données et l'ergonomie visuelle de votre poste de travail.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Valeurs d'usine</span>
        </button>
      </div>

      {/* 2. APERÇU INTERACTIF EN DIRECT (Light UI Excel Workspace Preview) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Aperçu en direct de l'espace de travail
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Style : {sidebarStyle === 'floating' ? 'Menu Flottant' : 'Barre Fixe'}</span>
            <span aria-hidden="true">·</span>
            <span>Densité : {density === 'comfortable' ? 'Confort' : 'Compact'}</span>
            <span aria-hidden="true">·</span>
            <span>Couleur : {accentColor}</span>
          </div>
        </div>

        {/* Maquette dynamique en Light UI Excel */}
        <div className="h-48 w-full rounded-xl p-3 relative overflow-hidden border border-slate-200 bg-slate-50/90 text-slate-900 shadow-inner">
          {/* Barre supérieure simulée (Excel Header) */}
          <div className="h-8 w-full rounded-lg px-3 flex items-center justify-between mb-2.5 text-[11px] font-semibold border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-900">GMAO Poste Central</span>
              <span className="text-slate-300">|</span>
              <span className="text-[10px] text-slate-500 font-normal">Supervision Ateliers</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-600">
              {headerClockEnabled && (
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>14:30</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                <FileSpreadsheet className="w-2.5 h-2.5" />
                <span>Moteur Excel Connecté</span>
              </span>
            </div>
          </div>

          {/* Corps de la fenêtre de simulation */}
          <div className="flex h-[calc(100%-2.75rem)] gap-2.5 relative">
            {/* Menu latéral simulé */}
            <div
              className={`transition-all duration-300 flex flex-col justify-between p-2 shrink-0 ${
                sidebarStyle === 'floating'
                  ? 'w-24 rounded-xl border border-emerald-200 bg-white shadow-xs text-emerald-700'
                  : 'w-28 rounded-lg border-r border-slate-200 bg-white text-slate-800'
              } ${sidebarBehavior === 'overlay' ? 'absolute top-0 left-0 bottom-0 z-20 shadow-lg' : ''}`}
            >
              <div className="space-y-1.5">
                <div className="h-2 w-3/4 rounded bg-emerald-600/80" />
                <div className="h-1.5 w-full rounded bg-slate-200" />
                <div className="h-1.5 w-5/6 rounded bg-slate-200" />
                <div className="h-1.5 w-2/3 rounded bg-slate-200" />
              </div>
              <div className="h-2 w-full rounded bg-slate-100 border border-slate-200" />
            </div>

            {/* Voile d'arrière-plan si mode superposition */}
            {sidebarBehavior === 'overlay' && (
              <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-2xs z-10 rounded-xl pointer-events-none" />
            )}

            {/* Zone de tableau simulée (Grille Excel) */}
            <div className="flex-1 rounded-xl p-3 space-y-2 border border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-700 font-mono">STOCK_PDR_ACTIF.XLSX</span>
                </div>
                <div className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                  10 000+ Lignes
                </div>
              </div>

              {/* Lignes de données simulées avec adaptation de densité */}
              <div className={density === 'compact' ? 'space-y-1' : 'space-y-1.5'}>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200/80 text-[10px] font-mono">
                  <span className="font-semibold text-slate-700">ROUL-SKF-6204-2RS</span>
                  <span className="font-bold text-emerald-700">142 unités</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200/80 text-[10px] font-mono">
                  <span className="font-semibold text-slate-700">JOINT-TOR-NBR-45</span>
                  <span className="font-bold text-emerald-700">85 unités</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200/80 text-[10px] font-mono">
                  <span className="font-semibold text-slate-700">COURROIE-OPTIBELT</span>
                  <span className="font-bold text-emerald-700">24 unités</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION 1 : THÈME VISUEL (Cadre Standard Light UI Excel) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Thème d'affichage de l'application
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Le poste de travail utilise la charte haute clarté Light UI Excel pour une lisibilité parfaite des données tabulaires.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Option Mode Clair (Standard Actif) */}
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`group relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {theme === 'light' && (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="mb-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div className="space-y-1 rounded bg-white p-2 border border-slate-200 shadow-2xs">
                <div className="h-1.5 w-16 rounded-full bg-slate-300" />
                <div className="h-1.5 w-24 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center gap-1.5 rounded bg-white p-1.5 border border-slate-200 shadow-2xs">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div className="h-1.5 w-20 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-xs text-slate-900">
                Mode Clair (Standard Excel)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Contraste optimal et visibilité maximale pour les ateliers, bureaux et tablettes de terrain.
            </p>
          </button>

          {/* Option Mode Sombre (Présentation réservée) */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`group relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-300 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="mb-3 space-y-1.5 rounded-lg border border-slate-300 bg-slate-100 p-2.5 opacity-80">
              <div className="space-y-1 rounded bg-slate-200 p-2 border border-slate-300">
                <div className="h-1.5 w-16 rounded-full bg-slate-400" />
                <div className="h-1.5 w-24 rounded-full bg-slate-400" />
              </div>
              <div className="flex items-center gap-1.5 rounded bg-slate-200 p-1.5 border border-slate-300">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                <div className="h-1.5 w-20 rounded-full bg-slate-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-xs text-slate-700">
                Mode Sombre (À venir)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              En cours d'harmonisation architecturale pour couvrir l'ensemble des modules industriels.
            </p>
          </button>

          {/* Option Synchronisation Système */}
          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`group relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {theme === 'system' && (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="mb-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div className="space-y-1 rounded bg-white p-2 border border-slate-200 shadow-2xs">
                <div className="h-1.5 w-16 rounded-full bg-slate-300" />
                <div className="h-1.5 w-24 rounded-full bg-slate-300" />
              </div>
              <div className="flex items-center gap-1.5 rounded bg-white p-1.5 border border-slate-200 shadow-2xs">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <div className="h-1.5 w-20 rounded-full bg-slate-300" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-900">
                Automatique (Système)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Conserve la cohérence lumineuse par défaut selon l'environnement de l'ordinateur.
            </p>
          </button>
        </div>
      </div>

      {/* 4. SECTION 2 : STYLE ET DISPOSITION DE LA NAVIGATION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <PanelLeft className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Disposition de la barre latérale
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Sélectionnez le mode de navigation entre un menu rétractable compact et une barre de navigation fixe classique.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sous-section A : Style du menu */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PanelLeft className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Style du menu
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Style Flottant */}
              <button
                type="button"
                onClick={() => handleSidebarStyleChange('floating')}
                className={`relative rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                  sidebarStyle === 'floating'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {sidebarStyle === 'floating' && (
                  <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <div className="relative h-16 w-full rounded-lg bg-slate-100 p-1 border border-slate-200 mb-2 overflow-hidden">
                  <div className="absolute inset-y-1 left-1 w-1/3 rounded bg-emerald-600/30 border border-emerald-500/40 p-1" />
                  <div className="absolute top-1 left-[calc(33.33%+8px)] right-1 h-3 rounded bg-slate-200" />
                  <div className="absolute bottom-1 left-[calc(33.33%+8px)] right-1 top-5 rounded bg-white border border-slate-200" />
                </div>
                <span className="block text-xs font-bold text-slate-900">
                  Menu Flottant
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Compact avec expansion au survol
                </span>
              </button>

              {/* Style Standard Fixe */}
              <button
                type="button"
                onClick={() => handleSidebarStyleChange('standard')}
                className={`relative rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                  sidebarStyle === 'standard'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {sidebarStyle === 'standard' && (
                  <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <div className="flex h-16 w-full rounded-lg bg-slate-100 overflow-hidden border border-slate-200 mb-2">
                  <div className="w-1/3 bg-slate-200 border-r border-slate-300 p-1 flex flex-col gap-1">
                    <div className="h-1.5 w-full rounded bg-emerald-500/60" />
                    <div className="h-1.5 w-2/3 rounded bg-slate-400" />
                  </div>
                  <div className="flex-1 p-1 flex flex-col gap-1">
                    <div className="h-2 w-full rounded bg-slate-200" />
                    <div className="flex-1 rounded bg-white border border-slate-200" />
                  </div>
                </div>
                <span className="block text-xs font-bold text-slate-900">
                  Barre Fixe
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Ancrée et toujours déployée
                </span>
              </button>
            </div>
          </div>

          {/* Sous-section B : Comportement de décalage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Comportement d'interaction
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Comportement Pousser */}
              <button
                type="button"
                onClick={() => handleSidebarBehaviorChange('push')}
                className={`relative rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                  sidebarBehavior === 'push'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {sidebarBehavior === 'push' && (
                  <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <div className="relative h-16 w-full rounded-lg bg-slate-100 p-1 flex gap-1 border border-slate-200 mb-2 overflow-hidden">
                  <div className="w-1/3 rounded bg-emerald-600/30 border border-emerald-500/30 p-1">
                    <div className="h-1 w-full bg-emerald-500/50 rounded" />
                  </div>
                  <div className="flex-1 rounded bg-white border border-slate-200 p-1">
                    <div className="h-1.5 w-3/4 bg-slate-300 rounded" />
                  </div>
                </div>
                <span className="block text-xs font-bold text-slate-900">
                  Décalage (Push)
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Décale la vue sans masquer les données
                </span>
              </button>

              {/* Comportement Superposition */}
              <button
                type="button"
                onClick={() => handleSidebarBehaviorChange('overlay')}
                className={`relative rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                  sidebarBehavior === 'overlay'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {sidebarBehavior === 'overlay' && (
                  <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <div className="relative h-16 w-full rounded-lg bg-slate-100 p-1 border border-slate-200 mb-2 overflow-hidden">
                  <div className="absolute inset-1 rounded bg-white border border-slate-200 p-1">
                    <div className="h-1.5 w-full bg-slate-200 rounded" />
                  </div>
                  <div className="absolute top-1 bottom-1 left-1 w-1/3 rounded bg-emerald-600/40 border border-emerald-400/60 z-10 shadow-xs p-1">
                    <div className="h-1 w-full bg-white/80 rounded" />
                  </div>
                </div>
                <span className="block text-xs font-bold text-slate-900">
                  Superposition (Overlay)
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Survole l'espace avec voile léger
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECTION 3 : DENSITÉ D'AFFICHAGE ET ACCENTUATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Densité des données */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center shrink-0">
                <Table className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Densité d'affichage
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajustez la hauteur des lignes dans les tableaux et inventaires de stock.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Confortable */}
            <button
              type="button"
              onClick={() => handleDensityChange('comfortable')}
              className={`rounded-xl border-2 p-3.5 text-left transition-all cursor-pointer ${
                density === 'comfortable'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900">Confortable</span>
                {density === 'comfortable' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Espacement aéré idéal pour écrans tactiles et tablettes d'atelier.
              </p>
            </button>

            {/* Compacte */}
            <button
              type="button"
              onClick={() => handleDensityChange('compact')}
              className={`rounded-xl border-2 p-3.5 text-left transition-all cursor-pointer ${
                density === 'compact'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900">Compacte</span>
                {density === 'compact' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Haute densité pour visualiser un maximum de lignes de pièces par écran.
              </p>
            </button>
          </div>
        </div>

        {/* Couleur d'accentuation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Identité & Couleur d'accent
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Palette dominante des boutons d'action et indicateurs de supervision.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'emerald', label: 'Vert Usine (Défaut)', colorClass: 'bg-emerald-600', borderActive: 'border-emerald-600' },
              { id: 'blue', label: 'Bleu Maintenance', colorClass: 'bg-blue-600', borderActive: 'border-blue-600' },
              { id: 'indigo', label: 'Indigo Superviseur', colorClass: 'bg-indigo-600', borderActive: 'border-indigo-600' },
              { id: 'slate', label: 'Ardoise / Titane', colorClass: 'bg-slate-700', borderActive: 'border-slate-700' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAccentChange(item.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                  accentColor === item.id
                    ? `${item.borderActive} bg-slate-50 ring-2 ring-slate-400/20`
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${item.colorClass} shrink-0`} />
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. SECTION 4 : OPTIONS ERGONOMIQUES DU POSTE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Options d'ergonomie et réactivité
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Optimisations des éléments dynamiques affichés dans la barre supérieure et les panneaux.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Option Horloge */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Horloge de poste en temps réel
                </span>
                <span className="text-xs text-slate-500">
                  Affiche l'heure locale industrielle et l'horodatage des relèves dans la barre supérieure.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleClock}
              role="switch"
              aria-checked={headerClockEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                headerClockEnabled ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                  headerClockEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Option Animations */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Transitions et animations fluides
                </span>
                <span className="text-xs text-slate-500">
                  Active les animations de déploiement des volets et des fenêtres modales.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleAnimations}
              role="switch"
              aria-checked={animationsEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                animationsEnabled ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                  animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppearanceLayoutSelector;
