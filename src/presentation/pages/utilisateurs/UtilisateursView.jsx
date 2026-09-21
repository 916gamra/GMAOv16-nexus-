import {  useState, useRef, useMemo, useEffect  } from 'react';
import AnimatedPage from '../../components/common/AnimatedPage';
import CustomSelect from '../../components/common/CustomSelect';
import {
  Users,
  User,
  Plus,
  Search,
  MapPin,
  Trash2,
  Edit2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  Sparkles,
  ClipboardList,
  Wrench,
  ArrowDown,
  ArrowUp,
  ShieldCheck,
  Check,
  Hash,
  Crown,
  Globe,
  X,
  RotateCcw,
  Calculator,
  FileSpreadsheet,
} from 'lucide-react';
import SupervisorAccount from '../../components/common/icons/SupervisorAccount';
import UserCodePicker from '../../components/common/UserCodePicker';
import FormulasModalButton from '../../components/common/FormulasModalButton';
import Action3DButton from '../../components/common/Action3DButton';
import {
  RESPONSABLE_TEMPLATES,
  normalizeTemplateIds,
  getTemplatesForUser,
  formatTemplateLabels,
} from '../../../data/responsableTemplates';

export default function UtilisateursView({
  technicians,
  operations,
  zones,
  onAddTechnician,
  onUpdateTechnician,
  onDeleteTechnician,
  onAddOperation,
  onUpdateOperation,
  onDeleteOperation,
  onOpenAddZoneModal,
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
    }, 200);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const [profileFilter, setProfileFilter] = useState('ALL'); // ALL, TECHNICIEN, OPERATEUR, RESPONSABLE, RMT, RZN, RPD, RMG
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFormulasModal, setShowFormulasModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-calculation of next ID respecting order (TECH-xx, OP-xx, RESP-xx)
  const getNextId = (type) => {
    if (type === 'TECHNICIEN') {
      const nums = technicians
        .map((t) => {
          const m = String(t.id_technician || '').match(/TECH-(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `TECH-${String(max + 1).padStart(2, '0')}`;
    } else if (type === 'OPERATEUR') {
      const nums = operations
        .filter(
          (o) =>
            o.type_profil === 'OPERATEUR' &&
            !String(o.id_operation).startsWith('RESP') &&
            !String(o.id_operation).startsWith('CHEF')
        )
        .map((o) => {
          const m = String(o.id_operation || '').match(/OP-(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `OP-${String(max + 1).padStart(2, '0')}`;
    } else if (type === 'RESPONSABLE' || type === 'CHEF') {
      const nums = operations
        .filter(
          (o) =>
            o.type_profil === 'RESPONSABLE' ||
            o.type_profil === 'CHEF' ||
            String(o.id_operation).startsWith('RESP') ||
            String(o.id_operation).startsWith('CHEF')
        )
        .map((o) => {
          const m = String(o.id_operation || '').match(/(?:RESP|CHEF)-(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `RESP-${String(max + 1).padStart(2, '0')}`;
    }
    return '';
  };

  // Form for Add/Edit
  const [form, setForm] = useState({
    type: 'TECHNICIEN', // TECHNICIEN, OPERATEUR, RESPONSABLE
    nom: '',
    id_zone: zones[0]?.id_zone || '',
    zones: ['ALL'],
    templates: ['RMT'],
    template_id: 'RMT',
    specialite: '',
    customCode: '',
  });

  const modalAutoNextId = useMemo(() => getNextId(form.type), [form.type, technicians, operations]);

  const modalPrefix = form.type === 'TECHNICIEN' ? 'TECH-' : form.type === 'OPERATEUR' ? 'OP-' : 'RESP-';

  const modalTakenNumbers = useMemo(() => {
    const set = new Set();
    if (form.type === 'TECHNICIEN') {
      (technicians || []).forEach((t) => {
        const m = String(t.id_technician || t.id || '').match(/TECH-(\d+)/i);
        if (m) set.add(parseInt(m[1], 10));
      });
    } else if (form.type === 'OPERATEUR') {
      (operations || []).forEach((o) => {
        if (
          o.type_profil === 'OPERATEUR' &&
          !String(o.id_operation || '').startsWith('RESP') &&
          !String(o.id_operation || '').startsWith('CHEF')
        ) {
          const m = String(o.id_operation || o.id || '').match(/OP-(\d+)/i);
          if (m) set.add(parseInt(m[1], 10));
        }
      });
    } else {
      (operations || []).forEach((o) => {
        if (
          o.type_profil === 'RESPONSABLE' ||
          o.type_profil === 'CHEF' ||
          String(o.id_operation || '').startsWith('RESP') ||
          String(o.id_operation || '').startsWith('CHEF')
        ) {
          const m = String(o.id_operation || o.id || '').match(/(?:RESP|CHEF)-(\d+)/i);
          if (m) set.add(parseInt(m[1], 10));
        }
      });
    }
    return set;
  }, [form.type, technicians, operations]);

  // Calculate combined users list with full multi-template metadata
  const combinedUsers = useMemo(() => {
    const list = [];

    // Add technicians
    technicians.forEach((t) => {
      list.push({
        id: t.id_technician,
        nom: t.nom,
        id_zone: t.id_zone,
        zones: [t.id_zone],
        type: 'TECHNICIEN',
        specialite: t.specialite || 'Spécialité Maintenance',
        templates: [],
        template_ids: [],
        template_id: null,
        template_label: null,
        raw: t,
      });
    });

    // Add operations (Operators and Responsables)
    operations.forEach((o) => {
      const isResp =
        o.type_profil === 'RESPONSABLE' ||
        o.type_profil === 'CHEF' ||
        String(o.id_operation).startsWith('RESP') ||
        String(o.id_operation).startsWith('CHEF');

      const opZones = Array.isArray(o.zones)
        ? o.zones
        : o.id_zone
          ? o.id_zone.split(',').map((s) => s.trim())
          : ['ALL'];

      const userTemplates = isResp ? getTemplatesForUser(o) : [];
      const userTemplateIds = userTemplates.map((t) => t.id);
      const templateIdStr = userTemplateIds.join(', ');
      const templateLabelStr = isResp
        ? userTemplates.map((t) => t.label).join(', ')
        : 'Opérateur Ligne de Production';

      list.push({
        id: o.id_operation,
        nom: o.nom,
        id_zone: o.id_zone || (opZones.includes('ALL') ? 'ALL' : opZones.join(', ')),
        zones: opZones,
        type: isResp ? 'RESPONSABLE' : 'OPERATEUR',
        templates: userTemplates,
        template_ids: userTemplateIds,
        template_id: templateIdStr,
        template_label: templateLabelStr,
        specialite: isResp
          ? userTemplates.map((t) => t.description).join(' • ') || 'Responsabilité & Coordination'
          : 'Opérateur Ligne de Production',
        raw: o,
      });
    });

    return list;
  }, [technicians, operations]);

  // Filters with multi-template awareness
  const filtered = combinedUsers.filter((u) => {
    if (profileFilter !== 'ALL') {
      if (profileFilter === 'TECHNICIEN' || profileFilter === 'OPERATEUR' || profileFilter === 'RESPONSABLE') {
        if (u.type !== profileFilter) return false;
      } else {
        // Specific template filter: RMT, RZN, RPD, RMG
        const hasTpl =
          (Array.isArray(u.template_ids) && u.template_ids.includes(profileFilter)) ||
          (Array.isArray(u.templates) && u.templates.some((t) => t.id === profileFilter)) ||
          (typeof u.template_id === 'string' && u.template_id.includes(profileFilter));
        if (!hasTpl) return false;
      }
    }
    if (zoneFilter !== 'ALL') {
      const hasAll = u.zones?.includes('ALL') || u.id_zone === 'ALL';
      const hasZone = u.zones?.includes(zoneFilter) || u.id_zone === zoneFilter;
      if (!hasAll && !hasZone) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(u?.id || '').toLowerCase().includes(q) ||
      String(u?.nom || '').toLowerCase().includes(q) ||
      String(u?.id_zone || '').toLowerCase().includes(q) ||
      String(u?.template_label || '').toLowerCase().includes(q) ||
      String(u?.template_id || '').toLowerCase().includes(q) ||
      (Array.isArray(u?.template_ids) && u.template_ids.some((tid) => tid.toLowerCase().includes(q))) ||
      String(u?.specialite || '').toLowerCase().includes(q)
    );
  });

  // Pagination & Sorting
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');

  const sortedData = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  const totalItems = sortedData.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const rawDisplayedData =
    pageSize === 0 ? sortedData : sortedData.slice(startIndex, startIndex + effectivePageSize);
  const displayedData = useMemo(() => {
    const minRows = 19;
    if (rawDisplayedData.length >= minRows) return rawDisplayedData;
    const padded = [...rawDisplayedData];
    for (let i = 0; i < minRows - rawDisplayedData.length; i++) {
      padded.push({ __isEmptyPlaceholder: true, id: `empty-${i}` });
    }
    return padded;
  }, [rawDisplayedData]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Submit Handler
  const handleSave = (e) => {
    e.preventDefault();
    if (!form.nom.trim()) return;

    if (userToEdit) {
      // Edit mode
      const isTech = userToEdit.id.startsWith('TECH-');
      if (isTech) {
        onUpdateTechnician(userToEdit.id, {
          id_technician: userToEdit.id,
          nom: form.nom,
          id_zone: form.id_zone,
          specialite: form.specialite,
        });
      } else {
        const isResp = form.type === 'RESPONSABLE';
        const isAll = (form.zones || []).includes('ALL');
        const selectedTpls = isResp
          ? form.templates && form.templates.length > 0
            ? form.templates
            : [form.template_id || 'RMT']
          : [];
        const tplLabel = isResp ? formatTemplateLabels(selectedTpls) : null;
        onUpdateOperation(userToEdit.id, {
          id_operation: userToEdit.id,
          nom: form.nom,
          id_zone: isResp ? (isAll ? 'ALL' : form.zones.join(', ')) : form.id_zone,
          zones: isResp ? form.zones : [form.id_zone],
          type_profil: isResp ? 'RESPONSABLE' : 'OPERATEUR',
          templates: isResp ? selectedTpls : null,
          template_ids: isResp ? selectedTpls : null,
          template_id: isResp ? selectedTpls.join(', ') : null,
          template_label: tplLabel,
        });
      }
      setUserToEdit(null);
    } else {
      // Add mode - Auto calculate ID on submission or use picked custom code
      const nextId = form.customCode || getNextId(form.type);
      if (form.type === 'TECHNICIEN') {
        onAddTechnician({
          id_technician: nextId,
          nom: form.nom,
          id_zone: form.id_zone,
          specialite: form.specialite || 'Spécialité Maintenance',
        });
      } else if (form.type === 'OPERATEUR') {
        onAddOperation({
          id_operation: nextId,
          nom: form.nom,
          id_zone: form.id_zone,
          type_profil: 'OPERATEUR',
        });
      } else {
        const isAll = (form.zones || []).includes('ALL');
        const selectedTpls =
          form.templates && form.templates.length > 0
            ? form.templates
            : [form.template_id || 'RMT'];
        const tplLabel = formatTemplateLabels(selectedTpls);
        onAddOperation({
          id_operation: nextId,
          nom: form.nom,
          id_zone: isAll ? 'ALL' : form.zones.join(', '),
          zones: form.zones,
          type_profil: 'RESPONSABLE',
          templates: selectedTpls,
          template_ids: selectedTpls,
          template_id: selectedTpls.join(', '),
          template_label: tplLabel,
        });
      }
      setShowAddModal(false);
    }

    // Reset Form
    setForm({
      type: 'TECHNICIEN',
      nom: '',
      id_zone: zones[0]?.id_zone || '',
      zones: ['ALL'],
      templates: ['RMT'],
      template_id: 'RMT',
      specialite: '',
      customCode: '',
    });
  };

  // Delete Handler
  const confirmDelete = () => {
    if (!userToDelete) return;
    const isTech = userToDelete.id.startsWith('TECH-');
    if (isTech) {
      onDeleteTechnician(userToDelete.id);
    } else {
      onDeleteOperation(userToDelete.id);
    }
    setUserToDelete(null);
  };

  const handleExportExcel = () => {
    const headers = ['ID Utilisateur', 'Nom & Prénom', 'Rôle / Profil', 'Zone d\'affectation', 'Spécialité / Templates'];
    const rows = filtered.map((u) => [
      u.id || '',
      u.nom || '',
      u.type || '',
      u.id_zone || '',
      u.template_label || u.specialite || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition shrink-0" />
      );
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-700 shrink-0 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-700 shrink-0 font-bold" />
    );
  };

  return (
    <AnimatedPage className="space-y-5">
      {/* 1. Header section with Stats - Wrapped inside elegant card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex items-center justify-between gap-3 sm:gap-4 w-full relative overflow-hidden group/header">
          {/* Subtle Ambient Gradient Background Highlight */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover/header:bg-indigo-500/10 transition-colors duration-500" />

          <div className="flex items-center gap-3 min-w-0 relative">
            {/* 3D Elevated Page Badge Icon */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200/90 shadow-[0_4px_12px_rgba(99,102,241,0.12)] flex items-center justify-center text-indigo-700 group-hover/header:scale-105 group-hover/header:border-indigo-400/80 transition-all duration-300 shrink-0">
              <Users className="w-6 h-6 text-indigo-700 transition-transform duration-300 group-hover/header:scale-110" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Registre des Utilisateurs & Membres
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Gérez les techniciens de maintenance, les opérateurs de ligne et les responsables (RESP)
                dans un répertoire unifié.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <FormulasModalButton
              onClick={() => setShowFormulasModal(true)}
              title="Formules Excel (Codification Utilisateurs)"
            />

            <Action3DButton
              variant="circle"
              color="indigo"
              icon={Users}
              showAddBadge={true}
              onClick={() => {
                setForm({
                  type: 'TECHNICIEN',
                  nom: '',
                  id_zone: zones[0]?.id_zone || '',
                  zones: ['ALL'],
                  templates: ['RMT'],
                  template_id: 'RMT',
                  specialite: '',
                  customCode: getNextId('TECHNICIEN'),
                });
                setUserToEdit(null);
                setShowAddModal(true);
              }}
              title="Ajouter un utilisateur"
            />
          </div>
        </div>

        {/* Quick KPI stats bar - Redesigned to be highly polished */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Membres */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Membres
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
                {combinedUsers.length}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Membres enregistrés</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Techniciens */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Techniciens (TECH)
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
                {technicians.length}
              </span>
              <span className="text-[10px] text-blue-500 mt-0.5 block">Maintenance & SAV</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Opérateurs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                Opérateurs (OP)
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
                {operations.filter((o) => o.type_profil === 'OPERATEUR').length}
              </span>
              <span className="text-[10px] text-indigo-500 mt-0.5 block">Ligne de Production</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Responsables */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                Responsables (RESP)
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
                {
                  operations.filter(
                    (o) =>
                      o.type_profil === 'RESPONSABLE' ||
                      o.type_profil === 'CHEF' ||
                      String(o.id_operation).startsWith('RESP') ||
                      String(o.id_operation).startsWith('CHEF')
                  ).length
                }
              </span>
              <span className="text-[10px] text-rose-500 mt-0.5 block">RMT • RZN • RPD • RMG</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and search controls - Fully responsive & styled */}
        <div className="relative z-30 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4">
          {/* Header Toolbar: Icon + Title + Count Badge + Excel Export + Circular Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Filtres & Recherche Avancée
                  </span>
                  <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-amber-200/70 shadow-2xs font-mono">
                    {filtered.length} / {combinedUsers.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Référentiel des Techniciens, Opérateurs et Responsables • Colonnes A → J
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Export Excel Button */}
              <button
                onClick={handleExportExcel}
                className="h-8 px-3 rounded-xl border border-emerald-200/80 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                title="Exporter le tableau vers Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>

              {/* Circular Reset Button */}
              {(localSearch || profileFilter !== 'ALL' || zoneFilter !== 'ALL' || sortField !== 'nom' || sortOrder !== 'asc') && (
                <button
                  onClick={() => {
                    setLocalSearch('');
                    setProfileFilter('ALL');
                    setZoneFilter('ALL');
                    setSortField('nom');
                    setSortOrder('asc');
                  }}
                  title="Réinitialiser tous les filtres actifs"
                  className="w-8 h-8 rounded-full border border-rose-200/80 bg-rose-50 hover:bg-rose-100 text-rose-700 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 animate-in fade-in shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Search */}
            <div className="relative w-full">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  RECHERCHE LIBRE
                </label>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                  Col. B+C+E
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs pointer-events-none z-10">
                  <Search className="w-3 h-3" />
                </span>
                <input
                  type="text"
                  placeholder="Rechercher par nom, ID, zone..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Profile filter select */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  RÔLE / PROFIL
                </label>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                  Col. D
                </span>
              </div>
              <CustomSelect
                prefixIcon={
                  <span className="w-5 h-5 rounded-md bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
                    <User className="w-3 h-3" />
                  </span>
                }
                options={[
                  { value: 'ALL', label: 'Tous les Profils (D)' },
                  { value: 'TECHNICIEN', label: '[D] Techniciens (TECH)' },
                  { value: 'OPERATEUR', label: '[D] Opérateurs (OP)' },
                  { value: 'RESPONSABLE', label: '[D] Tous les Responsables (RESP)' },
                  { value: 'RMT', label: '• [RMT] Responsable Maintenance' },
                  { value: 'RZN', label: '• [RZN] Responsable Zone' },
                  { value: 'RPD', label: '• [RPD] Responsable Production' },
                  { value: 'RMG', label: '• [RMG] Responsable Magasin' },
                ]}
                value={profileFilter}
                onChange={setProfileFilter}
              />
            </div>

            {/* Zone Filter */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  ZONE D'AFFECTATION
                </label>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                  Col. E
                </span>
              </div>
              <CustomSelect
                prefixIcon={
                  <span className="w-5 h-5 rounded-md bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
                    <MapPin className="w-3 h-3" />
                  </span>
                }
                options={[
                  { value: 'ALL', label: 'Toutes les Zones (E)' },
                  ...zones.map((z) => ({
                    value: z.id_zone,
                    label: `[E] ${z.libelle} (${z.id_zone})`,
                  })),
                ]}
                value={zoneFilter}
                onChange={setZoneFilter}
              />
            </div>

            {/* Sort Dropdown (Tri) */}
            <div className="w-full relative" ref={sortMenuRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  TRI DES ENREGISTREMENTS
                </label>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                  Ordre A-Z
                </span>
              </div>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                  showSortMenu || sortField !== 'nom' || sortOrder !== 'asc'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                  <span>
                    Tri : <b className="font-mono text-slate-900">{sortField.toUpperCase()}</b> (
                    {sortOrder === 'asc' ? 'A→Z' : 'Z→A'})
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showSortMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showSortMenu && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                      Trier par
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <button
                      onClick={() => {
                        if (sortField === 'id') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('id');
                          setSortOrder('asc');
                        }
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                        sortField === 'id'
                          ? 'bg-indigo-50 text-indigo-800 font-bold'
                          : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Identifiant (B)</span>
                      {sortField === 'id' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600 shrink-0" />
                        ))}
                    </button>

                    <button
                      onClick={() => {
                        if (sortField === 'nom') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('nom');
                          setSortOrder('asc');
                        }
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                        sortField === 'nom'
                          ? 'bg-indigo-50 text-indigo-800 font-bold'
                          : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Nom Complet (C)</span>
                      {sortField === 'nom' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600 shrink-0" />
                        ))}
                    </button>

                    <button
                      onClick={() => {
                        if (sortField === 'type') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('type');
                          setSortOrder('asc');
                        }
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                        sortField === 'type'
                          ? 'bg-indigo-50 text-indigo-800 font-bold'
                          : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Profil & Rôle (D)</span>
                      {sortField === 'type' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600 shrink-0" />
                        ))}
                    </button>

                    <button
                      onClick={() => {
                        if (sortField === 'id_zone') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('id_zone');
                          setSortOrder('asc');
                        }
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                        sortField === 'id_zone'
                          ? 'bg-indigo-50 text-indigo-800 font-bold'
                          : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Zone d&apos;Affectation (E)</span>
                      {sortField === 'id_zone' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600 shrink-0" />
                        ))}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {(localSearch || profileFilter !== 'ALL' || zoneFilter !== 'ALL') && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtres actifs :</span>
              {localSearch && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
                  <Search className="w-3 h-3 text-indigo-600" />
                  Recherche: &quot;{localSearch}&quot;
                  <button
                    onClick={() => setLocalSearch('')}
                    className="hover:bg-indigo-200/60 p-0.5 rounded-full transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {profileFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
                  <User className="w-3 h-3 text-indigo-600" />
                  Profil: {profileFilter}
                  <button
                    onClick={() => setProfileFilter('ALL')}
                    className="hover:bg-indigo-200/60 p-0.5 rounded-full transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {zoneFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  Zone: {zoneFilter}
                  <button
                    onClick={() => setZoneFilter('ALL')}
                    className="hover:bg-indigo-200/60 p-0.5 rounded-full transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Unified Table in Excel Twin Style (like Journal des Mouvements) */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
          {/* Top Info Header Bar inside Card */}
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
            <div className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Tableau Utilisateurs • Colonnes B → F</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400 hidden lg:block">
              id_user (B) | nom (C) | type_profil (D) | id_zone (E) | specialite (F)
            </div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto overflow-x-auto">
            <table className="min-w-[850px] w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="bg-slate-100/90 text-[10.5px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 select-none">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12 text-slate-500 font-mono text-[10px] bg-slate-200/50 border-r border-slate-200 shrink-0">
                    N°
                  </th>

                  {/* IDENTIFIANT (B) */}
                  <th
                    onClick={() => handleSort('id')}
                    className="py-2.5 px-4 cursor-pointer select-none hover:bg-slate-200/80 transition group text-left"
                    title="Cliquer pour trier par Identifiant Unique"
                  >
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>IDENTIFIANT</span>{' '}
                      <span className="text-slate-400 font-normal text-[10px] font-mono">(B)</span>
                      {renderSortIcon('id')}
                    </div>
                  </th>

                  {/* NOM COMPLET (C) */}
                  <th
                    onClick={() => handleSort('nom')}
                    className="py-2.5 px-4 cursor-pointer select-none hover:bg-slate-200/80 transition group text-left"
                    title="Cliquer pour trier par Nom Complet"
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>NOM COMPLET</span>{' '}
                      <span className="text-slate-400 font-normal text-[10px] font-mono">(C)</span>
                      {renderSortIcon('nom')}
                    </div>
                  </th>

                  {/* PROFIL & RÔLE (D) */}
                  <th
                    onClick={() => handleSort('type')}
                    className="py-2.5 px-4 cursor-pointer select-none hover:bg-slate-200/80 transition group text-left"
                    title="Cliquer pour trier par Profil & Rôle"
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>PROFIL & RÔLE</span>{' '}
                      <span className="text-slate-400 font-normal text-[10px] font-mono">(D)</span>
                      {renderSortIcon('type')}
                    </div>
                  </th>

                  {/* ZONE(S) D'AFFECTATION (E) */}
                  <th
                    onClick={() => handleSort('id_zone')}
                    className="py-2.5 px-4 cursor-pointer select-none hover:bg-slate-200/80 transition group text-left"
                    title="Cliquer pour trier par Zone d'Affectation"
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>ZONE(S) D&apos;AFFECTATION</span>{' '}
                      <span className="text-slate-400 font-normal text-[10px] font-mono">(E)</span>
                      {renderSortIcon('id_zone')}
                    </div>
                  </th>

                  {/* SPÉCIALITÉ / DESCRIPTION (F) */}
                  <th className="py-2.5 px-4 text-slate-700 font-bold select-none text-left">
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>SPÉCIALITÉ / DOMAINE</span>{' '}
                      <span className="text-slate-400 font-normal text-[10px] font-mono">(F)</span>
                    </div>
                  </th>

                  {/* ACTIONS COLUMN: "•••" */}
                  <th
                    className="py-2.5 px-4 text-center w-20 select-none font-bold text-slate-400 tracking-widest"
                    title="Actions (Modifier / Supprimer)"
                  >
                    •••
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayedData.map((user, idx) => {
                    const realIndex = startIndex + idx;
                    if (user.__isEmptyPlaceholder) {
                      return (
                        <tr key={`empty-${idx}`} className="border-b border-slate-100 bg-white/40 select-none">
                          <td className="py-2.5 px-3 text-center font-mono text-[10.5px] text-slate-300 bg-slate-100/30 border-r border-slate-200/60 shrink-0">
                            {realIndex + 1}
                          </td>
                          <td colSpan={6} className="py-2.5 px-4 text-center text-slate-300 font-mono text-[11px]">
                            —
                          </td>
                        </tr>
                      );
                    }
                    const isResp = user.type === 'RESPONSABLE';
                    const isTech = user.type === 'TECHNICIEN';
                    const isOp = user.type === 'OPERATEUR';

                    const tpls = Array.isArray(user.templates) && user.templates.length > 0
                      ? user.templates
                      : getTemplatesForUser(user);

                    return (
                      <tr
                        key={`user-row-${user.id ?? ''}-${user.type ?? ''}-${realIndex}`}
                        className="even:bg-slate-50/70 odd:bg-white hover:bg-indigo-50/40 transition-colors border-b border-slate-100"
                      >
                        {/* Row N° Column */}
                        <td className="py-2.5 px-3 text-center font-mono text-[10.5px] font-bold text-slate-400 bg-slate-100/30 border-r border-slate-200/60 shrink-0">
                          {realIndex + 1}
                        </td>

                        {/* IDENTIFIANT (B) */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-slate-100 text-slate-900 border border-slate-200/90 shadow-2xs">
                            <Hash className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>{user.id}</span>
                          </span>
                        </td>

                        {/* NOM COMPLET (C) */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border shadow-2xs ${
                                isTech
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : isOp
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {isTech ? (
                                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                              ) : isOp ? (
                                <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                              ) : (
                                <SupervisorAccount className="w-3.5 h-3.5 text-amber-600" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs sm:text-[12.5px] block leading-tight">
                                {user.nom}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <User className="w-2.5 h-2.5 text-slate-400" />
                                <span>{isResp ? 'Cadre / Supervision' : isTech ? 'Maintenance Industrielle' : 'Opérations & Lignes'}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* PROFIL & RÔLE (D) */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {isOp ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                              <ClipboardList className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span>Opérateur Ligne (OP)</span>
                            </span>
                          ) : isResp ? (
                            <div className="flex flex-wrap gap-1 items-center max-w-sm">
                              {tpls.map((tpl) => (
                                <span
                                  key={tpl.id}
                                  className={`inline-flex items-center gap-1 text-[10.5px] font-bold border px-2.5 py-0.5 rounded-full shadow-2xs ${tpl.badgeClass}`}
                                  title={`${tpl.label} - ${tpl.description}`}
                                >
                                  <Crown className="w-2.5 h-2.5 shrink-0 opacity-80" />
                                  <span>[{tpl.id}] {tpl.label}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                              <Wrench className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>Technicien (TECH)</span>
                            </span>
                          )}
                        </td>

                        {/* ZONE(S) D'AFFECTATION (E) */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {user.zones && user.zones.includes('ALL') ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                              <Globe className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>ALL (Toutes les zones)</span>
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1 items-center max-w-xs">
                              {(user.zones && user.zones.length > 0 ? user.zones : [user.id_zone]).map(
                                (zid) => {
                                  const zObj = zones.find((z) => z.id_zone === zid);
                                  return (
                                    <span
                                      key={zid}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                                    >
                                      <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                      <span className="font-semibold text-slate-800">{zObj ? zObj.libelle : zid}</span>
                                      <span className="text-[10px] font-mono text-slate-400">({zid})</span>
                                    </span>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </td>

                        {/* SPÉCIALITÉ / DESCRIPTION (F) */}
                        <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={user.specialite}>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-medium text-slate-700 truncate">
                              {user.specialite || '— Polyvalent / Affectation Générale —'}
                            </span>
                          </div>
                        </td>

                        {/* ACTIONS (•••) */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const userTpls = normalizeTemplateIds(
                                  user.templates || user.template_ids || user.template_id
                                );
                                setUserToEdit(user);
                                setForm({
                                  type: user.type,
                                  nom: user.nom,
                                  id_zone: user.id_zone,
                                  zones:
                                    user.zones && user.zones.length > 0
                                      ? user.zones
                                      : [user.id_zone || 'ALL'],
                                  templates: userTpls.length > 0 ? userTpls : ['RMT'],
                                  template_id: userTpls.join(', ') || 'RMT',
                                  specialite:
                                    user.specialite === 'Spécialité Maintenance' ||
                                    user.specialite?.includes('Opérateur') ||
                                    user.specialite?.includes('Supervision') ||
                                    user.specialite?.includes('Responsabilité')
                                      ? ''
                                      : user.specialite || '',
                                });
                                setShowAddModal(true);
                              }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition cursor-pointer shadow-2xs"
                              title="Modifier l'utilisateur"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserToDelete(user)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer shadow-2xs"
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Lignes par page :</span>
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              {[25, 50, 100, 200, 0].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    pageSize === size
                      ? 'bg-white text-indigo-800 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out border border-slate-200/50'
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
              <b className="text-slate-900">
                {Math.min(startIndex + displayedData.length, totalItems)}
              </b>{' '}
              sur <b className="text-slate-900">{totalItems}</b>
            </div>
            {pageSize !== 0 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
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

        {/* Manual Add / Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  {userToEdit
                    ? 'Modifier la Fiche Utilisateur'
                    : 'Enregistrer un nouvel Utilisateur'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
                {/* Mode Select (Enabled ONLY for creation, disabled for editing) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Type de Profil / Rôle
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-xl border border-slate-200/80">
                    {[
                      { key: 'TECHNICIEN', label: 'Technicien', sub: '(TECH)' },
                      { key: 'OPERATEUR', label: 'Opérateur', sub: '(OP)' },
                      { key: 'RESPONSABLE', label: 'Responsable', sub: '(RESP)' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        disabled={!!userToEdit}
                        onClick={() =>
                          setForm({
                            ...form,
                            type: item.key,
                            customCode: getNextId(item.key),
                          })
                        }
                        className={`py-2 px-2 text-center text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                          form.type === item.key
                            ? 'bg-white text-slate-900 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900'
                        } disabled:opacity-50`}
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">{item.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ID Field with UserCodePicker when adding, or readonly box when editing */}
                {userToEdit ? (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Identifiant Unique (ID)
                    </label>
                    <div className="w-full h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center shadow-2xs">
                      {userToEdit.id}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Identifiant permanent non modifiable en mode édition.
                    </p>
                  </div>
                ) : (
                  <UserCodePicker
                    prefix={modalPrefix}
                    currentCode={form.customCode || modalAutoNextId}
                    onChangeCode={(code) => setForm((prev) => ({ ...prev, customCode: code }))}
                    autoGeneratedCode={modalAutoNextId}
                    takenNumbers={modalTakenNumbers}
                    label="Code Utilisateur"
                    helperText={`Généré automatiquement selon le profil (${form.type}) avec choix libre de numéro (01-99)`}
                  />
                )}

                {/* Template Selection for RESPONSABLE (Multi-Select) */}
                {form.type === 'RESPONSABLE' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Templates & Domaines de Responsabilité (Multi-sélection)
                      </label>
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {(form.templates || []).length} actif(s)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {RESPONSABLE_TEMPLATES.map((tpl) => {
                        const isSelected = (form.templates || []).includes(tpl.id);
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => {
                              const current = form.templates || [];
                              let next;
                              if (isSelected) {
                                if (current.length > 1) {
                                  next = current.filter((id) => id !== tpl.id);
                                } else {
                                  next = current; // Keep at least one selected
                                }
                              } else {
                                next = [...current, tpl.id];
                              }
                              setForm({
                                ...form,
                                templates: next,
                                template_id: next.join(', '),
                              });
                            }}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tpl.badgeClass}`}
                              >
                                {tpl.id}
                              </span>
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-900 line-clamp-1">
                              {tpl.label}
                            </span>
                            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {tpl.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Un responsable peut cumuler plusieurs templates (ex: RMT + RZN).
                    </p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nom Complet du Membre
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Rachid Belkacem"
                    className="w-full h-10 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                {/* Zones Selection */}
                {form.type === 'RESPONSABLE' ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Zones sous Responsabilité
                        </label>
                        {onOpenAddZoneModal && (
                          <button
                            type="button"
                            onClick={onOpenAddZoneModal}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Nouvelle zone</span>
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentZones = form.zones || [];
                          if (currentZones.includes('ALL')) {
                            setForm({ ...form, zones: [zones[0]?.id_zone || ''] });
                          } else {
                            setForm({ ...form, zones: ['ALL'] });
                          }
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                          (form.zones || []).includes('ALL')
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        ALL (Toutes Zones)
                      </button>
                    </div>

                    {!(form.zones || []).includes('ALL') && (
                      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {zones.map((z) => {
                          const isChecked = (form.zones || []).includes(z.id_zone);
                          return (
                            <label
                              key={z.id_zone}
                              className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-white transition"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentZones = (form.zones || []).filter((x) => x !== 'ALL');
                                  if (e.target.checked) {
                                    setForm({ ...form, zones: [...currentZones, z.id_zone] });
                                  } else {
                                    const next = currentZones.filter((x) => x !== z.id_zone);
                                    setForm({ ...form, zones: next.length > 0 ? next : ['ALL'] });
                                  }
                                }}
                                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300"
                              />
                              <span className="truncate">{z.libelle}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                      <span>Affectation de Zone</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          onOpenAddZoneModal();
                        }}
                        className="text-[10px] text-indigo-600 hover:underline font-bold inline-flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Nouvelle zone</span>
                      </button>
                    </label>
                    <select
                      value={form.id_zone}
                      onChange={(e) => setForm({ ...form, id_zone: e.target.value })}
                      className="w-full h-10 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    >
                      {zones.map((z) => (
                        <option key={z.id_zone} value={z.id_zone}>
                          {z.libelle} ({z.id_zone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Specialty (Shown ONLY for Technicians) */}
                {form.type === 'TECHNICIEN' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Spécialité Technique
                    </label>
                    <input
                      type="text"
                      value={form.specialite}
                      onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                      placeholder="Ex: Hydraulique & Pneumatique"
                      className="w-full h-10 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out"
                  >
                    {userToEdit ? 'Sauvegarder' : "Créer l'utilisateur"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-black text-slate-900">Supprimer l&apos;Utilisateur ?</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Confirmez-vous la suppression de <b>{userToDelete.nom}</b> ? Cette opération
                  supprimera définitivement sa fiche.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Excel Formulas Preview Modal */}
        {showFormulasModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span>Formules Excel Miroir — Utilisateurs</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Techniciens & Opérations
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Règles d'Auto-ID, filtres par profil et liaisons zones dans Excel
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFormulasModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content: 4 Formula Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Auto-ID Technicien */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between gap-2 hover:border-blue-300 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 truncate">
                      <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Auto-ID Technicien</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 border border-blue-200 shrink-0">
                      Feuille Tech
                    </span>
                  </div>
                  <div className="font-mono text-xs text-blue-800 font-bold bg-white p-2 rounded-lg border border-blue-100">
                    ="TECH-" & TEXT(COUNTIF(Tech[ID],"TECH-*")+1, "00")
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    Génération séquentielle du matricule technique (e.g. TECH-01, TECH-02).
                  </p>
                </div>

                {/* Auto-ID Opérateur */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between gap-2 hover:border-emerald-300 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 truncate">
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Auto-ID Opérateur</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-200 shrink-0">
                      Feuille Op
                    </span>
                  </div>
                  <div className="font-mono text-xs text-emerald-800 font-bold bg-white p-2 rounded-lg border border-emerald-100">
                    ="OP-" & TEXT(COUNTIF(Op[Type],"OPERATEUR")+1, "00")
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    Incrémentation automatique des identifiants des opérateurs de chaîne de production.
                  </p>
                </div>

                {/* Auto-ID Responsable */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between gap-2 hover:border-purple-300 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 truncate">
                      <Crown className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">Auto-ID Responsable</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100/80 text-purple-800 border border-purple-200 shrink-0">
                      Feuille Op / RESP
                    </span>
                  </div>
                  <div className="font-mono text-xs text-purple-800 font-bold bg-white p-2 rounded-lg border border-purple-100">
                    ="RESP-" & TEXT(COUNTIF(Op[Type],"RESPONSABLE")+1, "00")
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    Codification des chefs d'équipe, responsables zone, maintenance et généraux.
                  </p>
                </div>

                {/* Liaison Zone & Templates */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between gap-2 hover:border-amber-300 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">Liaison Zone & Responsabilité</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100/80 text-amber-800 border border-amber-200 shrink-0">
                      Col. [id_zone]
                    </span>
                  </div>
                  <div className="font-mono text-xs text-amber-800 font-bold bg-white p-2 rounded-lg border border-amber-100">
                    =[@id_zone] → Zone!B:B
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    Rattachement automatique de chaque profil à une zone spécifique ou à un périmètre multi-zones (ALL).
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Conforme à 100% avec le fichier Excel modèle <span className="font-mono text-slate-600">GMAO_Light_Template_V2</span>
                </span>
                <button
                  onClick={() => setShowFormulasModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
    </AnimatedPage>
  );
}
