import { describe, it, expect } from 'vitest';
import {
  BASELINE_STOCK_ITEMS,
  INITIAL_STOCK_LOOKUP,
  getBaselineStockItem,
} from '../../utils/baselineStock';

describe('baselineStock Utility', () => {
  it('should generate baseline stock items array', () => {
    expect(Array.isArray(BASELINE_STOCK_ITEMS)).toBe(true);
    expect(BASELINE_STOCK_ITEMS.length).toBeGreaterThan(0);
  });

  it('should ensure each baseline stock item has required fields', () => {
    const item = BASELINE_STOCK_ITEMS[0];
    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
    expect(item.ref).toBeDefined();
    expect(item.designation).toBeDefined();
    expect(item.type).toBeDefined();
    expect(typeof item.qty).toBe('number');
    expect(typeof item.seuil).toBe('number');
    expect(item.emplacement).toBeDefined();
  });

  it('should populate INITIAL_STOCK_LOOKUP map for fast lookups', () => {
    expect(INITIAL_STOCK_LOOKUP.size).toBeGreaterThan(0);
  });

  it('should find item by ref or designation using getBaselineStockItem', () => {
    const first = BASELINE_STOCK_ITEMS[0];
    const foundByRef = getBaselineStockItem(first.ref);
    expect(foundByRef).toBeDefined();
    expect(foundByRef.ref).toBe(first.ref);

    const foundByDesig = getBaselineStockItem(first.designation);
    expect(foundByDesig).toBeDefined();
  });

  it('should return null for non-existent references', () => {
    expect(getBaselineStockItem('NON_EXISTENT_REF_XYZ_12345')).toBeNull();
    expect(getBaselineStockItem('')).toBeNull();
    expect(getBaselineStockItem(null)).toBeNull();
  });
});
