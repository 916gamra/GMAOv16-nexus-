import { useState, useMemo } from 'react';
import {
  Wrench,
  Play,
  CheckCircle,
  Clock,
  User,
  Package,
  Search,
  SlidersHorizontal,
  RotateCcw,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Zap,
  ArrowRight,
  Sparkles,
  Calendar,
  Factory,
} from 'lucide-react';
import { stockIndexStore } from '../../../application/StockIndexStore';
import * as XLSX from 'xlsx';

export default function BonsTravailTab({
  interventions = [],
  onStartLive,
  onUpdateIntervention: _onUpdateIntervention,
  onNavigateToTab,
  stockItems: _stockItems = [],
  technicians = [],
  intervenants = [],
  panneCategories: _panneCategories = {},
  actionsByPanne: _actionsByPanne = {},
  travauxAFaire: _travauxAFaire = [],
  showToast,
}) {
  const [filterStatus, setFilterStatus] = useState('EN_COURS'); // 'ALL', 'EN_COURS', 'CLOTURE'
  const [filterTech, setFilterTech] = useState('ALL');
  const [filterMachine, setFilterMachine] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting & Pagination State
  const [sortField, setSortField] = useState('num_bt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // BTs are interventions that have a num_bt
  const bts = useMemo(() => {
    return interventions.filter((item) => Boolean(item.num_bt));
  }, [interventions]);

  // All technicians present in BTs + configured intervenants
  const availableTechs = useMemo(() => {
    const set = new Set();
    bts.forEach((b) => {
      if (b.intervenant) set.add(b.intervenant);
    });
    (intervenants || []).forEach((i) => {
      const nom = i.nom || i.name;
      if (nom) set.add(nom);
    });
    (technicians || []).forEach((t) => {
      const nom = t.nom || t.name;
      if (nom) set.add(nom);
    });
    return Array.from(set);
  }, [bts, intervenants, technicians]);

  // All machines present in BTs
  const availableMachines = useMemo(() => {
    const set = new Set();
    bts.forEach((b) => {
      if (b.code_machine) set.add(b.code_machine);
    });
    return Array.from(set).sort();
  }, [bts]);

  // KPI Metrics
  const kpiStats = useMemo(() => {
    const total = bts.length;
    const inProgress = bts.filter((b) => b.statut === 'EN_COURS' || b.statut === 'BT_PLANIFIE').length;
    const closed = bts.filter((b) => b.statut === 'CLOTURE').length;
    const withPdr = bts.filter((b) => Boolean(b.pdr || b.pdr_ref)).length;

    return { total, inProgress, closed, withPdr };
  }, [bts]);

  // Filtered BTs
  const filteredBts = useMemo(() => {
    return bts.filter((bt) => {
      if (
        filterStatus === 'EN_COURS' &&
        bt.statut !== 'EN_COURS' &&
        bt.statut !== 'BT_PLANIFIE' &&
        bt.statut !== 'DEMANDE'
      )
        return false;
      if (filterStatus === 'CLOTURE' && bt.statut !== 'CLOTURE') return false;
      if (filterStatus === 'WITH_PDR' && !bt.pdr && !bt.pdr_ref) return false;

      if (filterTech !== 'ALL' && bt.intervenant !== filterTech) return false;
      if (filterMachine !== 'ALL' && bt.code_machine !== filterMachine) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const num = String(bt.num_bt || '').toLowerCase();
        const machine = String(bt.code_machine || '').toLowerCase();
        const anom = String(bt.anomalie || '').toLowerCase();
        const desc = String(bt.travail_a_faire || bt.action_realisee || '').toLowerCase();
        const tech = String(bt.intervenant || '').toLowerCase();
        if (
          !num.includes(term) &&
          !machine.includes(term) &&
          !anom.includes(term) &&
          !desc.includes(term) &&
          !tech.includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [bts, filterStatus, filterTech, filterMachine, searchTerm]);

  // Sorting
  const sortedBts = useMemo(() => {
    const list = [...filteredBts];
    list.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredBts, sortField, sortOrder]);

  // Pagination
  const totalItems = sortedBts.length;
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize) || 1;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const rawDisplayedBts =
    pageSize === 0 ? sortedBts : sortedBts.slice(startIndex, startIndex + effectivePageSize);

  // Table row padding
  const displayedBts = useMemo(() => {
    const minRows = 15;
    if (rawDisplayedBts.length >= minRows) return rawDisplayedBts;
    const padded = [...rawDisplayedBts];
    for (let i = 0; i < minRows - rawDisplayedBts.length; i++) {
      padded.push({ __isEmptyPlaceholder: true, id: `empty-${i}` });
    }
    return padded;
  }, [rawDisplayedBts]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition shrink-0" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-700 shrink-0 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-700 shrink-0 font-bold" />
    );
  };

  const hasActiveFilters =
    filterStatus !== 'ALL' ||
    filterTech !== 'ALL' ||
    filterMachine !== 'ALL' ||
    Boolean(searchTerm);

  const clearAllFilters = () => {
    setFilterStatus('ALL');
    setFilterTech('ALL');
    setFilterMachine('ALL');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleStartLiveIntervention = (bt) => {
    onStartLive(bt.id);
    showToast?.(`Intervention Live démarrée pour ${bt.num_bt} (${bt.code_machine})`, 'success');
    if (onNavigateToTab) {
      onNavigateToTab('corrective_live');
    }
  };

  const handleExportFilteredExcel = () => {
    try {
      const headers = [
        'N° BT (B)',
        'Machine (A)',
        'Intervenant (D)',
        'Date Demande (C)',
        'Heure Début (E)',
        'Type Panne (I)',
        'Anomalie (J)',
        'Travail à Faire (K)',
        'PDR (L)',
        'Statut',
      ];
      const dataRows = filteredBts.map((item) => [
        item.num_bt || '',
        item.code_machine || '',
        item.intervenant || '',
        item.date_demande || '',
        item.heure_debut || '',
        item.type_panne || '',
        item.anomalie || '',
        item.travail_a_faire || '',
        item.pdr || item.pdr_ref || '',
        item.statut || '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bons_de_Travail');
      XLSX.writeFile(wb, `Bons_de_Travail_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

      showToast?.('Export Excel des Bons de Travail généré avec succès (.xlsx)', 'success');
    } catch (err) {
      console.error(err);
      showToast?.('Erreur lors de l\'export Excel', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top 4 Primary KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total BTs */}
        <div
          onClick={() => setFilterStatus('ALL')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            filterStatus === 'ALL'
              ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-blue-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(59,130,246,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                Total Bons de Travail (BT)
              </span>
              <Wrench className="w-6 h-6 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
                {kpiStats.total}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">ordres</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono">
                Col B Excel
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Historique usine :</span>
            <span className="font-mono font-bold text-blue-700">Complet</span>
          </div>
        </div>

        {/* BTs En Cours */}
        <div
          onClick={() => setFilterStatus('EN_COURS')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            filterStatus === 'EN_COURS'
              ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-amber-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(245,158,11,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                BTs En Cours d'Atelier
              </span>
              <Play className="w-6 h-6 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 font-mono tracking-tight">
                {kpiStats.inProgress}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">interventions</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono animate-pulse">
                Chrono Live disponible
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Techniciens mobilisés :</span>
            <span className="font-mono font-bold text-amber-700">{availableTechs.length} actifs</span>
          </div>
        </div>

        {/* BTs Clôturés */}
        <div
          onClick={() => setFilterStatus('CLOTURE')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            filterStatus === 'CLOTURE'
              ? 'border-emerald-400 ring-2 ring-emerald-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-emerald-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(16,185,129,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                BTs Clôturés & Validés
              </span>
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 font-mono tracking-tight">
                {kpiStats.closed}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">dépannages OK</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                Temps calculé & PDR déstockée
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Taux résolution :</span>
            <span className="font-mono font-bold text-emerald-700">
              {kpiStats.total ? Math.round((kpiStats.closed / kpiStats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Avec PDR */}
        <div
          onClick={() => setFilterStatus('WITH_PDR')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            filterStatus === 'WITH_PDR'
              ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-cyan-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(6,182,212,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                Consommation PDR
              </span>
              <Package className="w-6 h-6 text-cyan-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-cyan-600 font-mono tracking-tight">
                {kpiStats.withPdr}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">avec pièces</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 font-mono">
                Liaison Stock Automatique
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Impact magasin :</span>
            <span className="font-mono font-bold text-cyan-700">Sorties PDR</span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Card (Unified Mature Light UI Design System) */}
      <div className="relative z-30 bg-white border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-200/80 flex items-center justify-center text-blue-700 shadow-2xs">
              <SlidersHorizontal className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Filtres & Recherche Avancée BT
                </span>
                <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold border border-blue-200/70 shadow-2xs">
                  {filteredBts.length} BT{filteredBts.length > 1 ? 's' : ''} affiché{filteredBts.length > 1 ? 's' : ''} / {bts.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ordres de Réparation • Lancement direct du Chronomètre d'Atelier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportFilteredExcel}
              className="h-8 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Exporter les BTs filtrés vers Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-8 h-8 rounded-full border border-rose-200/80 bg-rose-50 hover:bg-rose-100 text-rose-700 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                title="Réinitialiser tous les filtres actifs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Status Presets */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            <Wrench className="w-3 h-3 text-slate-400" />
            État BT :
          </span>
          {[
            { key: 'ALL', label: 'Tous les BTs', count: bts.length },
            {
              key: 'EN_COURS',
              label: 'En Cours',
              count: kpiStats.inProgress,
              color: 'text-amber-700 bg-amber-50 border-amber-200',
            },
            {
              key: 'CLOTURE',
              label: 'Clôturés',
              count: kpiStats.closed,
              color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            },
            {
              key: 'WITH_PDR',
              label: 'Avec PDR',
              count: kpiStats.withPdr,
              color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
            },
          ].map((preset) => {
            const isActive = filterStatus === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => setFilterStatus(preset.key)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{preset.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : preset.color || 'bg-white text-slate-700'
                  }`}
                >
                  {preset.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3-Column Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher BT, machine, intervenant..."
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-blue-400 focus:outline-hidden transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Technicien Filter */}
          <div>
            <select
              value={filterTech}
              onChange={(e) => {
                setFilterTech(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-blue-400 focus:outline-hidden transition"
            >
              <option value="ALL">Tous les Techniciens ({availableTechs.length})</option>
              {availableTechs.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>

          {/* Machine Filter */}
          <div>
            <select
              value={filterMachine}
              onChange={(e) => {
                setFilterMachine(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-blue-400 focus:outline-hidden transition"
            >
              <option value="ALL">Toutes les Machines ({availableMachines.length})</option>
              {availableMachines.slice(0, 50).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Excel-Grade Clean Industrial Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-200 select-none">
                <th
                  onClick={() => toggleSort('num_bt')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>N° BT (Col B)</span>
                    {renderSortIcon('num_bt')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('code_machine')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Machine (Col A)</span>
                    {renderSortIcon('code_machine')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('intervenant')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Intervenant (Col D)</span>
                    {renderSortIcon('intervenant')}
                  </div>
                </th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4">Anomalie (Col J)</th>
                <th className="py-3 px-4">Travail à Faire (Col K)</th>
                <th className="py-3 px-4">PDR Prévue (Col L)</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Action Directe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {displayedBts.map((bt, idx) => {
                if (bt.__isEmptyPlaceholder) {
                  return (
                    <tr key={bt.id} className="h-11 bg-slate-50/20">
                      <td colSpan={9} className="py-2 px-4 text-slate-300 font-mono text-[11px]">
                        &nbsp;
                      </td>
                    </tr>
                  );
                }

                const isClosed = bt.statut === 'CLOTURE';

                return (
                  <tr
                    key={bt.id || idx}
                    className="hover:bg-blue-50/40 transition-colors group h-11"
                  >
                    {/* N° BT */}
                    <td className="py-2.5 px-4 font-black text-blue-900 font-mono flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center font-black text-[10px]">
                        BT
                      </div>
                      <span>{bt.num_bt}</span>
                    </td>

                    {/* Machine */}
                    <td className="py-2.5 px-4 font-bold text-slate-800 font-mono">
                      {bt.code_machine}
                    </td>

                    {/* Intervenant */}
                    <td className="py-2.5 px-4 text-slate-700 font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{bt.intervenant || 'Non assigné'}</span>
                    </td>

                    {/* Type Panne */}
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {bt.type_panne || 'M'}
                      </span>
                    </td>

                    {/* Anomalie */}
                    <td className="py-2.5 px-4 font-medium text-slate-800 max-w-xs truncate" title={bt.anomalie}>
                      {bt.anomalie || 'court_circuit'}
                    </td>

                    {/* Travail à Faire */}
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={bt.travail_a_faire}>
                      {bt.travail_a_faire || bt.action_realisee || 'Intervention standard'}
                    </td>

                    {/* PDR */}
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                      {bt.pdr || bt.pdr_ref ? (
                        <span className="text-cyan-800 font-medium flex items-center gap-1">
                          <Package className="w-3 h-3 text-cyan-600 shrink-0" />
                          <span className="truncate">{bt.pdr || bt.pdr_ref}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="py-2.5 px-3 text-center">
                      {isClosed ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                          CLÔTURÉ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-900 border border-blue-300 font-mono animate-pulse">
                          EN COURS
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4 text-right">
                      {!isClosed ? (
                        <button
                          onClick={() => handleStartLiveIntervention(bt)}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs active:scale-95"
                          title="Lancer le Chrono Live et déduire automatiquement les pauses"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Chrono Live</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono font-bold text-emerald-700">
                          {bt.temps_intervention_calc || bt.temps_intervention || '00:45'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="bg-slate-50/90 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Afficher par page :</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-xs focus:outline-hidden"
            >
              <option value={15}>15 lignes</option>
              <option value={20}>20 lignes</option>
              <option value={50}>50 lignes</option>
              <option value={100}>100 lignes</option>
              <option value={0}>Tous ({totalItems})</option>
            </select>
            <span className="text-slate-400 font-mono">
              ({startIndex + 1} à {Math.min(startIndex + effectivePageSize, totalItems)} sur {totalItems})
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs cursor-pointer shadow-2xs"
              >
                Précédent
              </button>
              <span className="px-3 font-mono font-bold text-slate-800">
                Page {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs cursor-pointer shadow-2xs"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
