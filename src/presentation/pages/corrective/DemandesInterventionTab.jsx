import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Flame,
  AlertTriangle,
  Plus,
  ArrowRight,
  Search,
  Clock,
  CheckCircle,
  SlidersHorizontal,
  RotateCcw,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Layers,
  Wrench,
  Check,
  Zap,
  BookOpen,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DemandesInterventionTab({
  interventions = [],
  onAddDemande,
  onConvertToBt,
  machines = [],
  technicians = [],
  actionsByPanne = {},
  panneCategories = {},
  travauxAFaire = [],
  intervenants = [],
  getActionsForPanne: getActionsForPanneProp,
  onAddActionForPanne: _onAddActionForPanne,
  showToast,
  onNavigateToTab,
  autoOpenCreate = false,
  onResetAutoOpen,
  presetData = null,
  onClearPreset,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(null); // holds selected DI
  const [showTravauxSelector, setShowTravauxSelector] = useState(false);
  const [travauxSearchTerm, setTravauxSearchTerm] = useState('');

  useEffect(() => {
    if (autoOpenCreate) {
      setShowCreateModal(true);
      onResetAutoOpen?.();
    }
  }, [autoOpenCreate, onResetAutoOpen]);

  // Filters State
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, DEMANDE, EN_COURS, CLOTURE
  const [filterUrgence, setFilterUrgence] = useState('ALL');
  const [filterTypePanne, setFilterTypePanne] = useState('ALL');
  const [filterMachine, setFilterMachine] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting & Pagination State
  const [sortField, setSortField] = useState('date_demande');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Robust search for suggested actions for a panne anomalie
  const getActionsForPanne = useCallback((anomalie) => {
    if (typeof getActionsForPanneProp === 'function') {
      return getActionsForPanneProp(anomalie);
    }
    if (!anomalie || !actionsByPanne) return [];
    const anom = String(anomalie).trim();
    if (!anom) return [];
    if (actionsByPanne[anom]) return actionsByPanne[anom];
    const withUnder = anom.replace(/\s+/g, '_');
    if (actionsByPanne[withUnder]) return actionsByPanne[withUnder];
    const withSpace = anom.replace(/_/g, ' ');
    if (actionsByPanne[withSpace]) return actionsByPanne[withSpace];
    const lower = anom.toLowerCase().replace(/_/g, ' ').trim();
    for (const [key, acts] of Object.entries(actionsByPanne)) {
      if (key.toLowerCase().replace(/_/g, ' ').trim() === lower) {
        return acts;
      }
    }
    for (const [key, acts] of Object.entries(actionsByPanne)) {
      const normKey = key.toLowerCase().replace(/_/g, ' ').trim();
      if (normKey.includes(lower) || lower.includes(normKey)) {
        return acts;
      }
    }
    return [];
  }, [actionsByPanne, getActionsForPanneProp]);

  // Combined machine list from registered state
  const allMachineOptions = useMemo(() => {
    if (Array.isArray(machines) && machines.length > 0) {
      return machines.map((m) => ({
        id_machine_registered: m.id_machine_registered || m.code || m.id,
        code: m.code || m.id_machine_registered || m.id,
        zone: m.zone || 'Atelier',
        totalInterventions: m.totalInterventions || 0,
      }));
    }
    return [
      { id_machine_registered: 'RCP-02', code: 'RCP-02', zone: 'Atelier' },
      { id_machine_registered: 'P-HYD-01', code: 'P-HYD-01', zone: 'Atelier' },
    ];
  }, [machines]);

  // Combined technician list from registered state or seeded intervenants
  const allTechnicianOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Add real intervenants from corrective team (seedIntervenants)
    if (Array.isArray(intervenants)) {
      intervenants.forEach((i) => {
        const nom = i.nom || i.name || String(i);
        if (nom && !seen.has(nom.toLowerCase())) {
          seen.add(nom.toLowerCase());
          list.push({
            nom,
            name: nom,
            role: i.total ? `${i.total} interventions` : 'Intervenant Usine',
            isCorrective: true,
          });
        }
      });
    }

    // 2. Add general technicians from userSub
    if (Array.isArray(technicians)) {
      technicians.forEach((t) => {
        const nom = t.nom || t.name || String(t);
        if (nom && !seen.has(nom.toLowerCase())) {
          seen.add(nom.toLowerCase());
          list.push({
            nom,
            name: nom,
            role: t.role || 'Technicien GMAO',
          });
        }
      });
    }

    if (list.length === 0) {
      return [
        { nom: 'm_hammed', name: 'M\'hammed', role: '1665 interventions' },
        { nom: 'Rachid', name: 'Rachid', role: '1076 interventions' },
        { nom: 'Ismaayl', name: 'Ismaayl', role: '418 interventions' },
      ];
    }
    return list;
  }, [technicians, intervenants]);

  // Form State for new DI
  const [newForm, setNewForm] = useState({
    code_machine: allMachineOptions[0]?.code || allMachineOptions[0]?.id_machine_registered || 'RCP-02',
    demandeur: 'Production',
    priorite: 'HAUTE',
    type_panne: 'E',
    anomalie: 'court_circuit',
    travail_a_faire: '',
    arret_machine: true,
  });

  useEffect(() => {
    if (presetData) {
      setNewForm((prev) => ({
        ...prev,
        type_panne: presetData.type_panne || prev.type_panne,
        anomalie: presetData.anomalie || prev.anomalie,
        travail_a_faire: presetData.travail_a_faire || prev.travail_a_faire,
      }));
      setShowCreateModal(true);
      onClearPreset?.();
    }
  }, [presetData, onClearPreset]);

  // Convert Modal State
  const [convertForm, setConvertForm] = useState({
    num_bt: '',
    intervenant: allTechnicianOptions[0]?.nom || 'm_hammed',
    priorite: 'HAUTE',
    travail_a_faire: '',
  });

  // Category Panne Options
  const availableCategories = useMemo(() => {
    return Object.keys(panneCategories || { E: [], H: [], P: [], M: [] });
  }, [panneCategories]);

  // Filtered standard travaux options
  const filteredStandardTravaux = useMemo(() => {
    if (!Array.isArray(travauxAFaire)) return [];
    if (!travauxSearchTerm.trim()) return travauxAFaire.slice(0, 30);
    const q = travauxSearchTerm.toLowerCase();
    return travauxAFaire.filter((t) => String(t).toLowerCase().includes(q)).slice(0, 30);
  }, [travauxAFaire, travauxSearchTerm]);

  const anomaliesForSelectedCategory = useMemo(() => {
    return panneCategories[newForm.type_panne] || [];
  }, [newForm.type_panne]);

  // KPI Metrics Calculation
  const kpiStats = useMemo(() => {
    const total = interventions.length;
    const pending = interventions.filter(
      (i) => i.statut === 'DEMANDE' || i.statut === 'DEMANDE_CREEE' || i.statut === 'EN_ATTENTE_VALIDATION'
    ).length;
    const converted = interventions.filter((i) => i.statut === 'EN_COURS' || Boolean(i.num_bt)).length;
    const arret = interventions.filter((i) => i.arret_machine === true || i.arret_machine === 'OUI').length;

    return { total, pending, converted, arret };
  }, [interventions]);

  // Filtered DIs
  const filteredDis = useMemo(() => {
    return interventions.filter((item) => {
      // Status filter
      if (
        filterStatus === 'DEMANDE' &&
        item.statut !== 'DEMANDE' &&
        item.statut !== 'DEMANDE_CREEE' &&
        item.statut !== 'EN_ATTENTE_VALIDATION'
      )
        return false;
      if (filterStatus === 'EN_COURS' && item.statut !== 'EN_COURS' && item.statut !== 'BT_PLANIFIE') return false;
      if (filterStatus === 'CLOTURE' && item.statut !== 'CLOTURE') return false;
      if (filterStatus === 'ARRET' && !item.arret_machine) return false;

      // Urgence filter
      if (filterUrgence !== 'ALL' && item.priorite !== filterUrgence) return false;

      // Type Panne filter
      if (filterTypePanne !== 'ALL' && item.type_panne !== filterTypePanne) return false;

      // Machine filter
      if (filterMachine !== 'ALL' && item.code_machine !== filterMachine) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const mCode = String(item.code_machine || '').toLowerCase();
        const anom = String(item.anomalie || '').toLowerCase();
        const desc = String(item.travail_a_faire || item.action_realisee || '').toLowerCase();
        const bt = String(item.num_bt || '').toLowerCase();
        const tech = String(item.intervenant || '').toLowerCase();
        if (
          !mCode.includes(term) &&
          !anom.includes(term) &&
          !desc.includes(term) &&
          !bt.includes(term) &&
          !tech.includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [interventions, filterStatus, filterUrgence, filterTypePanne, filterMachine, searchTerm]);

  // Sorting
  const sortedDis = useMemo(() => {
    const list = [...filteredDis];
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
  }, [filteredDis, sortField, sortOrder]);

  // Pagination
  const totalItems = sortedDis.length;
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize) || 1;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const rawDisplayedDis =
    pageSize === 0 ? sortedDis : sortedDis.slice(startIndex, startIndex + effectivePageSize);

  // Table row padding to guarantee crisp Excel layout
  const displayedDis = useMemo(() => {
    const minRows = 15;
    if (rawDisplayedDis.length >= minRows) return rawDisplayedDis;
    const padded = [...rawDisplayedDis];
    for (let i = 0; i < minRows - rawDisplayedDis.length; i++) {
      padded.push({ __isEmptyPlaceholder: true, id: `empty-${i}` });
    }
    return padded;
  }, [rawDisplayedDis]);

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
      <ArrowUp className="w-3 h-3 text-amber-700 shrink-0 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-700 shrink-0 font-bold" />
    );
  };

  const hasActiveFilters =
    filterStatus !== 'ALL' ||
    filterUrgence !== 'ALL' ||
    filterTypePanne !== 'ALL' ||
    filterMachine !== 'ALL' ||
    Boolean(searchTerm);

  const clearAllFilters = () => {
    setFilterStatus('ALL');
    setFilterUrgence('ALL');
    setFilterTypePanne('ALL');
    setFilterMachine('ALL');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleExportFilteredExcel = () => {
    try {
      const headers = [
        'ID',
        'Machine',
        'Type Panne',
        'Anomalie',
        'Demandeur',
        'Date Demande',
        'Heure Demande',
        'Priorité',
        'Arrêt Machine',
        'Statut',
        'N° BT',
        'Intervenant',
      ];
      const dataRows = filteredDis.map((item) => [
        item.id || '',
        item.code_machine || '',
        item.type_panne || '',
        item.anomalie || '',
        item.demandeur || 'Production',
        item.date_demande || '',
        item.heure_demande || '',
        item.priorite || 'NORMALE',
        item.arret_machine ? 'OUI' : 'NON',
        item.statut || '',
        item.num_bt || '',
        item.intervenant || '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Demandes_Intervention');
      XLSX.writeFile(wb, `Demandes_Intervention_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

      showToast?.('Export Excel des demandes d\'intervention généré avec succès (.xlsx)', 'success');
    } catch (err) {
      console.error(err);
      showToast?.('Erreur lors de l\'export Excel', 'error');
    }
  };

  // Submit new DI
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newForm.code_machine) {
      showToast?.('Veuillez sélectionner une machine', 'warning');
      return;
    }

    const created = onAddDemande({
      ...newForm,
      statut: 'DEMANDE',
      date_demande: new Date().toISOString().split('T')[0],
      heure_demande: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    });

    showToast?.(`Demande d'intervention enregistrée pour ${created.code_machine}`, 'success');
    setShowCreateModal(false);
  };

  // Open convert modal
  const handleOpenConvert = (di) => {
    setShowConvertModal(di);
    const suffix = di.id ? String(di.id).replace(/\D/g, '').slice(-4) || '1001' : '1001';
    setConvertForm({
      num_bt: di.num_bt || `BT-${suffix}`,
      intervenant: di.intervenant || allTechnicianOptions[0]?.nom || 'm_hammed',
      priorite: di.priorite || 'HAUTE',
      travail_a_faire: di.travail_a_faire || '',
    });
  };

  // Submit conversion to BT
  const handleConvertSubmit = (e) => {
    e.preventDefault();
    if (!showConvertModal) return;

    onConvertToBt(showConvertModal.id, {
      ...convertForm,
    });

    showToast?.(`DI convertie en Bon de Travail ${convertForm.num_bt}`, 'success');
    setShowConvertModal(null);
    if (onNavigateToTab) {
      onNavigateToTab('corrective_bt');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top 4 Primary KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Demandes */}
        <div
          onClick={() => setFilterStatus('ALL')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            filterStatus === 'ALL'
              ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-amber-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(245,158,11,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                Total Demandes (DI)
              </span>
              <Flame className="w-6 h-6 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight group-hover:text-amber-600 transition-colors">
                {kpiStats.total}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">demandes</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-700">Toutes origines</span>
              <span>•</span>
              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                100% tracé
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Vue générale :</span>
            <span className="font-mono font-bold text-amber-700">Flux d'entrée usine</span>
          </div>
        </div>

        {/* En Attente de Traitement */}
        <div
          onClick={() => setFilterStatus('DEMANDE')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            filterStatus === 'DEMANDE'
              ? 'border-rose-400 ring-2 ring-rose-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-rose-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(244,63,94,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                En Attente de Validation
              </span>
              <Clock className="w-6 h-6 text-rose-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 font-mono tracking-tight">
                {kpiStats.pending}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">à convertir</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-mono">
                Action Chef requise
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Priorité :</span>
            <span className="font-mono font-bold text-rose-700">Génération BT</span>
          </div>
        </div>

        {/* Converties en BT */}
        <div
          onClick={() => setFilterStatus('EN_COURS')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            filterStatus === 'EN_COURS'
              ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-blue-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(59,130,246,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                Converties en BT Actifs
              </span>
              <Wrench className="w-6 h-6 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 font-mono tracking-tight">
                {kpiStats.converted}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">ordres BT</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono">
                Techniciens affectés
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Taux prise en charge :</span>
            <span className="font-mono font-bold text-blue-700">
              {kpiStats.total ? Math.round((kpiStats.converted / kpiStats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Pannes avec Arrêt Machine */}
        <div
          onClick={() => setFilterStatus('ARRET')}
          className={`bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
            filterStatus === 'ARRET'
              ? 'border-purple-400 ring-2 ring-purple-400/30 shadow-md'
              : 'border-slate-200/90 hover:border-purple-300/80 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(168,85,247,0.12)] hover:-translate-y-1'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                Arrêt Machine Bloquant
              </span>
              <AlertTriangle className="w-6 h-6 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-600 font-mono tracking-tight">
                {kpiStats.arret}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">lignes stoppées</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-mono">
                Impact direct production
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Gravité :</span>
            <span className="font-mono font-bold text-purple-700">Arrêt Usine</span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Card (Unified Mature Light UI Design System) */}
      <div className="relative z-30 bg-white border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs">
              <SlidersHorizontal className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Filtres & Recherche Avancée DI
                </span>
                <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold border border-amber-200/70 shadow-2xs">
                  {filteredDis.length} demande{filteredDis.length > 1 ? 's' : ''} affichée{filteredDis.length > 1 ? 's' : ''} / {interventions.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Liaisons Excel Colonnes A → J • Tri multicritères et conversion instantanée en BT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportFilteredExcel}
              className="h-8 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Exporter les demandes filtrées vers Excel (.xlsx)"
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

            <button
              onClick={() => setShowCreateModal(true)}
              className="h-8 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-600/25 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer DI</span>
            </button>
          </div>
        </div>

        {/* Quick Status Presets Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            <Flame className="w-3 h-3 text-slate-400" />
            Statut DI :
          </span>
          {[
            { key: 'ALL', label: 'Toutes', count: interventions.length },
            {
              key: 'DEMANDE',
              label: 'En Attente',
              count: kpiStats.pending,
              color: 'text-rose-700 bg-rose-50 border-rose-200',
            },
            {
              key: 'EN_COURS',
              label: 'Converties BT',
              count: kpiStats.converted,
              color: 'text-blue-700 bg-blue-50 border-blue-200',
            },
            {
              key: 'ARRET',
              label: 'Arrêt Machine',
              count: kpiStats.arret,
              color: 'text-purple-700 bg-purple-50 border-purple-200',
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
              placeholder="Rechercher machine, anomalie, BT..."
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-amber-400 focus:outline-hidden transition"
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
              value={filterMachine}
              onChange={(e) => {
                setFilterMachine(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-amber-400 focus:outline-hidden transition"
            >
              <option value="ALL">Toutes les Machines ({allMachineOptions.length})</option>
              {allMachineOptions.slice(0, 50).map((m) => {
                const code = m.code || m.id_machine_registered || m.id;
                return (
                  <option key={code} value={code}>
                    {code} {m.zone ? `(${m.zone})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Type Panne Filter */}
          <div>
            <select
              value={filterTypePanne}
              onChange={(e) => {
                setFilterTypePanne(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-amber-400 focus:outline-hidden transition"
            >
              <option value="ALL">Tous Types Panne ({availableCategories.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  Type {cat} ({panneCategories[cat]?.length || 0} anomalies)
                </option>
              ))}
            </select>
          </div>

          {/* Urgence Filter */}
          <div>
            <select
              value={filterUrgence}
              onChange={(e) => {
                setFilterUrgence(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-amber-400 focus:outline-hidden transition"
            >
              <option value="ALL">Toutes les Urgences</option>
              <option value="HAUTE">HAUTE (Urgent)</option>
              <option value="MOYENNE">MOYENNE (Normal)</option>
              <option value="BASSE">BASSE (Faible)</option>
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
                  onClick={() => toggleSort('code_machine')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Machine (Col A)</span>
                    {renderSortIcon('code_machine')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('date_demande')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date & Heure (Col C)</span>
                    {renderSortIcon('date_demande')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('type_panne')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type (Col I)</span>
                    {renderSortIcon('type_panne')}
                  </div>
                </th>
                <th className="py-3 px-4">Anomalie Constatée (Col J)</th>
                <th className="py-3 px-4">Demandeur / Travail Demandé</th>
                <th className="py-3 px-3 text-center">Arrêt Machine</th>
                <th className="py-3 px-3 text-center">Priorité</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Action Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {displayedDis.map((di, idx) => {
                if (di.__isEmptyPlaceholder) {
                  return (
                    <tr key={di.id} className="h-11 bg-slate-50/20">
                      <td colSpan={9} className="py-2 px-4 text-slate-300 font-mono text-[11px]">
                        &nbsp;
                      </td>
                    </tr>
                  );
                }

                const isPending =
                  di.statut === 'DEMANDE' ||
                  di.statut === 'DEMANDE_CREEE' ||
                  di.statut === 'EN_ATTENTE_VALIDATION';
                const isArret = di.arret_machine === true || di.arret_machine === 'OUI';

                return (
                  <tr
                    key={di.id || idx}
                    className="hover:bg-amber-50/40 transition-colors group h-11"
                  >
                    {/* Machine */}
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-mono flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-black text-[10px]">
                        {String(di.code_machine || 'MCH').slice(0, 3)}
                      </div>
                      <span>{di.code_machine}</span>
                    </td>

                    {/* Date / Heure */}
                    <td className="py-2.5 px-4 text-slate-600 font-mono">
                      <div>{di.date_demande || di.date || '2026-03-24'}</div>
                      <div className="text-[10px] text-slate-400">{di.heure_demande || di.heure || '08:00'}</div>
                    </td>

                    {/* Type Panne */}
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {di.type_panne || 'M'}
                      </span>
                    </td>

                    {/* Anomalie */}
                    <td className="py-2.5 px-4 font-medium text-slate-800 max-w-xs truncate" title={di.anomalie}>
                      {di.anomalie || 'court_circuit'}
                    </td>

                    {/* Demandeur / Travail */}
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={di.travail_a_faire}>
                      <span className="font-semibold text-slate-700 mr-1">[{di.demandeur || 'Production'}]</span>
                      <span className="text-slate-500">{di.travail_a_faire || 'Diagnostic en attente'}</span>
                    </td>

                    {/* Arrêt Machine */}
                    <td className="py-2.5 px-3 text-center">
                      {isArret ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                          ARRÊT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-500 font-mono">
                          NON
                        </span>
                      )}
                    </td>

                    {/* Priorité */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                          di.priorite === 'HAUTE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : di.priorite === 'BASSE'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {di.priorite || 'MOYENNE'}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="py-2.5 px-3 text-center">
                      {isPending ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-mono animate-pulse">
                          EN ATTENTE
                        </span>
                      ) : di.statut === 'EN_COURS' ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-900 border border-blue-300 font-mono">
                          BT ACTIF
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                          CLÔTURÉ
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right">
                      {isPending ? (
                        <button
                          onClick={() => handleOpenConvert(di)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs active:scale-95"
                          title="Convertir en Bon de Travail (BT) et affecter un technicien"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Générer BT</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500 font-bold">
                          {di.num_bt || 'BT-OK'}
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

      {/* MODAL 1: Nouvelle Demande d'Intervention (DI) */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-xs">
                  <Flame className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Nouvelle Demande d'Intervention (DI)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Signalement immédiat d'une anomalie par la production
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Machine Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Machine Concernée <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newForm.code_machine}
                  onChange={(e) => setNewForm({ ...newForm, code_machine: e.target.value })}
                  className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:outline-hidden"
                >
                  {allMachineOptions.map((m) => {
                    const code = m.code || m.id_machine_registered || m.id;
                    return (
                      <option key={code} value={code}>
                        {code} {m.zone ? `(${m.zone})` : ''} - {m.totalInterventions ? `${m.totalInterventions} interventions` : 'Parc'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Type Panne & Anomalie Autocomplete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Type Panne (Base de données)
                  </label>
                  <select
                    value={newForm.type_panne}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const firstAnom = panneCategories[cat]?.[0] || '';
                      setNewForm({ ...newForm, type_panne: cat, anomalie: firstAnom });
                    }}
                    className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:outline-hidden"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} ({panneCategories[cat]?.length || 0} anomalies)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Anomalie Détectée
                  </label>
                  <select
                    value={newForm.anomalie}
                    onChange={(e) => setNewForm({ ...newForm, anomalie: e.target.value })}
                    className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:outline-hidden"
                  >
                    {anomaliesForSelectedCategory.map((anom) => (
                      <option key={anom} value={anom}>
                        {anom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Demandeur & Urgence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Service Demandeur
                  </label>
                  <input
                    type="text"
                    value={newForm.demandeur}
                    onChange={(e) => setNewForm({ ...newForm, demandeur: e.target.value })}
                    placeholder="Ex: Production, Chef d'Atelier, Qualité"
                    className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Niveau d'Urgence
                  </label>
                  <select
                    value={newForm.priorite}
                    onChange={(e) => setNewForm({ ...newForm, priorite: e.target.value })}
                    className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:outline-hidden"
                  >
                    <option value="HAUTE">HAUTE (Urgent - Arrêt Imminent)</option>
                    <option value="MOYENNE">MOYENNE (Normal - Sous 24h)</option>
                    <option value="BASSE">BASSE (Prévisionnel)</option>
                  </select>
                </div>
              </div>

              {/* Arrêt Machine Checkbox */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                <input
                  type="checkbox"
                  id="arretMachineCheck"
                  checked={newForm.arret_machine}
                  onChange={(e) => setNewForm({ ...newForm, arret_machine: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="arretMachineCheck" className="font-bold text-slate-800 text-xs cursor-pointer">
                  La machine est à l'arrêt complet (Ligne bloquée)
                </label>
              </div>

              {/* Travail à faire */}
              <div>
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Description de la Panne / Travail Souhaité
                  </label>

                  <div className="flex items-center gap-2">
                    {getActionsForPanne(newForm.anomalie).length > 0 && (
                      <span className="text-[10px] font-bold text-amber-700">
                        {getActionsForPanne(newForm.anomalie).length} actions recommandées
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowTravauxSelector(!showTravauxSelector)}
                      className="px-2 py-0.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[10.5px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <BookOpen className="w-3 h-3 text-blue-600" />
                      <span>{showTravauxSelector ? 'Fermer catalogue' : 'Choisir parmi les 114 travaux standard'}</span>
                    </button>
                  </div>
                </div>

                {/* Searchable Standard Travaux Dropdown */}
                {showTravauxSelector && (
                  <div className="mb-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-blue-900">
                        Catalogue des 114 Travaux Standard d'Atelier (Cliquer pour insérer) :
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTravauxSelector(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={travauxSearchTerm}
                      onChange={(e) => setTravauxSearchTerm(e.target.value)}
                      placeholder="Filtrer parmi les 114 travaux (ex: démonter, huile, moteur, graissage...)"
                      className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-blue-200 bg-white focus:outline-hidden focus:border-blue-400"
                    />

                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 divide-y divide-blue-100">
                      {filteredStandardTravaux.map((t, tIdx) => (
                        <div
                          key={tIdx}
                          onClick={() => {
                            setNewForm((prev) => ({
                              ...prev,
                              travail_a_faire: prev.travail_a_faire ? `${prev.travail_a_faire}\n${t}` : t,
                            }));
                            setShowTravauxSelector(false);
                            showToast?.('Travail standard inséré !', 'success');
                          }}
                          className="pt-1.5 pb-1 px-1.5 text-[11px] text-slate-800 hover:bg-blue-100/70 rounded-md cursor-pointer transition flex items-start justify-between gap-2"
                        >
                          <span className="font-medium leading-relaxed">{t}</span>
                          <span className="text-[9.5px] font-mono text-blue-600 font-bold shrink-0 mt-0.5">+ Insérer</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={newForm.travail_a_faire}
                  onChange={(e) => setNewForm({ ...newForm, travail_a_faire: e.target.value })}
                  placeholder="Ex: Vérifier le bobinage moteur, changer le fusible ou réaligner la courroie..."
                  className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:outline-hidden"
                />

                {/* Quick Action Badges for Selected Panne */}
                {getActionsForPanne(newForm.anomalie).length > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                      Actions standard pour « {newForm.anomalie} » (Cliquer pour insérer) :
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {getActionsForPanne(newForm.anomalie).map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewForm((prev) => ({
                              ...prev,
                              travail_a_faire: prev.travail_a_faire ? `${prev.travail_a_faire}\n${act}` : act,
                            }));
                          }}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-medium text-[10.5px] cursor-pointer transition shadow-2xs text-left"
                        >
                          + {act}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-amber-600/25 active:scale-95"
                >
                  Enregistrer la Demande (DI)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Convertir en Bon de Travail (BT) */}
      {showConvertModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-300/80 flex items-center justify-center text-blue-700 shadow-xs">
                  <Wrench className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Générer le Bon de Travail (BT)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Machine : <b>{showConvertModal.code_machine}</b> • Anomalie : <b>{showConvertModal.anomalie}</b>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConvertModal(null)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* N° BT */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Numéro du Bon de Travail (BT) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={convertForm.num_bt}
                  onChange={(e) => setConvertForm({ ...convertForm, num_bt: e.target.value })}
                  placeholder="Ex: BT-4825"
                  className="w-full py-2 px-3 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:outline-hidden"
                />
              </div>

              {/* Affectation Technicien */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Affecter un Intervenant / Technicien
                </label>
                <select
                  value={convertForm.intervenant}
                  onChange={(e) => setConvertForm({ ...convertForm, intervenant: e.target.value })}
                  className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:outline-hidden"
                >
                  {allTechnicianOptions.map((t) => (
                    <option key={t.nom || t.name} value={t.nom || t.name}>
                      {t.nom || t.name} {t.role ? `(${t.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructions de Travail */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Travail à Faire (Suggestions d'Atelier)
                  </label>
                  {getActionsForPanne(showConvertModal.anomalie).length > 0 && (
                    <span className="text-[10px] font-bold text-blue-700">
                      {getActionsForPanne(showConvertModal.anomalie).length} actions recommandées
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={convertForm.travail_a_faire}
                  onChange={(e) => setConvertForm({ ...convertForm, travail_a_faire: e.target.value })}
                  placeholder="Ex: Démonter vis sans fin, vérifier circuit de commande, changer roulement..."
                  className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:outline-hidden"
                />

                {/* Quick Action Badges for Selected Panne in Convert Modal */}
                {getActionsForPanne(showConvertModal.anomalie).length > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 block">
                      Actions types pour « {showConvertModal.anomalie} » :
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {getActionsForPanne(showConvertModal.anomalie).map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setConvertForm((prev) => ({
                              ...prev,
                              travail_a_faire: prev.travail_a_faire ? `${prev.travail_a_faire}\n${act}` : act,
                            }));
                          }}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-950 border border-blue-300 font-medium text-[10.5px] cursor-pointer transition shadow-2xs text-left"
                        >
                          + {act}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-blue-600/25 active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Valider et Créer le BT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
