import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';
import { Logger } from '../core/logger/LoggerService.js';

// Cache configuration
const MAX_CACHE_SIZE = 50;
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Map for memory cache with access timestamp
let memoryCache = new Map();
let lastCleanupTime = Date.now();

// Function to clean up stale cache entries
function cleanupCache() {
  const now = Date.now();
  const keysToDelete = [];

  // Remove entries not accessed for more than 10 minutes
  for (const [key, value] of memoryCache) {
    if (value && value._lastAccessed && (now - value._lastAccessed) > 10 * 60 * 1000) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => memoryCache.delete(key));

  // If cache still exceeds limit, evict the oldest 20%
  if (memoryCache.size > MAX_CACHE_SIZE) {
    const keys = Array.from(memoryCache.keys());
    const keysToRemove = keys.slice(0, Math.floor(keys.length * 0.2));
    keysToRemove.forEach(key => memoryCache.delete(key));
  }

  lastCleanupTime = now;
}

// Periodic cleanup
if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
  const timer = setInterval(() => {
    if (Date.now() - lastCleanupTime > CACHE_CLEANUP_INTERVAL) {
      cleanupCache();
    }
  }, CACHE_CLEANUP_INTERVAL);
  if (timer && typeof timer.unref === 'function') {
    timer.unref();
  }
}

// Legacy keys for migration only
const OLD_SECURE_STORAGE_KEY = 'CIOB_GMAO_CLIENT_PERSISTENCE_SALT_KEY_987654321!';
const KEY_STORE_NAME = 'gmao_crypto_keys';
const KEY_ID = 'main_aes_gcm_key';

let webCryptoKey = null;

// Pre-populate memoryCache from localStorage safely on startup
try {
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('gmao_')) {
        const item = localStorage.getItem(k);
        if (item && !item.startsWith('WC:') && !item.startsWith('U2FsdGVkX1')) {
          try {
            const parsed = JSON.parse(item);
            memoryCache.set(k, { data: parsed, _lastAccessed: Date.now() });
          } catch {
            memoryCache.set(k, { data: item, _lastAccessed: Date.now() });
          }
        }
      }
    }
  }
} catch (e) {
  Logger.warn('Initial localStorage read error:', e, 'storageService');
}

