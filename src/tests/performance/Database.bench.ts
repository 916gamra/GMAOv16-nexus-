import { bench, describe } from 'vitest';
import { DatabaseService } from '../../core/database/DatabaseService';

describe('Database Service Benchmarks', () => {
  const db = new DatabaseService();
  
  // Clean up database storage first
  db.close();
  const testDb = new DatabaseService();

  bench('Sequential save of 100 intervention records', async () => {
    for (let i = 0; i < 100; i++) {
      await testDb.save('interventions', {
        id: `DI-BENCH-${i}`,
        code_machine: 'PRESS-A',
        statut: 'DEMANDE',
        anomalie: `Vibration excessive ${i}`
      });
    }
  });

  bench('Bulk read of all saved intervention records', async () => {
    await testDb.getAll('interventions');
  });

  bench('Query item by specific ID from database', async () => {
    await testDb.getById('interventions', 'DI-BENCH-50');
  });
});
