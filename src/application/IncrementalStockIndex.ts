export type MovementType = 'ENTREE' | 'SORTIE' | 'COMMANDE';

const TYPE_ALIASES: Record<string, MovementType> = {
  'entree': 'ENTREE',
  'entree interne': 'ENTREE',
  'entree externe': 'ENTREE',
  'reception': 'ENTREE',
  'retour': 'ENTREE',
  'retour atelier': 'ENTREE',
  'in': 'ENTREE',
  'reappro': 'ENTREE',
  'reapprovisionnement': 'ENTREE',
  'entree_retour': 'ENTREE',
  'sortie': 'SORTIE',
  'sortie interne': 'SORTIE',
  'sortie externe': 'SORTIE',
  'bon de sortie': 'SORTIE',
  'consommation': 'SORTIE',
  'out': 'SORTIE',
  'commande': 'COMMANDE',
  'commande_fournisseur': 'COMMANDE',
  'demande': 'COMMANDE',
};

export function normalizeType(raw: string): MovementType | null {
  const t = String(raw ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // strip accents
  return TYPE_ALIASES[t] ?? null;
}

export interface StockTotals {
  entrees: number;
  sorties: number;
  commandes: number;
  lastUpdated: number;
}

export interface MovementDelta {
  ref: string;
  type: string;
  quantity: number;
}

export class IncrementalStockIndex {
  private index = new Map<string, StockTotals>();
  private initialStocks = new Map<string, number>();
  private hydrated = false;

  hasData(): boolean {
    return this.index.size > 0;
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  markHydrated(value = true): void {
    this.hydrated = value;
  }

  setInitialStock(ref: string, qty: number): void {
    this.initialStocks.set(this._key(ref), Number(qty) || 0);
  }

  setAllInitialStocks(initialStockMap: Map<string, number> | Record<string, number>): void {
    if (initialStockMap instanceof Map) {
      initialStockMap.forEach((qty, ref) => {
        this.setInitialStock(ref, qty);
      });
    } else if (typeof initialStockMap === 'object' && initialStockMap !== null) {
      Object.entries(initialStockMap).forEach(([ref, qty]) => {
        this.setInitialStock(ref, Number(qty) || 0);
      });
    }
  }

  rebuild(movements: MovementDelta[], initialStocks?: Map<string, number>): void {
    this.index.clear();
    if (initialStocks) {
      this.initialStocks = new Map(initialStocks);
    }
    for (const m of movements) {
      this._accumulate(m, +1);
    }
  }

  applyDelta(m: MovementDelta): void {
    this._accumulate(m, +1);
  }

  rollbackDelta(m: MovementDelta): void {
    this._accumulate(m, -1);
  }

  updateDelta(args: {
    ref: string;
    oldType: string;
    oldQty: number;
    newType: string;
    newQty: number;
  }): void {
    this._accumulate({ ref: args.ref, type: args.oldType, quantity: args.oldQty }, -1);
    this._accumulate({ ref: args.ref, type: args.newType, quantity: args.newQty }, +1);
  }

  getTotals(ref: string): StockTotals {
    return (
      this.index.get(this._key(ref)) ?? {
        entrees: 0,
        sorties: 0,
        commandes: 0,
        lastUpdated: 0,
      }
    );
  }

  calculateCurrentStock(ref: string, overrideInitial?: number): number {
    const key = this._key(ref);
    const init = overrideInitial ?? this.initialStocks.get(key) ?? 0;
    const { entrees, sorties } = this.getTotals(ref);
    return Math.max(0, init + entrees - sorties); // Clamping strictly happens at calculation time
  }

  private _key(ref: string): string {
    return String(ref ?? '')
      .trim()
      .toUpperCase();
  }

  private _accumulate(m: MovementDelta, sign: 1 | -1): void {
    const key = this._key(m.ref);
    if (!key) return;
    const qty = Number(m.quantity);
    if (!Number.isFinite(qty) || qty === 0) return;

    const type = normalizeType(m.type);
    if (!type) {
      // Gracefully log unknown types for traceability without crashing
      console.warn(`[StockIndex] Unknown type "${m.type}" for ref ${key} — SKIPPED`);
      return;
    }

    let entry = this.index.get(key);
    if (!entry) {
      entry = { entrees: 0, sorties: 0, commandes: 0, lastUpdated: 0 };
      this.index.set(key, entry);
    }

    const delta = sign * qty;
    if (type === 'ENTREE') entry.entrees += delta;
    else if (type === 'SORTIE') entry.sorties += delta;
    else entry.commandes += delta;
    entry.lastUpdated = Date.now();

    // Do NOT clamp raw running totals. Signal inconsistencies if negative.
    if (entry.entrees < 0 || entry.sorties < 0) {
      console.warn('[StockIndex] Negative running total (data inconsistency):', key, entry);
    }
  }
}
