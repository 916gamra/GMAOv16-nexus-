import { describe, it, expect } from 'vitest';
import { calculateCurrentStock, getStockStatus } from '@/domain/stockCalculations';

describe('Stock Calculations Unit Tests', () => {
  it('يجب حساب المخزون الفعلي بشكل صحيح', () => {
    const initial = 100;
    const entries = 50;
    const exits = 30;

    const result = calculateCurrentStock(initial, entries, exits);
    expect(result).toBe(120);
  });

  it('يجب تحديد حالة المخزون بشكل صحيح عند الوصول لحد التنبيه', () => {
    const stock = 5;
    const minimum = 10;

    const status = getStockStatus(stock, minimum);
    expect(status).toBe('ALERTE');
  });

  it('يجب تحديد حالة النفاد RUPTURE عند نفاذ المخزون', () => {
    const stock = 0;
    const minimum = 10;

    const status = getStockStatus(stock, minimum);
    expect(status).toBe('RUPTURE');
  });

  it('يجب منع المخزون السالب وحمايته بصفر كحد أدنى', () => {
    const initial = 10;
    const entries = 0;
    const exits = 20;

    const result = calculateCurrentStock(initial, entries, exits);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBe(0);
  });
});
