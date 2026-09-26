import { useState, useMemo } from 'react';
import {
  Database,
  Search,
  BookOpen,
  Wrench,
  RefreshCw,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Filter,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import PannesCatalogTab from './referentiel/PannesCatalogTab';
import TravauxStandardTab from './referentiel/TravauxStandardTab';
import MatricesActionsTab from './referentiel/MatricesActionsTab';
import EquipeIntervenantsTab from './referentiel/EquipeIntervenantsTab';

const CATEGORY_META = {
  E: { label: 'Électrique', color: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500' },
  M: { label: 'Mécanique', color: 'bg-blue-100 text-blue-900 border-blue-300', dot: 'bg-blue-500' },
  H: { label: 'Hydraulique', color: 'bg-cyan-100 text-cyan-900 border-cyan-300', dot: 'bg-cyan-500' },
  P: { label: 'Pneumatique', color: 'bg-teal-100 text-teal-900 border-teal-300', dot: 'bg-teal-500' },
  E_M: { label: 'Électro-Mécanique', color: 'bg-indigo-100 text-indigo-900 border-indigo-300', dot: 'bg-indigo-500' },
  E_H: { label: 'Électro-Hydraulique', color: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-500' },
  E_P: { label: 'Électro-Pneumatique', color: 'bg-pink-100 text-pink-900 border-pink-300', dot: 'bg-pink-500' },
  M_P: { label: 'Mécanique-Pneumatique', color: 'bg-sky-100 text-sky-900 border-sky-300', dot: 'bg-sky-500' },
  M_H: { label: 'Mécanique-Hydraulique', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-500' },
  AUTRE: { label: 'Autres Anomalies', color: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-500' },
};

function formatPanneName(str) {
  if (!str) return '';
  return String(str)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReferentielPannesTravauxTab({
  activeSubTab,
  onSubTabChange,
  hideHeaderCard = false,
  panneCategories = {},
  travauxAFaire = [],
  actionsByPanne = {},
  intervenants = [],
  onAddDemandeWithPreset,
  onForceSyncSeed,
  onAddActionForPanne: _onAddActionForPanne,
  showToast,
}) {
  const [internalSubTab, setInternalSubTab] = useState('pannes'); // 'pannes', 'travaux', 'actions', 'intervenants'
  const subTab = activeSubTab || internalSubTab;
  const setSubTab = (val) => {
    setInternalSubTab(val);
    if (typeof onSubTabChange === 'function') {
      onSubTabChange(val);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedPanne, setExpandedPanne] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Calculations & Counts
  const allCategories = useMemo(() => {
    return Object.keys(panneCategories);
  }, [panneCategories]);

  const flatPannes = useMemo(() => {
    const list = [];
    Object.entries(panneCategories).forEach(([cat, pannes]) => {
      if (Array.isArray(pannes)) {
        pannes.forEach((p) => {
          list.push({
            id: `${cat}_${p}`,
            category: cat,
            code: p,
            name: formatPanneName(p),
            actions: actionsByPanne[p] || actionsByPanne[p.replace(/_/g, ' ')] || actionsByPanne[p.replace(/\s+/g, '_')] || [],
          });
        });
      }
    });
    return list;
  }, [panneCategories, actionsByPanne]);

  const totalPannesCount = flatPannes.length;
  const totalTravauxCount = (travauxAFaire || []).length;
  const totalActionsKeysCount = Object.keys(actionsByPanne || {}).length;
  const totalIntervenantsCount = (intervenants || []).length;

  // 2. Filtered Pannes
  const filteredPannes = useMemo(() => {
    return flatPannes.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchCat = (CATEGORY_META[item.category]?.label || '').toLowerCase().includes(q);
        return matchName || matchCode || matchCat;
      }
      return true;
    });
  }, [flatPannes, selectedCategory, searchQuery]);

  // 3. Filtered Travaux à Faire
  const filteredTravaux = useMemo(() => {
    if (!Array.isArray(travauxAFaire)) return [];
    if (!searchQuery.trim()) return travauxAFaire;
    const q = searchQuery.toLowerCase();
    return travauxAFaire.filter((t) => String(t).toLowerCase().includes(q));
  }, [travauxAFaire, searchQuery]);

  // 4. Filtered Actions Matrix
  const filteredActionsMatrix = useMemo(() => {
    const entries = Object.entries(actionsByPanne || {});
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(([panneKey, acts]) => {
      if (panneKey.toLowerCase().includes(q)) return true;
      if (Array.isArray(acts) && acts.some((a) => String(a).toLowerCase().includes(q))) return true;
      return false;
    });
  }, [actionsByPanne, searchQuery]);

  // 5. Filtered Intervenants
  const filteredIntervenants = useMemo(() => {
    if (!Array.isArray(intervenants)) return [];
    if (!searchQuery.trim()) return intervenants;
    const q = searchQuery.toLowerCase();
    return intervenants.filter((i) => {
      const nom = String(i.nom || i.name || '').toLowerCase();
      return nom.includes(q);
    });
  }, [intervenants, searchQuery]);

  // Handlers
  const handleCopyText = (text, idx) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
      showToast?.('Texte copié dans le presse-papier !', 'success');
    } catch {
      showToast?.('Impossible de copier le texte', 'error');
    }
  };

  const handleForceSync = () => {
    setIsSyncing(true);
    try {
      if (typeof onForceSyncSeed === 'function') {
        const res = onForceSyncSeed();
        showToast?.(
          `Données réelles synchronisées avec succès : ${res?.interventionsCount || 1705} Interventions, ${res?.travauxCount || 114} Travaux, ${res?.pannesCount || 282} Pannes, ${res?.actionsCount || 71} Actions !`,
          'success'
        );
      } else {
        showToast?.('Synchronisation effectuée avec succès !', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast?.('Erreur lors de la synchronisation', 'error');
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Pannes
      const pannesData = flatPannes.map((p) => ({
        Catégorie_Code: p.category,
        Catégorie_Nom: CATEGORY_META[p.category]?.label || p.category,
        Anomalie_Code: p.code,
        Anomalie_Libellé: p.name,
        Nombre_Actions_Standard: p.actions.length,
      }));
      const wsPannes = XLSX.utils.json_to_sheet(pannesData);
      XLSX.utils.book_append_sheet(wb, wsPannes, 'Pannes_Par_Categorie');

      // Sheet 2: Travaux
      const travauxData = (travauxAFaire || []).map((t, idx) => ({
        N_Ordre: idx + 1,
        Description_Travail_Standard: t,
      }));
      const wsTravaux = XLSX.utils.json_to_sheet(travauxData);
      XLSX.utils.book_append_sheet(wb, wsTravaux, 'Travaux_A_Faire_114');

      // Sheet 3: Actions Matrix
      const actionsData = [];
      Object.entries(actionsByPanne || {}).forEach(([p, acts]) => {
        (acts || []).forEach((a, i) => {
          actionsData.push({
            Anomalie_Panne: p,
            N_Action: i + 1,
            Action_Corrective_Recommandée: a,
          });
        });
      });
      const wsActions = XLSX.utils.json_to_sheet(actionsData);
      XLSX.utils.book_append_sheet(wb, wsActions, 'Actions_Par_Panne');

      // Sheet 4: Intervenants
      const techData = (intervenants || []).map((i) => ({
        Nom: i.nom || i.name || '',
        Total_Interventions_Historique: i.total || 0,
      }));
      const wsTech = XLSX.utils.json_to_sheet(techData);
      XLSX.utils.book_append_sheet(wb, wsTech, 'Intervenants_Equipe');

      XLSX.writeFile(wb, `GMAO_Referentiel_Pannes_Travaux_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast?.('Export Excel du catalogue complet généré avec succès (.xlsx)', 'success');
    } catch (e) {
      console.error(e);
      showToast?.('Erreur lors de l\'export Excel', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Metrics Card */}
      {!hideHeaderCard && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16)] transition-all relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-5 border-b border-slate-100">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
                <Database className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Catalogue & Référentiel Données GMAO (الكواليس)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                    الصفحة الثانوية (الكواليس)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-800 border border-slate-300 font-mono">
                    Accès Responsables & Administrateurs
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Espace réservé à la configuration et sauvegarde des référentiels maîtres : <b>{totalPannesCount} pannes cataloguées</b>, <b>{totalTravauxCount} tâches standards</b>, <b>{totalActionsKeysCount} matrices d'actions correctives</b> et <b>{totalIntervenantsCount} techniciens habilités</b>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={handleForceSync}
                disabled={isSyncing}
                className={`h-9 px-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 ${
                  isSyncing ? 'opacity-70 animate-pulse' : ''
                }`}
                title="Forcer la synchronisation et recharger les données d'usine complètes"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronisation...' : 'Actualiser Données Usine'}</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="h-9 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                title="Exporter l'ensemble du référentiel vers Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export Référentiel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* 4 Interactive Statistics Counters (Click to jump to sub-tab) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5">
            <div
              onClick={() => {
                setSubTab('pannes');
                setSearchQuery('');
              }}
              className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                subTab === 'pannes'
                  ? 'bg-amber-500/10 border-amber-300 shadow-2xs ring-1 ring-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Pannes Répertoriées</span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalPannesCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">10 catégories industrielles</div>
            </div>

            <div
              onClick={() => {
                setSubTab('travaux');
                setSearchQuery('');
              }}
              className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                subTab === 'travaux'
                  ? 'bg-blue-500/10 border-blue-300 shadow-2xs ring-1 ring-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Travaux Standard</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalTravauxCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Ordres & tâches d'atelier</div>
            </div>

            <div
              onClick={() => {
                setSubTab('actions');
                setSearchQuery('');
              }}
              className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                subTab === 'actions'
                  ? 'bg-emerald-500/10 border-emerald-300 shadow-2xs ring-1 ring-emerald-300'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Matrices Actions</span>
                <Wrench className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalActionsKeysCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pannes avec solutions types</div>
            </div>

            <div
              onClick={() => {
                setSubTab('intervenants');
                setSearchQuery('');
              }}
              className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                subTab === 'intervenants'
                  ? 'bg-purple-500/10 border-purple-300 shadow-2xs ring-1 ring-purple-300'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Équipe Intervenants</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalIntervenantsCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Fiches techniciens usine</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Multi-Criteria Filter & Search Card Archetype (Identical to StockView original archetype) */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_4px_10px_-2px_rgba(0,0,0,0.02)] space-y-3.5">
        {/* Header Row: Title with Icon, Result Count & Reset Button */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100/90">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Filtres & Recherche Avancée</span>
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                  {subTab === 'pannes'
                    ? `${filteredPannes.length} Pannes`
                    : subTab === 'travaux'
                    ? `${filteredTravaux.length} Travaux`
                    : subTab === 'actions'
                    ? `${filteredActionsMatrix.length} Pannes`
                    : `${filteredIntervenants.length} Intervenants`}
                </span>
              </h3>
            </div>
          </div>

          {/* Reset Filters button */}
          {(searchQuery || selectedCategory !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="w-8 h-8 rounded-full border border-rose-200/80 bg-rose-50 hover:bg-rose-100 text-rose-700 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 animate-in fade-in"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Grid Row: Omni-Text Search Input & Category Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-end">
          {/* Omni Search Input */}
          <div className="w-full sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <span>Recherche Multi-Critères</span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
                Mots-Clés / Codes
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs pointer-events-none">
                <Search className="w-3 h-3" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Rechercher dans ${
                  subTab === 'pannes'
                    ? 'les 282 pannes...'
                    : subTab === 'travaux'
                    ? 'les 114 travaux...'
                    : subTab === 'actions'
                    ? 'les matrices d\'actions...'
                    : 'les intervenants...'
                }`}
                className="w-full h-9 pl-9 pr-7 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Dropdown (When in pannes tab) */}
          {subTab === 'pannes' && (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
                <span>Catégorie D'Anomalie</span>
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                  10 Types
                </span>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer transition-colors"
              >
                <option value="ALL">Toutes les Catégories ({totalPannesCount})</option>
                {allCategories.map((cat) => {
                  const meta = CATEGORY_META[cat] || { label: cat };
                  const count = (panneCategories[cat] || []).length;
                  return (
                    <option key={cat} value={cat}>
                      {meta.label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* 3. Category Tags Row (When in pannes tab) */}
        {subTab === 'pannes' && (
          <div className="pt-2.5 border-t border-slate-100/90 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 font-mono">
              <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              Filtre Rapide :
            </span>

            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toutes ({totalPannesCount})
            </button>

            {allCategories.map((cat) => {
              const meta = CATEGORY_META[cat] || { label: cat, color: 'bg-slate-100 text-slate-800' };
              const count = (panneCategories[cat] || []).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? `${meta.color} ring-1 ring-slate-400 shadow-2xs`
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot || 'bg-slate-400'}`} />
                  <span>{meta.label}</span>
                  <span className="px-1 py-0.1 text-[9.5px] font-mono rounded bg-white/60">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SUB-TABS CONTENT MODULES */}
      {subTab === 'pannes' && (
        <PannesCatalogTab
          filteredPannes={filteredPannes}
          totalPannesCount={totalPannesCount}
          selectedCategory={selectedCategory}
          CATEGORY_META={CATEGORY_META}
          expandedPanne={expandedPanne}
          setExpandedPanne={setExpandedPanne}
          onAddDemandeWithPreset={onAddDemandeWithPreset}
          setSearchQuery={setSearchQuery}
          setSelectedCategory={setSelectedCategory}
        />
      )}

      {subTab === 'travaux' && (
        <TravauxStandardTab
          filteredTravaux={filteredTravaux}
          totalTravauxCount={totalTravauxCount}
          copiedIndex={copiedIndex}
          handleCopyText={handleCopyText}
          onAddDemandeWithPreset={onAddDemandeWithPreset}
          setSearchQuery={setSearchQuery}
        />
      )}

      {subTab === 'actions' && (
        <MatricesActionsTab
          filteredActionsMatrix={filteredActionsMatrix}
          totalActionsKeysCount={totalActionsKeysCount}
          copiedIndex={copiedIndex}
          handleCopyText={handleCopyText}
          formatPanneName={formatPanneName}
          onAddDemandeWithPreset={onAddDemandeWithPreset}
        />
      )}

      {subTab === 'intervenants' && (
        <EquipeIntervenantsTab
          filteredIntervenants={filteredIntervenants}
        />
      )}
    </div>
  );
}
