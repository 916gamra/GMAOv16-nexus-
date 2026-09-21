import { Logger } from '../logger/LoggerService.js';

export const BACKUP_STORAGE_KEY = 'gmao_snapshots_history';
export const MAX_SNAPSHOTS = 10;

const CRITICAL_KEYS = [
  'gmao_spare_parts',
  'gmao_movements',
  'gmao_machines',
  'gmao_families',
  'gmao_templates',
  'gmao_types',
  'gmao_diagnostics',
  'gmao_zones',
  'gmao_technicians',
  'gmao_operations',
  'gmao_warehouse_items',
  'gmao_part_types',
  'gmao_part_designations',
  'gmao_users',
  'gmao_access_logs'
];

export class AutoBackupService {
  static changeCounter = 0;
  static autoIntervalId = null;

  /**
   * Captures the current snapshot of all application data
   * @param {string} reason - Cause of snapshot (e.g. 'Avant import Excel', 'Périodique', 'Manuel')
   * @param {boolean} isManual - Whether triggered manually by user
   * @returns {object} The created snapshot object
   */
  static createSnapshot(reason = 'Point de restauration automatique', isManual = false) {
    try {
      const data = {};
      const counts = {};

      for (const key of CRITICAL_KEYS) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            data[key] = parsed;
            if (Array.isArray(parsed)) {
              counts[key.replace('gmao_', '')] = parsed.length;
            }
          }
        } catch {
          // ignore corrupted single key
        }
      }

      const timestamp = Date.now();
      const dateStr = new Date(timestamp).toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const snapshot = {
        id: `snap-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp,
        dateStr,
        reason,
        isManual,
        counts,
        data,
        version: '3.0.0'
      };

      const history = this.listSnapshots();
      history.unshift(snapshot);

      // Keep only last MAX_SNAPSHOTS to prevent localStorage quota exhaustion
      const trimmedHistory = history.slice(0, MAX_SNAPSHOTS);
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(trimmedHistory));

      this.changeCounter = 0;
      Logger.info(`[AutoBackupService] Snapshot created: ${snapshot.id} (${reason})`, { counts });
      return snapshot;
    } catch (err) {
      Logger.error('[AutoBackupService] Failed to create snapshot', err);
      return null;
    }
  }

  /**
   * List all stored snapshots sorted by most recent first
   * @returns {Array} List of snapshot headers/items
   */
  static listSnapshots() {
    try {
      const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch (err) {
      Logger.warn('[AutoBackupService] Could not parse snapshot history', err);
      return [];
    }
  }

  /**
   * Get a specific snapshot by ID
   * @param {string} snapshotId 
   * @returns {object|null}
   */
  static getSnapshot(snapshotId) {
    const list = this.listSnapshots();
    return list.find((s) => s.id === snapshotId) || null;
  }

  /**
   * Restore state from a specific snapshot
   * @param {string} snapshotId 
   * @returns {boolean}
   */
  static restoreSnapshot(snapshotId) {
    try {
      const snapshot = this.getSnapshot(snapshotId);
      if (!snapshot || !snapshot.data) {
        throw new Error(`Snapshot ${snapshotId} not found or corrupted`);
      }

      // Create a safety recovery snapshot before applying restore
      this.createSnapshot('Sauvegarde de sécurité avant restauration', false);

      // Apply snapshot data to localStorage
      for (const [key, value] of Object.entries(snapshot.data)) {
        localStorage.setItem(key, JSON.stringify(value));
      }

      Logger.info(`[AutoBackupService] Successfully restored snapshot: ${snapshotId}`);
      return true;
    } catch (err) {
      Logger.error(`[AutoBackupService] Restore failed for ${snapshotId}`, err);
      return false;
    }
  }

  /**
   * Delete a specific snapshot
   * @param {string} snapshotId 
   * @returns {boolean}
   */
  static deleteSnapshot(snapshotId) {
    try {
      const history = this.listSnapshots();
      const filtered = history.filter((s) => s.id !== snapshotId);
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(filtered));
      Logger.info(`[AutoBackupService] Deleted snapshot: ${snapshotId}`);
      return true;
    } catch (err) {
      Logger.error(`[AutoBackupService] Failed to delete snapshot ${snapshotId}`, err);
      return false;
    }
  }

  /**
   * Export all data as a standalone JSON backup file
   */
  static exportFullBackupJSON() {
    const data = {};
    for (const key of CRITICAL_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) data[key] = JSON.parse(raw);
      } catch {
        // pass
      }
    }

    const payload = {
      app: 'CIOB GMAO Enterprise',
      exportDate: new Date().toISOString(),
      version: '3.0.0',
      data
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CIOB_GMAO_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import data from a JSON backup file
   * @param {string} jsonText 
   * @returns {boolean}
   */
  static importFullBackupJSON(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      const data = parsed.data || parsed;

      // Safety snapshot
      this.createSnapshot('Sauvegarde avant import fichier JSON', false);

      for (const [key, value] of Object.entries(data)) {
        if (CRITICAL_KEYS.includes(key)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }

      Logger.info('[AutoBackupService] Full backup imported successfully');
      return true;
    } catch (err) {
      Logger.error('[AutoBackupService] Failed to import JSON backup', err);
      return false;
    }
  }

  /**
   * Notify that data was modified; triggers an auto-snapshot every N changes
   * @param {number} threshold - Number of changes before auto-snapshot
   */
  static recordChange(threshold = 5) {
    this.changeCounter++;
    if (this.changeCounter >= threshold) {
      this.createSnapshot('Sauvegarde automatique après 5 modifications', false);
    }
  }
}
