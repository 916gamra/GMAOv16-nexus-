import { bench, describe } from 'vitest';
import { StockCalculationService } from '../../core/domain/services/StockCalculationService';

describe('Stock Calculation Benchmarks', () => {
  const generateLargeDataset = (articleCount: number, movementCount: number) => {
    const articles = Array.from({ length: articleCount }, (_, i) => ({
      ref: `ROUL-${String(i).padStart(5, '0')}`,
      designation: `Bearing ${i}`,
      stockInitial: Math.floor(Math.random() * 1000) + 10,
      seuil: Math.floor(Math.random() * 50) + 2
    }));

    const movements = Array.from({ length: movementCount }, (_, i) => ({
      ref: `ROUL-${String(Math.floor(Math.random() * articleCount)).padStart(5, '0')}`,
      type: Math.random() > 0.4 ? 'Entrée' : 'Sortie',
      quantite: Math.floor(Math.random() * 10) + 1
    }));

    return { articles, movements };
  };

  const mediumData = generateLargeDataset(500, 2000);
  const largeData = generateLargeDataset(2000, 10000);

  bench('Calculate 500 articles with 2,000 movements', () => {
    StockCalculationService.calculateAllStocks(mediumData.articles, mediumData.movements);
  });

  bench('Calculate 2,000 articles with 10,000 movements', () => {
    StockCalculationService.calculateAllStocks(largeData.articles, largeData.movements);
  });
});
