import { useState, useMemo, useCallback, useEffect, useDeferredValue, useRef } from 'react';
import {
  Search,
  Calendar,
  CalendarDays,
  Grid,
  Table2,
  BarChart3,
  List,
  CheckCircle2,
  Printer,
  Package,
  Trash2,
  Activity,
  Clock,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  User,
  DollarSign,
  X,
  FileSpreadsheet,
  MapPin,
  Factory,
  Wrench,
  Filter,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import PrintWorkOrderModal from './PrintWorkOrderModal';
import PreventiveService from '../../../../application/services/PreventiveService';
import { multiTokenSearch } from '../../../../utils/searchUtils';

const ACTION_PILL_MAP = {
  C: { bg: 'bg-blue-500/10 text-blue-800 border-blue-200/80', dot: 'bg-blue-600', label: 'Contrôle' },
  N: { bg: 'bg-emerald-500/10 text-emerald-800 border-emerald-200/80', dot: 'bg-emerald-600', label: 'Nettoyage' },
  G: { bg: 'bg-amber-500/10 text-amber-800 border-amber-200/80', dot: 'bg-amber-600', label: 'Graissage' },
  V: { bg: 'bg-indigo-500/10 text-indigo-800 border-indigo-200/80', dot: 'bg-indigo-600', label: 'Vidange' },
  R: { bg: 'bg-purple-500/10 text-purple-800 border-purple-200/80', dot: 'bg-purple-600', label: 'Réglage' },
  S: { bg: 'bg-rose-500/10 text-rose-800 border-rose-200/80', dot: 'bg-rose-600', label: 'Sécurité' },
  L: { bg: 'bg-cyan-500/10 text-cyan-800 border-cyan-200/80', dot: 'bg-cyan-600', label: 'Lubrification' },
};

const STATUT_BADGES = {
  'À faire': 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs',
  'Fait': 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs',
  'En retard': 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs animate-pulse',
};

export default function TabMainView({
  tasks = [],
  machines = [],
  zones = [],
  technicians = [],
  actions = [],
  _guides = [],
  stockItems = [],
  warehouseItems = [],
  viewMode: controlledViewMode,
  onViewModeChange,
  onMarkTaskDone,
  _onDeleteTask,
  _onUpdateTaskCounter,
  _onUpdateTaskStatus,
  _onNavigateToPlanBuilder,
  onCreateCorrective,
  _onNavigateToMachine,
}) {
  const [internalViewMode, setInternalViewMode] = useState('matrix'); // 'matrix' | 'calendar' | 'list' | 'analytics'
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;
  const setViewMode = useCallback(
    (mode) => {
      if (onViewModeChange) {
        onViewModeChange(mode);
      }
      setInternalViewMode(mode);
    },
    [onViewModeChange]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Lazy loading / progressive viewport chunking
  const [visibleChunkSize, setVisibleChunkSize] = useState(50);
  const matrixScrollContainerRef = useRef(null);
  const listScrollContainerRef = useRef(null);

  // O(1) Lookup Maps for Master Data & Filters
  const machineMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(machines)) {
      machines.forEach((m) => {
        const id = m?.id_machine_registered || m?.id || m?.code || m?.id_machine;
        if (id) map.set(id, m);
      });
    }
    return map;
  }, [machines]);

  const taskMachineMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(tasks)) {
      tasks.forEach((t) => {
        if (t?.id_machine && !map.has(t.id_machine)) {
          map.set(t.id_machine, t);
        }
      });
    }
    return map;
  }, [tasks]);
  
  // Filters
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedMachine, setSelectedMachine] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedFrequence, setSelectedFrequence] = useState('ALL');
  const [selectedWeek, setSelectedWeek] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTech, setSelectedTech] = useState('ALL');

  // Matrix range selector
  const [weekRange, setWeekRange] = useState('S1-S16');

  // Pagination with fixed standard of 20 rows
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals state
  const [selectedTaskForValidation, setSelectedTaskForValidation] = useState(null);
  const [selectedTaskForBT, setSelectedTaskForBT] = useState(null);
  const [selectedTaskForPrint, setSelectedTaskForPrint] = useState(null);

  // Validation Form State with PDR & Labor
  const [validationData, setValidationData] = useState({
    date_realisation: new Date().toISOString().split('T')[0],
    technicien: '',
    duree_reelle: '20 min',
    taux_horaire: 35,
    observations: 'Intervention préventive réalisée avec succès et conforme aux normes constructeur.',
    usedPDR: [],
    mode_calcul_recurrence: 'FIXE',
    compteur_releve: '',
  });

  // Custom PDR item add form inside modal
  const [newPdrItem, setNewPdrItem] = useState({
    id_article: '',
    designation: '',
    reference: '',
    quantite: 1,
    unite: 'Pièce',
    prix_unitaire: 0,
  });

  // BT Anomaly Form State
  const [btData, setBtData] = useState({
    description: '',
    priorite: 'Haute',
  });

  // Distinct Lists for Filters connected to full Master Data
  const machineList = useMemo(() => {
    const set = new Set();
    if (Array.isArray(machines)) {
      machines.forEach((m) => {
        const id = m?.id_machine_registered || m?.id || m?.code || m?.id_machine;
        if (id && typeof id === 'string' && id.trim()) set.add(id.trim());
      });
    }
    if (Array.isArray(tasks)) {
      tasks.forEach((t) => {
        const id = t?.id_machine;
        if (id && typeof id === 'string' && id.trim()) set.add(id.trim());
      });
    }
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return ['ALL', ...sorted];
  }, [machines, tasks]);

  const zoneList = useMemo(() => {
    const set = new Set();
    if (Array.isArray(zones)) {
      zones.forEach((z) => {
        const name = typeof z === 'string' ? z : (z?.nom_zone || z?.id_zone || z?.code_zone || z?.code || z?.name);
        if (name && typeof name === 'string' && name.trim()) set.add(name.trim());
      });
    }
    if (Array.isArray(machines)) {
      machines.forEach((m) => {
        const z = m?.id_zone || m?.zone;
        if (z && typeof z === 'string' && z.trim()) set.add(z.trim());
      });
    }
    if (Array.isArray(tasks)) {
      tasks.forEach((t) => {
        const z = t?.id_zone;
        if (z && typeof z === 'string' && z.trim()) set.add(z.trim());
      });
    }
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return ['ALL', ...sorted];
  }, [zones, machines, tasks]);

  const techList = useMemo(() => {
    const set = new Set();
    if (Array.isArray(technicians)) {
      technicians.forEach((t) => {
        let name = '';
        if (typeof t === 'string') {
          name = t;
        } else if (t && typeof t === 'object') {
          if (t.nom) {
            name = `${t.nom} ${t.prenom || ''}`.trim();
          } else {
            name = t.nom_technicien || t.name || t.id_technician || '';
          }
        }
        if (name && name.trim()) set.add(name.trim());
      });
    }
    if (Array.isArray(tasks)) {
      tasks.forEach((t) => {
        const resp = t?.responsable;
        if (resp && typeof resp === 'string' && resp.trim()) set.add(resp.trim());
      });
    }
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ['ALL', ...sorted];
  }, [technicians, tasks]);

  // Current ISO Week detection for highlighting current column
  const currentWeekNumber = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - start) / (24 * 60 * 60 * 1000));
    return Math.min(52, Math.max(1, Math.ceil((days + start.getDay() + 1) / 7)));
  }, []);

  // Weeks to display in matrix
  const matrixWeeks = useMemo(() => {
    if (weekRange === 'S1-S16') return Array.from({ length: 16 }, (_, i) => `S${i + 1}`);
    if (weekRange === 'S17-S32') return Array.from({ length: 16 }, (_, i) => `S${i + 17}`);
    if (weekRange === 'S33-S52') return Array.from({ length: 20 }, (_, i) => `S${i + 33}`);
    return Array.from({ length: 52 }, (_, i) => `S${i + 1}`);
  }, [weekRange]);

  // Filtered Tasks with robust string normalization & deferred search query
  const filteredTasks = useMemo(() => {
    const norm = (str) => String(str || '').trim().toUpperCase().replace(/[-_\s]/g, '');

    return tasks.filter((t) => {
      // Search query across all fields using multiTokenSearch
      const matchSearch = multiTokenSearch(
        t,
        [
          'id_machine',
          'nom_machine',
          'composant',
          'code',
          'action_code',
          'action_libelle',
          'id_zone',
          'responsable',
          'frequence',
          'etat',
          'ref_plan',
          'id_bt',
        ],
        deferredSearchQuery
      );

      const matchZone = selectedZone === 'ALL' || norm(t.id_zone) === norm(selectedZone);
      const matchMach = selectedMachine === 'ALL' || norm(t.id_machine) === norm(selectedMachine);
      const matchAct = selectedAction === 'ALL' || (t.action_code || 'C').toUpperCase() === selectedAction.toUpperCase();
      const matchFreq = selectedFrequence === 'ALL' || norm(t.frequence) === norm(selectedFrequence);
      const matchStat = selectedStatus === 'ALL' || t.etat === selectedStatus;
      const matchTech = selectedTech === 'ALL' || norm(t.responsable) === norm(selectedTech);
      const matchWeek = selectedWeek === 'ALL' || (t.planning && Boolean(t.planning[selectedWeek]));

      return matchSearch && matchZone && matchMach && matchAct && matchFreq && matchStat && matchTech && matchWeek;
    });
  }, [tasks, deferredSearchQuery, selectedZone, selectedMachine, selectedAction, selectedFrequence, selectedStatus, selectedTech, selectedWeek]);

  // Reset page and chunk size when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
    setVisibleChunkSize(50);
  }, [searchQuery, selectedZone, selectedMachine, selectedAction, selectedFrequence, selectedWeek, selectedStatus, selectedTech, weekRange, pageSize]);

  // Infinite Scroll / Lazy Load handler on table scroll
  const handleTableScroll = useCallback((e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 250) {
      setVisibleChunkSize((prev) => {
        if (prev < filteredTasks.length) {
          return Math.min(prev + 50, filteredTasks.length);
        }
        return prev;
      });
    }
  }, [filteredTasks.length]);

  // Pagination & Lazy Chunk Slicing
  const totalItems = filteredTasks.length;
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize) || 1;
  const startIndex = (currentPage - 1) * effectivePageSize;

  // Progressive slicing based on page size & visible chunk limit
  const rawDisplayedTasks = useMemo(() => {
    if (pageSize === 0) {
      return filteredTasks.slice(0, visibleChunkSize);
    }
    const pageSlice = filteredTasks.slice(startIndex, startIndex + effectivePageSize);
    if (effectivePageSize > 50) {
      return pageSlice.slice(0, visibleChunkSize);
    }
    return pageSlice;
  }, [filteredTasks, pageSize, startIndex, effectivePageSize, visibleChunkSize]);

  // Pad with empty placeholders up to minRows = 20 for stable non-shrinking table height
  const displayedTasks = useMemo(() => {
    const minRows = 20;
    if (rawDisplayedTasks.length >= minRows || (pageSize === 0 && totalItems > 0)) return rawDisplayedTasks;
    const padded = [...rawDisplayedTasks];
    for (let i = 0; i < minRows - rawDisplayedTasks.length; i++) {
      padded.push({ __isEmptyPlaceholder: true, id: `empty-row-${i}` });
    }
    return padded;
  }, [rawDisplayedTasks, pageSize, totalItems]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const aFaire = tasks.filter((t) => t.etat === 'À faire').length;
    const fait = tasks.filter((t) => t.etat === 'Fait').length;
    const enRetard = tasks.filter((t) => t.etat === 'En retard').length;
    const complianceRate = total > 0 ? Math.round((fait / total) * 100) : 0;
    const totalCost = tasks.reduce((acc, curr) => acc + Number(curr.cout_cumule || 0), 0);

    return { total, aFaire, fait, enRetard, complianceRate, totalCost: Math.round(totalCost * 100) / 100 };
  }, [tasks]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedZone !== 'ALL') count++;
    if (selectedMachine !== 'ALL') count++;
    if (selectedAction !== 'ALL') count++;
    if (selectedFrequence !== 'ALL') count++;
    if (selectedWeek !== 'ALL') count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedTech !== 'ALL') count++;
    return count;
  }, [searchQuery, selectedZone, selectedMachine, selectedAction, selectedFrequence, selectedWeek, selectedStatus, selectedTech]);

  const hasActiveFilters = activeFiltersCount > 0;

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedZone('ALL');
    setSelectedMachine('ALL');
    setSelectedAction('ALL');
    setSelectedFrequence('ALL');
    setSelectedWeek('ALL');
    setSelectedStatus('ALL');
    setSelectedTech('ALL');
    setCurrentPage(1);
  }, []);

  // Formatted Option arrays for CustomSelect with master data integration
  const zoneOptions = useMemo(() => [
    {
      value: 'ALL',
      label: `Toutes Zones (${Math.max(0, zoneList.length - 1)})`,
      badge: 'Global',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    ...zoneList.filter((z) => z !== 'ALL').map((z) => {
      const machCountInZone = Array.isArray(machines)
        ? machines.filter((m) => (m.id_zone || m.zone) === z).length
        : 0;
      return {
        value: z,
        label: `Zone ${z}`,
        sublabel: machCountInZone > 0 ? `${machCountInZone} équipement(s) installés` : undefined,
        badge: 'Site',
        badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
      };
    }),
  ], [zoneList, machines]);

  const machineOptions = useMemo(() => [
    {
      value: 'ALL',
      label: `Toutes Machines (${Math.max(0, machineList.length - 1)})`,
      badge: 'Global',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    ...machineList.filter((m) => m !== 'ALL').map((mId) => {
      const masterMachine = machineMap.get(mId);
      const relatedTask = taskMachineMap.get(mId);
      const machineName = masterMachine?.nom_machine || masterMachine?.nom || relatedTask?.nom_machine || '';
      const zoneName = masterMachine?.id_zone || masterMachine?.zone || relatedTask?.id_zone;
      const familyName = masterMachine?.id_family || masterMachine?.family;
      return {
        value: mId,
        label: machineName ? `${mId} · ${machineName}` : mId,
        sublabel: zoneName ? `Zone: ${zoneName}${familyName ? ` · ${familyName}` : ''}` : undefined,
        badge: 'Équip.',
        badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200/80',
      };
    }),
  ], [machineList, machineMap, taskMachineMap]);

  const actionOptions = useMemo(() => [
    { value: 'ALL', label: `Toutes Actions (${actions.length})`, badge: 'AFNOR', badgeColor: 'bg-slate-100 text-slate-700' },
    ...actions.map((a) => ({
      value: a.code,
      label: `${a.code} - ${a.libelle}`,
      sublabel: a.description || undefined,
      badge: a.code,
      badgeColor: ACTION_PILL_MAP[a.code]?.bg || 'bg-indigo-50 text-indigo-800',
    })),
  ], [actions]);

  const frequenceOptions = useMemo(() => [
    { value: 'ALL', label: 'Toutes Fréquences', badge: 'Période', badgeColor: 'bg-slate-100 text-slate-700' },
    { value: 'Hebdo', label: 'Hebdomadaire (Hebdo)', sublabel: 'Toutes les semaines', badge: '7J', badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200' },
    { value: 'Mensuel', label: 'Mensuel (Mois)', sublabel: 'Toutes les 4 semaines', badge: '30J', badgeColor: 'bg-teal-50 text-teal-800 border border-teal-200' },
    { value: 'Trimestriel', label: 'Trimestriel (3 Mois)', sublabel: 'Toutes les 12 semaines', badge: '90J', badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200' },
    { value: 'Semestriel', label: 'Semestriel (6 Mois)', sublabel: 'Toutes les 26 semaines', badge: '180J', badgeColor: 'bg-purple-50 text-purple-800 border border-purple-200' },
    { value: 'Annuel', label: 'Annuel (1 An)', sublabel: '1 fois par an (52 semaines)', badge: '365J', badgeColor: 'bg-rose-50 text-rose-800 border border-rose-200' },
  ], []);

  const weekOptions = useMemo(() => [
    { value: 'ALL', label: 'Toutes Semaines (S1-S52)', badge: '52S', badgeColor: 'bg-slate-100 text-slate-700' },
    ...Array.from({ length: 52 }, (_, i) => {
      const weekNum = i + 1;
      const s = `S${weekNum}`;
      const isCurrent = weekNum === Number(currentWeekNumber);
      return {
        value: s,
        label: isCurrent ? `Semaine ${s} (En cours)` : `Semaine ${s}`,
        sublabel: isCurrent ? 'Semaine calendaire active' : undefined,
        badge: isCurrent ? 'ACTIF' : s,
        badgeColor: isCurrent
          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black'
          : 'bg-slate-100 text-slate-700',
      };
    }),
  ], [currentWeekNumber]);

  const techOptions = useMemo(() => [
    {
      value: 'ALL',
      label: `Tous Techniciens (${Math.max(0, techList.length - 1)})`,
      badge: 'Équipe',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    ...techList.filter((t) => t !== 'ALL').map((tName) => {
      const masterTech = Array.isArray(technicians)
        ? technicians.find((t) => {
            const full = typeof t === 'string' ? t : (t?.nom ? `${t.nom} ${t.prenom || ''}`.trim() : (t?.nom_technicien || t?.name || t?.id_technician));
            return full === tName;
          })
        : null;
      return {
        value: tName,
        label: tName,
        sublabel: (masterTech && typeof masterTech === 'object' && masterTech.specialite) ? masterTech.specialite : 'Technicien de Maintenance',
        badge: 'Tech',
        badgeColor: 'bg-purple-50 text-purple-800 border border-purple-200',
      };
    }),
  ], [techList, technicians]);

  // Available warehouse/stock items for fast search
  const availableInventory = useMemo(() => {
    if (warehouseItems && warehouseItems.length > 0) return warehouseItems;
    if (stockItems && stockItems.length > 0) return stockItems;
    return [];
  }, [warehouseItems, stockItems]);

  // Open Validation Modal with prefilled recommended PDR
  const handleOpenValidate = (task) => {
    setSelectedTaskForValidation(task);
    const recommended = PreventiveService.getRecommendedPDRForAction(task.action_code, task.composant);
    setValidationData({
      date_realisation: new Date().toISOString().split('T')[0],
      technicien: task.responsable || '',
      duree_reelle: task.duree_estimee || '15 min',
      taux_horaire: 35,
      observations: `Intervention préventive ${task.action_code} sur ${task.composant} (${task.id_machine}) exécutée conformément.`,
      usedPDR: recommended,
      mode_calcul_recurrence: task.mode_calcul_recurrence || 'FIXE',
      compteur_releve: task.compteur_actuel || '',
    });
  };

  // Add PDR to validation list
  const handleAddPdrToValidation = (item) => {
    if (!item || !item.designation) return;
    setValidationData((prev) => ({
      ...prev,
      usedPDR: [
        ...prev.usedPDR,
        {
          id_article: item.id_article || `PDR-${Date.now().toString().slice(-4)}`,
          designation: item.designation,
          reference: item.reference || item.ref || item.code || 'STD',
          quantite: Number(item.quantite || 1),
          unite: item.unite || 'Pièce',
          prix_unitaire: Number(item.prix_unitaire || item.prix_achat_ht || item.prix || 0),
        },
      ],
    }));
    setNewPdrItem({
      id_article: '',
      designation: '',
      reference: '',
      quantite: 1,
      unite: 'Pièce',
      prix_unitaire: 0,
    });
  };

  const handleRemovePdrFromValidation = (idx) => {
    setValidationData((prev) => ({
      ...prev,
      usedPDR: prev.usedPDR.filter((_, i) => i !== idx),
    }));
  };

  const handleConfirmValidation = (e) => {
    e.preventDefault();
    if (!selectedTaskForValidation) return;
    onMarkTaskDone(selectedTaskForValidation.id, validationData);
    setSelectedTaskForValidation(null);
  };

  // Open Corrective Trigger Modal
  const handleOpenCorrective = (task) => {
    setSelectedTaskForBT(task);
    setBtData({
      description: `Anomalie décelée lors du contrôle ${task.action_code} sur ${task.composant} (${task.id_machine}) : Nécessite une intervention corrective immédiate.`,
      priorite: 'Haute',
    });
  };

  const handleConfirmCorrective = (e) => {
    e.preventDefault();
    if (!selectedTaskForBT) return;
    onCreateCorrective(selectedTaskForBT, btData);
    setSelectedTaskForBT(null);
  };

  // Export Full Matrix & Tasks to CSV / Excel
  const handleExportCSV = () => {
    const allWeeks = Array.from({ length: 52 }, (_, i) => `S${i + 1}`);
    const headers = [
      'Code Tâche',
      'Machine ID',
      'Nom Machine',
      'Zone',
      'Composant',
      'Action Code',
      'Type Intervention',
      'Fréquence',
      'Responsable',
      'Durée Estimée',
      'Statut',
      'Prochaine Échéance',
      'Dernière Réalisation',
      'Coût Cumulé (DT)',
      ...allWeeks,
      'Consignes / Remarques',
    ];

    const rows = filteredTasks.map((t) => {
      const weekCols = allWeeks.map((w) => (t.planning && t.planning[w]) ? t.planning[w] : '');
      return [
        `"${t.code || ''}"`,
        `"${t.id_machine || ''}"`,
        `"${t.nom_machine || ''}"`,
        `"${t.id_zone || ''}"`,
        `"${t.composant || ''}"`,
        `"${t.action_code || ''}"`,
        `"${t.type_intervention || ''}"`,
        `"${t.frequence || ''}"`,
        `"${t.responsable || ''}"`,
        `"${t.duree_estimee || ''}"`,
        `"${t.etat || ''}"`,
        `"${t.prochaine_echeance || ''}"`,
        `"${t.derniere_realisation || ''}"`,
        `"${Number(t.cout_cumule || 0).toFixed(2)}"`,
        ...weekCols.map((val) => `"${val}"`),
        `"${(t.consigne || t.observations || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GMAO_Matrice_Preventive_S1_S52_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* 3D TACTILE KPI CARDS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Tasks */}
        <div 
          onClick={() => setSelectedStatus('ALL')}
          className={`bg-white rounded-2xl p-4 border transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 ${
            selectedStatus === 'ALL' ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/20' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider uppercase text-slate-500">
              Total Programme
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {stats.total}
            </span>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              S1-S52
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1 truncate">
            {Math.max(0, machineList.length - 1)} machines enregistrées
          </p>
        </div>

        {/* Card 2: À Faire */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'À faire' ? 'ALL' : 'À faire')}
          className={`bg-white rounded-2xl p-4 border transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 ${
            selectedStatus === 'À faire' ? 'border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider uppercase text-blue-700">
              À Réaliser
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-900 font-mono tracking-tight">
              {stats.aFaire}
            </span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
              Planifiées
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1">
            En attente d'exécution
          </p>
        </div>

        {/* Card 3: Fait & Conforme */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'Fait' ? 'ALL' : 'Fait')}
          className={`bg-white rounded-2xl p-4 border transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 ${
            selectedStatus === 'Fait' ? 'border-emerald-400 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider uppercase text-emerald-700">
              Fait & Conforme
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-900 font-mono tracking-tight">
              {stats.fait}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              {stats.complianceRate}%
            </span>
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.complianceRate}%` }} 
            />
          </div>
        </div>

        {/* Card 4: En Retard / Alertes */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'En retard' ? 'ALL' : 'En retard')}
          className={`bg-white rounded-2xl p-4 border transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 ${
            selectedStatus === 'En retard' ? 'border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider uppercase text-rose-700">
              En Retard
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shadow-2xs group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-900 font-mono tracking-tight">
              {stats.enRetard}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${stats.enRetard > 0 ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              {stats.enRetard > 0 ? 'Action Requise' : 'Aucun'}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1">
            Déclenchement BT possible
          </p>
        </div>

        {/* Card 5: Budget PDR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 col-span-2 lg:col-span-1 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider uppercase text-amber-700">
              Budget PDR Réalisé
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {stats.totalCost.toFixed(2)} <span className="text-xs font-normal text-slate-500">DT</span>
            </span>
            <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
              Pièces
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1 truncate">
            Coût cumulé préventif
          </p>
        </div>
      </div>

      {/* FILTER TOOLBAR CARD (Tactile Elevation & CustomSelect Dropdowns) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4">
        {/* Top Header Row inside Filter Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shadow-2xs">
              <SlidersHorizontal className="w-4 h-4 text-indigo-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Filtres & Affichage Matrice
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {filteredTasks.length} / {tasks.length}
                </span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium">
                Matrice 52 Semaines · Planning Dynamique & Fiches Métier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            {/* Export Excel / CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-xl border border-emerald-300/90 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Exporter la matrice vers un fichier CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {/* Print Planning */}
            <button
              type="button"
              onClick={() => window.print()}
              className="h-8 w-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
              title="Imprimer la page ou le planning"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Reset Filters Circular Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="h-8 w-8 rounded-full border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95 relative group"
                title="Réinitialiser tous les filtres"
              >
                <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-45" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {activeFiltersCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* QUICK STATUS PRESETS BAR (Bandeau Statut Rapide) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1 shrink-0">
            <Activity className="w-3 h-3 text-slate-400" />
            Statut Rapide :
          </span>
          {[
            { key: 'ALL', label: 'Toutes les Tâches', count: tasks.length, colorDot: null },
            { key: 'À faire', label: 'À Réaliser', count: stats.aFaire, colorDot: 'bg-blue-500' },
            { key: 'Fait', label: 'Fait & Conforme', count: stats.fait, colorDot: 'bg-emerald-500' },
            { key: 'En retard', label: 'En Retard (Alerte)', count: stats.enRetard, colorDot: 'bg-rose-500' },
          ].map((preset) => {
            const isSelected = selectedStatus === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => {
                  setSelectedStatus(preset.key);
                  setCurrentPage(1);
                }}
                className={`h-7 px-2.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 font-medium'
                }`}
              >
                {preset.colorDot && (
                  <span
                    className={`w-2 h-2 rounded-full ${preset.colorDot} ${
                      isSelected ? 'ring-2 ring-white/50 animate-pulse' : ''
                    }`}
                  />
                )}
                <span>{preset.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {preset.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar (Full Width & Clean) */}
        <div className="relative w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shadow-2xs">
              <Search className="w-3.5 h-3.5" />
            </span>
          </div>
          <input
            type="text"
            placeholder="Recherche multi-mots : machine (ex: FRM-01), organe (ex: Roulement), action (ex: C, N, G), technicien..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-10 py-2.5 text-xs bg-slate-50/90 border border-slate-200/90 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 6 Cascading Selector Dropdowns with CustomSelect & Expressive Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
          {/* 1. Zone Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <span>Zone</span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Site
              </span>
            </div>
            <CustomSelect
              value={selectedZone}
              prefixIcon={
                <span className="w-5 h-5 rounded-md bg-emerald-100 border border-emerald-300/80 flex items-center justify-center text-emerald-700 shadow-2xs">
                  <MapPin className="w-3 h-3" />
                </span>
              }
              onChange={(val) => {
                setSelectedZone(val);
                setCurrentPage(1);
              }}
              options={zoneOptions}
              placeholder="Toutes Zones"
            />
          </div>

          {/* 2. Machine Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <span>Machine</span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                Équip.
              </span>
            </div>
            <CustomSelect
              value={selectedMachine}
              prefixIcon={
                <span className="w-5 h-5 rounded-md bg-blue-100 border border-blue-300/80 flex items-center justify-center text-blue-700 shadow-2xs">
                  <Factory className="w-3 h-3" />
                </span>
              }
              onChange={(val) => {
                setSelectedMachine(val);
                setCurrentPage(1);
              }}
              options={machineOptions}
              placeholder="Toutes Machines"
            />
          </div>

          {/* 3. Action AFNOR Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <span>Action AFNOR</span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                Type
              </span>
            </div>
            <CustomSelect
              value={selectedAction}
              prefixIcon={
                <span className="w-5 h-5 rounded-md bg-indigo-100 border border-indigo-300/80 flex items-center justify-center text-indigo-700 shadow-2xs">
                  <Wrench className="w-3 h-3" />
                </span>
              }
              onChange={(val) => {
                setSelectedAction(val);
                setCurrentPage(1);
              }}
              options={actionOptions}
              placeholder="Toutes Actions"
            />
          </div>

          {/* 4. Fréquence Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <span>Fréquence</span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                Période
              </span>
            </div>
            <CustomSelect
              value={selectedFrequence}
              prefixIcon={
                <span className="w-5 h-5 rounded-md bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs">
                  <Clock className="w-3 h-3" />
                </span>
              }
              onChange={(val) => {
                setSelectedFrequence(val);
                setCurrentPage(1);
              }}
              options={frequenceOptions}
              placeholder="Toutes Fréquences"
            />
          </div>

          {/* 5. Semaine ISO Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <span>Semaine ISO</span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
                S1-S52
              </span>
            </div>
            <CustomSelect
              value={selectedWeek}
              prefixIcon={
                <span className="w-5 h-5 rounded-md bg-teal-100 border border-teal-300/80 flex items-center justify-center text-teal-700 shadow-2xs">
                  <CalendarDays className="w-3 h-3" />
                </span>
              }
              onChange={(val) => {
                setSelectedWeek(val);
                setCurrentPage(1);
              }}
              options={weekOptions}
              placeholder="Toutes Semaines"
            />
          </div>

          {/* 6. Technicien Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <span>Technicien</span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                Assigné
              </span>
            </div>
            <CustomSelect
              value={selectedTech}
              prefixIcon={
                <span className="w-5 h-5 rounded-md bg-purple-100 border border-purple-300/80 flex items-center justify-center text-purple-700 shadow-2xs">
                  <User className="w-3 h-3" />
                </span>
              }
              onChange={(val) => {
                setSelectedTech(val);
                setCurrentPage(1);
              }}
              options={techOptions}
              placeholder="Tous Techniciens"
            />
          </div>
        </div>

        {/* ACTIVE FILTER TAGS BAR (Removable Chips) */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-500" />
              Filtres actifs :
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-medium">
                <span>Recherche : <b>"{searchQuery}"</b></span>
                <button type="button" onClick={() => setSearchQuery('')} className="text-indigo-500 hover:text-indigo-800 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedZone !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>Zone : <b>{selectedZone}</b></span>
                <button type="button" onClick={() => setSelectedZone('ALL')} className="text-emerald-500 hover:text-emerald-800 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedMachine !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-medium">
                <Factory className="w-3 h-3 text-blue-600" />
                <span>Machine : <b>{selectedMachine}</b></span>
                <button type="button" onClick={() => setSelectedMachine('ALL')} className="text-blue-500 hover:text-blue-800 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedAction !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-medium">
                <Wrench className="w-3 h-3 text-indigo-600" />
                <span>Action : <b>{selectedAction}</b></span>
                <button type="button" onClick={() => setSelectedAction('ALL')} className="text-indigo-500 hover:text-indigo-800 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedFrequence !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Fréquence : <b>{selectedFrequence}</b></span>
                <button type="button" onClick={() => setSelectedFrequence('ALL')} className="text-amber-500 hover:text-amber-800 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedWeek !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 font-medium">
                <CalendarDays className="w-3 h-3 text-teal-600" />
                <span>Semaine : <b>{selectedWeek}</b></span>
                <button type="button" onClick={() => setSelectedWeek('ALL')} className="text-teal-500 hover:text-teal-800 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 font-medium">
                <Activity className="w-3 h-3 text-rose-600" />
                <span>Statut : <b>{selectedStatus}</b></span>
                <button type="button" onClick={() => setSelectedStatus('ALL')} className="text-rose-500 hover:text-rose-800 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTech !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-medium">
                <User className="w-3 h-3 text-purple-600" />
                <span>Technicien : <b>{selectedTech}</b></span>
                <button type="button" onClick={() => setSelectedTech('ALL')} className="text-purple-500 hover:text-purple-800 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-xs font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Effacer tous les filtres
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: MATRIX S1-S52 (With Sticky Header, Zebra Stripes, Row Numbers, 20 Fixed Rows & Floating Footer) */}
      {viewMode === 'matrix' && (
        <div className="space-y-4 animate-view-transition">
          {/* Main Matrix Twin Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
            {/* Top Card Info Header Bar with Switch to List View & Integrated Week Range Selector */}
            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50/70 gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {/* 3D Circular Switch Button to toggle to List View */}
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="relative w-9 h-9 rounded-full bg-white hover:bg-indigo-50/80 border border-slate-200/90 hover:border-indigo-400 text-indigo-700 hover:text-indigo-950 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-3px_rgba(99,102,241,0.3),0_3px_8px_-2px_rgba(99,102,241,0.15)] active:translate-y-0.5 active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group/switch cursor-pointer shrink-0"
                  title="Basculer vers Vue Liste Détaillée (A → I)"
                >
                  <List className="w-4 h-4 transition-transform duration-300 group-hover/switch:scale-110" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600 ring-2 ring-white" />
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="font-black text-slate-900 text-[13px]">
                    Matrice Préventive S1→S52
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {totalItems} Tâche{totalItems > 1 ? 's' : ''}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200" title="Semaine actuelle">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En cours : S{currentWeekNumber}</span>
                </span>
              </div>

              {/* Integrated Matrix Week Range Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-600 hidden md:inline">Plage de semaines :</span>
                <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
                  {[
                    { key: 'S1-S16', label: 'S01 - S16' },
                    { key: 'S17-S32', label: 'S17 - S32' },
                    { key: 'S33-S52', label: 'S33 - S52' },
                    { key: 'ALL', label: 'Toutes (S1-S52)' },
                  ].map((rng) => (
                    <button
                      key={rng.key}
                      type="button"
                      onClick={() => setWeekRange(rng.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        weekRange === rng.key
                          ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/70 font-black'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
                      }`}
                      title={`Afficher les semaines ${rng.label}`}
                    >
                      {rng.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Container with Sticky Headings & Horizontal Scroll */}
            <div ref={matrixScrollContainerRef} onScroll={handleTableScroll} className="max-h-[62vh] overflow-y-auto overflow-x-auto relative">
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 z-20 shadow-2xs select-none">
                  <tr>
                    {/* Row Index (N°) */}
                    <th className="py-3 px-3 text-center w-12 text-slate-500 font-mono text-[10px] bg-slate-200/70 border-r border-slate-200 sticky left-0 z-30 shrink-0">
                      N°
                    </th>

                    {/* Machine (A) */}
                    <th className="py-3 px-3.5 min-w-[120px] sticky left-12 z-30 bg-slate-100 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Factory className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>MACHINE</span>
                        <span className="text-slate-400 font-normal text-[10px]">(A)</span>
                      </div>
                    </th>

                    {/* Zone (B) */}
                    <th className="py-3 px-3 min-w-[90px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>ZONE</span>
                        <span className="text-slate-400 font-normal text-[10px]">(B)</span>
                      </div>
                    </th>

                    {/* Organe / Composant (C) */}
                    <th className="py-3 px-3.5 min-w-[180px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>COMPOSANT</span>
                        <span className="text-slate-400 font-normal text-[10px]">(C)</span>
                      </div>
                    </th>

                    {/* Action AFNOR (D) */}
                    <th className="py-3 px-3 min-w-[80px] text-center border-r border-slate-200">
                      <div className="flex items-center justify-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>ACTION</span>
                        <span className="text-slate-400 font-normal text-[10px]">(D)</span>
                      </div>
                    </th>

                    {/* Fréquence (E) */}
                    <th className="py-3 px-3 min-w-[95px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>FRÉQ.</span>
                        <span className="text-slate-400 font-normal text-[10px]">(E)</span>
                      </div>
                    </th>

                    {/* 52 Weeks Header Columns (F) */}
                    {matrixWeeks.map((week) => {
                      const isCurrent = week === `S${currentWeekNumber}`;
                      return (
                        <th
                          key={week}
                          className={`py-2 px-1 text-center font-mono text-[11px] min-w-[36px] border-r border-slate-200/80 transition-colors ${
                            isCurrent ? 'bg-indigo-600 text-white font-black' : 'bg-slate-100 text-slate-700'
                          }`}
                          title={isCurrent ? `Semaine en cours (${week})` : `Semaine ${week}`}
                        >
                          {week}
                        </th>
                      );
                    })}

                    {/* Responsable (G) */}
                    <th className="py-3 px-3 min-w-[110px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>RESP.</span>
                        <span className="text-slate-400 font-normal text-[10px]">(G)</span>
                      </div>
                    </th>

                    {/* Statut (H) */}
                    <th className="py-3 px-3 min-w-[95px] text-center border-r border-slate-200">
                      <div className="flex items-center justify-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>ÉTAT</span>
                        <span className="text-slate-400 font-normal text-[10px]">(H)</span>
                      </div>
                    </th>

                    {/* Actions Menu */}
                    <th className="py-3 px-3.5 text-center min-w-[100px] font-bold text-slate-400 tracking-widest select-none" title="Actions Rapides">
                      •••
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {totalItems === 0 ? (
                    <tr>
                      <td colSpan={matrixWeeks.length + 9} className="p-12 text-center text-slate-400 text-xs">
                        <div className="max-w-md mx-auto space-y-2">
                          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-600">Aucune tâche préventive trouvée</p>
                          <p className="text-[11px] text-slate-400">
                            Ajustez les filtres de recherche ou sélectionnez une autre zone / machine.
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={clearAllFilters}
                              className="mt-2 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 cursor-pointer"
                            >
                              Réinitialiser les filtres
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedTasks.map((task, idx) => {
                      const rowNum = startIndex + idx + 1;
                      if (task.__isEmptyPlaceholder) {
                        return (
                          <tr key={`empty-mat-${idx}`} className="border-b border-slate-100 bg-white/40 select-none">
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-300 bg-slate-100/40 border-r border-slate-200/80 sticky left-0 z-10">
                              {rowNum}
                            </td>
                            <td colSpan={matrixWeeks.length + 8} className="py-2.5 px-3 text-center text-slate-300 font-mono text-[11px]">
                              —
                            </td>
                          </tr>
                        );
                      }

                      const statusBadge = STATUT_BADGES[task.etat] || STATUT_BADGES['À faire'];
                      const actionConfig = ACTION_PILL_MAP[task.action_code] || {
                        bg: 'bg-slate-100 text-slate-800 border-slate-200',
                        dot: 'bg-slate-500',
                        label: 'Autre',
                      };

                      return (
                        <tr
                          key={`task-${task.id}-${rowNum}`}
                          className="even:bg-slate-50/70 odd:bg-white hover:bg-indigo-50/40 border-b border-slate-200/70 transition-colors group"
                        >
                          {/* Row Number */}
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] font-bold text-slate-400 bg-slate-100/40 border-r border-slate-200/80 sticky left-0 z-10 shrink-0">
                            {rowNum}
                          </td>

                          {/* Machine (A) */}
                          <td className="py-2.5 px-3.5 sticky left-12 z-10 bg-inherit border-r border-slate-200/80 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 font-mono text-xs">
                                {task.id_machine}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                                {task.nom_machine}
                              </span>
                            </div>
                          </td>

                          {/* Zone (B) */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 border-r border-slate-200/80 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                              {task.id_zone || 'AFM'}
                            </span>
                          </td>

                          {/* Composant (C) */}
                          <td className="py-2.5 px-3.5 font-medium text-slate-800 border-r border-slate-200/80">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-xs">{task.composant}</span>
                              {task.is_global_machine && (
                                <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded border border-emerald-200">
                                  Globale
                                </span>
                              )}
                            </div>
                            <span className="text-[10.5px] text-slate-400 block truncate max-w-[180px] mt-0.5">
                              {task.type_intervention}
                            </span>
                          </td>

                          {/* Action Code (D) */}
                          <td className="py-2.5 px-3 text-center border-r border-slate-200/80 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black font-mono border ${actionConfig.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${actionConfig.dot}`} />
                              <span>{task.action_code}</span>
                            </span>
                          </td>

                          {/* Fréquence & Mode (E) */}
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200/80 whitespace-nowrap">
                            <span className="font-bold text-slate-700 block text-xs">{task.frequence}</span>
                            <span className={`text-[9.5px] font-mono font-bold uppercase ${
                              task.mode_calcul_recurrence === 'GLISSANT' ? 'text-indigo-600' : 'text-slate-400'
                            }`}>
                              {task.mode_calcul_recurrence === 'GLISSANT' ? '⚡ Gliss.' : '📅 Fixe'}
                            </span>
                          </td>

                          {/* Week Cells S1-S52 (F) */}
                          {matrixWeeks.map((week) => {
                            const cellVal = task.planning && task.planning[week];
                            const isDone = cellVal === 'DONE';
                            const hasAction = Boolean(cellVal);
                            const isCurrent = week === `S${currentWeekNumber}`;

                            return (
                              <td
                                key={week}
                                className={`p-1 text-center border-r border-slate-200/60 font-mono text-[11px] ${
                                  isCurrent ? 'bg-indigo-50/50' : ''
                                }`}
                              >
                                {isDone ? (
                                  <span
                                    className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-black text-[11px] mx-auto shadow-2xs cursor-default"
                                    title={`Tâche réalisée avec succès en ${week}`}
                                  >
                                    ✓
                                  </span>
                                ) : hasAction ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenValidate(task)}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[10.5px] mx-auto transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-2xs ${
                                      task.etat === 'En retard'
                                        ? 'bg-rose-600 text-white animate-pulse shadow-rose-200'
                                        : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-600 hover:text-white border border-indigo-200'
                                    }`}
                                    title={`${task.action_code} sur ${task.composant} (${task.frequence}) - Cliquez pour valider`}
                                  >
                                    {cellVal}
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-[10px] select-none">•</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Responsable (G) */}
                          <td className="py-2.5 px-3 font-medium text-slate-700 border-r border-slate-200/80 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 text-xs truncate max-w-[100px]">
                                {task.responsable || 'Technicien'}
                              </span>
                            </div>
                          </td>

                          {/* Statut (H) */}
                          <td className="py-2.5 px-3 text-center border-r border-slate-200/80 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${statusBadge}`}>
                              {task.etat}
                            </span>
                          </td>

                          {/* Actions Quick Menu */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedTaskForPrint(task)}
                                className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-2xs cursor-pointer"
                                title="Imprimer Bon d'OT Préventif"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {task.etat !== 'Fait' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenValidate(task)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
                                  title="Valider avec pièces et consommables"
                                >
                                  Valider
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating 3D Pagination & Summary Footer Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Lignes par page :</span>
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                {[20, 50, 100, 200, 0].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      pageSize === size
                        ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {size === 0 ? 'Tout' : size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs font-semibold text-slate-500">
                Affichage <b className="text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</b> à{' '}
                <b className="text-slate-900">{Math.min(startIndex + effectivePageSize, totalItems)}</b>{' '}
                sur <b className="text-slate-900">{totalItems}</b>
              </div>
              {pageSize !== 0 && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Précédent
                  </button>
                  <span className="px-2 font-mono text-xs font-bold text-slate-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition cursor-pointer"
                  >
                    Suivant
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="space-y-4 animate-view-transition">
          {/* Top Calendar Header Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className="relative w-9 h-9 rounded-full bg-white hover:bg-teal-50/80 border border-slate-200/90 hover:border-teal-400 text-teal-700 hover:text-teal-950 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-3px_rgba(20,184,166,0.3),0_3px_8px_-2px_rgba(20,184,166,0.15)] active:translate-y-0.5 active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group/switch cursor-pointer shrink-0"
                title="Revenir à la Vue Matrice S1→S52"
              >
                <Table2 className="w-4 h-4 transition-transform duration-300 group-hover/switch:scale-110" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600 ring-2 ring-white" />
                </span>
              </button>

              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-800 text-[13px]">
                  Planning Hebdomadaire Préventif (Calendrier 8 Semaines)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                S{currentWeekNumber} à S{currentWeekNumber + 7 > 52 ? currentWeekNumber + 7 - 52 : currentWeekNumber + 7}
              </span>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Glissez et visualisez les interventions préventives réparties par semaine calendaire
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => {
            const wNum = currentWeekNumber + i;
            const weekKey = `S${wNum > 52 ? wNum - 52 : wNum}`;
            const tasksInWeek = filteredTasks.filter((t) => t.planning && t.planning[weekKey]);

            return (
              <div
                key={weekKey}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono font-black text-sm text-slate-900">
                      {weekKey} {wNum === currentWeekNumber && <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">En cours</span>}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {tasksInWeek.length} tâche(s)
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
                    {tasksInWeek.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Aucune intervention cette semaine</p>
                    ) : (
                      tasksInWeek.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 rounded-xl text-xs space-y-1 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 font-mono">{t.id_machine}</span>
                            <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              {t.action_code}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium truncate">{t.composant}</p>
                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                            <span>{t.responsable}</span>
                            <button
                              onClick={() => handleOpenValidate(t)}
                              className="text-indigo-600 font-bold hover:underline"
                            >
                              Valider →
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* VIEW 3: DETAILED LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-view-transition">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
            {/* Top Info Header Bar with Switch to Matrix View */}
            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                {/* 3D Circular Switch Button to toggle back to Matrix View */}
                <button
                  type="button"
                  onClick={() => setViewMode('matrix')}
                  className="relative w-9 h-9 rounded-full bg-white hover:bg-indigo-50/80 border border-slate-200/90 hover:border-indigo-400 text-indigo-700 hover:text-indigo-950 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-3px_rgba(99,102,241,0.3),0_3px_8px_-2px_rgba(99,102,241,0.15)] active:translate-y-0.5 active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group/switch cursor-pointer shrink-0"
                  title="Basculer vers Matrice Préventive S1→S52"
                >
                  <Grid className="w-4 h-4 transition-transform duration-300 group-hover/switch:scale-110" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600 ring-2 ring-white" />
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-[13px]">
                    Tableau Détaillé des Tâches Préventives (GMAO)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {totalItems} Tâche{totalItems > 1 ? 's' : ''}
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 hidden xl:block">
                N° | Machine (A) | Zone (B) | Composant (C) | Action (D) | Fréq (E) | Échéance (F) | Resp (G) | Coût (H) | État (I)
              </div>
            </div>

            <div ref={listScrollContainerRef} onScroll={handleTableScroll} className="max-h-[62vh] overflow-y-auto overflow-x-auto relative">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 uppercase font-black text-[10.5px] tracking-wider border-b border-slate-200 z-20 shadow-2xs select-none">
                  <tr>
                    <th className="py-3 px-3 text-center w-12 text-slate-500 font-mono text-[10px] bg-slate-200/70 border-r border-slate-200 sticky left-0 z-30 shrink-0">
                      N°
                    </th>
                    <th className="py-3 px-3.5 min-w-[130px] sticky left-12 z-30 bg-slate-100 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Factory className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>MACHINE</span>
                        <span className="text-slate-400 font-normal text-[10px]">(A)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 min-w-[90px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>ZONE</span>
                        <span className="text-slate-400 font-normal text-[10px]">(B)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3.5 min-w-[170px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>COMPOSANT</span>
                        <span className="text-slate-400 font-normal text-[10px]">(C)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 min-w-[80px] text-center border-r border-slate-200">
                      <div className="flex items-center justify-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>ACTION</span>
                        <span className="text-slate-400 font-normal text-[10px]">(D)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 min-w-[90px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>FRÉQ.</span>
                        <span className="text-slate-400 font-normal text-[10px]">(E)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 min-w-[95px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>ÉCHÉANCE</span>
                        <span className="text-slate-400 font-normal text-[10px]">(F)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 min-w-[110px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>RESP.</span>
                        <span className="text-slate-400 font-normal text-[10px]">(G)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 min-w-[95px] border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>COÛT</span>
                        <span className="text-slate-400 font-normal text-[10px]">(H)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[95px] border-r border-slate-200">
                      <div className="flex items-center justify-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>ÉTAT</span>
                        <span className="text-slate-400 font-normal text-[10px]">(I)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3.5 text-center min-w-[110px] font-bold text-slate-400 tracking-widest select-none">
                      •••
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {totalItems === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-slate-400 text-xs">
                        <div className="max-w-md mx-auto space-y-2">
                          <List className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-600">Aucune tâche trouvée</p>
                          <p className="text-[11px] text-slate-400">
                            Ajustez les filtres pour afficher des résultats.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedTasks.map((t, idx) => {
                      const rowNum = startIndex + idx + 1;
                      if (t.__isEmptyPlaceholder) {
                        return (
                          <tr key={`empty-list-${idx}`} className="border-b border-slate-100 bg-white/40 select-none">
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-300 bg-slate-100/40 border-r border-slate-200/80 sticky left-0 z-10">
                              {rowNum}
                            </td>
                            <td colSpan={10} className="py-2.5 px-3 text-center text-slate-300 font-mono text-[11px]">
                              —
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={`list-task-${t.id}-${rowNum}`}
                          className="even:bg-slate-50/70 odd:bg-white hover:bg-indigo-50/40 border-b border-slate-200/70 transition-colors group"
                        >
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] font-bold text-slate-400 bg-slate-100/40 border-r border-slate-200/80 sticky left-0 z-10 shrink-0">
                            {rowNum}
                          </td>
                          <td className="py-2.5 px-3.5 sticky left-12 z-10 bg-inherit border-r border-slate-200/80 whitespace-nowrap">
                            <span className="font-bold text-slate-900 font-mono block">{t.id_machine}</span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[120px] block">{t.nom_machine}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 border-r border-slate-200/80 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                              {t.id_zone}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 border-r border-slate-200/80">
                            <span className="font-bold text-slate-800 block text-xs">{t.composant}</span>
                            <span className="text-[11px] text-slate-500 truncate max-w-[170px] block">{t.consigne}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200/80 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md font-mono font-black bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">
                              {t.action_code}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200/80 whitespace-nowrap">{t.frequence}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 font-semibold border-r border-slate-200/80 whitespace-nowrap">{t.prochaine_echeance || t.semaine_cible || 'S1'}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 border-r border-slate-200/80 whitespace-nowrap">{t.responsable}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-r border-slate-200/80 whitespace-nowrap">{Number(t.cout_cumule || 0).toFixed(2)} DT</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200/80 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${STATUT_BADGES[t.etat] || ''}`}>
                              {t.etat}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenCorrective(t)}
                                className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer"
                                title="Déclencher un BT Correctif en cas d'anomalie"
                              >
                                Anomalie BT
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenValidate(t)}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer"
                              >
                                Valider
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {visibleChunkSize < (pageSize === 0 ? totalItems : Math.min(effectivePageSize, totalItems - startIndex)) && (
                <div className="sticky bottom-0 z-20 py-2.5 px-4 bg-indigo-50/90 border-t border-indigo-200/80 flex items-center justify-between text-xs text-indigo-900 font-medium backdrop-blur-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
                    </span>
                    <span>⚡ Chargement progressif (Lazy Load) : <b>{visibleChunkSize}</b> sur <b>{pageSize === 0 ? totalItems : Math.min(effectivePageSize, totalItems - startIndex)}</b> lignes affichées (Défilez vers le bas pour charger la suite)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVisibleChunkSize((prev) => Math.min(prev + 100, totalItems))}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                  >
                    Charger +100 lignes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Floating 3D Pagination & Summary Footer Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Lignes par page :</span>
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                {[20, 50, 100, 200, 0].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      pageSize === size
                        ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {size === 0 ? 'Tout' : size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs font-semibold text-slate-500">
                Affichage <b className="text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</b> à{' '}
                <b className="text-slate-900">{Math.min(startIndex + effectivePageSize, totalItems)}</b>{' '}
                sur <b className="text-slate-900">{totalItems}</b>
              </div>
              {pageSize !== 0 && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Précédent
                  </button>
                  <span className="px-2 font-mono text-xs font-bold text-slate-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition cursor-pointer"
                  >
                    Suivant
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: ANALYTICS & HEALTH */}
      {viewMode === 'analytics' && (
        <div className="space-y-4 animate-view-transition">
          {/* Top Analytics Header Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className="relative w-9 h-9 rounded-full bg-white hover:bg-purple-50/80 border border-slate-200/90 hover:border-purple-400 text-purple-700 hover:text-purple-950 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-3px_rgba(168,85,247,0.3),0_3px_8px_-2px_rgba(168,85,247,0.15)] active:translate-y-0.5 active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group/switch cursor-pointer shrink-0"
                title="Revenir à la Vue Matrice S1→S52"
              >
                <Table2 className="w-4 h-4 transition-transform duration-300 group-hover/switch:scale-110" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-600 ring-2 ring-white" />
                </span>
              </button>

              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-slate-800 text-[13px]">
                  Tableau de Bord & Statistiques (Santé & Coûts Préventifs)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200">
                KPIs & Ratios Analytiques
              </span>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Analyses des taux de conformité, répartition par zone et valorisation des coûts préventifs
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Taux de Réalisation Préventif par Zone</span>
              </h3>
              <div className="space-y-3">
                {zoneList.filter((z) => z !== 'ALL').map((z) => {
                  const zTasks = tasks.filter((t) => t.id_zone === z);
                  const zDone = zTasks.filter((t) => t.etat === 'Fait').length;
                  const zRate = zTasks.length > 0 ? Math.round((zDone / zTasks.length) * 100) : 0;

                  return (
                    <div key={z} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Zone {z}</span>
                        <span>{zRate}% ({zDone}/{zTasks.length})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${zRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>Répartition des Dépenses PDR par Famille d'Action</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {actions.map((act) => {
                  const actTasks = tasks.filter((t) => t.action_code === act.code);
                  const actCost = actTasks.reduce((acc, curr) => acc + Number(curr.cout_cumule || 0), 0);

                  return (
                    <div key={act.code} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{act.code} - {act.libelle}</span>
                      </div>
                      <p className="font-mono font-black text-slate-900 text-sm">{actCost.toFixed(2)} DT</p>
                      <span className="text-[10px] text-slate-400">{actTasks.length} intervention(s)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VALIDATION DE TÂCHE AVEC CONSOMMATION PDR & RÉCURRENCE AUTO */}
      {/* ========================================================================= */}
      {selectedTaskForValidation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Validation d'Intervention Préventive
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedTaskForValidation.id_machine} • {selectedTaskForValidation.composant} ({selectedTaskForValidation.action_code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTaskForValidation(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmValidation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Date Réalisation :</label>
                  <input
                    type="date"
                    required
                    value={validationData.date_realisation}
                    onChange={(e) => setValidationData({ ...validationData, date_realisation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Technicien Réalisateur :</label>
                  <input
                    type="text"
                    required
                    value={validationData.technicien}
                    onChange={(e) => setValidationData({ ...validationData, technicien: e.target.value })}
                    placeholder="Nom du technicien"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Mode Récurrence & Durée */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Durée Réelle Passée :</label>
                  <input
                    type="text"
                    value={validationData.duree_reelle}
                    onChange={(e) => setValidationData({ ...validationData, duree_reelle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Calcul de la prochaine échéance :</label>
                  <select
                    value={validationData.mode_calcul_recurrence}
                    onChange={(e) => setValidationData({ ...validationData, mode_calcul_recurrence: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="FIXE">Calendrier Fixe (Garde la semaine annuelle)</option>
                    <option value="GLISSANT">Glissant (Calculé à partir de la date réelle)</option>
                  </select>
                </div>
              </div>

              {/* PDR Consumables Section */}
              <div className="bg-indigo-50/50 border border-indigo-200/70 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Pièces de rechange & consommables utilisés</span>
                  </span>
                  <span className="text-[11px] font-mono text-indigo-700 font-bold">
                    {validationData.usedPDR.length} pièce(s)
                  </span>
                </div>

                {/* Used PDR Items list */}
                {validationData.usedPDR.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {validationData.usedPDR.map((pdr, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{pdr.designation}</span>
                          <span className="text-[11px] text-slate-400 font-mono ml-2">
                            Réf: {pdr.reference} • Qte: {pdr.quantite} {pdr.unite}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePdrFromValidation(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Quick PDR from inventory dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-indigo-100 text-xs">
                  <div className="sm:col-span-8">
                    <select
                      value={newPdrItem.id_article}
                      onChange={(e) => {
                        const it = availableInventory.find((i) => (i.id_article || i.id || i.reference) === e.target.value);
                        if (it) {
                          setNewPdrItem({
                            id_article: it.id_article || it.id || it.reference,
                            designation: it.designation || it.nom,
                            reference: it.reference || it.code_article || 'STD',
                            quantite: 1,
                            unite: it.unite || 'Pièce',
                            prix_unitaire: Number(it.prix_unitaire || it.prix_achat || 0),
                          });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="">Sélectionner une pièce du stock...</option>
                      {availableInventory.map((item, idx) => (
                        <option key={idx} value={item.id_article || item.id || item.reference}>
                          {item.reference || item.code_article} - {item.designation || item.nom} (Stock: {item.quantite || item.stock_actuel || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <button
                      type="button"
                      onClick={() => handleAddPdrToValidation(newPdrItem)}
                      disabled={!newPdrItem.designation}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"
                    >
                      + Ajouter PDR
                    </button>
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 uppercase mb-1">Compte-rendu & Observations :</label>
                <textarea
                  rows={3}
                  value={validationData.observations}
                  onChange={(e) => setValidationData({ ...validationData, observations: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForValidation(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Confirmer la Réalisation & Auto-Reprogrammer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DÉCLENCHEMENT BON DE TRAVAIL CORRECTIF SUITE À ANOMALIE */}
      {/* ========================================================================= */}
      {selectedTaskForBT && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-700">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Déclencher un Bon de Travail (BT)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Anomalie sur {selectedTaskForBT.id_machine} • {selectedTaskForBT.composant}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTaskForBT(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCorrective} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description de l'Anomalie :</label>
                <textarea
                  required
                  rows={4}
                  value={btData.description}
                  onChange={(e) => setBtData({ ...btData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Niveau de Priorité :</label>
                <select
                  value={btData.priorite}
                  onChange={(e) => setBtData({ ...btData, priorite: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Urgente">Urgente (Arrêt Machine)</option>
                  <option value="Haute">Haute</option>
                  <option value="Normale">Normale</option>
                  <option value="Basse">Basse</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForBT(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  Créer le BT Correctif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: IMPRESSION BON D'ORDRE DE TRAVAIL (OT) */}
      {/* ========================================================================= */}
      {selectedTaskForPrint && (
        <PrintWorkOrderModal
          task={selectedTaskForPrint}
          onClose={() => setSelectedTaskForPrint(null)}
        />
      )}
    </div>
  );
}
