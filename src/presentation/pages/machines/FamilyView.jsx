import {  useState, useRef, useMemo, useEffect  } from 'react';
import AnimatedPage from '../../components/common/AnimatedPage';
import SequentialCodePicker from '../../components/common/SequentialCodePicker';
import Action3DButton from '../../components/common/Action3DButton';
import FormulasModalButton from '../../components/common/FormulasModalButton';
import { HubIcon } from '../../components/common/icons/HubIcon';
import { CategoryIcon } from '../../components/common/icons/CategoryIcon';
import {
  Search,
  ArrowRight,
  Cpu,
  Trash2,
  Edit2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  RotateCcw,
  ArrowDown,
  ArrowUp,
  Boxes,
  X,
  Calculator,
  MoreVertical,
  Factory,
  FileSpreadsheet,
} from 'lucide-react';
import { CategoryPlusIcon } from '../../components/common/icons/CategoryPlusIcon';

export default function FamilyView({
  families,
  templates,
  machines,
  onAddFamily,
  onUpdateFamily,
  onDeleteFamily,
  onNavigateToTemplatesFiltered,
  onQuickCreateTemplate,
  onNavigateToMachinesByFamily,
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
  const [form, setForm] = useState({ id_family: '', libelle: '' });
  const [toEdit, setToEdit] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const safeFamilies = Array.isArray(families) ? families : [];

  const autoFamilyId = useMemo(() => {
    const nums = safeFamilies
      .map((f) => {
        const m = String(f.id_family || '').match(/FAM-(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `FAM-${String(max + 1).padStart(2, '0')}`;
  }, [safeFamilies]);

  const takenFamilyNumbers = useMemo(() => {
    const set = new Set();
    safeFamilies.forEach((f) => {
      const m = String(f.id_family || '').match(/(\d+)$/);
      if (m) set.add(parseInt(m[1], 10));
    });
    return set;
  }, [safeFamilies]);

  useEffect(() => {
    if (showAddModal) {
      setForm((prev) => ({
        ...prev,
        id_family: prev.id_family || autoFamilyId,
      }));
    }
  }, [showAddModal, autoFamilyId]);

  const filtered = families.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(f?.id_family || '').toLowerCase().includes(q) ||
      String(f?.libelle || '').toLowerCase().includes(q)
    );
  });

  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('id_family');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortMenuRef = useRef(null);

  // Active Action Menu Popover
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortOrder]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
      if (!event.target.closest('.action-menu-container')) {
        setActiveActionMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const sortedData = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let valA = a[sortField] || (sortField === 'libelle' ? a.designation : '') || '';
      let valB = b[sortField] || (sortField === 'libelle' ? b.designation : '') || '';
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
    // Standard Excel Twin Table: minRows = 19 (1 header + 19 body rows = 20 total)
    const minRows = 19;
    if (rawDisplayedData.length >= minRows) return rawDisplayedData;
    const padded = [...rawDisplayedData];
    for (let i = 0; i < minRows - rawDisplayedData.length; i++) {
      padded.push({ __isEmptyPlaceholder: true, id_family: `empty-${i}` });
    }
    return padded;
  }, [rawDisplayedData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id_family || !form.libelle) return;
    onAddFamily(form);
    setForm({ id_family: '', libelle: '' });
    setShowAddModal(false);
  };

  const handleExportExcel = () => {
    const headers = ['ID Famille', 'Libellé / Désignation', 'Nb Templates', 'Nb Machines'];
    const rows = filtered.map((f) => [
      f.id_family || '',
      f.libelle || '',
      f.templatesCount ?? 0,
      f.machinesCount ?? 0,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `familles_machines_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatedPage className="space-y-4">
      {/* Top Banner (BDR Light GMAO Header Card with 3D Tactile Elevation) */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden group/header">
        {/* Subtle Ambient Gradient Background Highlight */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl pointer-events-none group-hover/header:bg-teal-500/10 transition-colors duration-500" />

        <div className="min-w-0 flex-1 flex items-start sm:items-center gap-3.5 relative">
          {/* 3D Elevated Page Badge Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-200/90 shadow-[0_4px_12px_rgba(20,184,166,0.12)] flex items-center justify-center text-teal-700 group-hover/header:scale-105 group-hover/header:border-teal-400/80 transition-all duration-300 shrink-0">
            <HubIcon className="w-6 h-6 text-teal-700 transition-transform duration-300 group-hover/header:scale-110" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Familles de Machines (Catégories d'Équipements)
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Cliquez sur <b className="text-cyan-600">Nb Templates</b> pour voir les modèles de la
              famille, ou sur <b className="text-emerald-600">Nb Machines</b> pour filtrer le parc
              (Family = sélectionnée, Template = Tous).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative">
          <FormulasModalButton
            onClick={() => setShowFormulasModal(true)}
            title="Formules Excel (Familles de Machines)"
          />

          <Action3DButton
            variant="circle"
            color="teal"
            icon={HubIcon}
            showAddBadge={true}
            onClick={() => setShowAddModal(true)}
            title="Nouvelle Famille"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative z-30 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4">
        {/* Header Toolbar: Icon + Title + Count Badge + Excel Export + Circular Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-2xs shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Filtres & Recherche Avancée
                </span>
                <span className="bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-teal-200/70 shadow-2xs font-mono">
                  {filtered.length} / {safeFamilies.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Référentiel des Familles de Machines • Colonnes B → E
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
            {(localSearch || search || sortField !== 'id_family' || sortOrder !== 'asc') && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  setSearch('');
                  setSortField('id_family');
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          {/* Search */}
          <div className="relative w-full">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                RECHERCHE LIBRE
              </label>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                Col. B + C
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-teal-100 border border-teal-300/80 flex items-center justify-center text-teal-700 shadow-2xs pointer-events-none z-10">
                <Search className="w-3 h-3" />
              </span>
              <input
                type="text"
                placeholder="Rechercher una famille (ID, libellé)..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
              {localSearch && (
                <button
                  onClick={() => {
                    setLocalSearch('');
                    setSearch('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sort Dropdown */}
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
                showSortMenu || sortField !== 'id_family' || sortOrder !== 'asc'
                  ? 'bg-teal-50 text-teal-800 border-teal-300 ring-1 ring-teal-200 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-teal-100 border border-teal-300/80 flex items-center justify-center text-teal-700 shadow-2xs shrink-0">
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
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
                    Trier par
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <button
                    onClick={() => {
                      if (sortField === 'id_family') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('id_family');
                        setSortOrder('asc');
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                      sortField === 'id_family'
                        ? 'bg-cyan-50 text-cyan-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Code Famille ID (B)</span>
                    {sortField === 'id_family' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
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
                        ? 'bg-cyan-50 text-cyan-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Libellé Famille (C)</span>
                    {sortField === 'libelle' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      ))}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {search && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtre actif :</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
              <Search className="w-3 h-3 text-cyan-600" />
              Recherche: &quot;{search}&quot;
              <button
                onClick={() => {
                  setLocalSearch('');
                  setSearch('');
                }}
                className="hover:bg-cyan-200/60 p-0.5 rounded-full transition cursor-pointer"
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
            <Boxes className="w-4 h-4 text-cyan-600" />
            <span>Tableau Families • Colonnes B → E</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 hidden lg:block">
            id_family (B) | libelle (C) | nb_templates (D) | nb_machines (E)
          </div>
        </div>

        {/* Table Container with max-h-[62vh] and overflow-y-auto */}
        <div className="max-h-[62vh] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 z-10 shadow-2xs select-none">
              <tr>
                <th className="py-3 px-3 text-center w-12 text-slate-500 font-mono text-[10px] bg-slate-200/60 border-r border-slate-200 shrink-0 select-none">
                  N°
                </th>
                <th
                  onClick={() => handleSort('id_family')}
                  className="py-3 px-3.5 cursor-pointer select-none hover:bg-slate-200/80 transition group"
                  title="Cliquer pour trier par ID Famille"
                >
                  <div className="flex items-center gap-1.5">
                    <HubIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>ID FAMILLE</span>
                    <span className="text-slate-400 font-normal text-[10px]">(B)</span>
                    {renderSortIcon('id_family')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('libelle')}
                  className="py-3 px-3.5 cursor-pointer select-none hover:bg-slate-200/80 transition group min-w-[200px]"
                  title="Cliquer pour trier par Libellé"
                >
                  <div className="flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>LIBELLÉ DE LA FAMILLE</span>
                    <span className="text-slate-400 font-normal text-[10px]">(C)</span>
                    {renderSortIcon('libelle')}
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <CategoryIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>NB TEMPLATES</span>
                    <span className="text-slate-400 font-normal text-[10px]">(D)</span>
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>NB MACHINES</span>
                    <span className="text-slate-400 font-normal text-[10px]">(E)</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center font-bold text-slate-400 tracking-widest select-none w-24" title="Actions & Options">
                  •••
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {displayedData.map((f, idx) => {
                const rowNum = startIndex + idx + 1;
                if (f.__isEmptyPlaceholder) {
                  return (
                    <tr key={`empty-${idx}`} className="border-b border-slate-100 bg-white/40 select-none">
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-300 bg-slate-100/40 border-r border-slate-200/80">
                        {rowNum}
                      </td>
                      <td colSpan={5} className="py-3 px-4 text-center text-slate-300 font-mono text-[11px]">
                        —
                      </td>
                    </tr>
                  );
                }
                const tCount = templates.filter((t) => t.id_family === f.id_family).length;
                const mCount = machines.filter((m) => m.id_family === f.id_family).length;

                return (
                  <tr
                    key={f.id_family}
                    className="even:bg-slate-50/80 odd:bg-white hover:bg-slate-100/70 border-b border-slate-200/70 transition-colors"
                  >
                    {/* Row N° Column */}
                    <td className="py-3 px-3 text-center font-mono text-[11px] font-bold text-slate-400 bg-slate-100/40 border-r border-slate-200/80 shrink-0">
                      {rowNum}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {f.id_family}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 text-[13px]">
                      {f.libelle}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onNavigateToTemplatesFiltered(f.id_family)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 text-xs font-semibold transition group shadow-2xs"
                        title="Voir les templates de cette famille"
                      >
                        <CategoryIcon className="w-3.5 h-3.5 text-cyan-600" />
                        <span>{tCount} templates</span>
                        <ArrowRight className="w-3 h-3 text-cyan-600 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onNavigateToMachinesByFamily(f.id_family)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition group shadow-2xs"
                        title="Filtrer Machines Registered : Famille sélectionnée, Template = Tous"
                      >
                        <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{mCount} machines (All)</span>
                        <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                    {/* Actions (•••) */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="relative inline-flex items-center justify-center action-menu-container">
                        <div className="inline-flex rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                          {/* Quick Action Button: Create Template for this Family */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onQuickCreateTemplate) {
                                onQuickCreateTemplate(f.id_family);
                              } else if (onNavigateToTemplatesFiltered) {
                                onNavigateToTemplatesFiltered(f.id_family);
                              }
                              setActiveActionMenuId(null);
                            }}
                            className="p-1.5 bg-white hover:bg-slate-100/80 text-slate-800 hover:text-black transition flex items-center justify-center cursor-pointer border-r border-slate-200"
                            title="Créer un Modèle (Template) pour cette famille"
                          >
                            <CategoryPlusIcon className="w-3.5 h-3.5 text-slate-900" />
                          </button>

                          {/* 3-dots Toggle Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionMenuId(activeActionMenuId === f.id_family ? null : f.id_family);
                            }}
                            className={`p-1.5 hover:bg-slate-100 transition cursor-pointer ${
                              activeActionMenuId === f.id_family
                                ? 'bg-slate-100 text-cyan-700 font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Actions et options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Popover Action Menu Card */}
                        {activeActionMenuId === f.id_family && (
                          <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-1.5 text-left animate-in fade-in slide-in-from-top-2 duration-150 space-y-0.5">
                            <div className="px-3 py-2 border-b border-slate-100 mb-1 bg-slate-50/80 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Famille Machine
                              </span>
                              <span className="font-mono text-xs font-bold text-cyan-700 block truncate">
                                {f.id_family} • {f.libelle}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuId(null);
                                if (onQuickCreateTemplate) {
                                  onQuickCreateTemplate(f.id_family);
                                } else if (onNavigateToTemplatesFiltered) {
                                  onNavigateToTemplatesFiltered(f.id_family);
                                }
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                            >
                              <CategoryPlusIcon className="w-3.5 h-3.5 text-amber-600" />
                              <span>Créer un template ({f.id_family})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuId(null);
                                onNavigateToTemplatesFiltered(f.id_family);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                            >
                              <CategoryIcon className="w-3.5 h-3.5 text-cyan-600" />
                              <span>Voir les templates ({tCount})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuId(null);
                                onNavigateToMachinesByFamily(f.id_family);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                            >
                              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Filtrer les machines ({mCount})</span>
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuId(null);
                                setToEdit({ ...f });
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Modifier cette famille</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuId(null);
                                setToDelete(f);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Supprimer cette famille</span>
                            </button>
                          </div>
                        )}
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
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Nouvelle Famille de Machine
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Créez une catégorie principale de machine (ex: FAM-HYD).
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <SequentialCodePicker
                  prefix="FAM-"
                  currentCode={form.id_family}
                  onChangeCode={(newCode) => setForm((prev) => ({ ...prev, id_family: newCode }))}
                  autoGeneratedCode={autoFamilyId}
                  takenNumbers={takenFamilyNumbers}
                  label="ID Famille (ex: FAM-01)"
                  helperText="Code séquentiel de la famille avec choix libre du numéro"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Libellé de la Famille
                </label>
                <input
                  type="text"
                  placeholder="Hydraulique & Pressurisation..."
                  value={form.libelle}
                  onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                  className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  required
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
      )}

      {toEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Modifier Famille</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateFamily(toEdit.id_family, toEdit);
                setToEdit(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-500">ID Famille</label>
                <input
                  type="text"
                  value={toEdit.id_family}
                  disabled
                  className="mt-1 w-full h-10 px-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-mono"
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
      )}
      {toDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="w-8 h-8 text-rose-600 mb-2" />
              <h3 className="font-bold text-lg text-slate-900">Supprimer la famille ?</h3>
            </div>
            <p className="text-sm text-center text-slate-600">
              Confirmez-vous la suppression de <b>{toDelete.libelle}</b> ?
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
                  onDeleteFamily(toDelete.id_family);
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

      {/* Excel Formulas Modal */}
      {showFormulasModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Formules Excel — Familles de Machines</h3>
                  <p className="text-xs text-slate-500">Formules miroir de l'onglet Familles (Excel GMAO)</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulasModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formule D — Nb Templates</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">COUNTIF</span>
                </div>
                <div className="font-mono text-xs text-cyan-800 font-bold bg-white p-2 rounded-lg border border-cyan-100">
                  =COUNTIF(Templates!C:C, [@id_family])
                </div>
                <p className="text-[11px] text-slate-500">Compte le nombre total de modèles/templates rattachés à cette famille de machines.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formule E — Nb Machines Total</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">COUNTIF</span>
                </div>
                <div className="font-mono text-xs text-emerald-800 font-bold bg-white p-2 rounded-lg border border-emerald-100">
                  =COUNTIF(Machines!D:D, [@id_family])
                </div>
                <p className="text-[11px] text-slate-500">Compte tous les équipements physiques actifs dans le parc enregistrés sous cette catégorie.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formule F — Machines En Service</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">COUNTIFS</span>
                </div>
                <div className="font-mono text-xs text-blue-800 font-bold bg-white p-2 rounded-lg border border-blue-100">
                  =COUNTIFS(Machines!D:D, [@id_family], Machines!H:H, "En service")
                </div>
                <p className="text-[11px] text-slate-500">Calcule le nombre de machines actuellement opérationnelles sous cette famille.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Modèle GMAO_Light_Template_V2</span>
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
