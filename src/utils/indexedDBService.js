/**
 * IndexedDB Service for CIOB GMAO Light
 * High performance, high capacity 100% offline data store using browser native IndexedDB.
 */
import { Logger } from '../core/logger/LoggerService.js';

const DB_NAME = 'CIOB_GMAO_LIGHT_DB';
const DB_VERSION = 1;

let dbPromise = null;
let dbInstance = null;

/**
 * Executes an async operation with exponential backoff retry logic.
 */
async function executeWithRetry(fn, operationName = 'IndexedDB Operation', maxRetries = 3, baseDelay = 100) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      Logger.warn(
        `⚠️ IDB Retry ${attempt}/${maxRetries} for [${operationName}]: ${error?.message || error}`,
        null,
        'IndexedDB'
      );
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  Logger.error(`❌ IDB Operation [${operationName}] failed after ${maxRetries} retries`, lastError, 'IndexedDB');
  throw lastError;
}

function getDB() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (!dbPromise) {
    dbPromise = executeWithRetry(
      () =>
        new Promise((resolve, reject) => {
          if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB non disponible ou non supporté par ce navigateur'));
            return;
          }

          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('app_data')) {
              db.createObjectStore('app_data');
            }
          };

          request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
          };

          request.onerror = (event) => {
            dbInstance = null;
            reject(event.target.error || new Error('Erreur d\'ouverture IndexedDB'));
          };
        }),
      'Open DB Connection',
      3,
      150
    );
  }

  return dbPromise;
}

export const indexedDBService = {
  async getItem(key, fallback = null) {
    try {
      return await executeWithRetry(
        async () => {
          const db = await getDB();
          return new Promise((resolve, reject) => {
            try {
              const tx = db.transaction('app_data', 'readonly');
              const store = tx.objectStore('app_data');
              const req = store.get(key);
              req.onsuccess = () => resolve(req.result !== undefined ? req.result : fallback);
              req.onerror = () => reject(req.error || new Error('getItem read error'));
            } catch (e) {
              reject(e);
            }
          });
        },
        `getItem(${key})`,
        3,
        100
      );
    } catch (e) {
      Logger.warn('Fallback getItem error after retries:', e, 'IndexedDB');
      return fallback;
    }
  },

  async setItem(key, value) {
    try {
      return await executeWithRetry(
        async () => {
          const db = await getDB();
          return new Promise((resolve, reject) => {
            try {
              const tx = db.transaction('app_data', 'readwrite');
              const store = tx.objectStore('app_data');
              const req = store.put(value, key);
              req.onsuccess = () => resolve(true);
              req.onerror = () => reject(req.error || new Error('setItem write error'));
            } catch (e) {
              reject(e);
            }
          });
        },
        `setItem(${key})`,
        3,
        100
      );
    } catch (e) {
      Logger.warn('Fallback setItem error after retries:', e, 'IndexedDB');
      return false;
    }
  },

  async removeItem(key) {
    try {
      return await executeWithRetry(
        async () => {
          const db = await getDB();
          return new Promise((resolve, reject) => {
            try {
              const tx = db.transaction('app_data', 'readwrite');
              const store = tx.objectStore('app_data');
              const req = store.delete(key);
              req.onsuccess = () => resolve(true);
              req.onerror = () => reject(req.error || new Error('removeItem delete error'));
            } catch (e) {
              reject(e);
            }
          });
        },
        `removeItem(${key})`,
        3,
        100
      );
    } catch (e) {
      Logger.warn('Fallback removeItem error after retries:', e, 'IndexedDB');
      return false;
    }
  },

  async clear() {
    try {
      return await executeWithRetry(
        async () => {
          const db = await getDB();
          return new Promise((resolve, reject) => {
            try {
              const tx = db.transaction('app_data', 'readwrite');
              const store = tx.objectStore('app_data');
              const req = store.clear();
              req.onsuccess = () => resolve(true);
              req.onerror = () => reject(req.error || new Error('clear error'));
            } catch (e) {
              reject(e);
            }
          });
        },
        'clear()',
        3,
        100
      );
    } catch (e) {
      Logger.warn('Fallback clear error after retries:', e, 'IndexedDB');
      return false;
    }
  },

  /**
   * Batch save multiple items in a single readwrite transaction
   * @param {Object|Array<[string, any]>} entries - Key-value map or array of [key, val] tuples
   */
  async setItemsBatch(entries) {
    try {
      return await executeWithRetry(
        async () => {
          const db = await getDB();
          const entriesList = Array.isArray(entries)
            ? entries
            : Object.entries(entries);

          return new Promise((resolve, reject) => {
            try {
              const tx = db.transaction('app_data', 'readwrite');
              const store = tx.objectStore('app_data');

              for (const [key, value] of entriesList) {
                store.put(value, key);
              }

              tx.oncomplete = () => resolve(true);
              tx.onerror = (e) => reject(tx.error || e || new Error('Batch transaction error'));
            } catch (e) {
              reject(e);
            }
          });
        },
        'setItemsBatch()',
        3,
        100
      );
    } catch (e) {
      Logger.warn('Fallback setItemsBatch error after retries:', e, 'IndexedDB');
      return false;
    }
  },

  /**
   * Batch read multiple keys in a single readonly transaction
   * @param {string[]} keys - Array of keys to retrieve
   * @returns {Promise<Object>} Map of key -> value
   */
  async getItemsBatch(keys) {
    try {
      return await executeWithRetry(
        async () => {
          const db = await getDB();
          return new Promise((resolve, reject) => {
            try {
              const tx = db.transaction('app_data', 'readonly');
              const store = tx.objectStore('app_data');
              const results = {};
              let completed = 0;

              if (!keys || keys.length === 0) {
                return resolve(results);
              }

              for (const key of keys) {
                const req = store.get(key);
                req.onsuccess = () => {
                  if (req.result !== undefined) {
                    results[key] = req.result;
                  }
                  completed++;
                  if (completed === keys.length) {
                    resolve(results);
                  }
                };
                req.onerror = () => {
                  completed++;
                  if (completed === keys.length) {
                    resolve(results);
                  }
                };
              }
            } catch (e) {
              reject(e);
            }
          });
        },
        'getItemsBatch()',
        3,
        100
      );
    } catch (e) {
      Logger.warn('Fallback getItemsBatch error after retries:', e, 'IndexedDB');
      return {};
    }
  },

  /**
   * Close connection
   */
  async close() {
    if (dbInstance) {
      try {
        dbInstance.close();
        dbInstance = null;
        dbPromise = null;
      } catch (e) {
        Logger.warn('Error closing database:', e, 'IndexedDB');
      }
    }
  },
};