// Resilient IDB helper with strict timeout to prevent hangs in iframes
const idbKeyStore = {
  get(key) {
    return new Promise((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') return resolve(null);
        const timer = setTimeout(() => resolve(null), 300);
        const request = indexedDB.open('GMAO_Crypto_Store', 1);
        request.onupgradeneeded = (e) => {
          try {
            e.target.result.createObjectStore(KEY_STORE_NAME);
          } catch {}
        };
        request.onsuccess = (e) => {
          clearTimeout(timer);
          try {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(KEY_STORE_NAME)) return resolve(null);
            const tx = db.transaction(KEY_STORE_NAME, 'readonly');
            const store = tx.objectStore(KEY_STORE_NAME);
            const getReq = store.get(key);
            getReq.onsuccess = () => resolve(getReq.result || null);
            getReq.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        };
        request.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };
        request.onblocked = () => {
          clearTimeout(timer);
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  },
  set(key, val) {
    return new Promise((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') return resolve();
        const timer = setTimeout(() => resolve(), 300);
        const request = indexedDB.open('GMAO_Crypto_Store', 1);
        request.onupgradeneeded = (e) => {
          try {
            e.target.result.createObjectStore(KEY_STORE_NAME);
          } catch {}
        };
        request.onsuccess = (e) => {
          clearTimeout(timer);
          try {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(KEY_STORE_NAME)) return resolve();
            const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
            const store = tx.objectStore(KEY_STORE_NAME);
            store.put(val, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          } catch {
            resolve();
          }
        };
        request.onerror = () => {
          clearTimeout(timer);
          resolve();
        };
        request.onblocked = () => {
          clearTimeout(timer);
          resolve();
        };
      } catch {
        resolve();
      }
    });
  },
};

const base64ToArrayBuffer = (base64) => {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
  return bytes.buffer;
};

export const storageService = {
  _isInitializing: false,

  /**
   * Safe asynchronous initialization for legacy migration without blocking UI
   */
  async init() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (this._isInitializing) return;
    this._isInitializing = true;

    try {
      // 1. Safe WebCrypto key check if legacy WC: items exist
      let hasWcItems = false;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('gmao_')) {
            const val = localStorage.getItem(k);
            if (val && val.startsWith('WC:')) {
              hasWcItems = true;
              break;
            }
          }
        }
      } catch (e) {
        Logger.warn('Error checking localStorage:', e, 'storageService');
      }

      if (hasWcItems && typeof crypto !== 'undefined' && crypto.subtle) {
        try {
          let key = await idbKeyStore.get(KEY_ID);
          if (key) {
            webCryptoKey = key;
          }
        } catch (e) {
          Logger.warn('Error getting WebCrypto key:', e, 'storageService');
        }
      }

      // 2. Migrate legacy encrypted items to clean JSON
      const migratedKeys = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('gmao_')) continue;
        if (migratedKeys.has(k)) continue;

        try {
          const item = localStorage.getItem(k);
          if (!item) continue;

          let decryptedObj = null;

          if (item.startsWith('WC:') && webCryptoKey) {
            try {
              const parts = item.split(':');
              if (parts.length < 3) continue;
              const iv = base64ToArrayBuffer(parts[1]);
              const cipher = base64ToArrayBuffer(parts[2]);
              const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: new Uint8Array(iv) },
                webCryptoKey,
                cipher
              );
              const dec = new TextDecoder();
              decryptedObj = JSON.parse(dec.decode(decryptedBuffer));
            } catch (e) {
              Logger.warn(`WC migration skipped for ${k}:`, e, 'storageService');
            }
          } else if (item.startsWith('U2FsdGVkX1')) {
            try {
              const bytes = CryptoJS.AES.decrypt(item, OLD_SECURE_STORAGE_KEY);
              const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
              if (decryptedText) decryptedObj = JSON.parse(decryptedText);
            } catch (e) {
              Logger.warn(`Legacy AES migration skipped for ${k}:`, e, 'storageService');
            }
          }

          // If decrypted successfully, update memory cache and save clean JSON in localStorage
          if (decryptedObj !== null) {
            memoryCache.set(k, { data: decryptedObj, _lastAccessed: Date.now() });
            migratedKeys.add(k);
            try {
              localStorage.setItem(k, JSON.stringify(decryptedObj));
            } catch {}
          }
        } catch (e) {
          Logger.warn(`Error migrating key ${k}:`, e, 'storageService');
        }
      }
    } catch (e) {
      Logger.warn('Safe background init completed with notice:', e, 'storageService');
    } finally {
      this._isInitializing = false;
    }
  },

  /**
   * Synchronous retrieval with memory cache and localStorage fallback
   */
  getItem(key, fallback = null) {
    const cached = memoryCache.get(key);
    if (cached !== undefined) {
      if (cached && typeof cached === 'object') {
        cached._lastAccessed = Date.now();
        return cached.data !== undefined ? cached.data : cached;
      }
      return cached;
    }

    try {
      if (typeof localStorage === 'undefined') return fallback;
      const item = localStorage.getItem(key);
      if (item === null || item === undefined) return fallback;

      // If it's a legacy encrypted token waiting for migration, return fallback safely
      if (typeof item === 'string' && (item.startsWith('WC:') || item.startsWith('U2FsdGVkX1'))) {
        return fallback;
      }

      try {
        const parsed = JSON.parse(item);
        memoryCache.set(key, { data: parsed, _lastAccessed: Date.now() });
        return parsed;
      } catch {
        memoryCache.set(key, { data: item, _lastAccessed: Date.now() });
        return item;
      }
    } catch {
      return fallback;
    }
  },

  /**
   * Synchronous storage with immediate persistence to localStorage and memoryCache
   */
  setItem(key, value) {
    memoryCache.set(key, { data: value, _lastAccessed: Date.now() });

    // Evict oldest if exceeding capacity
    if (memoryCache.size > MAX_CACHE_SIZE) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }

    try {
      if (typeof localStorage !== 'undefined') {
        if (value === null || value === undefined) {
          localStorage.removeItem(key);
          memoryCache.delete(key);
        } else if (typeof value === 'object') {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          localStorage.setItem(key, String(value));
        }
      }
    } catch (e) {
      Logger.warn(`localStorage write error for ${key}:`, e, 'storageService');
      memoryCache.delete(key);
    }
    return true;
  },

  /**
   * Remove item from memory cache and localStorage
   */
  removeItem(key) {
    memoryCache.delete(key);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
    return true;
  },

  /**
   * Clear entire memory cache
   */
  clearCache() {
    memoryCache.clear();
  },

  /**
   * Get current cache size
   */
  getCacheSize() {
    return memoryCache.size;
  },

  /**
   * Convenience method to save updated stock articles
   */
  saveArticles(articles) {
    return this.setItem('gmao_raw_stock_v6', articles);
  },

  /**
   * Hash PIN code
   */
  hashPin(pin) {
    try {
      return bcrypt.hashSync(pin.trim(), 10);
    } catch {
      return CryptoJS.SHA256(pin.trim()).toString();
    }
  },

  /**
   * Verify input PIN against stored bcrypt or sha256 hash
   */
  verifyPin(inputPin, storedValue) {
    if (!storedValue) return false;
    const cleanInput = inputPin.trim();
    if (storedValue.startsWith('$2a$') || storedValue.startsWith('$2b$')) {
      try {
        return bcrypt.compareSync(cleanInput, storedValue);
      } catch {
        return false;
      }
    }
    if (storedValue.length === 64 && /^[0-9a-f]+$/i.test(storedValue)) {
      return CryptoJS.SHA256(cleanInput).toString() === storedValue;
    }
    const matchedPlain = cleanInput === storedValue.trim();
    if (matchedPlain) {
      const newHash = this.hashPin(cleanInput);
      this.setItem('gmao_admin_pin', newHash);
    }
    return matchedPlain;
  },
};
