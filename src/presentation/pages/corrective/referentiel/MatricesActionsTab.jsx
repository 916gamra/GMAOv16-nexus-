import { useState, useMemo, useEffect } from 'react';
import TablePaginationCard from '../../../components/common/TablePaginationCard';
import {
  Wrench,
  Plus,
  Copy,
  Check,
  LayoutGrid,
  Table,
  ShieldAlert,
  Layers,
  Zap,
} from 'lucide-react';

export default function MatricesActionsTab({
  filteredActionsMatrix = [],
  totalActionsKeysCount = 0,
  copiedIndex = null,
  handleCopyText = () => {},
  formatPanneName = (s) => s,
  onAddDemandeWithPreset = () => {},
}) {
  // View mode state: 'excel' (Tableau) | 'grid' (Cartes)
  const [displayMode, setDisplayMode] = useState('excel');

  // Pagination state: Default 20 rows standard
  const [pageSize, setPageSize] = useState(20); // 20, 50, 100, 200, 'ALL'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredActionsMatrix.length, pageSize]);

  // Calculate paginated slice
  const totalItems = filteredActionsMatrix.length;
  const effectivePageSize = pageSize === 0 || pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 0 || pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  // Safe current page
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 0 || pageSize === 'ALL' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedMatrix = useMemo(() => {
    return filteredActionsMatrix.slice(startIndex, endIndex);
  }, [filteredActionsMatrix, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Fixed 20 rows placeholder filler when fewer than 20 items in page
  const emptyRowsCount = useMemo(() => {
    if (pageSize === 0 || pageSize === 'ALL') return 0;
    const count = effectivePageSize - paginatedMatrix.length;
    return count > 0 ? Math.min(count, 20) : 0;
  }, [effectivePageSize, paginatedMatrix.length, pageSize]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header Toolbar: Summary on Left & Mode Switch on Top Right */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Result Counter & Range */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-emerald-600" />
            <span>Matrices des Actions Correctives</span>
          </span>

          <span className="text-slate-300">|</span>

          <span>
            {totalItems > 0 ? (
              <>
                Affichage de <b>{startIndex + 1}</b> à <b>{endIndex}</b> sur <b>{totalItems}</b> matrices
              </>
            ) : (
              'Aucune matrice trouvée'
            )}
          </span>

          {totalItems < totalActionsKeysCount && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Filtre actif ({totalItems} / {totalActionsKeysCount})
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
              <Table className="w-3.5 h-3.5 text-emerald-600" />
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
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cartes / Grille</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT DISPLAY: EXCEL SPREADSHEET TABLE MODE */}
      {displayMode === 'excel' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Subheader ribbon */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2 text-[11px] font-bold text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-slate-700">Matrices d'Actions & Solutions Types Référencées (71 Matrices)</span>
            </div>
            <div className="font-mono text-slate-400 text-[10px]">
              Affichage: {startIndex + 1} à {endIndex} sur {totalItems} • Défilement fluide
            </div>
          </div>

          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead className="bg-slate-100 text-[11px] font-black uppercase text-slate-700 tracking-wider border-b border-slate-200 sticky top-0 z-20 font-mono shadow-2xs">
              <tr>
                <th className="py-3 px-3 text-center w-12 bg-slate-200/70 border-r border-slate-200/90">
                  N°
                </th>
                <th className="py-3 px-3.5 text-center w-48 border-r border-slate-200/90 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ANOMALIE / PANNE CIBLÉE</span>
                  </div>
                </th>
                <th className="py-3 px-4 border-r border-slate-200/90 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-slate-600" />
                    <span>SOLUTIONS & ACTIONS TYPES RECOMMANDÉES</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-36 border-r border-slate-200/90 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>NB ACTIONS</span>
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
              {paginatedMatrix.map(([panneKey, actionsList], relativeIdx) => {
                const absoluteIdx = startIndex + relativeIdx;
                const formattedKey = formatPanneName(panneKey);
                const count = Array.isArray(actionsList) ? actionsList.length : 0;

                return (
                  <tr
                    key={panneKey}
                    className="odd:bg-white even:bg-slate-50/60 hover:bg-emerald-50/40 transition-colors group/row"
                  >
                    {/* Row Index */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 bg-slate-100/60 border-r border-slate-200/60 text-[11px]">
                      {absoluteIdx + 1}
                    </td>

                    {/* Panne Target Badge & Name */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/60">
                      <div className="font-bold text-slate-900 text-xs">{formattedKey}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{panneKey}</div>
                    </td>

                    {/* Actions List */}
                    <td className="py-2.5 px-4 border-r border-slate-200/60">
                      {count > 0 ? (
                        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                          {actionsList.map((action, aIdx) => (
                            <div
                              key={aIdx}
                              className="text-[11px] text-slate-700 bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-200/50 flex items-start gap-1.5"
                            >
                              <span className="text-emerald-700 font-bold">•</span>
                              <span className="leading-tight">{action}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-slate-400 italic">Aucune action définie</span>
                      )}
                    </td>

                    {/* Number of Actions Badge */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200/60 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {count} action{count > 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onAddDemandeWithPreset === 'function') {
                            onAddDemandeWithPreset({
                              anomalie: panneKey,
                            });
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                        title="Créer une Demande d'Intervention"
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
                  <td className="border-r border-slate-100 text-[10px] text-slate-300 px-3">-</td>
                  <td className="border-r border-slate-100 text-[10px] text-slate-300 px-4">-</td>
                  <td className="border-r border-slate-100 text-center text-[10px] text-slate-300">-</td>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
            {paginatedMatrix.map(([panneKey, actionsList], relativeIdx) => {
              const absoluteIdx = startIndex + relativeIdx;
              const formattedKey = formatPanneName(panneKey);
              const count = Array.isArray(actionsList) ? actionsList.length : 0;

              return (
                <div
                  key={panneKey}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                          {formattedKey}
                        </h4>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          code: <span className="text-slate-600 font-bold">{panneKey}</span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {count} action{count > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Actions standardisées :
                      </span>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {actionsList.map((action, aIdx) => {
                          const isCopied = copiedIndex === `${absoluteIdx}_${aIdx}`;
                          return (
                            <div
                              key={aIdx}
                              className="text-[11px] text-slate-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60 flex items-start justify-between gap-2"
                            >
                              <div className="flex items-start gap-1.5 leading-tight">
                                <span className="text-emerald-700 font-bold">•</span>
                                <span>{action}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(action, `${absoluteIdx}_${aIdx}`)}
                                className="text-slate-400 hover:text-emerald-700 p-0.5 cursor-pointer shrink-0"
                                title="Copier l'action"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-mono text-slate-400">
                      Matrice N° {absoluteIdx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof onAddDemandeWithPreset === 'function') {
                          onAddDemandeWithPreset({
                            anomalie: panneKey,
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Créer une Demande d'Intervention"
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
      {filteredActionsMatrix.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center text-slate-500 shadow-2xs">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800">Aucune matrice trouvée pour cette recherche.</p>
          <p className="text-xs text-slate-400 mt-1">Vérifiez les mots-clés saisis.</p>
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
        color="emerald"
      />
    </div>
  );
}
