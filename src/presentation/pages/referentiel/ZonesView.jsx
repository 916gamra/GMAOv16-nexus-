import {  useState, useRef, useMemo, useEffect  } from 'react';
import AnimatedPage from '../../components/common/AnimatedPage';
import SequentialCodePicker from '../../components/common/SequentialCodePicker';
import FormulasModalButton from '../../components/common/FormulasModalButton';
import Action3DButton from '../../components/common/Action3DButton';
import {
  MapPin,
  Search,
  ArrowRight,
  Users,
  Wrench,
  Cpu,
  Trash2,
  Edit2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  AlignLeft,
  Tag,
  Hash,
  Key,
  Shield,
  User,
  Calculator,
  RotateCcw,
  X,
} from 'lucide-react';

export default function ZonesView({
  zones = [],
  technicians = [],
  operations = [],
  machines = [],
  onAddZone,
  onUpdateZone,
  onDeleteZone,
  onNavigateToTechs,
  onNavigateToOps,
  onNavigateToMachines,
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
    }, 200);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFormulasModal, setShowFormulasModal] = useState(false);
  const [form, setForm] = useState({ code_zone: '', id_zone: '', libelle: '', type: 'FINITION', description: '' });
  const [toEdit, setToEdit] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const safeZones = Array.isArray(zones) ? zones : [];
  const safeTechs = Array.isArray(technicians) ? technicians : [];
  const safeOps = Array.isArray(operations) ? operations : [];
  const safeMachines = Array.isArray(machines) ? machines : [];

  // Auto-calculation of next Code Zone (e.g. ZONE-01)
  const autoCodeZone = useMemo(() => {
    const nums = safeZones
      .map((z) => {
        const val = z.code_zone || z.code || z.id_zone || '';
        const m = String(val).match(/ZONE-(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `ZONE-${String(max + 1).padStart(2, '0')}`;
  }, [safeZones]);

  const takenZoneNumbers = useMemo(() => {
    const set = new Set();
    safeZones.forEach((z) => {
      const val = z.code_zone || z.code || z.id_zone || '';
      const m = String(val).match(/(\d+)$/);
      if (m) set.add(parseInt(m[1], 10));
    });
    return set;
  }, [safeZones]);

  useEffect(() => {
    if (showAddModal) {
      setForm((prev) => ({
        ...prev,
        code_zone: prev.code_zone || autoCodeZone,
        id_zone: prev.id_zone || '',
      }));
    }
  }, [showAddModal, autoCodeZone]);

  const filtered = safeZones.filter((z) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(z?.code_zone || z?.code || '').toLowerCase().includes(q) ||
      String(z?.id_zone || '').toLowerCase().includes(q) ||
      String(z?.libelle || '').toLowerCase().includes(q) ||
      String(z?.type || '').toLowerCase().includes(q) ||
      String(z?.description || '').toLowerCase().includes(q)
    );
  });

  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('id_zone');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortMenuRef = useRef(null);

  const [prevFilters, setPrevFilters] = useState({ search, sortField, sortOrder });
  if (
    prevFilters.search !== search ||
    prevFilters.sortField !== sortField ||
    prevFilters.sortOrder !== sortOrder
  ) {
    setPrevFilters({ search, sortField, sortOrder });
    setCurrentPage(1);
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      padded.push({ __isEmptyPlaceholder: true, id_zone: `empty-${i}` });
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

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition shrink-0" />
      );
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-cyan-700 shrink-0 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-cyan-700 shrink-0 font-bold" />
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code_zone || !form.id_zone || !form.libelle) return;
    onAddZone({
      code_zone: form.code_zone.trim().toUpperCase(),
      id_zone: form.id_zone.trim().toUpperCase(),
      libelle: form.libelle.trim(),
      type: form.type,
      description: form.description || '',
    });
    setForm({ code_zone: '', id_zone: '', libelle: '', type: 'FINITION', description: '' });
    setShowAddModal(false);
  };

  return (
    <AnimatedPage className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex items-center justify-between gap-3 sm:gap-4 w-full relative overflow-hidden group/header">
        {/* Subtle Ambient Gradient Background Highlight */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover/header:bg-purple-500/10 transition-colors duration-500" />

        <div className="flex items-center gap-3 min-w-0 relative">
          {/* 3D Elevated Page Badge Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200/90 shadow-[0_4px_12px_rgba(147,51,234,0.12)] flex items-center justify-center text-purple-700 group-hover/header:scale-105 group-hover/header:border-purple-400/80 transition-all duration-300 shrink-0">
            <MapPin className="w-6 h-6 text-purple-700 transition-transform duration-300 group-hover/header:scale-110" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Zones & Ateliers de Production
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Point de départ du workflow. Cliquez sur <b className="text-blue-600">Nb Techs</b>,{' '}
              <b className="text-indigo-600">Nb Ops</b> ou{' '}
              <b className="text-emerald-600">Nb Machines</b> pour naviguer vers les listes filtrées.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <FormulasModalButton
            onClick={() => setShowFormulasModal(true)}
            title="Formules Excel (Zones & Secteurs)"
          />

          <Action3DButton
            variant="circle"
            color="purple"
            icon={MapPin}
            showAddBadge={true}
            onClick={() => setShowAddModal(true)}
            title="Nouvelle Zone"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-200/80 flex items-center justify-center text-purple-700 shadow-2xs shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Filtres & Recherche Avancée
                </span>
                <span className="bg-purple-50 text-purple-800 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-purple-200/70 shadow-2xs">
                  {filtered.length} zone{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''} / {safeZones.length} total
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Référentiel des Zones & Ateliers de Production • Colonnes A → F
              </p>
            </div>
          </div>

          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              title="Réinitialiser la recherche"
              className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-200 flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          {/* Search */}
          <div className="relative w-full">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Recherche
              </label>
              <span className="text-[10px] font-bold text-slate-400 font-mono">[Col. A + B + C]</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par code zone, identifiant, libellé..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full relative" ref={sortMenuRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tri des enregistrements
              </label>
              <span className="text-[10px] font-bold text-slate-400 font-mono">[A-Z]</span>
            </div>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                showSortMenu || sortField !== 'id_zone' || sortOrder !== 'asc'
                  ? 'bg-purple-50 text-purple-900 border-purple-300 ring-1 ring-purple-200 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
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
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                    Trier par
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs">
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
                        ? 'bg-purple-50 text-purple-800'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Code Zone (ID)</span>
                    {sortField === 'id_zone' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-purple-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-purple-600 shrink-0" />
                      ))}
                  </button>

                  <button
                    onClick={() => {
                      if (sortField === 'libelle') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('libelle');
                        setSortOrder('asc');
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                      sortField === 'libelle'
                        ? 'bg-purple-50 text-purple-800'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Libellé / Description</span>
                    {sortField === 'libelle' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-purple-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-purple-600 shrink-0" />
                      ))}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {localSearch && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtre actif :</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold">
              <Search className="w-3 h-3 text-purple-600" />
              Recherche: &quot;{localSearch}&quot;
              <button
                onClick={() => setLocalSearch('')}
                className="hover:bg-purple-200/60 p-0.5 rounded-full transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
        {/* Top Info Header Bar inside Card */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
          <div className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-600" />
            <span>Tableau Zones • Code Système & ID Utilisateur</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 hidden lg:block">
            code_zone (B.1) | id_zone (B.2) | libelle (C) | nb_techniciens (D) | nb_operations (E) | nb_machines (F)
          </div>
        </div>

        <div className="max-h-[62vh] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-[10.5px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-center w-12 text-slate-500 font-mono text-[10px] bg-slate-200/60 border-r border-slate-200 shrink-0">
                N°
              </th>
              <th
                onClick={() => handleSort('code_zone')}
                className="py-2.5 px-3 min-w-[160px] cursor-pointer select-none hover:bg-slate-200/70 transition group"
                title="Trier par Code / ID"
              >
                <div className="flex items-center gap-1.5">
                  <span>IDENTIFIANTS (CODE / ID)</span>
                  <span className="text-slate-400 font-normal text-[10px]">(b.1/b.2)</span>
                  {renderSortIcon('code_zone')}
                </div>
              </th>
              <th
                onClick={() => handleSort('libelle')}
                className="py-2.5 px-4 min-w-[250px] cursor-pointer select-none hover:bg-slate-200/70 transition group"
                title="Trier par Libellé"
              >
                <div className="flex items-center gap-1.5">
                  <span>LIBELLÉ SECTEUR / ATELIER</span>
                  <span className="text-slate-400 font-normal text-[10px]">(C)</span>
                  {renderSortIcon('libelle')}
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[200px]">
                <span>UTILISATEURS (ÉQUIPE)</span>{' '}
                <span className="text-slate-400 font-normal text-[10px]">(D/E)</span>
              </th>
              <th className="py-2.5 px-3">
                <span>MACHINES</span>{' '}
                <span className="text-slate-400 font-normal text-[10px]">(F)</span>
              </th>
              <th className="py-2.5 px-3 text-center">
                <span>ACTIONS</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {displayedData.map((z, idx) => {
              const rowNum = startIndex + idx + 1;
              if (z.__isEmptyPlaceholder) {
                return (
                  <tr key={`empty-${idx}`} className="border-b border-slate-100 bg-white/40 select-none">
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-300 bg-slate-100/40 border-r border-slate-200/80">
                      {rowNum}
                    </td>
                    <td colSpan={6} className="py-3 px-4 text-center text-slate-300 font-mono text-[11px]">
                      —
                    </td>
                  </tr>
                );
              }
              const codeVal = z.code_zone || z.code || z.id_zone || `ZONE-${String(rowNum).padStart(2, '0')}`;
              const idVal = z.id_zone || z.code_zone || z.code;

              const mCount = safeMachines.filter((m) => {
                const mZ = String(m.id_zone_default || '').trim().toLowerCase();
                const idZ = String(z.id_zone || '').trim().toLowerCase();
                const codeZ = String(z.code_zone || z.code || '').trim().toLowerCase();
                const libZ = String(z.libelle || '').trim().toLowerCase();
                return mZ && (mZ === idZ || mZ === codeZ || mZ === libZ);
              }).length;

              const zoneOps = safeOps.filter((op) => op.id_zone === z.id_zone || op.id_zone === z.code_zone);
              const zoneTechs = safeTechs.filter((t) => t.id_zone === z.id_zone || t.id_zone === z.code_zone);
              
              const responsables = zoneOps.filter(op => op.type_profil === 'CHEF' || op.type_profil === 'SUPERVISEUR' || op.type_profil === 'RESPONSABLE');
              const operateursCount = zoneOps.filter(op => op.type_profil === 'OPERATEUR' || !op.type_profil).length;

              return (
                <tr
                  key={z.code_zone || z.id_zone || idx}
                  className="even:bg-slate-50/80 odd:bg-white hover:bg-slate-100/70 border-b border-slate-200/70 transition-colors"
                >
                  {/* Row N° Column */}
                  <td className="py-3 px-3 text-center font-mono text-[11px] font-bold text-slate-400 bg-slate-100/40 border-r border-slate-200/80 shrink-0">
                    {rowNum}
                  </td>
                  {/* IDENTIFIANTS Column */}
                  <td className="py-2.5 px-3 min-w-[160px]">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span className="font-mono text-[11px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded shadow-2xs leading-none">
                          {codeVal}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="font-mono text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded shadow-2xs leading-none">
                          {idVal}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 min-w-[200px]">
                    <div className="flex flex-col gap-0.5">
                      {/* Libellé */}
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="text-[12px] font-bold text-slate-900 leading-snug break-words">
                          {z.libelle}
                        </span>
                      </div>
                      
                      {/* Description */}
                      {z.description && (
                        <div className="flex items-start gap-1.5">
                          <AlignLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-slate-500 font-medium leading-snug line-clamp-2" title={z.description}>
                            {z.description}
                          </span>
                        </div>
                      )}

                      {/* Type */}
                      {z.type && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold tracking-wide uppercase text-indigo-600">
                          <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[180px]" title={z.type}>{z.type}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 min-w-[200px]">
                    <div className="flex flex-col gap-2">
                      {/* Responsables */}
                      {responsables.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          {responsables.map((resp, i) => (
                            <div key={i} className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase text-slate-400">
                                <Shield className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate" title={resp.type_profil || 'RESPONSABLE'}>{resp.type_profil || 'RESPONSABLE'}</span>
                              </div>
                              <div className="flex items-start gap-1.5 pl-[1.125rem]">
                                <User className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                <span className="text-[11.5px] font-bold text-slate-900 leading-snug break-words">
                                  {resp.nom}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Techniciens */}
                      {zoneTechs.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => onNavigateToTechs && onNavigateToTechs(z.code_zone || z.id_zone)}
                            className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase text-slate-400 hover:text-blue-600 transition text-left cursor-pointer"
                          >
                            <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>TECHNICIEN{zoneTechs.length > 1 ? 'S' : ''} ({zoneTechs.length})</span>
                          </button>
                          <div className="flex flex-wrap items-center gap-1.5 pl-[1.125rem] mt-0.5">
                            {zoneTechs.map((tech, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => onNavigateToTechs && onNavigateToTechs(z.code_zone || z.id_zone)}
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold text-blue-700 shadow-2xs cursor-pointer transition"
                              >
                                {tech.id_technician || tech.code || 'TECH'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Opérateurs */}
                      {operateursCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onNavigateToOps && onNavigateToOps(z.code_zone || z.id_zone)}
                          className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold tracking-wide uppercase text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{operateursCount} OPÉRATEUR{operateursCount > 1 ? 'S' : ''}</span>
                        </button>
                      )}

                      {/* Fallback */}
                      {responsables.length === 0 && zoneTechs.length === 0 && operateursCount === 0 && (
                        <span className="text-[11px] text-slate-400 italic">Aucun utilisateur</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => onNavigateToMachines(z.code_zone || z.id_zone)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition group shadow-2xs"
                      title="Voir les machines installées dans cette zone"
                    >
                      <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{mCount} machines</span>
                      <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setToEdit(z)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Modifier la zone"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setToDelete(z)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Supprimer la zone"
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

      {/* Add Modal */}

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
                    ? 'bg-white text-cyan-800 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out border border-slate-200/50'
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition"
              >
                Suivant
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 flex flex-col max-h-screen">
            <h3 className="font-bold text-base text-slate-900 mb-1">Nouvelle Zone / Atelier</h3>
            <p className="text-xs text-slate-500 mb-4">
              Créez une zone géographique ou un secteur d&apos;usine.
            </p>
            <div className="overflow-y-auto pr-1">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Code Zone (Automatic Picker) */}
                <div>
                  <SequentialCodePicker
                    prefix="ZONE-"
                    currentCode={form.code_zone}
                    onChangeCode={(newCode) => setForm((prev) => ({ ...prev, code_zone: newCode }))}
                    autoGeneratedCode={autoCodeZone}
                    takenNumbers={takenZoneNumbers}
                    label="Code Zone (ex: ZONE-01) *"
                    helperText="Code séquentiel système avec choix libre du numéro"
                  />
                </div>

                {/* ID Zone (Manual Input) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    ID Zone (ex: POL, DET, AMBO) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: POL, DET, AMBO..."
                    value={form.id_zone}
                    onChange={(e) => setForm({ ...form, id_zone: e.target.value.toUpperCase() })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Identifiant manuel utilisateur (ex: DET, POL, SAT, AMBO)</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Libellé Secteur / Atelier
                  </label>
                  <input
                    type="text"
                    placeholder="Atelier Finition & Peinture..."
                    value={form.libelle}
                    onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Type de Zone</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none"
                  >
                    <option value="FINITION">FINITION</option>
                    <option value="DECOUPE">DECOUPE</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="FORMAGE">FORMAGE</option>
                    <option value="ASSEMBLAGE_FINAL">ASSEMBLAGE FINAL</option>
                    <option value="STOCK">STOCK</option>
                    <option value="AUTRE">AUTRE</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Description (Philosophie Industrielle)</label>
                  <textarea
                    rows={3}
                    placeholder="Principe physique et mécanique de l'opération..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 flex flex-col max-h-screen">
            <h3 className="font-bold text-base text-slate-900 mb-1">Modifier Zone</h3>
            <div className="overflow-y-auto pr-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdateZone(toEdit.id_zone, toEdit);
                  setToEdit(null);
                }}
                className="space-y-3"
              >
                <div>
                  <SequentialCodePicker
                    prefix="ZONE-"
                    currentCode={toEdit.code_zone || toEdit.code || toEdit.id_zone}
                    onChangeCode={(newCode) => setToEdit((prev) => ({ ...prev, code_zone: newCode }))}
                    autoGeneratedCode={toEdit.code_zone || toEdit.code || toEdit.id_zone}
                    takenNumbers={takenZoneNumbers}
                    label="Code Zone (B.1)"
                    disabled={true}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">ID Zone (B.2)</label>
                  <input
                    type="text"
                    value={toEdit.id_zone || ''}
                    onChange={(e) => setToEdit({ ...toEdit, id_zone: e.target.value.toUpperCase() })}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Libellé</label>
                  <input
                    type="text"
                    value={toEdit.libelle}
                    onChange={(e) => setToEdit({ ...toEdit, libelle: e.target.value })}
                    required
                    className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Type de Zone</label>
                  <select
                    value={toEdit.type || 'FINITION'}
                    onChange={(e) => setToEdit({ ...toEdit, type: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none"
                  >
                    <option value="FINITION">FINITION</option>
                    <option value="DECOUPE">DECOUPE</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="FORMAGE">FORMAGE</option>
                    <option value="ASSEMBLAGE_FINAL">ASSEMBLAGE FINAL</option>
                    <option value="STOCK">STOCK</option>
                    <option value="AUTRE">AUTRE</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Description (Philosophie Industrielle)</label>
                  <textarea
                    rows={3}
                    value={toEdit.description || ''}
                    onChange={(e) => setToEdit({ ...toEdit, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setToEdit(null)}
                    className="flex-1 h-10 rounded-xl bg-slate-100 text-xs font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {toDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-5 space-y-4">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="w-8 h-8 text-rose-600 mb-2" />
              <h3 className="font-bold text-lg text-slate-900">Supprimer la zone ?</h3>
            </div>
            <p className="text-sm text-center text-slate-600">
              Confirmez-vous la suppression de <b>{toDelete.libelle}</b> ? Les liaisons avec cette
              zone pourraient être rompues.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setToDelete(null)}
                className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteZone(toDelete.id_zone);
                  setToDelete(null);
                }}
                className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-xs font-semibold"
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
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Formules Excel Miroir — Zones & Secteurs</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Feuille Zones
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Formules d'agrégation et de décompte relationnel de la feuille Zones
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

            {/* Modal Content: 3 Formula Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Formule D: Techniciens */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between gap-2 hover:border-blue-300 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 truncate">
                    <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">Formule D (Techniciens)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 border border-blue-200 shrink-0">
                    Col. D
                  </span>
                </div>
                <div className="font-mono text-xs text-blue-800 font-bold bg-white p-2 rounded-lg border border-blue-100">
                  =COUNTIF(Tech!D:D, [@id_zone])
                </div>
                <p className="text-[10.5px] text-slate-500 leading-tight">
                  Décompte dynamique du nombre de techniciens de maintenance affectés à cette zone.
                </p>
              </div>

              {/* Formule E: Opérations */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between gap-2 hover:border-indigo-300 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">Formule E (Opérations)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100/80 text-indigo-800 border border-indigo-200 shrink-0">
                    Col. E
                  </span>
                </div>
                <div className="font-mono text-xs text-indigo-800 font-bold bg-white p-2 rounded-lg border border-indigo-100">
                  =COUNTIF(Op!D:D, [@id_zone])
                </div>
                <p className="text-[10.5px] text-slate-500 leading-tight">
                  Décompte dynamique des opérateurs de ligne et responsables rattachés à la zone.
                </p>
              </div>

              {/* Formule F: Machines */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between gap-2 hover:border-emerald-300 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 truncate">
                    <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Formule F (Machines)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-200 shrink-0">
                    Col. F
                  </span>
                </div>
                <div className="font-mono text-xs text-emerald-800 font-bold bg-white p-2 rounded-lg border border-emerald-100">
                  =COUNTIF(Mch!F:F, [@id_zone])
                </div>
                <p className="text-[10.5px] text-slate-500 leading-tight">
                  Total d'équipements et machines de production installés dans ce secteur.
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
