import { Logger } from '../logger/LoggerService.js';
import { indexedDBService } from '../../utils/indexedDBService.js';

export const BACKUP_STORAGE_KEY = 'gmao_snapshots_history';
export const MAX_SNAPSHOTS = 12;

const CRITICAL_KEYS = [
  'gmao_full_state_v1',
  'gmao_raw_stock_v6',
  'gmao_spare_parts',
  'gmao_mouvements',
  'gmao_movements',
  'gmao_machines',
  'gmao_families',
  'gmao_templates',
  'gmao_blueprints_v1',
  'gmao_types',
  'gmao_diagnostics',
  'gmao_zones',
  'gmao_technicians',
  'gmao_operations',
  'gmao_warehouse_items',
  'gmao_warehouse_items_v1',
  'gmao_comp_groups_v1',
  'gmao_comp_families_v1',
  'gmao_comp_templates_v1',
  'gmao_part_types',
  'gmao_part_types_v1',
  'gmao_part_designations',
  'gmao_part_designations_v1',
  'gmao_preventive_tasks_v8',
  'gmao_preventive_actions_v2',
  'gmao_preventive_guides_v2',
  'gmao_preventive_plans_v2',
  'gmao_sortie_externe_bobinage_v1',
  'gmao_users',
  'gmao_access_logs',
];

// In-memory cache for fast, synchronous retrieval of recent snapshot payloads
const snapshotDataCache = new Map();

/**
 * High-Capacity, Quota-Safe AutoBackupService.
 * Stores lightweight metadata in localStorage (<2KB) and full snapshot dumps in IndexedDB.
 */
export class AutoBackupService {
  static changeCounter = 0;
  static autoIntervalId = null;
  static isSanitized = false;

