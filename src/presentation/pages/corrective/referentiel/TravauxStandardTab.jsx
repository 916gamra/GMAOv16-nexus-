import { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Plus,
  LayoutGrid,
  Table,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function TravauxStandardTab({
  filteredTravaux = [],
  totalTravauxCount = 0,
  copiedIndex = null,
  handleCopyText = () => {},
  onAddDemandeWithPreset = () => {},
  setSearchQuery = () => {},
}) {
  // View mode state: 'grid' | 'excel'
  const [displayMode, setDisplayMode] = useState('grid');

  // Pagination state
  const [pageSize, setPageSize] = useState(10); // 10, 25, 50, 'ALL'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTravaux.length, pageSize]);

  // Calculate paginated slice
  const totalItems = filteredTravaux.length;
  const effectivePageSize = pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  // Ensure current page is valid
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 'ALL' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedTravaux = useMemo(() => {
    return filteredTravaux.slice(startIndex, endIndex);
  }, [filteredTravaux, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header Toolbar: View Mode Toggle & Pagination Controls */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Result Counter & Range */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Travaux Standards</span>
          </span>

          <span className="text-slate-300">|</span>

          <span>
            {totalItems > 0 ? (
              <>
                Affichage de <b>{startIndex + 1}</b> à <b>{endIndex}</b> sur <b>{totalItems}</b> tâches
              </>
            ) : (
              'Aucun résultat'
            )}
          </span>

          {totalItems < totalTravauxCount && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Filtre actif
            </span>
          )}
        </div>

        {/* Right: View Mode Toggle & Items Per Page Selector */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Items Per Page Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium text-[11px] hidden md:inline">Par page :</span>
            <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/80">
              {[10, 25, 50, 'ALL'].map((size) => (
                <button
                  key={String(size)}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition cursor-pointer ${
                    pageSize === size
                      ? 'bg-white text-blue-900 shadow-2xs border border-slate-200'
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
                  ? 'bg-white text-blue-950 shadow-2xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en cartes / grille"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>Grille</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('excel')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'excel'
                  ? 'bg-white text-blue-950 shadow-2xs border border-slate-200 font-black'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {paginatedTravaux.map((travail, relativeIdx) => {
            const absoluteIdx = startIndex + relativeIdx;
            const lines = String(travail).split('\n');
            const isCopied = copiedIndex === absoluteIdx;

            return (
              <div
                key={absoluteIdx}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:border-blue-300 flex flex-col justify-between group/card relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-black bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs">
                      Travail #{String(absoluteIdx + 1).padStart(3, '0')}
                    </span>

                    <button
                      onClick={() => handleCopyText(travail, absoluteIdx)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Copier le texte du travail"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/card:text-blue-600 transition-colors" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 mt-2.5 text-xs font-semibold text-slate-800 leading-relaxed">
                    {lines.map((l, lIdx) => (
                      <p
                        key={lIdx}
                        className={
                          lIdx > 0
                            ? 'text-slate-600 pl-2.5 border-l-2 border-blue-300/80 mt-1 font-normal'
                            : 'font-black text-slate-900'
                        }
                      >
                        {l}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Standard GMAO Usine
                  </span>

                  <button
                    onClick={() => {
                      if (typeof onAddDemandeWithPreset === 'function') {
                        onAddDemandeWithPreset({
                          travail_a_faire: travail,
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                    title="Créer une DI avec ce travail prérempli"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Utiliser dans DI</span>
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
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead className="bg-slate-100/90 text-[10.5px] font-black uppercase text-slate-600 tracking-wider border-b border-slate-200/90 sticky top-0 z-10 font-mono">
                <tr>
                  <th className="py-3 px-3 text-center w-12 bg-slate-200/60 border-r border-slate-200/80">
                    N°
                  </th>
                  <th className="py-3 px-3.5 text-center w-24 border-r border-slate-200/80">
                    CODE
                  </th>
                  <th className="py-3 px-4">
                    DESCRIPTIF DE LA TÂCHE STANDARD (INSTRUCTIONS)
                  </th>
                  <th className="py-3 px-3.5 text-center w-36 border-l border-slate-200/80">
                    CATÉGORIE
                  </th>
                  <th className="py-3 px-3.5 text-center w-48 border-l border-slate-200/80">
                    ACTIONS RAPIDES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {paginatedTravaux.map((travail, relativeIdx) => {
                  const absoluteIdx = startIndex + relativeIdx;
                  const lines = String(travail).split('\n');
                  const isCopied = copiedIndex === absoluteIdx;

                  return (
                    <tr
                      key={absoluteIdx}
                      className="hover:bg-blue-50/50 transition-colors group/row"
                    >
                      {/* Row Index */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 bg-slate-50/60 border-r border-slate-200/60 text-[11px]">
                        {absoluteIdx + 1}
                      </td>

                      {/* Code Badge */}
                      <td className="py-3 px-3.5 text-center font-mono font-bold border-r border-slate-200/60">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-[10.5px]">
                          #{String(absoluteIdx + 1).padStart(3, '0')}
                        </span>
                      </td>

                      {/* Content Description */}
                      <td className="py-3 px-4 font-medium text-slate-800 leading-relaxed">
                        {lines.map((l, lIdx) => (
                          <div
                            key={lIdx}
                            className={
                              lIdx > 0
                                ? 'text-slate-600 pl-2 border-l border-blue-200 mt-1 font-normal text-[11.5px]'
                                : 'font-bold text-slate-900 text-xs'
                            }
                          >
                            {l}
                          </div>
                        ))}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3.5 text-center border-l border-slate-200/60 font-mono text-[10.5px] text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          Standard Usine
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3.5 text-center border-l border-slate-200/60">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleCopyText(travail, absoluteIdx)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                            title="Copier le texte"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/row:text-blue-600 transition-colors" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              if (typeof onAddDemandeWithPreset === 'function') {
                                onAddDemandeWithPreset({
                                  travail_a_faire: travail,
                                });
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                            title="Créer une DI avec ce travail"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Utiliser</span>
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
      )}

      {/* 4. EMPTY STATE */}
      {filteredTravaux.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center text-slate-500 shadow-2xs">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800">Aucune tâche standard ne correspond à votre recherche.</p>
          <p className="text-xs text-slate-400 mt-1">Essayez de modifier votre mot-clé dans la barre de recherche ci-dessus.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
          >
            Effacer la recherche
          </button>
        </div>
      )}

      {/* 5. FOOTER PAGINATION BAR */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Counter info */}
          <div className="text-xs text-slate-500 font-medium">
            Page <b>{safeCurrentPage}</b> sur <b>{totalPages}</b> ({totalItems} tâches totales)
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
                      ? 'bg-blue-600 text-white shadow-xs font-black'
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
