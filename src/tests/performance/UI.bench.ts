import { bench, describe } from 'vitest';
import { ExcelFormulaEngine } from '../../core/domain/services/ExcelFormulaEngine';

describe('UI & Formula Engine Benchmarks', () => {
  const generateMovements = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      ref: i % 2 === 0 ? 'ROUL-6204' : 'ROUL-6205',
      type: i % 3 === 0 ? 'Entrée' : 'Sortie',
      quantite: Math.floor(Math.random() * 50) + 1
    }));
  };

  const movements100 = generateMovements(100);
  const movements1000 = generateMovements(1000);

  bench('SUMIFS calculation over 100 movement records', () => {
    ExcelFormulaEngine.sumifs(
      movements100,
      'quantite',
      'ref',
      'ROUL-6204',
      'type',
      'Entrée'
    );
  });

  bench('SUMIFS calculation over 1,000 movement records', () => {
    ExcelFormulaEngine.sumifs(
      movements1000,
      'quantite',
      'ref',
      'ROUL-6204',
      'type',
      'Entrée'
    );
  });

  bench('COUNTIFS calculation over 1,000 movement records', () => {
    ExcelFormulaEngine.countifs(
      movements1000,
      'ref',
      'ROUL-6204',
      'type',
      'Sortie'
    );
  });
});