  /**
   * Safely writes a key to localStorage with automatic quota management
   * @param {string} key
   * @param {string} value
   */
  static safeSetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      Logger.warn(`[AutoBackupService] LocalStorage quota pressure on '${key}'. Purging legacy history...`, e);
      // Attempt recovery: strip legacy heavy keys from localStorage
      try {
        const rawHistory = localStorage.getItem(BACKUP_STORAGE_KEY);
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory);
          if (Array.isArray(parsed)) {
            const stripped = parsed.map((s) => ({
              id: s.id,
              timestamp: s.timestamp,
              dateStr: s.dateStr,
              reason: s.reason,
              isManual: s.isManual,
              counts: s.counts,
              version: s.version || '3.0.0',
            }));
            localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(stripped.slice(0, 5)));
          }
        }
        // Retry the original setItem
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        Logger.warn('[AutoBackupService] LocalStorage write failed after recovery attempt', retryErr);
        return false;
      }
    }
  }

  /**
   * Cleans up legacy localStorage snapshots that contain large nested data objects
   */
  static sanitizeLegacyStorage() {
    if (this.isSanitized) return;
    this.isSanitized = true;

    try {
      const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (!raw) return;

      const history = JSON.parse(raw);
      if (!Array.isArray(history)) return;

      let hasHeavyPayloads = false;
      const cleanMetadataList = [];

      for (const item of history) {
        if (!item || !item.id) continue;

        if (item.data) {
          hasHeavyPayloads = true;
          // Cache in memory and persist in IndexedDB
          snapshotDataCache.set(item.id, item);
          indexedDBService.setItem(`gmao_snap_${item.id}`, item).catch(() => {});
        }

        // Keep only lightweight metadata for localStorage
        cleanMetadataList.push({
          id: item.id,
          timestamp: item.timestamp || Date.now(),
          dateStr: item.dateStr || new Date().toLocaleString('fr-FR'),
          reason: item.reason || 'Sauvegarde',
          isManual: Boolean(item.isManual),
          counts: item.counts || {},
          version: item.version || '3.0.0',
        });
      }

      if (hasHeavyPayloads) {
        const trimmed = cleanMetadataList.slice(0, MAX_SNAPSHOTS);
        this.safeSetLocalStorage(BACKUP_STORAGE_KEY, JSON.stringify(trimmed));
        Logger.info(`[AutoBackupService] Successfully sanitized ${history.length} snapshots in localStorage`);
      }
    } catch (err) {
      Logger.warn('[AutoBackupService] Sanitization warning', err);
    }
  }

  /**
   * Captures the current snapshot of all application data
   * @param {string} reason - Cause of snapshot (e.g. 'Avant import Excel', 'Périodique', 'Manuel')
   * @param {boolean} isManual - Whether triggered manually by user
   * @returns {object} The created snapshot metadata object
   */
  static createSnapshot(reason = 'Point de restauration automatique', isManual = false) {
    try {
      this.sanitizeLegacyStorage();

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
        second: '2-digit',
      });

      const snapshotId = `snap-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;

      // Full snapshot with data payload
      const fullSnapshot = {
        id: snapshotId,
        timestamp,
        dateStr,
        reason,
        isManual,
        counts,
        data,
        version: '3.0.0',
      };

      // 1. Store full snapshot in memory cache
      snapshotDataCache.set(snapshotId, fullSnapshot);

      // 2. Asynchronously save full snapshot to IndexedDB (virtually unlimited capacity)
      if (indexedDBService && typeof indexedDBService.setItem === 'function') {
        indexedDBService.setItem(`gmao_snap_${snapshotId}`, fullSnapshot).catch((idbErr) => {
          Logger.warn('[AutoBackupService] IndexedDB snapshot persistence warning', idbErr);
        });
      }

      // 3. Store ONLY lightweight metadata in localStorage to guarantee ZERO quota exhaustion
      const metadata = {
        id: snapshotId,
        timestamp,
        dateStr,
        reason,
        isManual,
        counts,
        version: '3.0.0',
      };

      const history = this.listSnapshots();
      // Remove any existing snapshot with same id
      const filtered = history.filter((s) => s.id !== snapshotId);
      filtered.unshift(metadata);

      const trimmedHistory = filtered.slice(0, MAX_SNAPSHOTS);
      this.safeSetLocalStorage(BACKUP_STORAGE_KEY, JSON.stringify(trimmedHistory));

      this.changeCounter = 0;
      Logger.info(`[AutoBackupService] Snapshot created: ${snapshotId} (${reason})`, { counts });
      return fullSnapshot;
    } catch (err) {
      Logger.error('[AutoBackupService] Failed to create snapshot', err);
      return null;
    }
  }

  /**
   * List all stored snapshots sorted by most recent first
   * @returns {Array} List of snapshot headers/metadata items
   */
  static listSnapshots() {
    try {
      this.sanitizeLegacyStorage();
      const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      Logger.warn('[AutoBackupService] Could not parse snapshot history', err);
      return [];
    }
  }

  /**
   * Get a specific snapshot (with data payload) by ID
   * @param {string} snapshotId 
   * @returns {Promise<object|null>|object|null}
   */
  static async getSnapshotAsync(snapshotId) {
    // 1. Check memory cache
    if (snapshotDataCache.has(snapshotId)) {
      return snapshotDataCache.get(snapshotId);
    }

    // 2. Check IndexedDB
    try {
      if (indexedDBService && typeof indexedDBService.getItem === 'function') {
        const fromIDB = await indexedDBService.getItem(`gmao_snap_${snapshotId}`);
        if (fromIDB && fromIDB.data) {
          snapshotDataCache.set(snapshotId, fromIDB);
          return fromIDB;
        }
      }
    } catch (e) {
      Logger.warn(`[AutoBackupService] IDB read failed for ${snapshotId}`, e);
    }

    // 3. Fallback: check localStorage for legacy embedded data
    const list = this.listSnapshots();
    const found = list.find((s) => s.id === snapshotId);
    if (found && found.data) {
      snapshotDataCache.set(snapshotId, found);
      return found;
    }

    return found || null;
  }

  /**
   * Synchronous getSnapshot (checks cache and legacy storage)
   * @param {string} snapshotId 
   * @returns {object|null}
   */
  static getSnapshot(snapshotId) {
    if (snapshotDataCache.has(snapshotId)) {
      return snapshotDataCache.get(snapshotId);
    }
    const list = this.listSnapshots();
    return list.find((s) => s.id === snapshotId) || null;
  }

  /**
   * Restore state from a specific snapshot
   * @param {string} snapshotId 
   * @returns {Promise<boolean>}
   */
  static async restoreSnapshot(snapshotId) {
    try {
      let snapshot = snapshotDataCache.get(snapshotId);

      if (!snapshot || !snapshot.data) {
        snapshot = await this.getSnapshotAsync(snapshotId);
      }

      if (!snapshot || !snapshot.data) {
        throw new Error(`Snapshot ${snapshotId} not found or has no restorable data`);
      }

      // Create a safety recovery snapshot before applying restore
      this.createSnapshot('Sauvegarde de sécurité avant restauration', false);

      // Apply snapshot data to localStorage
      for (const [key, value] of Object.entries(snapshot.data)) {
        if (value !== undefined && value !== null) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (storageErr) {
            Logger.warn(`[AutoBackupService] Could not write ${key} to localStorage`, storageErr);
          }
        }
      }

      // Also persist to IndexedDB
      try {
        if (indexedDBService && typeof indexedDBService.setItemsBatch === 'function') {
          await indexedDBService.setItemsBatch(snapshot.data);
        }
      } catch (idbErr) {
        Logger.warn('[AutoBackupService] IDB batch sync warning on restore', idbErr);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gmao:state_synced', { detail: snapshot.data }));
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
      snapshotDataCache.delete(snapshotId);
      if (indexedDBService && typeof indexedDBService.deleteItem === 'function') {
        indexedDBService.deleteItem(`gmao_snap_${snapshotId}`).catch(() => {});
      }

      const history = this.listSnapshots();
      const filtered = history.filter((s) => s.id !== snapshotId);
      this.safeSetLocalStorage(BACKUP_STORAGE_KEY, JSON.stringify(filtered));

      Logger.info(`[AutoBackupService] Deleted snapshot: ${snapshotId}`);
      return true;
    } catch (err) {
      Logger.error(`[AutoBackupService] Failed to delete snapshot ${snapshotId}`, err);
      return false;
    }
  }

  /**
   * Export all current data as a standalone JSON backup file
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
      data,
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
          this.safeSetLocalStorage(key, JSON.stringify(value));
        }
      }

      // Also batch persist to IndexedDB
      indexedDBService.setItemsBatch(data).catch(() => {});

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gmao:state_synced', { detail: data }));
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
  static recordChange(threshold = 10) {
    this.changeCounter++;
    if (this.changeCounter >= threshold) {
      this.createSnapshot('Sauvegarde automatique après modifications', false);
    }
  }
}

// Automatically trigger sanitization on startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    AutoBackupService.sanitizeLegacyStorage();
  }, 100);
}

