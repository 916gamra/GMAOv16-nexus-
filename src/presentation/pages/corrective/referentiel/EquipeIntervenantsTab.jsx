import { useState, useMemo, useEffect } from 'react';
import TablePaginationCard from '../../../components/common/TablePaginationCard';
import {
  Users,
  LayoutGrid,
  Table,
  Plus,
  MapPin,
  Wrench,
  CheckCircle2,
  FileSpreadsheet,
  User,
  Zap,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';

export default function EquipeIntervenantsTab({
  filteredIntervenants = [],
  totalIntervenantsCount = 0,
  onAddDemandeWithPreset = () => {},
  setSearchQuery: _setSearchQuery = () => {},
  onAddTechnician,
  onUpdateTechnician,
  onDeleteTechnician,
  zones = [],
  showToast,
}) {
  // View mode state: 'excel' (Tableau) | 'grid' (Cartes)
  const [displayMode, setDisplayMode] = useState('excel');

  // Pagination state: Default 20 rows standard
  const [pageSize, setPageSize] = useState(20); // 20, 50, 100, 200, 'ALL'
  const [currentPage, setCurrentPage] = useState(1);

  // CRUD Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [techToDelete, setTechToDelete] = useState(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formNom, setFormNom] = useState('');
  const [formZone, setFormZone] = useState('');
  const [formSpecialite, setFormSpecialite] = useState('');

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredIntervenants.length, pageSize]);

  // Calculate paginated slice
  const totalItems = filteredIntervenants.length;
  const effectivePageSize = pageSize === 0 || pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 0 || pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 0 || pageSize === 'ALL' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedIntervenants = useMemo(() => {
    return filteredIntervenants.slice(startIndex, endIndex);
  }, [filteredIntervenants, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Fixed 20 rows placeholder filler when fewer than 20 items in page
  const emptyRowsCount = useMemo(() => {
    if (pageSize === 0 || pageSize === 'ALL') return 0;
    const count = effectivePageSize - paginatedIntervenants.length;
    return count > 0 ? Math.min(count, 20) : 0;
  }, [effectivePageSize, paginatedIntervenants.length, pageSize]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    const nextSeq = String((totalIntervenantsCount || 0) + 1).padStart(2, '0');
    setFormId(`TECH-${nextSeq}`);
    setFormNom('');
    const defaultZone = zones.length > 0 ? (zones[0].id_zone || zones[0].nom || 'AFM') : 'Toutes zones';
    setFormZone(defaultZone);
    setFormSpecialite('Maintenance & Dépannage');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tech) => {
    setEditingTech(tech);
    setFormId(tech.id_technician || tech.id || '');
    setFormNom(tech.nom || tech.name || '');
    setFormZone(tech.id_zone || tech.zone || 'Toutes zones');
    setFormSpecialite(tech.specialite || 'Maintenance & Dépannage');
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    const cleanNom = formNom.trim();
    if (!cleanNom) return;

    const newTechnician = {
      id: formId.trim() || `TECH-${Date.now().toString().slice(-4)}`,
      id_technician: formId.trim() || `TECH-${Date.now().toString().slice(-4)}`,
      nom: cleanNom,
      name: cleanNom,
      id_zone: formZone.trim() || 'Toutes zones',
      zone: formZone.trim() || 'Toutes zones',
      specialite: formSpecialite.trim() || 'Maintenance & Dépannage',
      role: 'Technicien',
      status: 'Habilité',
      created_at: new Date().toISOString(),
    };

    if (typeof onAddTechnician === 'function') {
      onAddTechnician(newTechnician);
      showToast?.(`Technicien "${cleanNom}" ajouté avec succès à l'équipe habilitée !`, 'success');
    }
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTech) return;
    const cleanNom = formNom.trim();
    if (!cleanNom) return;

    const techId = editingTech.id_technician || editingTech.id;
    const updated = {
      ...editingTech,
      nom: cleanNom,
      name: cleanNom,
      id_zone: formZone.trim() || 'Toutes zones',
      zone: formZone.trim() || 'Toutes zones',
      specialite: formSpecialite.trim() || 'Maintenance & Dépannage',
      role: editingTech.role || 'Technicien',
    };

    if (typeof onUpdateTechnician === 'function') {
      onUpdateTechnician(techId, updated);
      showToast?.(`Fiche de "${cleanNom}" mise à jour avec succès !`, 'success');
    }
    setEditingTech(null);
  };

  const handleConfirmDelete = () => {
    if (!techToDelete) return;
    const techId = techToDelete.id_technician || techToDelete.id;
    const techName = techToDelete.nom || techToDelete.name || techId;

    if (typeof onDeleteTechnician === 'function') {
      onDeleteTechnician(techId);
      showToast?.(`Technicien "${techName}" retiré de l'équipe.`, 'info');
    }
    setTechToDelete(null);
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header Toolbar: Summary on Left & Action Buttons / Mode Switch on Top Right */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Result Counter & Range */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Équipe Intervenants & Techniciens Habilités (Source SSOT: Utilisateurs)</span>
          </span>

          <span className="text-slate-300">|</span>

          <span>
            {totalItems > 0 ? (
              <>
                Affichage de <b>{startIndex + 1}</b> à <b>{endIndex}</b> sur <b>{totalItems}</b> techniciens
              </>
            ) : (
              'Aucun technicien trouvé'
            )}
          </span>

          {totalItems < totalIntervenantsCount && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Filtre actif ({totalItems} / {totalIntervenantsCount})
            </span>
          )}
        </div>

        {/* Right: New Tech Button + Mode Switch (Grille vs Tableau Excel) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Nouveau Technicien 3D Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Ajouter un nouveau technicien habilité"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Technicien</span>
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
              <Table className="w-3.5 h-3.5 text-purple-600" />
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
              <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
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
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="font-mono text-slate-700">Registre Habilité des Techniciens de Maintenance (Calcul Dynamique Interventions)</span>
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
                <th className="py-3 px-3.5 text-center w-36 border-r border-slate-200/90 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span>ID TECHNICIEN</span>
                  </div>
                </th>
                <th className="py-3 px-4 border-r border-slate-200/90 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    <span>NOM & PRÉNOM DU TECHNICIEN</span>
                  </div>
                </th>
                <th className="py-3 px-4 border-r border-slate-200/90 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>ZONE / ATELIER</span>
                  </div>
                </th>
                <th className="py-3 px-4 border-r border-slate-200/90 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>SPÉCIALITÉ & COMPÉTENCES</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-36 border-r border-slate-200/90 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>INTERVENTIONS BT</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-32 border-r border-slate-200/90 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>STATUT GMAO</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-48 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>ACTIONS GMAO</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90">
              {paginatedIntervenants.map((tech, relativeIdx) => {
                const absoluteIdx = startIndex + relativeIdx;
                const name = tech.nom || tech.name || 'Technicien';
                const idCode = tech.id_technician || tech.id || `TECH-${String(absoluteIdx + 1).padStart(2, '0')}`;
                const total = tech.total || 0;
                const zone = tech.id_zone || tech.zone || 'Toutes zones';
                const spec = tech.specialite || 'Maintenance & Dépannage';

                return (
                  <tr
                    key={idCode}
                    className="odd:bg-white even:bg-slate-50/60 hover:bg-purple-50/40 transition-colors group/row"
                  >
                    {/* Row Index */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 bg-slate-100/60 border-r border-slate-200/60 text-[11px]">
                      {absoluteIdx + 1}
                    </td>

                    {/* ID Badge */}
                    <td className="py-2.5 px-3.5 text-center font-mono border-r border-slate-200/60 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-bold border border-purple-200 text-[10.5px]">
                        {idCode}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4 font-black text-slate-900 text-xs border-r border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span>{name}</span>
                      </div>
                    </td>

                    {/* Zone */}
                    <td className="py-2.5 px-4 font-bold text-slate-700 text-xs border-r border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{zone}</span>
                      </div>
                    </td>

                    {/* Specialite */}
                    <td className="py-2.5 px-4 text-slate-700 text-xs border-r border-slate-200/60">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-200 text-[11px]">
                        {spec}
                      </span>
                    </td>

                    {/* Interventions Count */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200/60 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-indigo-50 text-indigo-900 border border-indigo-200">
                        {total} BT{total > 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200/60 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Habilité</span>
                      </span>
                    </td>

                    {/* Action Buttons: Edit, Delete, Create DI */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(tech)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer active:scale-95"
                          title="Modifier les informations du technicien"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setTechToDelete(tech)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer active:scale-95"
                          title="Supprimer ce technicien de l'équipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (typeof onAddDemandeWithPreset === 'function') {
                              onAddDemandeWithPreset({
                                intervenant: name,
                              });
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10.5px] transition inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                          title="Affecter ce technicien à une nouvelle Demande"
                        >
                          <Plus className="w-3 h-3" />
                          <span>DI</span>
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
                  <td className="border-r border-slate-100 text-[10px] text-slate-300 px-4">-</td>
                  <td className="border-r border-slate-100 text-[10px] text-slate-300 px-4">-</td>
                  <td className="border-r border-slate-100 text-center text-[10px] text-slate-300">-</td>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {paginatedIntervenants.map((tech, relativeIdx) => {
              const absoluteIdx = startIndex + relativeIdx;
              const name = tech.nom || tech.name || 'Technicien';
              const idCode = tech.id_technician || tech.id || `TECH-${String(absoluteIdx + 1).padStart(2, '0')}`;
              const total = tech.total || 0;
              const zone = tech.id_zone || tech.zone || 'Toutes zones';
              const spec = tech.specialite || 'Maintenance & Dépannage';

              return (
                <div
                  key={idCode}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        {idCode}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Habilité</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 border border-purple-300/80 flex items-center justify-center font-black text-sm shadow-2xs">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">{name}</h4>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{zone}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400">Spécialité :</span>
                        <span className="font-semibold text-slate-800 truncate">{spec}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400">Total BT Réalisés :</span>
                        <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                          {total} interventions
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(tech)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer active:scale-95"
                        title="Modifier ce technicien"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setTechToDelete(tech)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer active:scale-95"
                        title="Supprimer ce technicien"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof onAddDemandeWithPreset === 'function') {
                          onAddDemandeWithPreset({
                            intervenant: name,
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Créer une DI avec ce technicien"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Affecter DI</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. EMPTY STATE */}
      {filteredIntervenants.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center text-slate-500 shadow-2xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800">Aucun technicien trouvé pour cette recherche.</p>
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
        color="purple"
      />

      {/* 6. MODAL: NOUVEAU TECHNICIEN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Nouveau Technicien Habilité</h3>
                  <p className="text-[11px] text-slate-400">Ajout au registre central des utilisateurs GMAO</p>
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
                <label className="block font-bold text-slate-700 mb-1">Identifiant Technicien :</label>
                <input
                  type="text"
                  required
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: TECH-06"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom & Prénom :</label>
                <input
                  type="text"
                  required
                  value={formNom}
                  onChange={(e) => setFormNom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Tariq El Amrani"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Zone / Atelier de Rattachement :</label>
                <select
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white"
                >
                  <option value="Toutes zones">Toutes zones d'intervention</option>
                  {zones.map((z) => {
                    const zName = z.id_zone || z.nom || z.code_zone || 'Zone';
                    return (
                      <option key={zName} value={zName}>
                        {zName} {z.nom && z.nom !== zName ? `- ${z.nom}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Spécialité & Compétences :</label>
                <input
                  type="text"
                  value={formSpecialite}
                  onChange={(e) => setFormSpecialite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Électromécanique & Automatisme"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer Technicien</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: MODIFIER TECHNICIEN */}
      {editingTech && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Modifier le Technicien</h3>
                  <p className="text-[11px] text-slate-400">ID : {formId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTech(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom & Prénom :</label>
                <input
                  type="text"
                  required
                  value={formNom}
                  onChange={(e) => setFormNom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Zone / Atelier de Rattachement :</label>
                <select
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white"
                >
                  <option value="Toutes zones">Toutes zones d'intervention</option>
                  {zones.map((z) => {
                    const zName = z.id_zone || z.nom || z.code_zone || 'Zone';
                    return (
                      <option key={zName} value={zName}>
                        {zName} {z.nom && z.nom !== zName ? `- ${z.nom}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Spécialité & Compétences :</label>
                <input
                  type="text"
                  value={formSpecialite}
                  onChange={(e) => setFormSpecialite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTech(null)}
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

      {/* 8. MODAL: CONFIRMATION SUPPRESSION TECHNICIEN */}
      {techToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Supprimer le technicien ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir retirer <b>{techToDelete.nom || techToDelete.name}</b> ({techToDelete.id_technician || techToDelete.id}) de l'équipe de maintenance ?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTechToDelete(null)}
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
