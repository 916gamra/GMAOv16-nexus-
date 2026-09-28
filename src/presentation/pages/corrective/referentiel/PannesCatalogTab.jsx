import { useState, useMemo, useEffect } from 'react';
import TablePaginationCard from '../../../components/common/TablePaginationCard';
import {
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Plus,
  LayoutGrid,
  Table,
  BookOpen,
  Wrench,
  Radio,
  Zap,
} from 'lucide-react';

export default function PannesCatalogTab({
  filteredPannes = [],
  totalPannesCount: _totalPannesCount = 0,
  selectedCategory = 'ALL',
  CATEGORY_META = {},
  expandedPanne = null,
  setExpandedPanne = () => {},
  onAddDemandeWithPreset = () => {},
  setSearchQuery = () => {},
  setSelectedCategory = () => {},
}) {
  // View mode state: 'excel' (Tableau) | 'grid' (Cartes)
  const [displayMode, setDisplayMode] = useState('excel');

  // Pagination state: Default 20 rows standard
  const [pageSize, setPageSize] = useState(20); // 20, 50, 100, 200, 'ALL'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPannes.length, pageSize, selectedCategory]);

  // Calculate paginated slice
  const totalItems = filteredPannes.length;
  const effectivePageSize = pageSize === 0 || pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 0 || pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  // Safe current page
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 0 || pageSize === 'ALL' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedPannes = useMemo(() => {
    return filteredPannes.slice(startIndex, endIndex);
  }, [filteredPannes, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Fixed 20 rows placeholder filler when fewer than 20 items in page
  const emptyRowsCount = useMemo(() => {
    if (pageSize === 0 || pageSize === 'ALL') return 0;
    const count = effectivePageSize - paginatedPannes.length;
    return count > 0 ? Math.min(count, 20) : 0;
  }, [effectivePageSize, paginatedPannes.length, pageSize]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header Toolbar: Summary info on Left & Mode Switch (Grille / Tableau Excel) on Top Right */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Result Counter & Category Info */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Référentiel des Pannes & Anomalies</span>
          </span>

          <span className="text-slate-300">|</span>

          <span>
            {totalItems > 0 ? (
              <>
                Affichage de <b>{startIndex + 1}</b> à <b>{endIndex}</b> sur <b>{totalItems}</b> pannes cataloguées
              </>
            ) : (
              'Aucune anomalie trouvée'
            )}
          </span>

          {selectedCategory !== 'ALL' && (
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Catégorie : {selectedCategory} ({CATEGORY_META[selectedCategory]?.label || selectedCategory})
            </span>
          )}
        </div>

        {/* Right: Mode Switch (Grille vs Tableau Excel) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setDisplayMode('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                displayMode === 'excel'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en tableau Excel avec 20 lignes fixes"
            >
              <Table className="w-3.5 h-3.5 text-amber-600" />
              <span>Tableau Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                displayMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en cartes / grille"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>Cartes / Grille</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT DISPLAY: EXCEL SPREADSHEET TABLE MODE */}
      {displayMode === 'excel' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
          {/* Top Info Header Bar inside Card */}
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
            <div className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Tableau Pannes_Cataloguées • Ordre Excel Row 3 : A → E</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400 hidden lg:block">
              N° | Catégorie (A) | Code Anomalie (B) | Désignation / Libellé (C) | Solutions Types (D) | Action Rapide (E)
            </div>
          </div>

          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead className="bg-slate-100 text-[11px] font-black uppercase text-slate-700 tracking-wider border-b border-slate-200 sticky top-0 z-20 font-mono shadow-2xs">
                <tr>
                  <th className="py-3 px-3 text-center w-12 bg-slate-200/70 border-r border-slate-200/90">
                    N°
                  </th>
                  <th className="py-3 px-3.5 text-center w-36 border-r border-slate-200/90 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>CATÉGORIE</span>
                    </div>
                  </th>
                  <th className="py-3 px-3.5 text-center w-40 border-r border-slate-200/90 whitespace-nowrap font-mono">
                    <div className="flex items-center justify-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-600" />
                      <span>CODE ANOMALIE</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 border-r border-slate-200/90 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                      <span>DÉSIGNATION / LIBELLÉ DE LA PANNE</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 border-r border-slate-200/90 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                      <span>SOLUTIONS & ACTIONS TYPES (ATELIER)</span>
                    </div>
                  </th>
                  <th className="py-3 px-3.5 text-center w-36 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>ACTION RAPIDE</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {paginatedPannes.map((panne, relativeIdx) => {
                  const absoluteIdx = startIndex + relativeIdx;
                  const meta = CATEGORY_META[panne.category] || {
                    label: panne.category,
                    color: 'bg-slate-100 text-slate-800 border-slate-300',
                  };
                  const hasActions = panne.actions && panne.actions.length > 0;

                  return (
                    <tr
                      key={panne.id}
                      className="odd:bg-white even:bg-slate-50/60 hover:bg-amber-50/40 transition-colors group/row"
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 bg-slate-100/60 border-r border-slate-200/60 text-[11px]">
                        {absoluteIdx + 1}
                      </td>

                      {/* Category Badge */}
                      <td className="py-2.5 px-3.5 text-center border-r border-slate-200/60 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-bold border ${meta.color}`}>
                          {panne.category} • {meta.label}
                        </span>
                      </td>

                      {/* Code Badge */}
                      <td className="py-2.5 px-3.5 text-center font-mono border-r border-slate-200/60 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[11px]">
                          {panne.code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-4 font-black text-slate-900 text-xs border-r border-slate-200/60">
                        {panne.name}
                      </td>

                      {/* Recommended Actions */}
                      <td className="py-2.5 px-4 border-r border-slate-200/60">
                        {hasActions ? (
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                            {panne.actions.map((act, actIdx) => (
                              <div
                                key={actIdx}
                                className="text-[11px] text-slate-700 bg-amber-50/60 p-1 rounded-lg border border-amber-200/50 flex items-start gap-1"
                              >
                                <span className="text-amber-700 font-bold">•</span>
                                <span className="leading-tight">{act}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10.5px] text-slate-400 italic">Aucune action définie</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (typeof onAddDemandeWithPreset === 'function') {
                              onAddDemandeWithPreset({
                                type_panne: panne.category,
                                anomalie: panne.code,
                              });
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                          title="Créer une Demande d'Intervention directe"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Créer DI</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Placeholder rows to maintain 20 rows height */}
                {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="h-10 opacity-30 select-none pointer-events-none">
                    <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-300 bg-slate-50 border-r border-slate-100">
                      -
                    </td>
                    <td className="border-r border-slate-100 text-center text-[10px] text-slate-300">-</td>
                    <td className="border-r border-slate-100 text-center text-[10px] text-slate-300">-</td>
                    <td className="border-r border-slate-100 text-[10px] text-slate-300 px-4">-</td>
                    <td className="border-r border-slate-100 text-[10px] text-slate-300 px-4">-</td>
                    <td className="text-center text-[10px] text-slate-300">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT DISPLAY: GRID CARDS MODE */}
      {displayMode === 'grid' && (
        <div className="overflow-y-auto max-h-[65vh] pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 content-start">
            {paginatedPannes.map((panne) => {
              const meta = CATEGORY_META[panne.category] || {
                label: panne.category,
                color: 'bg-slate-100 text-slate-800 border-slate-300',
              };
              const isExpanded = expandedPanne === panne.id;
              const hasActions = panne.actions && panne.actions.length > 0;

              return (
                <div
                  key={panne.id}
                  className={`bg-white border rounded-2xl p-4 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                    isExpanded ? 'border-amber-400 ring-1 ring-amber-400/30' : 'border-slate-200/90'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-bold border ${meta.color}`}>
                        {panne.category} • {meta.label}
                      </span>

                      {hasActions && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                          {panne.actions.length} action{panne.actions.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                      {panne.name}
                    </h4>

                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      code: <span className="text-slate-600 font-bold">{panne.code}</span>
                    </div>

                    {/* Expandable Recommended Actions */}
                    {hasActions && isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 animate-in fade-in duration-200">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                          Actions d'Atelier Recommandées :
                        </span>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {panne.actions.map((act, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-slate-700 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 flex items-start gap-1.5"
                            >
                              <span className="text-amber-700 font-bold">•</span>
                              <span className="leading-tight">{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {hasActions ? (
                      <button
                        onClick={() => setExpandedPanne(isExpanded ? null : panne.id)}
                        className="text-xs font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Masquer ({panne.actions.length})</span>
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span>Voir actions ({panne.actions.length})</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10.5px] text-slate-400 italic">Aucune action liée</span>
                    )}

                    <button
                      onClick={() => {
                        if (typeof onAddDemandeWithPreset === 'function') {
                          onAddDemandeWithPreset({
                            type_panne: panne.category,
                            anomalie: panne.code,
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 ml-auto"
                      title="Créer une Demande d'Intervention avec cette anomalie préremplie"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Créer DI</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. EMPTY STATE */}
      {filteredPannes.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center text-slate-500 shadow-2xs">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800">Aucune anomalie trouvée pour cette recherche.</p>
          <p className="text-xs text-slate-400 mt-1">Vérifiez les mots-clés ou réinitialisez le filtre de catégorie.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
            className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* 5. FOOTER PAGINATION BAR (Always at bottom of container) */}
      <TablePaginationCard
        currentPage={safeCurrentPage}
        setCurrentPage={handlePageChange}
        pageSize={pageSize}
        setPageSize={setPageSize}
        totalItems={totalItems}
        pageSizeOptions={[20, 25, 50, 100, 200, 0]}
        color="amber"
      />
    </div>
  );
}
