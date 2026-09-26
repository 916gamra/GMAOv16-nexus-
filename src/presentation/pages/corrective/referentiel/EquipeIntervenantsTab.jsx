export default function EquipeIntervenantsTab({
  filteredIntervenants = [],
}) {
  return (
    <div className="space-y-4">
      {/* Result Metrics Sub-Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-sans">
        <span>
          Affichage de <b>{filteredIntervenants.length}</b> intervenants enregistrés
        </span>
        <span className="text-[11px] text-slate-400">
          Historique des interventions et techniciens affectés aux Bons de Travail
        </span>
      </div>

      {/* Grid of Intervenants Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredIntervenants.map((tech, idx) => {
          const name = tech.nom || tech.name || 'Technicien';
          const total = tech.total || 0;

          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-purple-300 transition flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-200 flex items-center justify-center text-purple-700 font-black text-sm shrink-0">
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                    {name}
                  </h4>
                  <span className="text-xs text-slate-500 block mt-0.5">Technicien Correctif</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Interventions
                  </span>
                  <span className="text-lg font-black text-purple-700 font-mono">
                    {total > 0 ? total.toLocaleString() : 'Actif'}
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Disponible
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
