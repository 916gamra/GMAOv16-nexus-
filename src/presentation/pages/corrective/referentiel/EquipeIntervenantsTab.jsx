import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  LayoutGrid,
  Table,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

export default function EquipeIntervenantsTab({
  filteredIntervenants = [],
  totalIntervenantsCount = 0,
  onAddDemandeWithPreset = () => {},
  setSearchQuery = () => {},
}) {
  // View mode state: 'grid' | 'excel'
  const [displayMode, setDisplayMode] = useState('grid');

  // Pagination state
  const [pageSize, setPageSize] = useState(10); // 10, 25, 'ALL'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredIntervenants.length, pageSize]);

  // Calculate paginated slice
  const totalItems = filteredIntervenants.length;
  const effectivePageSize = pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 'ALL' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedIntervenants = useMemo(() => {
    return filteredIntervenants.slice(startIndex, endIndex);
  }, [filteredIntervenants, startIndex, endIndex]);

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
            <Users className="w-4 h-4 text-purple-600" />
            <span>Équipe Intervenants & Techniciens (Source: Utilisateurs)</span>
          </span>

          <span className="text-slate-300">|</span>

          <span>
            {totalItems > 0 ? (
              <>
                Affichage de <b>{startIndex + 1}</b> à <b>{endIndex}</b> sur <b>{totalItems}</b> techniciens
              </>
            ) : (
              'Aucun technicien'
            )}
          </span>

          {totalItems < totalIntervenantsCount && (
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
              {[10, 25, 'ALL'].map((size) => (
                <button
                  key={String(size)}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition cursor-pointer ${
                    pageSize === size
                      ? 'bg-white text-purple-900 shadow-2xs border border-slate-200'
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
                  ? 'bg-white text-purple-950 shadow-2xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en cartes / grille"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
              <span>Grille</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('excel')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'excel'
                  ? 'bg-white text-purple-950 shadow-2xs border border-slate-200 font-black'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedIntervenants.map((tech, relativeIdx) => {
            const absoluteIdx = startIndex + relativeIdx;
            const name = tech.nom || tech.name || 'Technicien';
            const idCode = tech.id_technician || tech.id || `TECH-${String(absoluteIdx + 1).padStart(2, '0')}`;
            const total = tech.total || 0;
            const zone = tech.id_zone || 'Toutes zones';
            const spec = tech.specialite || 'Maintenance Générale';

            return (
              <div
                key={tech.id || absoluteIdx}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group/card"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200">
                      {idCode}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Habilité</span>
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-200 flex items-center justify-center text-purple-700 font-black text-sm shrink-0">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-black text-slate-900 tracking-tight leading-snug truncate">
                        {name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{zone}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11.5px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-3 line-clamp-2 leading-relaxed">
                    <Wrench className="w-3 h-3 text-slate-400 inline mr-1" />
                    {spec}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      Interventions BT
                    </span>
                    <span className="text-lg font-black text-purple-700 font-mono">
                      {total.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof onAddDemandeWithPreset === 'function') {
                        onAddDemandeWithPreset({
                          intervenant: name,
                          demandeur: name,
                        });
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                    title={`Créer une intervention affectée à ${name}`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Affecter DI</span>
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
                    CODE / ID
                  </th>
                  <th className="py-3 px-4 w-48 border-r border-slate-200/80">
                    NOM ET PRÉNOM (UTILISATEUR)
                  </th>
                  <th className="py-3 px-3.5 w-40 border-r border-slate-200/80">
                    ZONE / ATELIER
                  </th>
                  <th className="py-3 px-4 border-r border-slate-200/80">
                    SPÉCIALITÉ & COMPÉTENCES
                  </th>
                  <th className="py-3 px-3.5 text-center w-36 border-r border-slate-200/80 font-mono">
                    INTERVENTIONS (BT)
                  </th>
                  <th className="py-3 px-3.5 text-center w-36 border-l border-slate-200/80">
                    ACTION RAPIDE
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {paginatedIntervenants.map((tech, relativeIdx) => {
                  const absoluteIdx = startIndex + relativeIdx;
                  const name = tech.nom || tech.name || 'Technicien';
                  const idCode = tech.id_technician || tech.id || `TECH-${String(absoluteIdx + 1).padStart(2, '0')}`;
                  const total = tech.total || 0;
                  const zone = tech.id_zone || 'Toutes zones';
                  const spec = tech.specialite || 'Maintenance Générale';

                  return (
                    <tr
                      key={tech.id || absoluteIdx}
                      className="hover:bg-purple-50/40 transition-colors group/row"
                    >
                      {/* Row Index */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400 bg-slate-50/60 border-r border-slate-200/60 text-[11px]">
                        {absoluteIdx + 1}
                      </td>

                      {/* Code Badge */}
                      <td className="py-3.5 px-3.5 text-center font-mono border-r border-slate-200/60">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-900 font-bold border border-purple-200 text-[10.5px]">
                          {idCode}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-black text-slate-900 text-xs border-r border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-black text-[11px] flex items-center justify-center shrink-0">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{name}</span>
                        </div>
                      </td>

                      {/* Zone */}
                      <td className="py-3.5 px-3.5 font-medium text-slate-700 border-r border-slate-200/60">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold inline-block">
                          {zone}
                        </span>
                      </td>

                      {/* Specialite */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 border-r border-slate-200/60">
                        {spec}
                      </td>

                      {/* Intervention count (Formula Result) */}
                      <td className="py-3.5 px-3.5 text-center font-mono font-bold text-purple-700 text-xs border-r border-slate-200/60">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                          {total.toLocaleString()} BTs
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3.5 text-center border-l border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof onAddDemandeWithPreset === 'function') {
                              onAddDemandeWithPreset({
                                intervenant: name,
                                demandeur: name,
                              });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                          title="Affecter une DI"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Affecter DI</span>
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
      {filteredIntervenants.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center text-slate-500 shadow-2xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800">Aucun technicien trouvé pour cette recherche.</p>
          <p className="text-xs text-slate-400 mt-1">Vérifiez les termes recherchés ou ajoutez un technicien dans Utilisateurs.</p>
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
            Page <b>{safeCurrentPage}</b> sur <b>{totalPages}</b> ({totalItems} techniciens habilités)
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
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center cursor-pointer active:scale-95 ${
                    safeCurrentPage === pageNum
                      ? 'bg-purple-600 text-white shadow-xs font-black'
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
