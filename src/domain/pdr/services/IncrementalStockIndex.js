/**
 * IncrementalStockIndex.js
 * إدارة تزايدية لفهرس حركات المخزون بـ O(1) للعمليات اليومية و O(M) للإقلاع والاستيراد
 * يحفظ القيمة الفيزيائية الحقيقية (stockPhysique: init + entrees - sorties) مع كشف التناقضات السلبية.
 */
export class IncrementalStockIndex {
  constructor() {
    /** @type {Map<string, { entrees: number, sorties: number }>} */
    this.index = new Map();
    this.isInitialized = false;
  }

  /**
   * بناء أولي / استيراد كامل (Full Rebuild) - O(M)
   * يُستدعى فقط عند إقلاع التطبيق، أو استيراد ملف Excel، أو استعادة Backup
   * @param {Array} movements
   */
  rebuild(movements = []) {
    this.index.clear();
    if (Array.isArray(movements)) {
      for (let i = 0; i < movements.length; i++) {
        const m = movements[i];
        if (!m) continue;
        this._accumulate(m.ref || m.Ref, m.type, Number(m.quantite ?? m.quantity ?? 0));
      }
    }
    this.isInitialized = true;
  }

  /**
   * تطبيق حركة جديدة فورياً بـ O(1)
   * @param {{ ref: string, type: string, quantity?: number, quantite?: number }} movement
   */
  applyDelta({ ref, type, quantity, quantite }) {
    if (!ref) return;
    const qty = Number(quantity ?? quantite ?? 0);
    this._accumulate(ref, type, qty);
  }

  /**
   * التراجع عن حركة أو حذفها بـ O(1) (Undo / Delete)
   * @param {{ ref: string, type: string, quantity?: number, quantite?: number }} movement
   */
  rollbackDelta({ ref, type, quantity, quantite }) {
    if (!ref) return;
    const qty = Number(quantity ?? quantite ?? 0);
    this._accumulate(ref, type, -qty);
  }

  /**
   * تعديل حركة سابقة بـ O(1) (Edit Movement)
   * @param {{ ref: string, oldType: string, oldQty: number, newType: string, newQty: number }} delta
   */
  updateDelta({ ref, oldType, oldQty, newType, newQty }) {
    if (!ref) return;
    this._accumulate(ref, oldType, -Number(oldQty || 0));
    this._accumulate(ref, newType, Number(newQty || 0));
  }

  /**
   * استرجاع مجاميع الصنف بـ O(1)
   * @param {string} ref
   * @returns {{ entrees: number, sorties: number }}
   */
  getTotals(ref) {
    if (!ref) return { entrees: 0, sorties: 0 };
    const key = String(ref).toLowerCase().trim();
    return this.index.get(key) || { entrees: 0, sorties: 0 };
  }

  /**
   * حساب الرصيد الفيزيائي الحقيقي غير المكبوت (Real Physical Stock)
   * @param {string} ref
   * @param {number} initialStock
   * @returns {number}
   */
  calculatePhysicalStock(ref, initialStock = 0) {
    const { entrees, sorties } = this.getTotals(ref);
    return Number(initialStock || 0) + entrees - sorties;
  }

  /**
   * حساب الرصيد الحالي المتاح (Clamped for display if needed)
   * @param {string} ref
   * @param {number} initialStock
   * @param {{ allowNegative?: boolean }} [options]
   * @returns {number}
   */
  calculateCurrentStock(ref, initialStock = 0, options = {}) {
    const physicalStock = this.calculatePhysicalStock(ref, initialStock);
    if (options && options.allowNegative) {
      return physicalStock;
    }
    return Math.max(0, physicalStock);
  }

  /**
   * مؤشر وجود عجز أو تناقض سلبي في المخزون
   * @param {string} ref
   * @param {number} initialStock
   * @returns {boolean}
   */
  hasNegativeDiscrepancy(ref, initialStock = 0) {
    return this.calculatePhysicalStock(ref, initialStock) < 0;
  }

  /**
   * تقرير سلامة مخزون الصنف
   * @param {string} ref
   * @param {number} initialStock
   */
  getStockIntegrity(ref, initialStock = 0) {
    const totals = this.getTotals(ref);
    const physicalStock = this.calculatePhysicalStock(ref, initialStock);
    return {
      physicalStock,
      availableStock: Math.max(0, physicalStock),
      hasNegativeDiscrepancy: physicalStock < 0,
      hasDiscrepancy: physicalStock < 0,
      entrees: totals.entrees,
      sorties: totals.sorties,
    };
  }

  /**
   * مسح الفهرس
   */
  clear() {
    this.index.clear();
    this.isInitialized = false;
  }

  // دالة تجميع داخلية خاصة
  _accumulate(ref, rawType, qty) {
    if (!ref || isNaN(qty) || qty === 0) return;
    const key = String(ref).toLowerCase().trim();
    let entry = this.index.get(key);

    if (!entry) {
      entry = { entrees: 0, sorties: 0 };
      this.index.set(key, entry);
    }

    const t = String(rawType || '').toLowerCase();
    if (t.includes('entr') || t === 'in' || t === 'reception' || t === 'retour') {
      entry.entrees += qty;
    } else if (t.includes('sort') || t === 'out' || t === 'bon de sortie' || t === 'consommation') {
      entry.sorties += qty;
    }
  }
}

export const stockIndex = new IncrementalStockIndex();
export default stockIndex;
