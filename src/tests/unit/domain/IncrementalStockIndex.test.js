import { describe, it, expect, beforeEach } from 'vitest';
import { IncrementalStockIndex } from '../../../domain/pdr/services/IncrementalStockIndex.js';

describe('IncrementalStockIndex Invariant Tests', () => {
  let index;

  beforeEach(() => {
    index = new IncrementalStockIndex();
  });

  it('Invariant 1: التعديل التزايدي applyDelta يطابق تماماً نتيجة الـ Full Rebuild', () => {
    const rawMovements = [
      { ref: 'PDR-001', type: 'Entrée', quantite: 50 },
      { ref: 'PDR-002', type: 'Entrée', quantite: 30 },
      { ref: 'PDR-001', type: 'Sortie', quantite: 15 },
    ];

    // 1. بناء كامل
    index.rebuild(rawMovements);
    const fullBuildStock = index.calculateCurrentStock('PDR-001', 10); // 10 + 50 - 15 = 45

    // 2. تطبيق تزايدي لنفس الحركات
    const incrementalIndex = new IncrementalStockIndex();
    rawMovements.forEach((m) => incrementalIndex.applyDelta(m));
    const incrementalStock = incrementalIndex.calculateCurrentStock('PDR-001', 10);

    expect(incrementalStock).toBe(fullBuildStock);
    expect(incrementalStock).toBe(45);
  });

  it('Invariant 2: دقة الـ Rollback (تطبيق حركة ثم التراجع عنها يعيد الرصيد كما كان)', () => {
    index.rebuild([{ ref: 'ROUL-6204', type: 'Entrée', quantite: 100 }]);
    const initial = index.calculateCurrentStock('ROUL-6204', 20);

    // صرف 25 قطعة
    index.applyDelta({ ref: 'ROUL-6204', type: 'Sortie', quantity: 25 });
    expect(index.calculateCurrentStock('ROUL-6204', 20)).toBe(95);

    // إلغاء عملية الصرف
    index.rollbackDelta({ ref: 'ROUL-6204', type: 'Sortie', quantity: 25 });
    expect(index.calculateCurrentStock('ROUL-6204', 20)).toBe(initial);
  });

  it('Invariant 3: تعديل حركة سابقة updateDelta يُحدث الرصيد بدقة ذرية', () => {
    index.applyDelta({ ref: 'COURROIE-B52', type: 'Sortie', quantity: 10 });
    // تم اكتشاف أن الفني صرف 4 قطع فقط بدلاً من 10
    index.updateDelta({
      ref: 'COURROIE-B52',
      oldType: 'Sortie',
      oldQty: 10,
      newType: 'Sortie',
      newQty: 4,
    });

    const stock = index.calculateCurrentStock('COURROIE-B52', 50); // 50 - 4 = 46
    expect(stock).toBe(46);
  });
});
