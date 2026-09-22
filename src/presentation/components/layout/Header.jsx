import { useMemo } from 'react';
import {
  Menu,
  Upload,
  Download,
  Link,
  Save,
  FileSpreadsheet,
  Bell,
  Keyboard,
  Smartphone
} from 'lucide-react';
import PWAInstallButton from '../common/PWAInstallButton';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from '../../../i18n/I18nContext';
import { analytics } from '../../../services/AnalyticsService';
import { notificationService } from '../../../services/NotificationService';
import { getParentModuleForTab } from './navConfig';

export default function Header({
  currentTab,
  setCurrentTab,
  filters,
  _navigation,
  setMobileMenuOpen,
  fileInputRef,
  handleImportFile,
  handleExportExcel,
  linkedFileName,
  onDirectLink,
  onDirectSave,
  currentUser,
  onOpenShortcuts,
  onOpenMobileSimulator,
}) {
  const { t } = useTranslation();
  const activeParent = getParentModuleForTab(currentTab);
  const childTabs = activeParent.children || [];

  // Smart Dynamic Breadcrumbs Calculation
  const breadcrumbs = useMemo(() => {
    // 1. MODULE: STOCK PDR & ITS SUB-PAGES
    if (activeParent.id === 'stock') {
      const rootCrumb = {
        id: 'stock-root',
        label: 'Stock PDR',
        onClick: () => {
          filters?.setStockTypeFilter?.('ALL');
          filters?.setStockSearch?.('');
          filters?.setDiagTypeFilter?.('ALL');
          setCurrentTab('stock');
        },
        title: 'Retourner au Stock PDR (Réinitialiser les filtres)',
      };

      if (currentTab === 'stock') {
        if (filters?.stockTypeFilter && filters.stockTypeFilter !== 'ALL') {
          return [
            rootCrumb,
            {
              id: 'stock-type-filter',
              label: `Type: ${filters.stockTypeFilter}`,
              onClick: () => setCurrentTab('types'),
              title: `Aller à Types PDR (${filters.stockTypeFilter})`,
            },
            {
              id: 'stock-articles',
              label: 'Articles',
              active: true,
            },
          ];
        }
        if (filters?.stockSearch) {
          return [
            rootCrumb,
            {
              id: 'stock-search-filter',
              label: `Réf: ${filters.stockSearch}`,
              onClick: () => filters?.setStockSearch?.(''),
              title: 'Effacer la recherche par référence',
              active: true,
            },
          ];
        }
        return [
          {
            ...rootCrumb,
            label: 'Stock PDR',
            active: false,
          },
          {
            id: 'stock-articles',
            label: 'Stock Articles',
            active: true,
          },
        ];
      }

      if (currentTab === 'types') {
        return [
          rootCrumb,
          {
            id: 'types-page',
            label: 'Types PDR',
            active: true,
          },
        ];
      }

      if (currentTab === 'designations') {
        if (filters?.diagTypeFilter && filters.diagTypeFilter !== 'ALL') {
          return [
            rootCrumb,
            {
              id: 'type-filtered-breadcrumb',
              label: `Type: ${filters.diagTypeFilter}`,
              onClick: () => {
                setCurrentTab('types');
              },
              title: `Retourner à Types PDR (${filters.diagTypeFilter})`,
            },
            {
              id: 'designations-page',
              label: 'Désignations',
              active: true,
            },
          ];
        }
        return [
          rootCrumb,
          {
            id: 'designations-page',
            label: 'Désignations PDR',
            active: true,
          },
        ];
      }

      if (currentTab === 'sortie') {
        return [
          rootCrumb,
          {
            id: 'mouvements-page',
            label: 'Mouvements',
            active: true,
          },
        ];
      }
    }

    // 2. MODULE: ENTREPÔT & ITS SUB-PAGES
    if (activeParent.id === 'entrepot') {
      const rootCrumb = {
        id: 'entrepot-root',
        label: 'Entrepôt',
        onClick: () => {
          filters?.setWhFamilyFilter?.('ALL');
          filters?.setWhTemplateFilter?.('ALL');
          filters?.setWhTypeFilter?.('ALL');
          filters?.setWhNatureFilter?.('ALL');
          filters?.setCompTemplateFamilyFilter?.('');
          filters?.setPartDesignationTypeFilter?.('');
          setCurrentTab('entrepot');
        },
        title: "Aller à l'Entrepôt",
      };

      if (currentTab === 'entrepot') {
        return [
          rootCrumb,
          { id: 'wh-stock', label: 'Stock Entrepôt', active: true },
        ];
      }
      if (currentTab === 'comp_groups') {
        return [
          rootCrumb,
          { id: 'comp-groups', label: 'Groupes Composants', active: true },
        ];
      }
      if (currentTab === 'comp_families') {
        return [
          rootCrumb,
          { id: 'comp-families', label: 'Familles Composants', active: true },
        ];
      }
      if (currentTab === 'comp_templates') {
        if (filters?.compTemplateFamilyFilter) {
          return [
            rootCrumb,
            {
              id: 'comp-fam-link',
              label: `Famille: ${filters.compTemplateFamilyFilter}`,
              onClick: () => setCurrentTab('comp_families'),
              title: 'Retourner aux Familles Composants',
            },
            { id: 'comp-templates', label: 'Templates Composants', active: true },
          ];
        }
        return [
          rootCrumb,
          { id: 'comp-templates', label: 'Templates Composants', active: true },
        ];
      }
      if (currentTab === 'part_types') {
        return [
          rootCrumb,
          { id: 'part-types', label: 'Types Parts', active: true },
        ];
      }
      if (currentTab === 'part_designations') {
        if (filters?.partDesignationTypeFilter) {
          return [
            rootCrumb,
            {
              id: 'part-type-link',
              label: `Type: ${filters.partDesignationTypeFilter}`,
              onClick: () => setCurrentTab('part_types'),
              title: 'Retourner aux Types Parts',
            },
            { id: 'part-designations', label: 'Désignations Parts', active: true },
          ];
        }
        return [
          rootCrumb,
          { id: 'part-designations', label: 'Désignations Parts', active: true },
        ];
      }
    }

    // 3. MODULE: MACHINES & ITS SUB-PAGES
    if (activeParent.id === 'machines') {
      const rootCrumb = {
        id: 'machines-root',
        label: 'Machines',
        onClick: () => {
          filters?.setMchFamilyFilter?.('ALL');
          filters?.setMchTemplateFilter?.('ALL');
          filters?.setTemplateFamilyFilter?.('ALL');
          setCurrentTab('machines');
        },
        title: 'Aller aux Machines',
      };

      if (currentTab === 'machines') {
        if (filters?.mchFamilyFilter && filters.mchFamilyFilter !== 'ALL') {
          return [
            rootCrumb,
            {
              id: 'mch-fam-link',
              label: `Famille: ${filters.mchFamilyFilter}`,
              onClick: () => setCurrentTab('families'),
              title: 'Voir la Famille',
            },
            { id: 'mch-list', label: 'Machines Registered', active: true },
          ];
        }
        return [
          rootCrumb,
          { id: 'mch-list', label: 'Machines Registered', active: true },
        ];
      }
      if (currentTab === 'families') {
        return [rootCrumb, { id: 'mch-fam', label: 'Familles', active: true }];
      }
      if (currentTab === 'templates') {
        if (filters?.templateFamilyFilter && filters.templateFamilyFilter !== 'ALL') {
          return [
            rootCrumb,
            {
              id: 'tmpl-fam-link',
              label: `Famille: ${filters.templateFamilyFilter}`,
              onClick: () => setCurrentTab('families'),
              title: 'Retourner aux Familles',
            },
            { id: 'tmpl-list', label: 'Templates', active: true },
          ];
        }
        return [rootCrumb, { id: 'tmpl-list', label: 'Templates', active: true }];
      }
      if (currentTab === 'blueprints') {
        return [rootCrumb, { id: 'mch-blueprints', label: 'Blueprints', active: true }];
      }
    }

    // 4. OTHER MODULES & FALLBACK
    const activeChild = childTabs.find((c) => c.id === currentTab);
    if (activeChild && activeChild.label !== activeParent.label) {
      return [
        {
          id: `${activeParent.id}-parent`,
          label: activeParent.label,
          onClick: () => setCurrentTab(activeParent.children?.[0]?.id || activeParent.id),
          title: `Aller à ${activeParent.label}`,
        },
        {
          id: `${activeChild.id}-child`,
          label: activeChild.label,
          active: true,
        },
      ];
    }

    return [
      {
        id: `${activeParent.id}-current`,
        label: activeParent.label,
        active: true,
      },
    ];
  }, [activeParent, currentTab, setCurrentTab, childTabs, filters]);

  const onExportWithTracking = () => {
    analytics.track('excel_exported', 'excel', { timestamp: Date.now() });
    handleExportExcel?.();
  };

  const onImportWithTracking = (e) => {
    analytics.track('excel_imported', 'excel', { fileName: e.target.files?.[0]?.name });
    handleImportFile?.(e);
  };

  const onSaveWithTracking = () => {
    analytics.track('excel_direct_save', 'excel', { fileName: linkedFileName });
    onDirectSave?.();
  };

  const handleNotificationClick = async () => {
    if (notificationService.isSupported()) {
      const perm = await notificationService.requestPermission();
      if (perm === 'granted') {
        notificationService.notify('🔔 Notifications CIOB GMAO', {
          body: 'Les notifications d’alertes de stock et de sauvegarde sont maintenant actives.',
        });
      }
    }
  };

  const handleChildTabKeyDown = (e, index) => {
    if (childTabs.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (index + 1) % childTabs.length;
      setCurrentTab(childTabs[nextIdx].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (index - 1 + childTabs.length) % childTabs.length;
      setCurrentTab(childTabs[prevIdx].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setCurrentTab(childTabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      setCurrentTab(childTabs[childTabs.length - 1].id);
    }
  };

  return (
    <header
      role="banner"
      className="sticky top-2 sm:top-3 z-30 w-[calc(100%-0.75rem)] sm:w-[calc(100%-1.25rem)] lg:w-[calc(100%-2rem)] xl:w-[calc(100%-2.5rem)] 2xl:w-[calc(100%-3rem)] max-w-[2200px] mx-auto rounded-[22px] sm:rounded-full bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] select-none transition-all my-2 sm:my-3 overflow-hidden"
    >
      <div className="px-2.5 sm:px-5 py-2 flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0">
        {/* Left: Desktop Brand Pill Capsule + Mobile Menu Button & Parent Module Title badge */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:text-black shadow-xs hover:shadow-md cursor-pointer transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            aria-label="Ouvrir le menu de navigation"
            aria-haspopup="dialog"
          >
            <Menu size={16} />
          </button>

          {/* Brand Capsule Pill (Matching Header Pills Style + Exact Mobile Sidebar Branding) */}
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1.5 rounded-full bg-white border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-emerald-300 hover:shadow-[0_4px_14px_rgba(16,185,129,0.12)] transition-all cursor-pointer shrink-0 group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            title="CIOB GMAO Light - Dashboard"
            aria-label="Tableau de bord CIOB GMAO Light"
          >
            {/* Dedicated 3D-styled green Excel workbook SVG Icon */}
            <div className="relative w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0 ring-2 ring-emerald-500/20 overflow-hidden group-hover:scale-105 transition-transform">
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4px_4px]" />
              <svg
                className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="3.5"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <line
                  x1="9.5"
                  y1="3"
                  x2="9.5"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                  strokeDasharray="1.5 1.5"
                />
                <line
                  x1="3"
                  y1="9.5"
                  x2="21"
                  y2="9.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                  strokeDasharray="1.5 1.5"
                />
                <line
                  x1="3"
                  y1="15.5"
                  x2="21"
                  y2="15.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                  strokeDasharray="1.5 1.5"
                />
                <path
                  d="M12.5 7.5L18 16.5M18 7.5L12.5 16.5"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="5" y="6" width="3" height="1.8" rx="0.5" fill="currentColor" />
                <rect x="5" y="11" width="3" height="1.8" rx="0.5" fill="currentColor" />
                <rect x="5" y="16" width="3" height="1.8" rx="0.5" fill="currentColor" />
              </svg>
            </div>

            {/* Brand Title & Subtitle */}
            <div className="text-left leading-tight pr-0.5 hidden sm:block">
              <div className="font-bold text-[12.5px] tracking-tight text-zinc-900 flex items-center gap-1">
                <span>Ciob PDR</span>
                <span className="text-[8.5px] font-extrabold uppercase px-1 py-0.1 rounded-md bg-emerald-500/15 text-emerald-700 border border-emerald-500/25">
                  XLS
                </span>
              </div>
              <div className="text-[9.5px] font-semibold text-emerald-700 tracking-tight truncate max-w-[120px]">
                Pièces de Rechange
              </div>
            </div>
          </button>

          {/* Smart Breadcrumb Navigation Capsule */}
          <div
            className="hidden md:flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] max-w-[280px] lg:max-w-[460px] shrink-0"
            role="navigation"
            aria-label="Fil d'Ariane intelligent (Breadcrumbs)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
            <ol className="flex items-center gap-1.5 text-xs tracking-tight truncate m-0 p-0 list-none">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.id || 'crumb'}-${idx}`} className="inline-flex items-center gap-1.5 min-w-0">
                    {idx > 0 && (
                      <span className="text-zinc-300 font-normal select-none shrink-0" aria-hidden="true">
                        /
                      </span>
                    )}
                    {crumb.onClick && !isLast ? (
                      <button
                        type="button"
                        onClick={crumb.onClick}
                        title={crumb.title || `Aller à ${crumb.label}`}
                        className="text-zinc-500 hover:text-emerald-700 hover:underline font-semibold cursor-pointer truncate transition-colors focus-visible:outline-hidden"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span
                        className={`truncate ${
                          isLast
                            ? 'font-bold text-zinc-900'
                            : 'font-semibold text-zinc-600'
                        }`}
                        title={crumb.label}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Center: Scrollable Responsive Sub-Tabs Navigation */}
        <nav
          role="navigation"
          aria-label="Sous-onglets de navigation"
          className="flex items-center justify-center flex-1 min-w-0 mx-1 sm:mx-2 overflow-hidden"
        >
          {childTabs.length > 0 && (
            <div
              role="tablist"
              aria-label={activeParent.label}
              className="inline-flex items-center p-1 sm:p-1.5 rounded-full bg-[#EFEFEE] border border-[#E5E5E3] shadow-[inset_0_1px_2px_rgba(0,0,0,0.06),0_2px_10px_rgba(0,0,0,0.03)] overflow-x-auto max-w-full scrollbar-none no-scrollbar flex-nowrap shrink-0 sm:shrink min-w-0 gap-0.5 sm:gap-1"
            >
              {childTabs.map((child, index) => {
                const isActive = currentTab === child.id;
                return (
                  <button
                    key={child.id}
                    role="tab"
                    id={`tab-${child.id}`}
                    aria-selected={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    tabIndex={isActive ? 0 : -1}
                    onKeyDown={(e) => handleChildTabKeyDown(e, index)}
                    onClick={() => setCurrentTab(child.id)}
                    className={`whitespace-nowrap px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11.5px] sm:text-[12.5px] font-semibold transition-all duration-200 cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden ${
                      isActive
                        ? 'bg-[#111111] text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] scale-[1.02]'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
                    }`}
                  >
                    {child.label}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Right: Actions, Excel Integration, Search, Notification & Profile */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportWithTracking}
            accept=".json,.xlsx,.xls"
            className="hidden"
            aria-label="Importer un fichier JSON ou Excel"
          />
          {/* Direct Link / Direct Save Button - Icon-Only in Emerald Theme */}
          {linkedFileName ? (
            <div className="flex items-center gap-1 shrink-0">
              <span
                className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/90 shadow-2xs truncate max-w-[130px]"
                title={`Fichier lié : ${linkedFileName}`}
                aria-label={`Fichier lié : ${linkedFileName}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                <span className="truncate">{linkedFileName}</span>
              </span>
              <button
                onClick={onSaveWithTracking}
                className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition shadow-[0_2px_8px_rgba(4,120,87,0.25)] cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
                title={`Enregistrer dans ${linkedFileName}`}
                aria-label="Sauvegarder dans le fichier Excel lié"
              >
                <Save size={16} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              onClick={onDirectLink}
              className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 flex items-center justify-center text-emerald-700 hover:text-emerald-900 transition shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-md cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
              title="Lier un fichier Excel (.xlsx)"
              aria-label="Lier directement un fichier Excel .xlsx"
            >
              <Link size={16} className="text-emerald-600 shrink-0" aria-hidden="true" />
            </button>
          )}

          <PWAInstallButton variant="header" />

          {/* Offline Language Switcher (Expands on hover) */}
          <LanguageSwitcher className="inline-flex" />

          {/* Export Excel Icon Button - Sleek Dark Neutral Style */}
          <button
            onClick={onExportWithTracking}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center transition shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:shadow-md cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden group"
            title={t('header.export_excel') || "Exporter Excel"}
            aria-label={t('header.export_excel') || "Exporter Excel"}
          >
            <Download size={15} className="text-white group-hover:scale-110 transition-transform" aria-hidden="true" />
          </button>

          {/* Action Icon Circles */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-black hover:border-zinc-300 transition shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-md cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            title="Importer JSON / Excel"
            aria-label="Importer un fichier de données JSON ou Excel"
          >
            <Upload size={16} aria-hidden="true" />
          </button>

          {/* Mobile Simulator Mode Button */}
          {onOpenMobileSimulator && (
            <button
              onClick={onOpenMobileSimulator}
              className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-blue-50 border border-blue-200/90 hover:bg-blue-100 flex items-center justify-center text-blue-700 transition shadow-[0_2px_6px_rgba(37,99,235,0.15)] cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500"
              title="تجربة وضع الموبايل (GMAO Mobile)"
              aria-label="تجربة وضع الموبايل"
            >
              <Smartphone size={16} className="text-blue-600" aria-hidden="true" />
            </button>
          )}

          <button
            onClick={onOpenShortcuts}
            className="hidden sm:flex w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-white border border-zinc-200 items-center justify-center text-zinc-600 hover:text-black hover:border-zinc-300 transition shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-md cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            title="Raccourcis clavier (F1 / ?)"
            aria-label="Afficher la liste des raccourcis clavier"
          >
            <Keyboard size={16} aria-hidden="true" />
          </button>

          <button
            onClick={handleNotificationClick}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-black hover:border-zinc-300 transition shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-md relative cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            title="Activer les notifications système"
            aria-label="Centre de notifications et alertes"
          >
            <Bell size={16} aria-hidden="true" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" aria-hidden="true" />
          </button>

          {/* User Profile Account Card Pill */}
          <button
            onClick={() => setCurrentTab('settings')}
            className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-white border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-emerald-300 hover:shadow-[0_4px_14px_rgba(16,185,129,0.12)] transition-all cursor-pointer shrink-0 group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            title="Mon Compte / Paramètres"
            aria-label={`Compte utilisateur de ${currentUser?.name || 'Achraf'} - Accéder aux paramètres`}
          >
            {/* Rounded Emerald Avatar Icon matching sidebar */}
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-extrabold text-[10.5px] flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform" aria-hidden="true">
              {currentUser?.avatar || 'RM'}
            </div>
            {/* User Name & Role matching sidebar typography */}
            <div className="hidden xl:block text-left leading-tight min-w-0 pr-0.5">
              <div className="text-[11.5px] font-bold text-slate-900 truncate">
                {currentUser?.name || 'Achraf'}
              </div>
              <div className="text-[9.5px] font-semibold text-emerald-700 truncate">
                {currentUser?.titleFr || currentUser?.role || 'Administrateur'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
