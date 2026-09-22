import { useState, useMemo, useCallback, useDeferredValue } from 'react';
import {
  Search,
  Calendar,
  CalendarDays,
  Grid,
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
  CalendarRange,
} from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import PrintWorkOrderModal from './PrintWorkOrderModal';
import MonthlyCalendarView from './MonthlyCalendarView';
import GroupedMachinesView from './GroupedMachinesView';
import MatrixWeeksView from './MatrixWeeksView';
import DetailedTaskListView from './DetailedTaskListView';
import PreventiveAnalyticsView from './PreventiveAnalyticsView';
import MonthlyDayMatrixView from './MonthlyDayMatrixView';
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
            {/* View Mode Segmented Controls */}
            <div className="flex items-center bg-slate-100/90 rounded-xl p-1 border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('monthly_grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'monthly_grid'
                    ? 'bg-white text-cyan-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grille Planning Mensuel Excel par Jours (J1→J31)"
              >
                <CalendarRange className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden sm:inline">Grille Jours J1-J31</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Matrice Annuelle 52 Semaines"
              >
                <Grid className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Matrice S1-S52</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grouped'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vue Machines & Tâches Groupées (Accordéon)"
              >
                <Factory className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Par Machine</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vue Calendrier Mensuel avec Badges Machines"
              >
                <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Calendrier Mensuel</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tableau Détaillé Liste"
              >
                <List className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Liste Tâches</span>
              </button>
            </div>

            {/* Export Excel / CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-xl border border-emerald-300/90 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Exporter la matrice vers un fichier CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">Export Excel</span>
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

      {/* VIEW 0: MONTHLY DAY-BY-DAY MATRIX (Grille Planning Mensuel Jours J1→J31) */}
      {viewMode === 'monthly_grid' && (
        <MonthlyDayMatrixView
          tasks={filteredTasks}
          onOpenValidate={handleOpenValidate}
          onOpenCorrective={handleOpenCorrective}
          onOpenPrint={(task) => setSelectedTaskForPrint(task)}
          onSwitchView={(mode) => setViewMode(mode)}
          hasActiveFilters={activeFiltersCount > 0}
          clearAllFilters={clearAllFilters}
        />
      )}

      {/* VIEW 1: MATRIX S1-S52 (Dedicated Matrix Component) */}
      {viewMode === 'matrix' && (
        <MatrixWeeksView
          tasks={filteredTasks}
          weekRange={weekRange}
          onWeekRangeChange={setWeekRange}
          currentWeekNumber={currentWeekNumber}
          onOpenValidate={handleOpenValidate}
          onOpenPrint={(task) => setSelectedTaskForPrint(task)}
          onSwitchView={(mode) => setViewMode(mode)}
          hasActiveFilters={activeFiltersCount > 0}
          clearAllFilters={clearAllFilters}
        />
      )}

      {/* VIEW 2: GROUPED BY MACHINE VIEW (Dedicated Component) */}
      {viewMode === 'grouped' && (
        <GroupedMachinesView
          tasks={filteredTasks}
          machines={machines}
          onOpenValidate={handleOpenValidate}
          onOpenCorrective={handleOpenCorrective}
          onOpenPrint={(task) => setSelectedTaskForPrint(task)}
          onNavigateToMachine={_onNavigateToMachine}
          onSwitchView={(mode) => setViewMode(mode)}
        />
      )}

      {/* VIEW 3: MONTHLY CALENDAR VIEW (Dedicated Component) */}
      {viewMode === 'calendar' && (
        <MonthlyCalendarView
          tasks={filteredTasks}
          machines={machines}
          onOpenValidate={handleOpenValidate}
          onOpenCorrective={handleOpenCorrective}
          onOpenPrint={(task) => setSelectedTaskForPrint(task)}
          onSwitchView={(mode) => setViewMode(mode)}
        />
      )}

      {/* VIEW 4: DETAILED OPERATIONAL LIST VIEW (Dedicated Component) */}
      {viewMode === 'list' && (
        <DetailedTaskListView
          tasks={filteredTasks}
          onOpenValidate={handleOpenValidate}
          onOpenCorrective={handleOpenCorrective}
          onOpenPrint={(task) => setSelectedTaskForPrint(task)}
          onSwitchView={(mode) => setViewMode(mode)}
          hasActiveFilters={activeFiltersCount > 0}
          clearAllFilters={clearAllFilters}
        />
      )}

      {/* VIEW 5: ANALYTICS & HEALTH (Dedicated Component) */}
      {viewMode === 'analytics' && (
        <PreventiveAnalyticsView
          tasks={filteredTasks}
          zones={zones}
          actions={actions}
          onSwitchView={(mode) => setViewMode(mode)}
        />
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
