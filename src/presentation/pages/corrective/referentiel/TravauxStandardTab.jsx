import { useState, useMemo, useEffect } from 'react';
import TablePaginationCard from '../../../components/common/TablePaginationCard';
import {
  BookOpen,
  Check,
  Copy,
  Plus,
  LayoutGrid,
  Table,
  ListOrdered,
  FileText,
  Zap,
} from 'lucide-react';

export default function TravauxStandardTab({
  filteredTravaux = [],
  totalTravauxCount = 0,
  copiedIndex = null,
  handleCopyText = () => {},
  onAddDemandeWithPreset = () => {},
  setSearchQuery = () => {},
}) {
  // View mode state: 'excel' (Tableau) | 'grid' (Cartes)
  const [displayMode, setDisplayMode] = useState('excel');

  // Pagination state: Default 20 rows standard
  const [pageSize, setPageSize] = useState(20); // 20, 50, 100, 200, 'ALL'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTravaux.length, pageSize]);

  // Calculate paginated slice
  const totalItems = filteredTravaux.length;
  const effectivePageSize = pageSize === 0 || pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 0 || pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  // Safe current page
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 0 || pageSize === 'ALL' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedTravaux = useMemo(() => {
    return filteredTravaux.slice(startIndex, endIndex);
  }, [filteredTravaux, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Fixed 20 rows placeholder filler when fewer than 20 items in page
  const emptyRowsCount = useMemo(() => {
    if (pageSize === 0 || pageSize === 'ALL') return 0;
    const count = effectivePageSize - paginatedTravaux.length;
    return count > 0 ? Math.min(count, 20) : 0;
  }, [effectivePageSize, paginatedTravaux.length, pageSize]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header Toolbar: Summary on Left & Mode Switch on Top Right */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Result Counter & Range */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Référentiel des Travaux & Tâches Standards</span>
          </span>

          <span className="text-slate-300">|</span>

          <span>
            {totalItems > 0 ? (
              <>
                Affichage de <b>{startIndex + 1}</b> à <b>{endIndex}</b> sur <b>{totalItems}</b> tâches standards
              </>
            ) : (
              'Aucune tâche trouvée'
            )}
          </span>

          {totalItems < totalTravauxCount && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Filtre actif ({totalItems} / {totalTravauxCount})
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
              <Table className="w-3.5 h-3.5 text-blue-600" />
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
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Tableau Travaux_Standard • Ordre Excel Row 3 : A → C</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400 hidden lg:block">
              N° | Réf. Tâche (A) | Description Standard (B) | Actions & Déclenchement BT (C)
            </div>
          </div>

          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead className="bg-slate-100 text-[11px] font-black uppercase text-slate-700 tracking-wider border-b border-slate-200 sticky top-0 z-20 font-mono shadow-2xs">
                <tr>
                  <th className="py-3 px-3 text-center w-12 bg-slate-200/70 border-r border-slate-200/90">
                    N°
                  </th>
                  <th className="py-3 px-3.5 text-center w-36 border-r border-slate-200/90 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
                      <span>RÉF. TÂCHE</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 border-r border-slate-200/90 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>DESCRIPTION DE LA TÂCHE STANDARD</span>
                    </div>
                  </th>
                  <th className="py-3 px-3.5 text-center w-48 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>ACTIONS RAPIDES</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {paginatedTravaux.map((travail, relativeIdx) => {
                  const absoluteIdx = startIndex + relativeIdx;
                  const isCopied = copiedIndex === absoluteIdx;
                  const taskRef = `TS-${String(absoluteIdx + 1).padStart(3, '0')}`;

                  return (
                    <tr
                      key={absoluteIdx}
                      className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/40 transition-colors group/row"
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 bg-slate-100/60 border-r border-slate-200/60 text-[11px]">
                        {absoluteIdx + 1}
                      </td>

                      {/* Task Reference Code */}
                      <td className="py-2.5 px-3.5 text-center font-mono border-r border-slate-200/60 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200 text-[11px]">
                          {taskRef}
                        </span>
                      </td>

                      {/* Task Description */}
                      <td className="py-2.5 px-4 font-bold text-slate-800 text-xs border-r border-slate-200/60 leading-relaxed">
                        {travail}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyText(travail, absoluteIdx)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                            title="Copier le libellé"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (typeof onAddDemandeWithPreset === 'function') {
                                onAddDemandeWithPreset({
                                  anomalie: `Tâche Standard: ${travail.slice(0, 60)}...`,
                                });
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                            title="Créer une Demande d'Intervention"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Créer DI</span>
                          </button>
                        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 content-start">
            {paginatedTravaux.map((travail, relativeIdx) => {
              const absoluteIdx = startIndex + relativeIdx;
              const isCopied = copiedIndex === absoluteIdx;
              const taskRef = `TS-${String(absoluteIdx + 1).padStart(3, '0')}`;

              return (
                <div
                  key={absoluteIdx}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                      <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {taskRef}
                      </span>
                      <span className="text-[10.5px] font-mono text-slate-400">
                        Ordre N° {absoluteIdx + 1}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {travail}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(travail, absoluteIdx)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copié !' : 'Copier'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof onAddDemandeWithPreset === 'function') {
                          onAddDemandeWithPreset({
                            anomalie: `Tâche Standard: ${travail.slice(0, 60)}...`,
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Créer une Demande d'Intervention avec cette tâche"
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
      {filteredTravaux.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center text-slate-500 shadow-2xs">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800">Aucune tâche trouvée pour cette recherche.</p>
          <p className="text-xs text-slate-400 mt-1">Vérifiez les mots-clés saisis.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
          >
            Effacer la recherche
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
        color="blue"
      />
    </div>
  );
}
