import { useState, useRef, useMemo, useEffect } from 'react';
import AnimatedPage from '../../components/common/AnimatedPage';
import Action3DButton from '../../components/common/Action3DButton';
import FormulasModalButton from '../../components/common/FormulasModalButton';
import { SpokeIcon } from '../../components/common/icons/SpokeIcon';
import { CubeIcon } from '../../components/common/icons/CubeIcon';
import { CubePlusIcon } from '../../components/common/icons/CubePlusIcon';
import CustomSelect from '../../components/common/CustomSelect';
import {
  Search,
  ArrowRight,
  Trash2,
  Edit2,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  RotateCcw,
  X,
  Tag,
  Calculator,
  MoreVertical,
  FileSpreadsheet,
  Boxes,
  FolderTree,
} from 'lucide-react';

export default function CompFamilyView({
  compGroups = [],
  compFamilies = [],
  compTemplates = [],
  warehouseItems = [],
  groupFilter = '',
  setGroupFilter,
  onAddCompFamily,
  onUpdateCompFamily,
  onDeleteCompFamily,
  onNavigateToCompTemplates,
  onQuickCreateCompTemplate,
  onNavigateToEntrepotByFamily,
  onNavigateToCompGroups,
}) {
  const [search, setSearch] = useState('');
  const [internalGroupFilter, setInternalGroupFilter] = useState('');
  const activeGroupFilter = groupFilter !== undefined && setGroupFilter ? groupFilter : internalGroupFilter;
  const setActiveGroupFilter = setGroupFilter || setInternalGroupFilter;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFormulasModal, setShowFormulasModal] = useState(false);
  const [toEdit, setToEdit] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [sortField, setSortField] = useState('id_family');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.action-menu-container')) {
        setActiveActionMenuId(null);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form state
  const [form, setForm] = useState({
    id_family: '',
    id_groupe: '',
    libelle: '',
    componentCode: '',
  });

  // Filter
  const filtered = useMemo(() => {
    return compFamilies.filter((f) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        f.id_family?.toLowerCase().includes(q) ||
        f.libelle?.toLowerCase().includes(q) ||
        f.componentCode?.toLowerCase().includes(q) ||
        f.id_groupe?.toLowerCase().includes(q);

      const matchGroup =
        !activeGroupFilter ||
        activeGroupFilter === 'ALL' ||
        f.id_groupe === activeGroupFilter ||
        compGroups.find((g) => (g.id === activeGroupFilter || g.code === activeGroupFilter))?.code === f.id_groupe ||
        compGroups.find((g) => (g.id === activeGroupFilter || g.code === activeGroupFilter))?.id_groupe === f.id_groupe;

      return matchSearch && matchGroup;
    });
  }, [compFamilies, search, activeGroupFilter, compGroups]);

  // Sort
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
      padded.push({ __isEmptyPlaceholder: true, id_family: `empty-${i}` });
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
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition shrink-0" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-teal-700 shrink-0 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-teal-700 shrink-0 font-bold" />
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id_family || !form.libelle) return;
    const cleanPrefix = (form.componentCode || form.id_family.replace(/^FAM-?/i, ''))
      .toUpperCase()
      .trim();

    onAddCompFamily({
      ...form,
      id_family: form.id_family.trim().toUpperCase(),
      componentCode: cleanPrefix,
    });
    setForm({ id_family: '', libelle: '', componentCode: '' });
    setShowAddModal(false);
  };

  const handleExportExcel = () => {
    const headers = ['ID Type', 'Libellé Type', 'Préfixe Code', 'Nb Désignations', 'Nb Articles'];
    const rows = filtered.map((f) => [
      f.id_family || '',
      f.libelle || '',
      f.componentCode || '',
      compTemplates.filter((t) => t.id_family === f.id_family).length,
      warehouseItems.filter((i) => i.id_family === f.id_family).length,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `types_composants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatedPage className="space-y-4">
      {/* Top Banner (BDR Light GMAO Header Card with 3D Tactile Elevation) */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden group/header">
        {/* Subtle Ambient Gradient Background Highlight */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover/header:bg-amber-500/10 transition-colors duration-500" />

        <div className="min-w-0 flex-1 flex items-start sm:items-center gap-3.5 relative">
          {/* 3D Elevated Page Badge Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/90 shadow-[0_4px_12px_rgba(245,158,11,0.12)] flex items-center justify-center text-amber-700 group-hover/header:scale-105 group-hover/header:border-amber-400/80 transition-all duration-300 shrink-0">
            <SpokeIcon className="w-6 h-6 text-amber-700 transition-transform duration-300 group-hover/header:scale-110" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Types de Composants d&apos;Entrepôt
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Nomenclature des types de sous-systèmes et ensembles stockés en entrepôt (Moteurs, Pompes, Réducteurs...).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative">
          <FormulasModalButton
            onClick={() => setShowFormulasModal(true)}
            title="Formules Excel (Types Composants)"
          />

          <Action3DButton
            variant="circle"
            color="amber"
            icon={SpokeIcon}
            showAddBadge={true}
            onClick={() => {
              const nextIdx = compFamilies.length + 1;
              setForm({
                id_family: `FAM-CMP${String(nextIdx).padStart(2, '0')}`,
                libelle: '',
                componentCode: `CMP${nextIdx}`,
              });
              setShowAddModal(true);
            }}
            title="Nouveau Type"
          />
        </div>
      </div>

      {/* Filter Bar */}
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
                  {filtered.length} / {compFamilies.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Référentiel des Types de Composants Entrepôt • Colonnes A → E
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
            {(search || (activeGroupFilter && activeGroupFilter !== 'ALL') || sortField !== 'id_family' || sortOrder !== 'asc') && (
              <button
                onClick={() => {
                  setSearch('');
                  setActiveGroupFilter('');
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

        {/* Active Group Filter Notification Banner */}
        {activeGroupFilter && activeGroupFilter !== 'ALL' && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50/90 border border-indigo-200/90 rounded-2xl text-xs text-indigo-900 animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Boxes className="w-3.5 h-3.5" />
              </span>
              <span>
                Affichage filtré sur le Groupe : <strong className="font-mono font-bold text-indigo-950 px-1.5 py-0.5 rounded bg-white border border-indigo-200">{activeGroupFilter}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateToCompGroups && (
                <button
                  onClick={() => onNavigateToCompGroups()}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:bg-white/80 rounded-lg transition cursor-pointer flex items-center gap-1 border border-indigo-200/60"
                >
                  <FolderTree className="w-3 h-3" />
                  <span>Tous les Groupes</span>
                </button>
              )}
              <button
                onClick={() => setActiveGroupFilter('')}
                className="p-1 hover:bg-indigo-200/60 text-indigo-600 hover:text-indigo-900 rounded-full transition cursor-pointer"
                title="Supprimer ce filtre"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Search */}
          <div className="relative w-full">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                RECHERCHE LIBRE
              </label>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                ID + Libellé
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs pointer-events-none z-10">
                <Search className="w-3 h-3" />
              </span>
              <input
                type="text"
                placeholder="Rechercher famille, code, groupe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Groupe Parent (Niveau 1) CustomSelect */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                GROUPE COMPOSANT (NIV 1)
              </label>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                Hiérarchie
              </span>
            </div>
            <CustomSelect
              value={activeGroupFilter || 'ALL'}
              onChange={(val) => setActiveGroupFilter(val === 'ALL' ? '' : val)}
              prefixIcon={
                <span className="w-5 h-5 rounded-md bg-indigo-100 border border-indigo-300/80 flex items-center justify-center text-indigo-700 shadow-2xs shrink-0">
                  <Boxes className="w-3 h-3" />
                </span>
              }
              options={[
                {
                  value: 'ALL',
                  label: `Tous les Groupes (${compGroups.length})`,
                  badge: `${compFamilies.length}`,
                  badgeColor: 'bg-slate-100 text-slate-700 font-bold',
                },
                ...compGroups.map((g, gIdx) => {
                  const count = compFamilies.filter((f) => f.id_groupe === g.code || f.id_groupe === g.id).length;
                  return {
                    value: g.code || g.id || `grp-${gIdx}`,
                    label: `${g.code || g.id} - ${g.name || g.libelle}`,
                    badge: `${count}`,
                    badgeColor: 'bg-indigo-50 text-indigo-800 font-bold',
                  };
                }),
              ]}
            />
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
                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
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
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>ID Type (A)</span>
                    {sortField === 'id_family' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-teal-600 shrink-0" />
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
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Libellé Type (B)</span>
                    {sortField === 'libelle' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ))}
                  </button>

                  <button
                    onClick={() => {
                      if (sortField === 'componentCode') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('componentCode');
                        setSortOrder('asc');
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                      sortField === 'componentCode'
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Code Composant (C)</span>
                    {sortField === 'componentCode' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-teal-600 shrink-0" />
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
              <Search className="w-3 h-3 text-teal-600" />
              Recherche: &quot;{search}&quot;
              <button
                onClick={() => setSearch('')}
                className="hover:bg-teal-200/60 p-0.5 rounded-full transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
          <div className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
            <SpokeIcon className="w-4 h-4 text-teal-600" />
            <span>Tableau Types de Composants (Entrepôt)</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 hidden lg:block">
            id_family | libelle | componentCode | templates | warehouse_items
          </div>
        </div>

        <div className="max-h-[62vh] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 z-10 shadow-2xs select-none">
              <tr>
                <th className="py-3 px-3 text-center w-12 text-slate-500 font-mono text-[10px] bg-slate-200/60 border-r border-slate-200 shrink-0">
                  N°
                </th>

                {/* Col 1: ID TYPE (A) */}
                <th
                  onClick={() => handleSort('id_family')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                  title="Cliquer pour trier par ID Famille"
                >
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>ID FAMILLE</span>
                    <span className="text-slate-400 font-normal text-[10px]">(A)</span>
                    {renderSortIcon('id_family')}
                  </div>
                </th>

                {/* Col: GROUPE COMPOSANT (NIV 1) */}
                <th
                  onClick={() => handleSort('id_groupe')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                  title="Cliquer pour trier par Groupe Parent"
                >
                  <div className="flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>GROUPE (NIV 1)</span>
                    {renderSortIcon('id_groupe')}
                  </div>
                </th>

                {/* Col 2: LIBELLÉ FAMILLE COMPOSANT (B) */}
                <th
                  onClick={() => handleSort('libelle')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group min-w-[200px]"
                  title="Cliquer pour trier par Libellé"
                >
                  <div className="flex items-center gap-1.5">
                    <SpokeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>LIBELLÉ FAMILLE</span>
                    <span className="text-slate-400 font-normal text-[10px]">(B)</span>
                    {renderSortIcon('libelle')}
                  </div>
                </th>

                {/* Col 3: PRÉFIXE CODE (C) */}
                <th
                  onClick={() => handleSort('componentCode')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                  title="Cliquer pour trier par Préfixe Code"
                >
                  <div className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>PRÉFIXE CODE</span>
                    <span className="text-slate-400 font-normal text-[10px]">(C)</span>
                    {renderSortIcon('componentCode')}
                  </div>
                </th>

                {/* Col 4: DÉSIGNATIONS COMPOSANTS (D) */}
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <CubeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>DÉSIGNATIONS COMPOSANTS</span>
                    <span className="text-slate-400 font-normal text-[10px]">(D)</span>
                  </div>
                </th>

                {/* Col 5: COMPOSANTS EN ENTREPÔT (E) */}
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>COMPOSANTS EN ENTREPÔT</span>
                    <span className="text-slate-400 font-normal text-[10px]">(E)</span>
                  </div>
                </th>

                {/* Col 6: Action (•••) */}
                <th className="py-3 px-4 font-bold text-slate-400 tracking-widest text-center select-none" title="Actions & Options">
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
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-300 bg-slate-100/40 border-r border-slate-200/80 shrink-0">
                        {rowNum}
                      </td>
                      <td colSpan={7} className="py-3 px-4 text-center text-slate-300 font-mono text-[11px]">
                        —
                      </td>
                    </tr>
                  );
                }
                  const tCount = compTemplates.filter((t) => t.id_family === f.id_family).length;
                  const cCount = warehouseItems.filter(
                    (w) =>
                      (w.nature === 'COMPONENT' || w.nature === 'PARTIE') &&
                      w.id_family === f.id_family
                  ).length;

                  return (
                    <tr
                      key={f.id_family}
                      className="even:bg-slate-50/80 odd:bg-white hover:bg-slate-100/70 border-b border-slate-200/70 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-mono text-[11px] font-bold text-slate-400 bg-slate-100/40 border-r border-slate-200/80 shrink-0">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {f.id_family}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {f.id_groupe ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGroupFilter(f.id_groupe);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition cursor-pointer shadow-2xs"
                            title={`Filtrer sur le groupe ${f.id_groupe}`}
                          >
                            <Boxes className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>{f.id_groupe}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 text-[13px]">
                        {f.libelle}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {f.componentCode || f.id_family.replace(/^FAM-?/i, '')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            onNavigateToCompTemplates && onNavigateToCompTemplates(f.id_family)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-xs font-semibold transition group shadow-2xs cursor-pointer"
                          title="Voir les désignations de ce type de composants"
                        >
                          <CubeIcon className="w-3.5 h-3.5 text-teal-600" />
                          <span>{tCount} désignations</span>
                          <ArrowRight className="w-3 h-3 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            onNavigateToEntrepotByFamily &&
                            onNavigateToEntrepotByFamily(f.id_family)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition group shadow-2xs cursor-pointer"
                          title="Filtrer Entrepôt sur ce type de composants"
                        >
                          <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{cCount} composants</span>
                          <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="relative inline-flex items-center justify-center action-menu-container">
                          <div className="inline-flex rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                            {/* Quick Action Button: Create Template for this Family */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onQuickCreateCompTemplate) {
                                  onQuickCreateCompTemplate(f.id_family);
                                } else if (onNavigateToCompTemplates) {
                                  onNavigateToCompTemplates(f.id_family);
                                }
                                setActiveActionMenuId(null);
                              }}
                              className="p-1.5 bg-white hover:bg-slate-100/80 text-slate-800 hover:text-black transition flex items-center justify-center cursor-pointer border-r border-slate-200"
                              title="Créer une Désignation rapide pour ce Type"
                            >
                              <CubePlusIcon className="w-3.5 h-3.5 text-slate-900" />
                            </button>

                            {/* 3-dots Toggle Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuId(activeActionMenuId === f.id_family ? null : f.id_family);
                              }}
                              className={`p-1.5 hover:bg-slate-100 transition cursor-pointer ${
                                activeActionMenuId === f.id_family
                                  ? 'bg-slate-100 text-teal-700 font-bold'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                              title="Actions et options de la famille"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Popover Action Menu Card */}
                          {activeActionMenuId === f.id_family && (
                            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-1.5 text-left animate-in fade-in slide-in-from-top-2 duration-150 space-y-0.5">
                              <div className="px-3 py-2 border-b border-slate-100 mb-1 bg-slate-50/80 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Actions Type Composant
                                </span>
                                <span className="text-xs font-mono font-bold text-teal-700 truncate block">
                                  {f.id_family} — {f.libelle}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  if (onQuickCreateCompTemplate) {
                                    onQuickCreateCompTemplate(f.id_family);
                                  } else if (onNavigateToCompTemplates) {
                                    onNavigateToCompTemplates(f.id_family);
                                  }
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition flex items-center justify-between cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <CubePlusIcon className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                  <span>Nouvelle Désignation Rapide</span>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200/60">
                                  +
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  if (onNavigateToCompTemplates) {
                                    onNavigateToCompTemplates(f.id_family);
                                  }
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer group"
                              >
                                <CubeIcon className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition-transform" />
                                <span>Voir Désignations ({tCount})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  if (onNavigateToEntrepotByFamily) {
                                    onNavigateToEntrepotByFamily(f.id_family);
                                  }
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer group"
                              >
                                <Warehouse className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                <span>Filtrer l&apos;entrepôt ({cCount})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  setToEdit({ ...f });
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                                <span>Modifier ce type</span>
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
                                <span>Supprimer ce type</span>
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
                    ? 'bg-white text-teal-800 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out border border-slate-200/50'
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
            <b className="text-slate-900">{Math.min(startIndex + effectivePageSize, totalItems)}</b> sur{' '}
            <b className="text-slate-900">{totalItems}</b>
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Nouveau Type de Composant
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Type d&apos;ensembles et sous-systèmes stockés en entrepôt.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  ID Type (Clé Unique)
                </label>
                <input
                  type="text"
                  required
                  value={form.id_family}
                  onChange={(e) => setForm({ ...form, id_family: e.target.value })}
                  placeholder="ex: FAM-MOT, FAM-POM, FAM-RED"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Groupe Parent (Niveau 1)
                </label>
                <select
                  value={form.id_groupe || ''}
                  onChange={(e) => setForm({ ...form, id_groupe: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Aucun Groupe Parent --</option>
                  {compGroups.map((g) => (
                    <option key={g.id || g.code} value={g.code || g.id}>
                      {g.code || g.id} - {g.name || g.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Libellé / Désignation du Type
                </label>
                <input
                  type="text"
                  required
                  value={form.libelle}
                  onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                  placeholder="ex: Moteurs & Motoréducteurs"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Préfixe Code Composant (Optionnel)
                </label>
                <input
                  type="text"
                  value={form.componentCode}
                  onChange={(e) => setForm({ ...form, componentCode: e.target.value })}
                  placeholder="ex: MOT, POM, RED"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Utilisé pour générer les codes automatiques en entrepôt (ex: MOT-01, MOT-02...).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {toEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Modifier Type de Composant
            </h3>
            <p className="text-xs font-mono text-teal-700 mb-4">{toEdit.id_family}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateCompFamily(toEdit.id_family, toEdit);
                setToEdit(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Groupe Parent (Niveau 1)
                </label>
                <select
                  value={toEdit.id_groupe || ''}
                  onChange={(e) => setToEdit({ ...toEdit, id_groupe: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Aucun Groupe Parent --</option>
                  {compGroups.map((g) => (
                    <option key={g.id || g.code} value={g.code || g.id}>
                      {g.code || g.id} - {g.name || g.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Libellé
                </label>
                <input
                  type="text"
                  required
                  value={toEdit.libelle || ''}
                  onChange={(e) => setToEdit({ ...toEdit, libelle: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Préfixe Code Composant
                </label>
                <input
                  type="text"
                  value={toEdit.componentCode || ''}
                  onChange={(e) =>
                    setToEdit({
                      ...toEdit,
                      componentCode: e.target.value.toUpperCase().trim(),
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setToEdit(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {toDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Supprimer ce Type de Composant ?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong className="text-slate-900 font-mono">{toDelete.id_family}</strong> (
              {toDelete.libelle}) ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteCompFamily(toDelete.id_family);
                  setToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer"
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
                  <h3 className="font-black text-slate-900 text-base">Formules Excel — Types de Composants</h3>
                  <p className="text-xs text-slate-500">Formules miroir de l'onglet Comp_Families (GMAO)</p>
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
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formule A — Identifiant Type Composant</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">CLE_PRIMAIRE</span>
                </div>
                <div className="font-mono text-xs text-teal-800 font-bold bg-white p-2 rounded-lg border border-teal-100">
                  =[@id_family] (ex: FAM-CMP01)
                </div>
                <p className="text-[11px] text-slate-500">Clé primaire unique de la famille de composants d'entrepôt.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formule B — Nombre de Désignations Associés</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">COUNTIF</span>
                </div>
                <div className="font-mono text-xs text-cyan-800 font-bold bg-white p-2 rounded-lg border border-cyan-100">
                  =COUNTIF(Comp_Templates!C:C, [@id_family])
                </div>
                <p className="text-[11px] text-slate-500">Compte les désignations de composants rattachés à ce type.</p>
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
