const fs = require('fs');
let content = fs.readFileSync('src/components/TechniciansView.jsx', 'utf8');

// The bottom of the file has the closing div and closing bracket
//   </div>
// );
// }

const modals = `

      {/* Edit Modal */}
      {techToEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Modifier Technicien</h3>
            <p className="text-xs text-slate-500 mb-4">Mettre à jour les informations du technicien. Les modifications se répercuteront partout.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateTechnician(techToEdit.id_technician, techToEdit);
              setTechToEdit(null);
            }} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ID Technicien</label>
                <input
                  type="text"
                  value={techToEdit.id_technician}
                  disabled
                  className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nom & Prénom</label>
                <input
                  type="text"
                  value={techToEdit.nom}
                  onChange={(e) => setTechToEdit({ ...techToEdit, nom: e.target.value })}
                  className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Zone Affectée</label>
                <CustomSelect
                  value={techToEdit.id_zone}
                  onChange={(val) => setTechToEdit({ ...techToEdit, id_zone: val })}
                  options={zones.map((z) => ({
                    value: z.id_zone,
                    label: \`\${z.libelle} (\${z.id_zone})\`
                  }))}
                  placeholder="-- Sélectionner une Zone --"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Spécialité</label>
                <input
                  type="text"
                  value={techToEdit.specialite}
                  onChange={(e) => setTechToEdit({ ...techToEdit, specialite: e.target.value })}
                  className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setTechToEdit(null)}
                  className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {techToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-rose-100">
            <div className="bg-rose-50 p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xs mb-3">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">Supprimer ce technicien ?</h3>
              <p className="text-xs text-rose-600/80 font-medium">Action irréversible !</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="text-sm text-slate-600 text-center">
                Êtes-vous sûr de vouloir supprimer <b className="text-slate-900">{techToDelete.nom}</b> ?
              </div>
              
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <p><b>Attention :</b> En supprimant ce technicien :</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Il n'apparaîtra plus dans les filtres.</li>
                  <li>Certains historiques (Mouvements, Interventions) pourraient perdre leur lien actif s'ils dépendent strictement de son ID.</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setTechToDelete(null)}
                  className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onDeleteTechnician(techToDelete.id_technician);
                    setTechToDelete(null);
                  }}
                  className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition"
                >
                  Oui, supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

content = content.replace(/<\/div>\s*< \/div>\s*\)\s*;\s*\}\s*$/m, ''); // remove bottom
content = content.replace(/<\/div>\s*\)\s*;\s*\}\s*$/, modals); // replace exact tail

fs.writeFileSync('src/components/TechniciansView.jsx', content);
console.log('updated modals');
