import { describe, it, expect } from 'vitest';

/**
 * 🧪 Unit tests for Mappers and Data Entity Transformation
 */
describe('Mappers Unit Tests', () => {
  it('يجب تحويل نموذج الحركة المخزنية إلى كائن معتمد', () => {
    const rawMovement = {
      ref_article: 'BEARING-6204',
      type_mvt: 'SORTIE',
      qte: '25',
      user_id: 'TECH-01',
      date_mvt: '2026-09-30T10:00:00Z'
    };

    const mapRawToEntity = (raw) => ({
      stockCode: raw.ref_article,
      type: raw.type_mvt === 'SORTIE' ? 'OUT' : 'IN',
      quantity: Number(raw.qte),
      userId: raw.user_id,
      timestamp: new Date(raw.date_mvt).getTime()
    });

    const mapped = mapRawToEntity(rawMovement);

    expect(mapped.stockCode).toBe('BEARING-6204');
    expect(mapped.type).toBe('OUT');
    expect(mapped.quantity).toBe(25);
    expect(mapped.userId).toBe('TECH-01');
  });

  it('يجب تحويل بطاقة الصيانة إلى صيغة التقرير الموحد', () => {
    const rawWorkOrder = {
      id_bt: 'BT-2026-089',
      machine: 'PRESS-01',
      duree_min: 45,
      cout_pdr: 120.5
    };

    const mapWorkOrderToReport = (wo) => ({
      workOrderId: wo.id_bt,
      machineId: wo.machine,
      durationMinutes: wo.duree_min,
      sparePartsCost: wo.cout_pdr,
      totalCostEstimate: wo.cout_pdr + (wo.duree_min / 60) * 35 // 35 DZD/hr labor rate
    });

    const report = mapWorkOrderToReport(rawWorkOrder);

    expect(report.workOrderId).toBe('BT-2026-089');
    expect(report.durationMinutes).toBe(45);
    expect(report.totalCostEstimate).toBeCloseTo(146.75, 2);
  });
});
