import { useState, useMemo } from 'react';
import { Search, X, Package, ArrowUpRight, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function MobileStockView({
  stockItems = [],
  onOpenQuickSortie,
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'alert' | 'rupture' | 'available'

  const filteredItems = useMemo(() => {
    let result = stockItems;

    // Filter by type
    if (filterType === 'alert') {
      result = result.filter((it) => {
        const qte = Number(it.quantite ?? it.stockFinal ?? 0);
        const min = Number(it.min ?? 0);
        return min > 0 && qte <= min;
      });
    } else if (filterType === 'rupture') {
      result = result.filter((it) => Number(it.quantite ?? it.stockFinal ?? 0) <= 0);
    } else if (filterType === 'available') {
      result = result.filter((it) => Number(it.quantite ?? it.stockFinal ?? 0) > 0);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (it) =>
          String(it.ref || '').toLowerCase().includes(q) ||
          String(it.designation || '').toLowerCase().includes(q) ||
          String(it.emplacement || '').toLowerCase().includes(q) ||
          String(it.famille || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [stockItems, search, filterType]);

  const counts = useMemo(() => {
    const alert = stockItems.filter((i) => {
      const q = Number(i.quantite ?? i.stockFinal ?? 0);
      const m = Number(i.min ?? 0);
      return m > 0 && q <= m;
    }).length;

    const rupture = stockItems.filter((i) => Number(i.quantite ?? i.stockFinal ?? 0) <= 0).length;

    return { all: stockItems.length, alert, rupture };
  }, [stockItems]);

  return (
    <div className="space-y-3 pb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par référence, désignation, rayon..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200/90 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-2xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl shrink-0 transition cursor-pointer ${
            filterType === 'all'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-white text-zinc-600 border border-zinc-200'
          }`}
        >
          Tous ({counts.all})
        </button>
        <button
          onClick={() => setFilterType('alert')}
          className={`px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            filterType === 'alert'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-amber-700 border border-amber-200'
          }`}
        >
          <AlertTriangle size={13} />
          <span>En Alerte ({counts.alert})</span>
        </button>
        <button
          onClick={() => setFilterType('rupture')}
          className={`px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            filterType === 'rupture'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-red-600 border border-red-200'
          }`}
        >
          <ShieldAlert size={13} />
          <span>Rupture ({counts.rupture})</span>
        </button>
      </div>

      {/* Parts List */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-400">
            <Package size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Aucune pièce de rechange trouvée</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const qte = Number(item.quantite ?? item.stockFinal ?? 0);
            const min = Number(item.min ?? 0);
            const isOutOfStock = qte <= 0;
            const isLow = min > 0 && qte <= min;

            return (
              <div
                key={item.ref || item.id}
                className="p-3.5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs flex flex-col justify-between gap-2.5 transition active:bg-zinc-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                        {item.ref}
                      </span>
                      {item.emplacement && (
                        <span className="text-[10.5px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                          📍 {item.emplacement}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-zinc-900 mt-1 leading-snug">
                      {item.designation}
                    </h3>
                    {item.famille && (
                      <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                        Famille: {item.famille}
                      </div>
                    )}
                  </div>

                  {/* Stock Quantity Badge */}
                  <div className="text-right shrink-0">
                    <div
                      className={`px-2.5 py-1 rounded-xl text-center font-black text-xs ${
                        isOutOfStock
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : isLow
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <div className="text-sm leading-none">{qte}</div>
                      <div className="text-[9px] font-extrabold uppercase mt-0.5">
                        {isOutOfStock ? 'Rupture' : isLow ? `Min ${min}` : 'En Stock'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Row: 1-Tap Quick Sortie Button */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <div className="text-[11px] text-zinc-500 font-semibold">
                    {item.prix_unitaire ? `${Number(item.prix_unitaire).toFixed(2)} DZD` : ''}
                  </div>
                  <button
                    onClick={() => onOpenQuickSortie?.(item)}
                    disabled={isOutOfStock}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none shadow-2xs cursor-pointer"
                  >
                    <span>Sortie Rapide</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
