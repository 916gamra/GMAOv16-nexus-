import { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Plus,
  LayoutGrid,
  Table,
  ChevronLeft,
} from 'lucide-react';

export default function PannesCatalogTab({
  filteredPannes = [],
  _totalPannesCount = 0,
  selectedCategory = 'ALL',
  CATEGORY_META = {},
  expandedPanne = null,
  setExpandedPanne = () => {},
  onAddDemandeWithPreset = () => {},
  setSearchQuery = () => {},
  setSelectedCategory = () => {},
}) {
  // View mode state: 'grid' | 'excel'
  const [displayMode, setDisplayMode] = useState('grid');

  // Pagination state
  const [pageSize, setPageSize] = useState(12); // 12, 24, 48, 'ALL'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPannes.length, pageSize, selectedCategory]);

  // Calculate paginated slice
  const totalItems = filteredPannes.length;
  const effectivePageSize = pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  // Safe current page
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 'ALL' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedPannes = useMemo(() => {
    return filteredPannes.slice(startIndex, endIndex);
  }, [filteredPannes, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header Toolbar: View Mode Toggle & Pagination Controls */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Result Counter & Category Info */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Référentiel des Pannes</span>
          </span>

          <span className="text-slate-300">|</span>

          <span>
            {totalItems > 0 ? (
              <>
                Affichage de <b>{startIndex + 1}</b> à <b>{endIndex}</b> sur <b>{totalItems}</b> pannes
              </>
            ) : (
              'Aucune anomalie'
            )}
          </span>

          {selectedCategory !== 'ALL' && (
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Catégorie : {selectedCategory} ({CATEGORY_META[selectedCategory]?.label || selectedCategory})
            </span>
          )}
        </div>

        {/* Right: View Mode Toggle & Items Per Page Selector */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Items Per Page Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium text-[11px] hidden md:inline">Par page :</span>
            <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/80">
              {[12, 24, 48, 'ALL'].map((size) => (
                <button
                  key={String(size)}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition cursor-pointer ${
                    pageSize === size
                      ? 'bg-white text-amber-900 shadow-2xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {size === 'ALL' ? 'Tous' : size}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* View Mode Toggle: Grid Cards vs Excel Spreadsheet Table */}
          <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setDisplayMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'grid'
                  ? 'bg-white text-amber-950 shadow-2xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en cartes / grille"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
              <span>Grille</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('excel')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'excel'
                  ? 'bg-white text-amber-950 shadow-2xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en tableau style Excel"
            >
              <Table className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tableau Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT DISPLAY: GRID CARDS MODE */}
      {displayMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 ml-auto"
                    title="Créer une Demande d'Intervention avec cette anomalie préremplie"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Créer DI</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. MAIN CONTENT DISPLAY: EXCEL SPREADSHEET TABLE MODE */}
      {displayMode === 'excel' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead className="bg-slate-100/90 text-[10.5px] font-black uppercase text-slate-600 tracking-wider border-b border-slate-200/90 sticky top-0 z-10 font-mono">
                <tr>
                  <th className="py-3 px-3 text-center w-12 bg-slate-200/60 border-r border-slate-200/80">
                    N°
                  </th>
                  <th className="py-3 px-3.5 text-center w-28 border-r border-slate-200/80">
                    CATÉGORIE
                  </th>
                  <th className="py-3 px-3.5 text-center w-36 border-r border-slate-200/80">
                    CODE ANOMALIE
                  </th>
                  <th className="py-3 px-4">
                    DÉSIGNATION / LIBELLÉ DE LA PANNE
                  </th>
                  <th className="py-3 px-4 border-l border-slate-200/80">
                    SOLUTIONS & ACTIONS TYPES (ATELIER)
                  </th>
                  <th className="py-3 px-3.5 text-center w-36 border-l border-slate-200/80">
                    ACTION RAPIDE
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
                      className="hover:bg-amber-50/40 transition-colors group/row"
                    >
                      {/* Row Index */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 bg-slate-50/60 border-r border-slate-200/60 text-[11px]">
                        {absoluteIdx + 1}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-3.5 text-center border-r border-slate-200/60">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.color}`}>
                          {panne.category} • {meta.label}
                        </span>
                      </td>

                      {/* Code Badge */}
                      <td className="py-3 px-3.5 text-center font-mono border-r border-slate-200/60">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[10.5px]">
                          {panne.code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 font-black text-slate-900 text-xs">
                        {panne.name}
                      </td>

                      {/* Recommended Actions */}
                      <td className="py-3 px-4 border-l border-slate-200/60">
                        {hasActions ? (
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                            {panne.actions.map((act, actIdx) => (
                              <div
                                key={actIdx}
                                className="text-[11px] text-slate-700 bg-amber-50/60 p-1.5 rounded-lg border border-amber-200/50 flex items-start gap-1"
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
                      <td className="py-3 px-3.5 text-center border-l border-slate-200/60">
                        <button
                          onClick={() => {
                            if (typeof onAddDemandeWithPreset === 'function') {
                              onAddDemandeWithPreset({
                                type_panne: panne.category,
                                anomalie: panne.code,
                              });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                          title="Créer une Demande d'Intervention"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Créer DI</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      {/* 5. FOOTER PAGINATION BAR */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Counter info */}
          <div className="text-xs text-slate-500 font-medium">
            Page <b>{safeCurrentPage}</b> sur <b>{totalPages}</b> ({totalItems} pannes totales)
          </div>

          {/* Page numbers navigation buttons */}
          <div className="flex items-center gap-1 self-center sm:self-auto">
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className={`p-1.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                safeCurrentPage === 1
                  ? 'opacity-40 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95'
              }`}
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (safeCurrentPage <= 3) {
                pageNum = i + 1;
              } else if (safeCurrentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = safeCurrentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center cursor-pointer active:scale-95 ${
                    safeCurrentPage === pageNum
                      ? 'bg-amber-600 text-white shadow-xs font-black'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className={`p-1.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                safeCurrentPage === totalPages
                  ? 'opacity-40 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95'
              }`}
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
