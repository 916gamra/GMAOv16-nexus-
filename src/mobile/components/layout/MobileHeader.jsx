import { Menu, Save, Monitor, Smartphone } from 'lucide-react';
import LanguageSwitcher from '../../../presentation/components/common/LanguageSwitcher';
import { useTranslation } from '../../../i18n/I18nContext';

export function MobileHeader({
  currentTab = 'dashboard',
  setMobileMenuOpen,
  linkedFileName,
  onDirectSave,
  mobileViewMode = 'compact',
  setMobileViewMode,
  currentUser,
}) {
  const { t } = useTranslation();

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return t('nav.dashboard') || 'Accueil';
      case 'stock':
      case 'articles':
      case 'pdr':
        return t('nav.stock') || 'Stock PDR';
      case 'machines':
        return t('nav.machines') || 'Machines';
      case 'preventive':
        return t('nav.preventive') || 'Préventif';
      case 'mouvements':
      case 'sortie':
        return t('nav.mouvements') || 'Mouvements';
      case 'zones':
        return t('nav.zones') || 'Zones';
      case 'nexus':
        return 'Nexus Matrix';
      case 'settings':
        return t('nav.settings') || 'Paramètres';
      default:
        return 'GMAO Light';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 h-[52px] px-3 flex items-center justify-between shadow-2xs">
      {/* Left: Menu Drawer Toggle + Excel Brand Icon + Current Section */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => setMobileMenuOpen?.(true)}
          className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-700 active:scale-95 transition shrink-0 cursor-pointer"
          aria-label="Ouvrir le menu complet"
        >
          <Menu size={16} />
        </button>

        {/* Brand Icon */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-2xs font-black text-xs">
            XLS
          </div>
          <span className="font-extrabold text-xs tracking-tight text-zinc-900 hidden xs:inline">
            Ciob PDR
          </span>
        </div>

        {/* Active Section Pill */}
        <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold truncate max-w-[120px]">
          {getSectionTitle()}
        </div>
      </div>

      {/* Right: Excel Save Status, Mode Toggle, Language & User */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Direct Excel Save Icon (if file linked) */}
        {linkedFileName && onDirectSave && (
          <button
            onClick={onDirectSave}
            className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs active:scale-95 transition cursor-pointer"
            title={`Sauvegarder dans ${linkedFileName}`}
            aria-label="Sauvegarder directement dans Excel"
          >
            <Save size={15} />
          </button>
        )}

        {/* Toggle between Compact Mobile Mode & Full Desktop View on mobile */}
        {setMobileViewMode && (
          <button
            onClick={() =>
              setMobileViewMode((prev) => (prev === 'compact' ? 'full' : 'compact'))
            }
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition cursor-pointer ${
              mobileViewMode === 'full'
                ? 'bg-zinc-900 text-white border-zinc-800'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-zinc-900'
            }`}
            title={
              mobileViewMode === 'compact'
                ? 'Basculer en Mode Bureau Complet'
                : 'Basculer en Mode Mobile Simplifié'
            }
            aria-label="Changer le mode d'affichage"
          >
            {mobileViewMode === 'compact' ? <Monitor size={15} /> : <Smartphone size={15} />}
          </button>
        )}

        {/* Language Switcher */}
        <LanguageSwitcher className="inline-flex scale-90 -mr-1" />

        {/* User Avatar Mini */}
        {currentUser && (
          <div
            className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-extrabold text-[10px] flex items-center justify-center shadow-2xs shrink-0"
            title={currentUser.name}
          >
            {currentUser.avatar || 'RM'}
          </div>
        )}
      </div>
    </header>
  );
}

export default MobileHeader;
