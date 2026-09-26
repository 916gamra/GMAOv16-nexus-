import { useState, useMemo, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Copy,
  Check,
  LayoutGrid,
  Table,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

export default function MatricesActionsTab({
  filteredActionsMatrix = [],
  totalActionsKeysCount = 0,
  copiedIndex = null,
  handleCopyText = () => {},
  formatPanneName = (s) => s,
  onAddDemandeWithPreset = () => {},
}) {
  // View mode state: 'grid' | 'excel'
  const [displayMode, setDisplayMode] = useState('grid');

  // Pagination state
  const [pageSize, setPageSize] = useState(10); // 10, 25, 50, 'ALL'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredActionsMatrix.length, pageSize]);

  // Calculate paginated slice
  const totalItems = filteredActionsMatrix.length;
  const effectivePageSize = pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  // Safe current page
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 'ALL' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedMatrix = useMemo(() => {
    return filteredActionsMatrix.slice(startIndex, endIndex);
  }, [filteredActionsMatrix, startIndex, endIndex]);

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
            <Wrench className="w-4 h-4 text-emerald-600" />
            <span>Matrices Actions Correctives</span>
          </span>

          <span className="text-slate-300">|</span>

          <span>
            {totalItems > 0 ? (
              <>
                Affichage de <b>{startIndex + 1}</b> à <b>{endIndex}</b> sur <b>{totalItems}</b> pannes (matrices)
              </>
            ) : (
              'Aucune matrice trouvée'
            )}
          </span>

          {totalItems < totalActionsKeysCount && (
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
                      ? 'bg-white text-emerald-900 shadow-2xs border border-slate-200'
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
                  ? 'bg-white text-emerald-950 shadow-2xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en cartes / grille"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grille</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('excel')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'excel'
                  ? 'bg-white text-emerald-950 shadow-2xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en tableau style Excel (Multi-actions)"
            >
              <Table className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tableau Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT DISPLAY: GRID CARDS MODE */}
      {displayMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedMatrix.map(([panneKey, actionsList], relativeIdx) => {
            const absoluteIdx = startIndex + relativeIdx;
            const formattedKey = formatPanneName(panneKey);
            const actionsCount = actionsList?.length || 0;
            const fullSolutionText = (actionsList || []).map((a, i) => `${i + 1}. ${a}`).join('\n');
            const isAllCopied = copiedIndex === `all_${absoluteIdx}`;

            return (
              <div
                key={panneKey}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:border-emerald-300 flex flex-col justify-between group/card"
              >
                <div>
                  {/* Header Problem Title & Code */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2.5 border-b border-slate-100/90">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{formattedKey}</span>
                      </h4>
                      <span className="text-[10.5px] font-mono text-slate-400 block mt-0.5">
                        clef: <b className="text-slate-700">{panneKey}</b>
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shrink-0">
                      {actionsCount} action{actionsCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Actions List (1 to N) */}
                  <div className="space-y-1.5 mt-3 max-h-52 overflow-y-auto pr-1">
                    {Array.isArray(actionsList) && actionsList.length > 0 ? (
                      actionsList.map((action, aIdx) => {
                        const copyKey = `act_${absoluteIdx}_${aIdx}`;
                        const isCopied = copiedIndex === copyKey;

                        return (
                          <div
                            key={aIdx}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 text-xs font-medium text-slate-800 flex items-start justify-between gap-2 group/act transition-colors"
                          >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {aIdx + 1}
                              </span>
                              <span className="leading-snug">{action}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyText(action, copyKey)}
                              className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-white transition cursor-pointer shrink-0"
                              title="Copier cette action"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/act:text-emerald-600" />
                              )}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 italic">Aucune action configurée pour cette panne.</p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(fullSolutionText, `all_${absoluteIdx}`)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                    title="Copier toutes les actions de cette panne"
                  >
                    {isAllCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Toutes copiées !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copier tout ({actionsCount})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof onAddDemandeWithPreset === 'function') {
                        onAddDemandeWithPreset({
                          anomalie: panneKey,
                          travail_a_faire: actionsList?.[0] || '',
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                    title="Créer une DI avec cette anomalie préremplie"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer DI liée</span>
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
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead className="bg-slate-100/90 text-[10.5px] font-black uppercase text-slate-600 tracking-wider border-b border-slate-200/90 sticky top-0 z-10 font-mono">
                <tr>
                  <th className="py-3 px-3 text-center w-12 bg-slate-200/60 border-r border-slate-200/80">
                    N°
                  </th>
                  <th className="py-3 px-3.5 text-center w-36 border-r border-slate-200/80">
                    CLEF / ANOMALIE
                  </th>
                  <th className="py-3 px-4 w-56 border-r border-slate-200/80">
                    DÉSIGNATION DU PROBLÈME
                  </th>
                  <th className="py-3 px-4">
                    MATRICE DES ACTIONS TYPES RECOMMANDÉES (1 → N)
                  </th>
                  <th className="py-3 px-3.5 text-center w-48 border-l border-slate-200/80">
                    ACTIONS RAPIDES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {paginatedMatrix.map(([panneKey, actionsList], relativeIdx) => {
                  const absoluteIdx = startIndex + relativeIdx;
                  const formattedKey = formatPanneName(panneKey);
                  const actionsCount = actionsList?.length || 0;
                  const fullSolutionText = (actionsList || []).map((a, i) => `${i + 1}. ${a}`).join('\n');
                  const isAllCopied = copiedIndex === `all_tbl_${absoluteIdx}`;

                  return (
                    <tr
                      key={panneKey}
                      className="hover:bg-emerald-50/40 transition-colors group/row"
                    >
                      {/* Row Index */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400 bg-slate-50/60 border-r border-slate-200/60 text-[11px] align-top">
                        {absoluteIdx + 1}
                      </td>

                      {/* Monospace Code Key */}
                      <td className="py-3.5 px-3.5 text-center font-mono border-r border-slate-200/60 align-top">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[10.5px]">
                          {panneKey}
                        </span>
                      </td>

                      {/* Problem Formatted Name */}
                      <td className="py-3.5 px-4 font-black text-slate-900 text-xs border-r border-slate-200/60 align-top">
                        <div>
                          <span>{formattedKey}</span>
                          <span className="mt-1 px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block">
                            {actionsCount} action{actionsCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>

                      {/* 1-to-N Actions Breakdown List */}
                      <td className="py-3.5 px-4 align-top">
                        {Array.isArray(actionsList) && actionsList.length > 0 ? (
                          <div className="space-y-1.5">
                            {actionsList.map((action, aIdx) => {
                              const copyKey = `act_tbl_${absoluteIdx}_${aIdx}`;
                              const isCopied = copiedIndex === copyKey;

                              return (
                                <div
                                  key={aIdx}
                                  className="p-2 rounded-xl bg-slate-50/90 hover:bg-emerald-50/60 border border-slate-200/70 text-xs font-medium text-slate-800 flex items-start justify-between gap-2 group/tblAct transition-colors"
                                >
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-black flex items-center justify-center shrink-0 mt-0.5">
                                      {aIdx + 1}
                                    </span>
                                    <span className="leading-relaxed">{action}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(action, copyKey)}
                                    className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-white transition cursor-pointer shrink-0"
                                    title="Copier cette action"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/tblAct:text-emerald-600" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10.5px] text-slate-400 italic">Aucune action recommandée</span>
                        )}
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-3.5 px-3.5 text-center border-l border-slate-200/60 align-top">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof onAddDemandeWithPreset === 'function') {
                                onAddDemandeWithPreset({
                                  anomalie: panneKey,
                                  travail_a_faire: actionsList?.[0] || '',
                                });
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                            title="Créer une DI préremplie"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Créer DI</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyText(fullSolutionText, `all_tbl_${absoluteIdx}`)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            title="Copier toutes les actions"
                          >
                            {isAllCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copier Tout</span>
                              </>
                            )}
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
      {filteredActionsMatrix.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center text-slate-500 shadow-2xs">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800">Aucune matrice d'action trouvée pour cette recherche.</p>
          <p className="text-xs text-slate-400 mt-1">Saisissez d'autres termes de recherche ci-dessus.</p>
        </div>
      )}

      {/* 5. FOOTER PAGINATION BAR */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Counter info */}
          <div className="text-xs text-slate-500 font-medium">
            Page <b>{safeCurrentPage}</b> sur <b>{totalPages}</b> ({totalItems} matrices totales)
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
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
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
