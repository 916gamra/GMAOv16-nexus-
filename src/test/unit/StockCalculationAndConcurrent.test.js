import { describe, it, expect } from 'vitest';
import { StockCalculationService } from '../../domain/pdr/services/StockCalculationService.js';

describe('Stock Calculation, Availability & Concurrent Operations Tests', () => {
  const sampleArticles = [
    { ref: 'PDR-001', designation: 'Roulement à billes', stockInitial: 100, seuil: 20, unitPrice: 15 },
    { ref: 'PDR-002', designation: 'Joint d\'étanchéité', stockInitial: 10, seuil: 15, unitPrice: 5 },
    { ref: 'PDR-003', designation: 'Courroie V', stockInitial: 0, seuil: 5, unitPrice: 30 },
  ];

  const sampleMovements = [
    { id: 'MVT-1', ref: 'PDR-001', type: 'Entrée', quantite: 20, date: '2026-09-01' },
    { id: 'MVT-2', ref: 'PDR-001', type: 'Sortie Interne', quantite: 30, date: '2026-09-02' },
    { id: 'MVT-3', ref: 'PDR-002', type: 'Sortie Externe', quantite: 8, date: '2026-09-03' },
  ];

  it('should calculate entrees, sorties, and stockActuel accurately', () => {
    StockCalculationService.clearCache();

    const entreesPDR1 = StockCalculationService.calculateEntrees('PDR-001', sampleMovements);
    expect(entreesPDR1).toBe(20);

    const sortiesPDR1 = StockCalculationService.calculateSorties('PDR-001', sampleMovements);
    expect(sortiesPDR1).toBe(30);

    // Initial(100) + Entrees(20) - Sorties(30) = 90
    const stockPDR1 = StockCalculationService.calculateStockActuel(sampleArticles[0], sampleMovements);
    expect(stockPDR1).toBe(90);

    // Initial(10) + Entrees(0) - Sorties(8) = 2
    const stockPDR2 = StockCalculationService.calculateStockActuel(sampleArticles[1], sampleMovements);
    expect(stockPDR2).toBe(2);
  });

  it('should validate stock availability before creating sorties', () => {
    // PDR-001 has 90 available
    const check1 = StockCalculationService.checkAvailability('PDR-001', 50, sampleArticles[0], sampleMovements);
    expect(check1.available).toBe(true);

    // Requesting 150 > 90
    const check2 = StockCalculationService.checkAvailability('PDR-001', 150, sampleArticles[0], sampleMovements);
    expect(check2.available).toBe(false);
    expect(check2.shortage).toBe(60);
    expect(check2.message).toContain('Stock insuffisant');
  });

  it('should handle concurrent movements sequentially using queueConcurrentMovement', async () => {
    const executedSequence = [];

    const task1 = StockCalculationService.queueConcurrentMovement('PDR-001', async () => {
      await new Promise((res) => setTimeout(res, 50));
      executedSequence.push('MVT_1_DONE');
      return 'OK1';
    });

    const task2 = StockCalculationService.queueConcurrentMovement('PDR-001', async () => {
      executedSequence.push('MVT_2_DONE');
      return 'OK2';
    });

    const [r1, r2] = await Promise.all([task1, task2]);
    expect(r1).toBe('OK1');
    expect(r2).toBe('OK2');
    expect(executedSequence).toEqual(['MVT_1_DONE', 'MVT_2_DONE']);
  });

  it('should generate comprehensive stock report with status counts and total valuations', () => {
    const report = StockCalculationService.generateStockReport(sampleArticles, sampleMovements);

    expect(report.totalArticles).toBe(3);
    expect(report.summary.ok).toBe(1); // PDR-001 (90 > 20)
    expect(report.summary.alerte).toBe(1); // PDR-002 (2 <= 15)
    expect(report.summary.rupture).toBe(1); // PDR-003 (0 <= 0)

    // Valuation: (90 * 15) + (2 * 5) + (0 * 30) = 1350 + 10 = 1360
    expect(report.totalValue).toBe(1360);
  });
});
