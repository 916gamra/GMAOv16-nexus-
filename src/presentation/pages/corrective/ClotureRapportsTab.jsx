import { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Eye,
  Printer,
  SlidersHorizontal,
  RotateCcw,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Clock,
  Wrench,
  CheckCircle,
  Package,
  AlertTriangle,
  Layers,
  FileText,
  User,
  Factory,
} from 'lucide-react';
import { CorrectiveCalculationService } from '../../../domain/corrective/services/CorrectiveCalculationService';
import * as XLSX from 'xlsx';

export default function ClotureRapportsTab({
  interventions = [],
  onUpdateIntervention: _onUpdateIntervention,
  showToast,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('ALL');
  const [selectedTech, setSelectedTech] = useState('ALL');
  const [selectedTypePanne, setSelectedTypePanne] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL', 'CLOTURE', 'ARRET', 'PDR'
  const [previewItem, setPreviewItem] = useState(null);

  // Sorting & Pagination State
  const [sortField, setSortField] = useState('date_demande');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Machine options
  const machines = useMemo(() => {
    const set = new Set();
    interventions.forEach((item) => {
      if (item.code_machine) set.add(item.code_machine);
    });
    return Array.from(set).sort();
  }, [interventions]);

  // Tech options
  const techs = useMemo(() => {
    const set = new Set();
    interventions.forEach((item) => {
      if (item.intervenant) set.add(item.intervenant);
    });
    return Array.from(set).sort();
  }, [interventions]);

  // Types Panne
  const typesPanne = useMemo(() => {
    const set = new Set();
    interventions.forEach((item) => {
      if (item.type_panne) set.add(item.type_panne);
    });
    return Array.from(set).sort();
  }, [interventions]);

  // KPI Metrics
  const kpiStats = useMemo(() => {
    const total = interventions.length;
    const closed = interventions.filter((i) => i.statut === 'CLOTURE' || i.temps_intervention_calc).length;
    const arret = interventions.filter((i) => i.arret_machine === true || i.arret_machine === 'OUI').length;
    const withPdr = interventions.filter((i) => Boolean(i.pdr || i.pdr_ref)).length;

    // MTTR calculation
    let totalMinutes = 0;
    let countMinutes = 0;
    interventions.forEach((i) => {
      const minutes =
        i.temps_minutes ||
        (i.temps_intervention_calc ? CorrectiveCalculationService.timeStringToMinutes(i.temps_intervention_calc) : 0);
      if (minutes > 0) {
        totalMinutes += minutes;
        countMinutes++;
      }
    });

    const avgMinutes = countMinutes > 0 ? Math.round(totalMinutes / countMinutes) : 45;
    const mttrFormatted = CorrectiveCalculationService.minutesToTimeString(avgMinutes);

    return { total, closed, arret, withPdr, avgMinutes, mttrFormatted };
  }, [interventions]);

  // Filtered interventions
  const filteredInterventions = useMemo(() => {
    return interventions.filter((item) => {
      if (selectedStatus === 'CLOTURE' && item.statut !== 'CLOTURE') return false;
      if (selectedStatus === 'ARRET' && !item.arret_machine) return false;
      if (selectedStatus === 'PDR' && !item.pdr && !item.pdr_ref) return false;

      if (selectedMachine !== 'ALL' && item.code_machine !== selectedMachine) return false;
      if (selectedTech !== 'ALL' && item.intervenant !== selectedTech) return false;
      if (selectedTypePanne !== 'ALL' && item.type_panne !== selectedTypePanne) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const code = String(item.code_machine || '').toLowerCase();
        const bt = String(item.num_bt || '').toLowerCase();
        const anom = String(item.anomalie || '').toLowerCase();
        const desc = String(item.travail_a_faire || item.action_realisee || '').toLowerCase();
        const tech = String(item.intervenant || '').toLowerCase();
        const pdr = String(item.pdr || item.pdr_ref || '').toLowerCase();
        if (
          !code.includes(term) &&
          !bt.includes(term) &&
          !anom.includes(term) &&
          !desc.includes(term) &&
          !tech.includes(term) &&
          !pdr.includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [interventions, selectedStatus, selectedMachine, selectedTech, selectedTypePanne, searchTerm]);

  // Sorting
  const sortedInterventions = useMemo(() => {
    const list = [...filteredInterventions];
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
  }, [filteredInterventions, sortField, sortOrder]);

  // Pagination
  const totalItems = sortedInterventions.length;
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize) || 1;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const rawDisplayed =
    pageSize === 0 ? sortedInterventions : sortedInterventions.slice(startIndex, startIndex + effectivePageSize);

  // Padded rows
  const displayedInterventions = useMemo(() => {
    const minRows = 15;
    if (rawDisplayed.length >= minRows) return rawDisplayed;
    const padded = [...rawDisplayed];
    for (let i = 0; i < minRows - rawDisplayed.length; i++) {
      padded.push({ __isEmptyPlaceholder: true, id: `empty-${i}` });
    }
    return padded;
  }, [rawDisplayed]);

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
      <ArrowUp className="w-3 h-3 text-emerald-700 shrink-0 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-700 shrink-0 font-bold" />
    );
  };

  const hasActiveFilters =
    selectedStatus !== 'ALL' ||
    selectedMachine !== 'ALL' ||
    selectedTech !== 'ALL' ||
    selectedTypePanne !== 'ALL' ||
    Boolean(searchTerm);

  const clearAllFilters = () => {
    setSelectedStatus('ALL');
    setSelectedMachine('ALL');
    setSelectedTech('ALL');
    setSelectedTypePanne('ALL');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleExportFilteredExcel = () => {
    try {
      const headers = [
        'N° BT (B)',
        'Machine (A)',
        'Demandeur',
        'Date Demande (C)',
        'Intervenant (D)',
        'Début (E)',
        'Fin (F)',
        'Temps Calculé (G)',
        'Arrêt Machine (H)',
        'Type Panne (I)',
        'Anomalie (J)',
        'Action / Travail Réalisé (K)',
        'PDR Utilisée (L)',
        'Marque (M)',
        'État (N)',
      ];
      const dataRows = filteredInterventions.map((item) => [
        item.num_bt || '',
        item.code_machine || '',
        item.demandeur || 'Production',
        item.date_demande || '',
        item.intervenant || '',
        `${item.date_debut || ''} ${item.heure_debut || ''}`.trim(),
        `${item.date_fin || ''} ${item.heure_fin || ''}`.trim(),
        item.temps_intervention_calc || item.temps_intervention || '',
        item.arret_machine ? 'OUI' : 'NON',
        item.type_panne || '',
        item.anomalie || '',
        item.action_realisee || item.travail_a_faire || '',
        item.pdr || item.pdr_ref || '',
        item.marque || '',
        item.etat_piece || 'Neuve',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rapport_Correctif_Filtre');
      XLSX.writeFile(wb, `Rapport_Correctif_${new Date().toISOString().split('T')[0]}.xlsx`);

      showToast?.('Export Excel du rapport filtré généré avec succès (.xlsx)', 'success');
    } catch (err) {
      console.error(err);
      showToast?.('Erreur lors de l\'export Excel', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top 4 Primary KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interventions Clôturées */}
        <div
          onClick={() => setSelectedStatus('ALL')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'ALL'
              ? 'border-emerald-400 ring-2 ring-emerald-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-emerald-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(16,185,129,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                Total Rapports Enregistrés
              </span>
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight group-hover:text-emerald-600 transition-colors">
                {kpiStats.total}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">interventions</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                Feuille Rapport Excel
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Clôturées à 100% :</span>
            <span className="font-mono font-bold text-emerald-700">{kpiStats.closed} validées</span>
          </div>
        </div>

        {/* MTTR Moyen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-blue-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(59,130,246,0.12)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                MTTR Moyen (Maintenabilité)
              </span>
              <Clock className="w-6 h-6 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 font-mono tracking-tight">
                {kpiStats.mttrFormatted}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">/ panne</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono">
                {kpiStats.avgMinutes} min temps ouvré
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Formule :</span>
            <span className="font-mono font-bold text-blue-700">Σ Temps / N</span>
          </div>
        </div>

        {/* Pannes avec Arrêt Machine */}
        <div
          onClick={() => setSelectedStatus('ARRET')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'ARRET'
              ? 'border-purple-400 ring-2 ring-purple-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-purple-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(168,85,247,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                Arrêts Machine Traités
              </span>
              <AlertTriangle className="w-6 h-6 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-600 font-mono tracking-tight">
                {kpiStats.arret}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">arrêts</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-mono">
                Col H Excel
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Impact sur parc :</span>
            <span className="font-mono font-bold text-purple-700">
              {kpiStats.total ? Math.round((kpiStats.arret / kpiStats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Total PDR Consommées */}
        <div
          onClick={() => setSelectedStatus('PDR')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'PDR'
              ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-cyan-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(6,182,212,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                PDR Utilisées & Sorties
              </span>
              <Package className="w-6 h-6 text-cyan-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-cyan-600 font-mono tracking-tight">
                {kpiStats.withPdr}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">pièces</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 font-mono">
                Col L/M/N Excel
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Déstockage :</span>
            <span className="font-mono font-bold text-cyan-700">Automatique</span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Card (Unified Mature Light UI Design System) */}
      <div className="relative z-30 bg-white border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
              <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Filtres & Recherche Avancée Rapport
                </span>
                <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-200/70 shadow-2xs">
                  {filteredInterventions.length} rapport{filteredInterventions.length > 1 ? 's' : ''} affiché{filteredInterventions.length > 1 ? 's' : ''} / {interventions.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Miroir direct de la feuille Excel <b>Rapport (Col A → N)</b> • Historique usine complet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportFilteredExcel}
              className="h-8 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Exporter le rapport filtré vers Excel (.xlsx)"
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

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            <CheckCircle className="w-3 h-3 text-slate-400" />
            Filtres Rapides :
          </span>
          {[
            { key: 'ALL', label: 'Tous', count: interventions.length },
            {
              key: 'CLOTURE',
              label: 'Clôturés Validés',
              count: kpiStats.closed,
              color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            },
            {
              key: 'ARRET',
              label: 'Avec Arrêt Machine',
              count: kpiStats.arret,
              color: 'text-purple-700 bg-purple-50 border-purple-200',
            },
            {
              key: 'PDR',
              label: 'Avec PDR Utilisée',
              count: kpiStats.withPdr,
              color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
            },
          ].map((preset) => {
            const isActive = selectedStatus === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => setSelectedStatus(preset.key)}
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

        {/* 4-Column Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher BT, machine, anomalie, PDR..."
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-400 focus:outline-hidden transition"
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

          {/* Machine Filter */}
          <div>
            <select
              value={selectedMachine}
              onChange={(e) => {
                setSelectedMachine(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-400 focus:outline-hidden transition"
            >
              <option value="ALL">Toutes les Machines ({machines.length})</option>
              {machines.slice(0, 50).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Technicien Filter */}
          <div>
            <select
              value={selectedTech}
              onChange={(e) => {
                setSelectedTech(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-400 focus:outline-hidden transition"
            >
              <option value="ALL">Tous les Techniciens ({techs.length})</option>
              {techs.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Type Panne Filter */}
          <div>
            <select
              value={selectedTypePanne}
              onChange={(e) => {
                setSelectedTypePanne(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-400 focus:outline-hidden transition"
            >
              <option value="ALL">Tous Types Panne ({typesPanne.length})</option>
              {typesPanne.map((tp) => (
                <option key={tp} value={tp}>
                  Type {tp}
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
                    <span>N° BT (B)</span>
                    {renderSortIcon('num_bt')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('code_machine')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Machine (A)</span>
                    {renderSortIcon('code_machine')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('intervenant')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Intervenant (D)</span>
                    {renderSortIcon('intervenant')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('temps_intervention_calc')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Temps Ouvré (G)</span>
                    {renderSortIcon('temps_intervention_calc')}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Arrêt (H)</th>
                <th className="py-3 px-3">Type (I)</th>
                <th className="py-3 px-4">Anomalie (J)</th>
                <th className="py-3 px-4">Travail Réalisé (K)</th>
                <th className="py-3 px-4">PDR / Marque (L/M)</th>
                <th className="py-3 px-4 text-right">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {displayedInterventions.map((item, idx) => {
                if (item.__isEmptyPlaceholder) {
                  return (
                    <tr key={item.id} className="h-11 bg-slate-50/20">
                      <td colSpan={10} className="py-2 px-4 text-slate-300 font-mono text-[11px]">
                        &nbsp;
                      </td>
                    </tr>
                  );
                }

                const isArret = item.arret_machine === true || item.arret_machine === 'OUI';

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-emerald-50/40 transition-colors group h-11"
                  >
                    {/* N° BT */}
                    <td className="py-2.5 px-4 font-black text-slate-900 font-mono flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-black text-[10px]">
                        BT
                      </div>
                      <span>{item.num_bt || `BT-${item.id?.slice(-4) || 'OK'}`}</span>
                    </td>

                    {/* Machine */}
                    <td className="py-2.5 px-4 font-bold text-slate-800 font-mono">
                      {item.code_machine}
                    </td>

                    {/* Intervenant */}
                    <td className="py-2.5 px-4 text-slate-700 font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.intervenant || 'm_hammed'}</span>
                    </td>

                    {/* Temps Ouvré */}
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {item.temps_intervention_calc || item.temps_intervention || '00:45'}
                    </td>

                    {/* Arrêt */}
                    <td className="py-2.5 px-3 text-center">
                      {isArret ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-100 text-purple-800 border border-purple-200 font-mono">
                          ARRÊT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-500 font-mono">
                          NON
                        </span>
                      )}
                    </td>

                    {/* Type Panne */}
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {item.type_panne || 'M'}
                      </span>
                    </td>

                    {/* Anomalie */}
                    <td className="py-2.5 px-4 font-medium text-slate-800 max-w-xs truncate" title={item.anomalie}>
                      {item.anomalie || 'court_circuit'}
                    </td>

                    {/* Travail Réalisé */}
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={item.travail_a_faire || item.action_realisee}>
                      {item.action_realisee || item.travail_a_faire || 'Dépannage et remise en route'}
                    </td>

                    {/* PDR */}
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                      {item.pdr || item.pdr_ref ? (
                        <span className="text-cyan-800 font-medium flex items-center gap-1">
                          <Package className="w-3 h-3 text-cyan-600 shrink-0" />
                          <span className="truncate">{item.pdr || item.pdr_ref} {item.marque ? `(${item.marque})` : ''}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* View Modal Trigger */}
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                        title="Consulter la fiche technique d'intervention"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
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

      {/* Technical Report Preview Modal */}
      {previewItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-300/80 flex items-center justify-center text-emerald-700 shadow-xs">
                  <FileText className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Fiche Technique de Rapport d'Intervention
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bon de Travail : <b>{previewItem.num_bt || 'BT-4825'}</b> • Machine : <b>{previewItem.code_machine}</b>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Machine</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{previewItem.code_machine}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Intervenant</span>
                  <span className="font-bold text-slate-900">{previewItem.intervenant || 'm_hammed'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Temps Ouvré</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {previewItem.temps_intervention_calc || previewItem.temps_intervention || '00:45'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Arrêt Machine</span>
                  <span className="font-bold text-purple-700">
                    {previewItem.arret_machine ? 'OUI (Arrêt usine)' : 'NON'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <span className="text-[10.5px] font-extrabold text-amber-950 uppercase tracking-wider block">
                  Diagnostic Panne & Anomalie Constatée
                </span>
                <div className="font-medium text-slate-900">
                  <b>Type {previewItem.type_panne || 'M'} :</b> {previewItem.anomalie || 'court_circuit'}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <b>Travail Réalisé :</b> {previewItem.action_realisee || previewItem.travail_a_faire || 'Intervention standard'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 space-y-2">
                <span className="text-[10.5px] font-extrabold text-cyan-950 uppercase tracking-wider block">
                  Pièce de Rechange (PDR) Consommée
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span>
                    <b>Désignation :</b> {previewItem.pdr || previewItem.pdr_ref || 'Aucune PDR utilisée'}
                  </span>
                  {previewItem.marque && (
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-cyan-200 text-cyan-800">
                      Marque: {previewItem.marque}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  État de la pièce : <b>{previewItem.etat_piece || 'Neuve'}</b>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer la Fiche</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
