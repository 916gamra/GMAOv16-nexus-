import {  useState, useRef, useMemo, useEffect  } from 'react';
import AnimatedPage from '../../components/common/AnimatedPage';
import Action3DButton from '../../components/common/Action3DButton';
import FormulasModalButton from '../../components/common/FormulasModalButton';
import CustomSelect from '../../components/common/CustomSelect';
import PartInfoIcon from '../../components/common/icons/PartInfoIcon';
import { LayersIcon } from '../../components/common/icons/LayersIcon';
import {
  Search,
  Tag,
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
  MapPin,
  AlertTriangle,
  Calculator,
  MoreVertical,
  FileSpreadsheet,
} from 'lucide-react';

export default function PartDesignationView({
  partDesignations = [],
  partTypes = [],
  warehouseItems = [],
  partDesignationTypeFilter = '',
  setPartDesignationTypeFilter,
  onAddPartDesignation,
  onUpdatePartDesignation,
  onDeletePartDesignation,
  onNavigateToPartTypes,
  onNavigateToEntrepotByPart,
  _onNavigateToQuickSortie,
}) {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFormulasModal, setShowFormulasModal] = useState(false);
  const [toEdit, setToEdit] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [sortField, setSortField] = useState('ref');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-menu-container')) {
        setActiveActionMenuId(null);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form state
  const [form, setForm] = useState({
    id_part: '',
    ref: '',
    designation: '',
    id_type: '',
    seuil: 5,
    emplacement: 'E-MAG-RAYON-A01',
  });

  // Filter
  const filtered = useMemo(() => {
    return partDesignations.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        d.ref?.toLowerCase().includes(q) ||
        d.id_part?.toLowerCase().includes(q) ||
        d.designation?.toLowerCase().includes(q) ||
        d.id_type?.toLowerCase().includes(q) ||
        d.emplacement?.toLowerCase().includes(q);

      const matchType = !partDesignationTypeFilter || d.id_type === partDesignationTypeFilter;
      return matchSearch && matchType;
    });
  }, [partDesignations, search, partDesignationTypeFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';
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
      padded.push({ __isEmptyPlaceholder: true, ref: `empty-${i}` });
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

  const handleExportExcel = () => {
    const headers = ['Référence', 'Désignation Part', 'Type Parent', 'Stock Actuel', 'Emplacement'];
    const rows = filtered.map((d) => [
      d.ref || '',
      d.designation || '',
      d.id_type || '',
      d.current_stock != null ? d.current_stock : '',
      d.emplacement || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `designations_parts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ref || !form.designation || !form.id_type) return;
    const cleanRef = form.ref.trim().toUpperCase();
    onAddPartDesignation({
      ...form,
      id_part: cleanRef,
      ref: cleanRef,
      seuil: Number(form.seuil) || 0,
    });
    setForm({
      id_part: '',
      ref: '',
      designation: '',
      id_type: '',
      seuil: 5,
      emplacement: 'E-MAG-RAYON-A01',
    });
    setShowAddModal(false);
  };

  return (
    <AnimatedPage className="space-y-4">
      {/* Top Banner (BDR Light GMAO Header Card with 3D Tactile Elevation) */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden group/header">
        {/* Subtle Ambient Gradient Background Highlight */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover/header:bg-blue-500/10 transition-colors duration-500" />

        <div className="min-w-0 flex-1 flex items-start sm:items-center gap-3.5 relative">
          {/* 3D Elevated Page Badge Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200/90 shadow-[0_4px_12px_rgba(59,130,246,0.12)] flex items-center justify-center text-blue-700 group-hover/header:scale-105 group-hover/header:border-blue-400/80 transition-all duration-300 shrink-0">
            <PartInfoIcon className="w-6 h-6 text-blue-700 transition-transform duration-300 group-hover/header:scale-110" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Désignations de Parts d&apos;Entrepôt
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Catalogue des désignations et spécifications de pièces détachées rattachées aux Types de Parts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative">
          <FormulasModalButton
            onClick={() => setShowFormulasModal(true)}
            title="Formules Excel (Désignations Parts)"
          />

          <Action3DButton
            variant="circle"
            color="blue"
            icon={PartInfoIcon}
            showAddBadge={true}
            onClick={() => {
              const nextIdx = partDesignations.length + 1;
              setForm({
                id_part: `PRT-${String(nextIdx).padStart(2, '0')}`,
                ref: `PRT-${String(nextIdx).padStart(2, '0')}`,
                designation: '',
                id_type: partTypes[0]?.id_type || '',
                seuil: 5,
                emplacement: 'E-MAG-RAYON-A01',
              });
              setShowAddModal(true);
            }}
            title="Nouvelle Désignation Part"
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
                  {filtered.length} / {partDesignations.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Référentiel des Désignations de Pièces Entrepôt • Colonnes A → F
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
            {(search || partDesignationTypeFilter || sortField !== 'ref' || sortOrder !== 'asc') && (
              <button
                onClick={() => {
                  setSearch('');
                  setPartDesignationTypeFilter && setPartDesignationTypeFilter('');
                  setSortField('ref');
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Search */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                RECHERCHE LIBRE
              </label>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                Tous champs
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs pointer-events-none z-10">
                <Search className="w-3 h-3" />
              </span>
              <input
                type="text"
                placeholder="Rechercher par référence, désignation, emplacement..."
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

          {/* Type Filter CustomSelect */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                TYPE DE PART
              </label>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                Col. C
              </span>
            </div>
            <CustomSelect
              prefixIcon={
                <span className="w-5 h-5 rounded-md bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
                  <Tag className="w-3 h-3" />
                </span>
              }
              value={partDesignationTypeFilter || 'ALL'}
              onChange={(val) =>
                setPartDesignationTypeFilter && setPartDesignationTypeFilter(val === 'ALL' ? '' : val)
              }
              options={[
                {
                  value: 'ALL',
                  label: `Tous les types de parts (${partTypes.length})`,
                  badge: `${partDesignations.length}`,
                  badgeColor: 'bg-slate-100 text-slate-700 font-bold',
                },
                ...partTypes.map((t) => {
                  const count = partDesignations.filter((d) => d.id_type === t.id_type).length;
                  return {
                    value: t.id_type,
                    label: `${t.id_type} - ${t.libelle}`,
                    badge: `${count}`,
                    badgeColor: 'bg-amber-50 text-amber-800 font-bold',
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
                showSortMenu || sortField !== 'ref' || sortOrder !== 'asc'
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
                      if (sortField === 'ref') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('ref');
                        setSortOrder('asc');
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                      sortField === 'ref'
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Référence / Code (A)</span>
                    {sortField === 'ref' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ))}
                  </button>

                  <button
                    onClick={() => {
                      if (sortField === 'designation') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('designation');
                        setSortOrder('asc');
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                      sortField === 'designation'
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Désignation / Libellé (B)</span>
                    {sortField === 'designation' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ))}
                  </button>

                  <button
                    onClick={() => {
                      if (sortField === 'id_type') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('id_type');
                        setSortOrder('asc');
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                      sortField === 'id_type'
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Type de Part (C)</span>
                    {sortField === 'id_type' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ))}
                  </button>

                  <button
                    onClick={() => {
                      if (sortField === 'seuil') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('seuil');
                        setSortOrder('asc');
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                      sortField === 'seuil'
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Seuil d'Alerte (D)</span>
                    {sortField === 'seuil' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ))}
                  </button>

                  <button
                    onClick={() => {
                      if (sortField === 'emplacement') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('emplacement');
                        setSortOrder('asc');
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                      sortField === 'emplacement'
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Emplacement (E)</span>
                    {sortField === 'emplacement' &&
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
        {(search || partDesignationTypeFilter) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtres actifs :</span>
            {search && (
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
            )}
            {partDesignationTypeFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
                <Tag className="w-3 h-3 text-cyan-600" />
                Type: {partDesignationTypeFilter}
                <button
                  onClick={() => setPartDesignationTypeFilter && setPartDesignationTypeFilter('')}
                  className="hover:bg-cyan-200/60 p-0.5 rounded-full transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
          <div className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
            <PartInfoIcon className="w-4 h-4 text-blue-600" />
            <span>Tableau Désignations de Parts (Entrepôt)</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 hidden lg:block">
            ref | designation | id_type (part) | seuil | emplacement | warehouse_items
          </div>
        </div>

        <div className="max-h-[62vh] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 shadow-2xs select-none">
              <tr>
                <th className="py-3 px-3 text-center w-12 text-slate-500 font-mono text-[10px] bg-slate-200/60 border-r border-slate-200 shrink-0">
                  N°
                </th>

                {/* RÉFÉRENCE / CODE (A) */}
                <th
                  onClick={() => handleSort('ref')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                  title="Cliquer pour trier par Référence / Code"
                >
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>REF / CODE</span>
                    <span className="text-slate-400 font-normal text-[10px]">(A)</span>
                    {renderSortIcon('ref')}
                  </div>
                </th>

                {/* DÉSIGNATION DE LA PIÈCE (B) */}
                <th
                  onClick={() => handleSort('designation')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                  title="Cliquer pour trier par Désignation"
                >
                  <div className="flex items-center gap-1.5">
                    <PartInfoIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>DÉSIGNATION DE LA PIÈCE</span>
                    <span className="text-slate-400 font-normal text-[10px]">(B)</span>
                    {renderSortIcon('designation')}
                  </div>
                </th>

                {/* TYPE DE PART PARENT (C) */}
                <th
                  onClick={() => handleSort('id_type')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                  title="Cliquer pour trier par Type"
                >
                  <div className="flex items-center gap-1.5">
                    <LayersIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>TYPE DE PART PARENT</span>
                    <span className="text-slate-400 font-normal text-[10px]">(C)</span>
                    {renderSortIcon('id_type')}
                  </div>
                </th>

                {/* SEUIL D'ALERTE (D) */}
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>SEUIL D&apos;ALERTE</span>
                    <span className="text-slate-400 font-normal text-[10px]">(D)</span>
                  </div>
                </th>

                {/* EMPLACEMENT (E) */}
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>EMPLACEMENT</span>
                    <span className="text-slate-400 font-normal text-[10px]">(E)</span>
                  </div>
                </th>

                {/* PARTS EN ENTREPÔT (F) */}
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>PARTS EN ENTREPÔT</span>
                    <span className="text-slate-400 font-normal text-[10px]">(F)</span>
                  </div>
                </th>

                <th className="py-3 px-4 text-center select-none font-bold text-slate-400 tracking-widest" title="Actions (Voir Entrepôt, Modifier, Supprimer)">
                  •••
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {displayedData.map((d, idx) => {
                  const rowNum = startIndex + idx + 1;
                  if (d.__isEmptyPlaceholder) {
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

                  const typeObj = partTypes.find((t) => t.id_type === d.id_type);
                  const pCount = warehouseItems.filter(
                    (w) =>
                      (w.nature === 'PART' || w.nature === 'COMPOSANT') &&
                      (w.id_warehouse_item === d.ref ||
                        w.ref === d.ref ||
                        w.designation === d.designation)
                  ).length;

                  return (
                    <tr
                      key={`part-desig-row-${d.ref || d.id_part || idx}-${idx}`}
                      className="even:bg-slate-50/80 odd:bg-white hover:bg-slate-100/70 border-b border-slate-200/70 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-mono text-[11px] font-bold text-slate-400 bg-slate-100/40 border-r border-slate-200/80 shrink-0">
                        {rowNum}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {d.ref || d.id_part}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 text-[13px]">
                        <div className="flex items-center gap-2">
                          <PartInfoIcon className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{d.designation}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            onNavigateToPartTypes && onNavigateToPartTypes(d.id_type)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold transition cursor-pointer"
                          title="Voir le type de part parent"
                        >
                          <LayersIcon className="w-3 h-3 text-emerald-600" />
                          <span className="font-mono">{d.id_type}</span>
                          {typeObj && (
                            <span className="text-slate-500 font-normal">({typeObj.libelle})</span>
            )}
                        </button>

                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {d.seuil ?? 3}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-mono font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {d.emplacement || 'Non assigné'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            onNavigateToEntrepotByPart &&
                            onNavigateToEntrepotByPart(d.ref || d.id_part, d.id_type)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition group shadow-2xs cursor-pointer"
                          title="Filtrer Entrepôt sur cette désignation de part"
                        >
                          <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{pCount} parts</span>
                          <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="relative inline-flex items-center justify-center action-menu-container">
                          <div className="inline-flex rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                            {/* Quick Action: Filtrer l'entrepôt */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToEntrepotByPart) {
                                  onNavigateToEntrepotByPart(d.ref || d.id_part, d.id_type);
                                }
                                setActiveActionMenuId(null);
                              }}
                              className="p-1.5 bg-white hover:bg-slate-100/80 text-slate-800 hover:text-black transition flex items-center justify-center cursor-pointer border-r border-slate-200"
                              title="Filtrer l'entrepôt sur cette désignation"
                            >
                              <Warehouse className="w-3.5 h-3.5 text-slate-900" />
                            </button>

                            {/* 3-dots Toggle Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const rowKey = d.ref || d.id_part || `desig-${idx}`;
                                setActiveActionMenuId(activeActionMenuId === rowKey ? null : rowKey);
                              }}
                              className={`p-1.5 hover:bg-slate-100 transition cursor-pointer ${
                                activeActionMenuId === (d.ref || d.id_part || `desig-${idx}`)
                                  ? 'bg-slate-100 text-emerald-700 font-bold'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                              title="Actions et options de la désignation"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Popover Action Menu */}
                          {activeActionMenuId === (d.ref || d.id_part || `desig-${idx}`) && (
                            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150 text-left space-y-0.5">
                              <div className="px-3 py-2 border-b border-slate-100 mb-1 bg-slate-50/80 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Désignation de Part
                                </span>
                                <span className="text-xs font-mono font-bold text-emerald-700 truncate block">
                                  {d.ref || d.id_part} — {d.designation}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (onNavigateToEntrepotByPart) {
                                    onNavigateToEntrepotByPart(d.ref || d.id_part, d.id_type);
                                  }
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer group"
                              >
                                <Warehouse className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                <span>Filtrer l&apos;entrepôt sur cette désignation</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setToEdit({ ...d });
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                                <span>Modifier cette désignation</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setToDelete(d);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Supprimer cette désignation</span>
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
                    ? 'bg-white text-emerald-800 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out border border-slate-200/50'
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
              Nouvelle Désignation de Part
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Référence et description d&apos;une pièce détachée stockée en entrepôt.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Référence / Code Part (Clé Unique)
                </label>
                <input
                  type="text"
                  required
                  value={form.ref}
                  onChange={(e) => setForm({ ...form, ref: e.target.value })}
                  placeholder="ex: FIX-01, MEC-01, PNE-01"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Désignation de la Pièce
                </label>
                <input
                  type="text"
                  required
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="ex: Cheville Filetée Haute Résistance 12x100"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Type de Part Parent
                </label>
                <select
                  required
                  value={form.id_type}
                  onChange={(e) => setForm({ ...form, id_type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="">Sélectionnez un type de part...</option>
                  {partTypes.map((t) => (
                    <option key={t.id_type} value={t.id_type}>
                      {t.id_type} - {t.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Seuil d&apos;Alerte
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.seuil}
                    onChange={(e) => setForm({ ...form, seuil: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Emplacement Entrepôt
                  </label>
                  <input
                    type="text"
                    value={form.emplacement}
                    onChange={(e) => setForm({ ...form, emplacement: e.target.value })}
                    placeholder="ex: E-MAG-RAYON-C01"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
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
              Modifier Désignation de Part
            </h3>
            <p className="text-xs font-mono text-teal-700 mb-4">{toEdit.ref || toEdit.id_part}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdatePartDesignation(toEdit.ref || toEdit.id_part, toEdit);
                setToEdit(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Désignation
                </label>
                <input
                  type="text"
                  required
                  value={toEdit.designation || ''}
                  onChange={(e) => setToEdit({ ...toEdit, designation: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Type de Part Parent
                </label>
                <select
                  required
                  value={toEdit.id_type || ''}
                  onChange={(e) => setToEdit({ ...toEdit, id_type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {partTypes.map((t) => (
                    <option key={t.id_type} value={t.id_type}>
                      {t.id_type} - {t.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Seuil d&apos;Alerte
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={toEdit.seuil ?? 3}
                    onChange={(e) =>
                      setToEdit({ ...toEdit, seuil: Number(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Emplacement
                  </label>
                  <input
                    type="text"
                    value={toEdit.emplacement || ''}
                    onChange={(e) => setToEdit({ ...toEdit, emplacement: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
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
              Supprimer cette Désignation de Part ?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong className="text-slate-900 font-mono">
                {toDelete.ref || toDelete.id_part}
              </strong>{' '}
              ({toDelete.designation}) ?
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
                  onDeletePartDesignation(toDelete.ref || toDelete.id_part);
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
                  <h3 className="font-black text-slate-900 text-base">Formules Excel — Désignations de Parts (Entrepôt)</h3>
                  <p className="text-xs text-slate-500">Formules miroir de l'onglet Part_Designations (GMAO)</p>
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
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formule B — Référence Pièce (ID Part)</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">REF_UNIOUE</span>
                </div>
                <div className="font-mono text-xs text-teal-800 font-bold bg-white p-2 rounded-lg border border-teal-100">
                  =[@id_part] (ex: PRT-01)
                </div>
                <p className="text-[11px] text-slate-500">Identifiant et référence unique de la pièce dans l'entrepôt.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formule D — Liaison Type de Part</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">LIAISON</span>
                </div>
                <div className="font-mono text-xs text-cyan-800 font-bold bg-white p-2 rounded-lg border border-cyan-100">
                  =[@id_type] (Clé étrangère vers Part_Types)
                </div>
                <p className="text-[11px] text-slate-500">Rattache la désignation au type de part parent.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formule G — Stock Entrepôt Associé</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">COUNTIF</span>
                </div>
                <div className="font-mono text-xs text-emerald-800 font-bold bg-white p-2 rounded-lg border border-emerald-100">
                  =COUNTIF(Entrepot_Items!C:C, [@ref])
                </div>
                <p className="text-[11px] text-slate-500">Compte les occurrences de la référence dans les mouvements et lignes d'entrepôt.</p>
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
