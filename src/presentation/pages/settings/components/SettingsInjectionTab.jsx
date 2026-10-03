import {
  Sliders,
  Layers,
  Cpu,
  Users,
  Activity,
  Wrench,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';

/**
 * Data Injection Hub: Seed factory baseline data, reset datasets, toggle demo mode.
 */
export default function SettingsInjectionTab({
  handleInjectAll,
  initialStock = [],
  handleInjectGroup,
  initialMachines = [],
  initialZones = [],
  initialTechnicians = [],
  initialMouvements = [],
  initialCorrectiveInterventions = [],
  isDemoMode,
  setIsDemoMode,
  onDownloadBlankTemplate,
  showToast,
  handleSaveSettings,
  handleResetToZero,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
            Centre d'injection des données d'usine
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Injectez les structures et données initiales du projet ou videz complètement la base.
          </p>
        </div>
        <button
          onClick={handleInjectAll}
          className="w-full lg:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
        >
          Injecter Toutes les Données Usine (Excel Twin)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Group 1: Stock */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-600" />
              Stock & Articles ({initialStock.length})
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Injecte la nomenclature intégrale des articles de stock avec leurs références, désignations et emplacements d'ateliers.
            </p>
          </div>
          <button
            onClick={() => handleInjectGroup('stock')}
            className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Injecter le Stock
          </button>
        </div>

        {/* Group 2: Machines */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              Parc Machines ({initialMachines.length})
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Initialise l'ensemble des 47 machines enregistrées de l'usine, leurs familles de production et gabarits structurels.
            </p>
          </div>
          <button
            onClick={() => handleInjectGroup('parc')}
            className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Injecter le Parc Machines
          </button>
        </div>

        {/* Group 3: Teams & Zones */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Zones & Équipes ({initialZones.length + initialTechnicians.length})
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Injecte les 14 zones d'ateliers, les superviseurs d'opérations et le corps des techniciens qualifiés.
            </p>
          </div>
          <button
            onClick={() => handleInjectGroup('zones')}
            className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Injecter les Équipes
          </button>
        </div>

        {/* Group 4: Mouvements */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              Mouvements Historiques ({initialMouvements.length})
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Injecte les 665 écritures de mouvements de stock (Sorties, Entrées, Sorties Externes, Bons de Commande).
            </p>
          </div>
          <button
            onClick={() => handleInjectGroup('mouvements')}
            className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Injecter les Mouvements
          </button>
        </div>

        {/* Group 5: Interventions Correctives */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs space-y-4 col-span-1 sm:col-span-2 lg:col-span-1">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-rose-600" />
              Interventions Correctives ({initialCorrectiveInterventions.length})
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Injecte les 800 fiches de dépannage et bons de travail historiques (Demandes, Pannes, Diagnostic, Réparations).
            </p>
          </div>
          <button
            onClick={() => handleInjectGroup('corrective')}
            className="w-full py-2 bg-slate-50 border border-slate-200 text-rose-700 font-bold text-[11px] rounded-lg hover:bg-rose-50 border-rose-200 transition cursor-pointer"
          >
            Injecter le Correctif
          </button>
        </div>
      </div>

      <div className="pt-5 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <span className="text-xs font-bold text-slate-700">
            Paramétrage de démarrage par défaut :
          </span>
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={isDemoMode}
              onChange={(e) => setIsDemoMode(e.target.checked)}
              className="rounded text-cyan-600 border-slate-300 focus:ring-cyan-500"
            />
            <span>Afficher les maquettes et fiches d'exemples au démarrage</span>
          </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <button
            type="button"
            onClick={() => {
              if (typeof onDownloadBlankTemplate === 'function') {
                onDownloadBlankTemplate();
              } else {
                showToast?.("Téléchargement du gabarit vierge déclenché !", "success");
              }
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Télécharger le modèle Excel vierge pour préparer vos données réelles"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Gabarit Vierge (.XLSX)
          </button>
          <button
            onClick={handleSaveSettings}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition cursor-pointer text-center"
          >
            Enregistrer ma préférence
          </button>
          <button
            onClick={handleResetToZero}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer tout et démarrer à vide
          </button>
        </div>
      </div>
    </div>
  );
}
