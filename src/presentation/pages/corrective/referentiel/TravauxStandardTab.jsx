import { useState, useMemo, useEffect } from 'react';
import TablePaginationCard from '../../../components/common/TablePaginationCard';
import {
  BookOpen,
  Check,
  Copy,
  Plus,
  LayoutGrid,
  Table,
  FileText,
  Zap,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';

export default function TravauxStandardTab({
  filteredTravaux = [],
  totalTravauxCount = 0,
  copiedIndex = null,
  handleCopyText = () => {},
  onAddDemandeWithPreset = () => {},
  setSearchQuery = () => {},
  onAddTravail,
  onUpdateTravail,
  onDeleteTravail,
  showToast,
}) {
  // View mode state: 'excel' (Tableau) | 'grid' (Cartes)
  const [displayMode, setDisplayMode] = useState('excel');

  // Pagination state: Default 20 rows standard
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // CRUD Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTravail, setEditingTravail] = useState(null);
  const [travailToDelete, setTravailToDelete] = useState(null);

  // Form field
  const [travailInputText, setTravailInputText] = useState('');

  // Reset to page 1 whenever search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTravaux.length, pageSize]);

  // Calculate paginated slice
  const totalItems = filteredTravaux.length;
  const effectivePageSize = pageSize === 0 || pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 0 || pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

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

  const emptyRowsCount = useMemo(() => {
    if (pageSize === 0 || pageSize === 'ALL') return 0;
    const count = effectivePageSize - paginatedTravaux.length;
    return count > 0 ? Math.min(count, 20) : 0;
  }, [effectivePageSize, paginatedTravaux.length, pageSize]);

  // Handlers for Add/Edit/Delete
  const handleOpenAddModal = () => {
    setTravailInputText('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (travailText) => {
    setEditingTravail(travailText);
    setTravailInputText(travailText);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    const clean = travailInputText.trim();
    if (!clean) return;

    if (typeof onAddTravail === 'function') {
      onAddTravail(clean);
      showToast?.('Tâche standard ajoutée avec succès au catalogue d\'atelier !', 'success');
    }
    setIsAddModalOpen(false);
    setTravailInputText('');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTravail) return;
    const clean = travailInputText.trim();
    if (!clean) return;

    if (typeof onUpdateTravail === 'function') {
      onUpdateTravail(editingTravail, clean);
      showToast?.('Tâche standard modifiée avec succès !', 'success');
    }
    setEditingTravail(null);
    setTravailInputText('');
  };

  const handleConfirmDelete = () => {
    if (!travailToDelete) return;
    if (typeof onDeleteTravail === 'function') {
      onDeleteTravail(travailToDelete);
      showToast?.('Tâche standard retirée du catalogue.', 'info');
    }
    setTravailToDelete(null);
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header Toolbar: Summary on Left & Add Button / Mode Switch on Right */}
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

        {/* Right: Add Button + Mode Switch (Grille vs Tableau Excel) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Ajouter une nouvelle tâche standard au catalogue"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Tâche Standard</span>
          </button>

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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16)] transition-all duration-300 ease-out">
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
            <div className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Tableau Travaux_Standard • Ordre Excel Row 3 : N° → Description → Actions</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400 hidden lg:block">
              N° d'Ordre (A) | Description / Tâche Standard d'Atelier (B) | Actions & Outils (C)
            </div>
          </div>

          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead className="bg-slate-100 text-[11px] font-black uppercase text-slate-700 tracking-wider border-b border-slate-200 sticky top-0 z-20 font-mono shadow-2xs">
                <tr>
                  <th className="py-3 px-3 text-center w-14 bg-slate-200/70 border-r border-slate-200/90">
                    N°
                  </th>
                  <th className="py-3 px-4 border-r border-slate-200/90 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>DESCRIPTION DE LA TÂCHE / TRAVAIL STANDARD (ATELIER)</span>
                    </div>
                  </th>
                  <th className="py-3 px-3.5 text-center w-52 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      <span>ACTIONS GMAO</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {paginatedTravaux.map((travail, relativeIdx) => {
                  const absoluteIdx = startIndex + relativeIdx;

                  return (
                    <tr
                      key={absoluteIdx}
                      className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/40 transition-colors group/row"
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 bg-slate-100/60 border-r border-slate-200/60 text-[11px]">
                        {absoluteIdx + 1}
                      </td>

                      {/* Travail Description */}
                      <td className="py-2.5 px-4 font-bold text-slate-800 text-xs border-r border-slate-200/60 leading-relaxed">
                        {travail}
                      </td>

                      {/* Actions Buttons: Copier + Modifier + Supprimer + Créer DI */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyText(travail, absoluteIdx)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] transition flex items-center gap-1 cursor-pointer active:scale-95 border border-slate-200"
                            title="Copier la description dans le presse-papier"
                          >
                            {copiedIndex === absoluteIdx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copié</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>Copier</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(travail)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition cursor-pointer border border-slate-200/80"
                            title="Modifier cette tâche standard"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setTravailToDelete(travail)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition cursor-pointer border border-slate-200/80"
                            title="Supprimer cette tâche du catalogue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (typeof onAddDemandeWithPreset === 'function') {
                                onAddDemandeWithPreset({
                                  travail_demande: travail,
                                });
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10.5px] transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                            title="Créer une Demande avec ce travail"
                          >
                            <Plus className="w-3 h-3" />
                            <span>DI</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Placeholder rows */}
                {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="h-10 opacity-30 select-none pointer-events-none">
                    <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-300 bg-slate-50 border-r border-slate-100">
                      -
                    </td>
                    <td className="border-r border-slate-100 text-[10px] text-slate-300 px-4">-</td>
                    <td className="text-center text-[10px] text-slate-300">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. GRID / CARDS DISPLAY MODE */}
      {displayMode === 'grid' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedTravaux.map((travail, relativeIdx) => {
              const absoluteIdx = startIndex + relativeIdx;

              return (
                <div
                  key={absoluteIdx}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        N° {absoluteIdx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(travail)}
                          className="p-1 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-500 transition cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTravailToDelete(travail)}
                          className="p-1 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-500 transition cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="font-bold text-slate-800 text-xs leading-relaxed group-hover:text-blue-900 transition-colors">
                      {travail}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(travail, absoluteIdx)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-200"
                    >
                      {copiedIndex === absoluteIdx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copier texte</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof onAddDemandeWithPreset === 'function') {
                          onAddDemandeWithPreset({
                            travail_demande: travail,
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ml-auto"
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
          <p className="text-sm font-extrabold text-slate-800">Aucune tâche standard trouvée.</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              Effacer la recherche
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              + Ajouter une Tâche
            </button>
          </div>
        </div>
      )}

      {/* 5. FOOTER PAGINATION BAR */}
      <TablePaginationCard
        currentPage={safeCurrentPage}
        setCurrentPage={handlePageChange}
        pageSize={pageSize}
        setPageSize={setPageSize}
        totalItems={totalItems}
        pageSizeOptions={[20, 25, 50, 100, 200, 0]}
        color="blue"
      />

      {/* 6. MODAL: AJOUTER UNE TÂCHE STANDARD */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Nouvelle Tâche Standard</h3>
                  <p className="text-[11px] text-slate-400">Ajout au référentiel d'atelier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description du Travail :</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ex: Remplacement du joint spy et vidange du réducteur principal"
                  value={travailInputText}
                  onChange={(e) => setTravailInputText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ajouter au Référentiel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: MODIFIER UNE TÂCHE STANDARD */}
      {editingTravail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Modifier la Tâche Standard</h3>
                  <p className="text-[11px] text-slate-400">Mise à jour du libellé d'atelier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTravail(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description du Travail :</label>
                <textarea
                  required
                  rows={4}
                  value={travailInputText}
                  onChange={(e) => setTravailInputText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTravail(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer Modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: CONFIRMATION SUPPRESSION TÂCHE */}
      {travailToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Supprimer la tâche ?</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                "{travailToDelete}"
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTravailToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
