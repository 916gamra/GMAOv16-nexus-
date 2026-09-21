import { describe, it, expect, beforeEach } from 'vitest';
import { AutoBackupService, MAX_SNAPSHOTS } from '../../core/backup/AutoBackupService.js';

describe('AutoBackupService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should capture a complete snapshot with counts', () => {
    localStorage.setItem('gmao_spare_parts', JSON.stringify([{ id: 1, ref: 'ROUL-6204' }]));
    localStorage.setItem('gmao_movements', JSON.stringify([{ id: 10, quantite: 5 }]));

    const snap = AutoBackupService.createSnapshot('Test Snapshot', true);
    expect(snap).toBeDefined();
    expect(snap.id).toMatch(/^snap-/);
    expect(snap.isManual).toBe(true);
    expect(snap.counts.spare_parts).toBe(1);
    expect(snap.counts.movements).toBe(1);

    const list = AutoBackupService.listSnapshots();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(snap.id);
  });

  it('should restore data from snapshot correctly', () => {
    localStorage.setItem('gmao_spare_parts', JSON.stringify([{ id: 1, ref: 'OLD-REF' }]));
    const snap1 = AutoBackupService.createSnapshot('Initial state', false);

    // Modify state
    localStorage.setItem('gmao_spare_parts', JSON.stringify([{ id: 2, ref: 'MODIFIED-REF' }]));

    // Restore snap1
    const ok = AutoBackupService.restoreSnapshot(snap1.id);
    expect(ok).toBe(true);

    const restored = JSON.parse(localStorage.getItem('gmao_spare_parts'));
    expect(restored[0].ref).toBe('OLD-REF');
  });

  it('should trim snapshot history to MAX_SNAPSHOTS', () => {
    for (let i = 0; i < MAX_SNAPSHOTS + 5; i++) {
      AutoBackupService.createSnapshot(`Snapshot ${i}`, false);
    }

    const list = AutoBackupService.listSnapshots();
    expect(list.length).toBe(MAX_SNAPSHOTS);
  });

  it('should delete snapshot by ID', () => {
    const snap1 = AutoBackupService.createSnapshot('Snap 1');
    const snap2 = AutoBackupService.createSnapshot('Snap 2');

    expect(AutoBackupService.listSnapshots().length).toBe(2);
    AutoBackupService.deleteSnapshot(snap1.id);

    const remaining = AutoBackupService.listSnapshots();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(snap2.id);
  });

  it('should automatically trigger snapshot when change threshold is reached', () => {
    expect(AutoBackupService.listSnapshots().length).toBe(0);

    for (let i = 0; i < 4; i++) {
      AutoBackupService.recordChange(5);
    }
    expect(AutoBackupService.listSnapshots().length).toBe(0);

    AutoBackupService.recordChange(5); // 5th change
    expect(AutoBackupService.listSnapshots().length).toBe(1);
  });
});
