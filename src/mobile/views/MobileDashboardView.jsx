import { useMemo } from 'react';
import {
  Package,
  Search,
  Cpu,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function MobileDashboardView({
  stockItems = [],
  machines = [],
  preventiveTasks = [],
  onNavigateTab,
  onOpenQuickSortie,
  linkedFileName,
  onDirectSave,
}) {
  // Stock alert calculation: parts with stock <= min threshold
  const stockAlerts = useMemo(() => {
    return stockItems
      .filter((item) => {
        const qte = Number(item.quantite ?? item.stockFinal ?? 0);
        const min = Number(item.min ?? 0);
        return min > 0 && qte <= min;
      })
      .slice(0, 10);
  }, [stockItems]);

  // Out of stock
  const outOfStockCount = useMemo(() => {
    return stockItems.filter((i) => Number(i.quantite ?? i.stockFinal ?? 0) <= 0).length;
  }, [stockItems]);

  // Due preventive tasks
  const pendingPreventive = useMemo(() => {
    return preventiveTasks.filter(
      (t) => !t.statut || t.statut.toLowerCase() !== 'termine' && t.statut.toLowerCase() !== 'terminé'
    );
  }, [preventiveTasks]);

  return (
    <div className="space-y-4 pb-4">
      {/* Excel Sync Status Banner */}
      <div className="p-3 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-900 truncate">
              {linkedFileName ? `Fichier lié: ${linkedFileName}` : 'Base de données active (Mémoire locale)'}
            </div>
            <div className="text-[10.5px] text-zinc-500 font-medium">Synchronisation GMAO Light</div>
          </div>
        </div>
        {linkedFileName && onDirectSave && (
          <button
            onClick={onDirectSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition shrink-0 cursor-pointer shadow-xs"
          >
            <Save size={13} />
            <span>Enregistrer</span>
          </button>
        )}
      </div>

      {/* 4 Prominent Industrial Quick-Action Cards */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 mb-2.5 px-1">
          Actions Rapides Médiaires
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Sortie Rapide */}
          <button
            onClick={onOpenQuickSortie}
            className="p-4 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 text-white shadow-md active:scale-97 transition-all text-left flex flex-col justify-between h-28 relative overflow-hidden group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <Package size={22} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25">
                Sortie
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight">Sortie PDR Rapide</div>
              <div className="text-[11px] text-amber-100 font-medium mt-0.5">Prélever une pièce</div>
            </div>
          </button>

          {/* 2. Recherche Stock */}
          <button
            onClick={() => onNavigateTab('stock')}
            className="p-4 rounded-2xl bg-linear-to-br from-emerald-600 to-emerald-700 text-white shadow-md active:scale-97 transition-all text-left flex flex-col justify-between h-28 relative overflow-hidden group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <Search size={22} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25">
                {stockItems.length}
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight">Recherche Stock</div>
              <div className="text-[11px] text-emerald-100 font-medium mt-0.5">Dispo & Emplacement</div>
            </div>
          </button>

          {/* 3. Parc Machines */}
          <button
            onClick={() => onNavigateTab('machines')}
            className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs hover:border-zinc-300 active:scale-97 transition-all text-left flex flex-col justify-between h-28 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Cpu size={22} />
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {machines.length}
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-zinc-900 leading-tight">Parc Machines</div>
              <div className="text-[11px] text-zinc-500 font-medium mt-0.5">Fiches & Spécifications</div>
            </div>
          </button>

          {/* 4. Maintenance Préventive */}
          <button
            onClick={() => onNavigateTab('preventive')}
            className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs hover:border-zinc-300 active:scale-97 transition-all text-left flex flex-col justify-between h-28 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Calendar size={22} />
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {pendingPreventive.length}
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-zinc-900 leading-tight">Préventif</div>
              <div className="text-[11px] text-zinc-500 font-medium mt-0.5">Tâches planifiées</div>
            </div>
          </button>
        </div>
      </div>

      {/* Critical Stock Alerts Section */}
      <div className="rounded-2xl bg-white border border-zinc-200/90 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/15 text-red-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Alertes Stock Critique</h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            {stockAlerts.length} pièces
          </span>
        </div>

        {stockAlerts.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-50 rounded-xl">
            Aucune rupture ni alerte critique pour le moment.
          </div>
        ) : (
          <div className="space-y-2">
            {stockAlerts.map((item) => {
              const qte = Number(item.quantite ?? item.stockFinal ?? 0);
              const min = Number(item.min ?? 0);
              const isRupture = qte <= 0;

              return (
                <div
                  key={item.ref || item.id}
                  className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-zinc-900">{item.ref}</span>
                      {item.emplacement && (
                        <span className="text-[10px] font-semibold text-zinc-500 px-1.5 py-0.2 rounded-md bg-white border border-zinc-200">
                          {item.emplacement}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-600 truncate mt-0.5 font-medium">
                      {item.designation}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                        isRupture
                          ? 'bg-red-500 text-white'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {qte} / Min {min}
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => onNavigateTab('stock')}
              className="w-full mt-2 py-2 text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Voir tout le stock en alerte</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Key Numbers Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
          <div className="text-[10.5px] font-bold text-zinc-500 uppercase">Articles PDR</div>
          <div className="text-lg font-black text-zinc-900 mt-0.5">{stockItems.length}</div>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
          <div className="text-[10.5px] font-bold text-zinc-500 uppercase">Ruptures</div>
          <div className={`text-lg font-black mt-0.5 ${outOfStockCount > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
            {outOfStockCount}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
          <div className="text-[10.5px] font-bold text-zinc-500 uppercase">Parc Actif</div>
          <div className="text-lg font-black text-zinc-900 mt-0.5">{machines.length}</div>
        </div>
      </div>
    </div>
  );
}
