import { describe, it, expect } from 'vitest';
import { calculateCurrentStock, getStockStatus } from '@/domain/stockCalculations';
import { ValidationService } from '@/domain/validators/index.js';
import { monitoringService } from '@/infrastructure/monitoringService.js';

describe('Complete GMAO E2E Workflow Test', () => {
  it('يجب محاكاة الدورة الكاملة: تسجيل، فحص مخزون، صرف سريع، ومراقبة الأداء', async () => {
    const endToEndRun = async () => {
      // 1. Initial items in system
      const stock = {
        code: 'FILTRE-AIR-01',
        designation: 'Filtre à air principal',
        quantity: 10,
        minStock: 3,
        unit: 'U',
      };
      ValidationService.validateStockItem(stock);

      // 2. Perform Quick Out Movement
      const mvt = {
        date: new Date().toISOString(),
        type: 'OUT',
        quantity: 2,
        stockCode: stock.code,
        user: 'Technicien Mounir',
      };
      ValidationService.validateMouvement(mvt);

      // 3. Stock recalculation
      stock.quantity = calculateCurrentStock(stock.quantity, 0, mvt.quantity);
      const status = getStockStatus(stock.quantity, stock.minStock);

      return { finalStock: stock.quantity, status };
    };

    const result = await monitoringService.measure('e2e_complete_flow', endToEndRun);

    expect(result.finalStock).toBe(8);
    expect(result.status).toBe('OPTIMAL');
  });
});
