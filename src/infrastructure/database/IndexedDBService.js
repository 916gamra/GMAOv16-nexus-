/**
 * IndexedDB Service - GMAO Industrial Architecture
 * Complete transactional persistence with retries, indexed queries, and fallback support.
 */

class IndexedDBService {
  constructor(dbName = 'GMAO_V16_NEXUS', version = 2) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.retries = 3;
    this.initPromise = null;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize and open the database with retry logic
   */
  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('⚠️ IndexedDB is not available in this environment');
      return null;
    }

    this.initPromise = (async () => {
      for (let i = 0; i < this.retries; i++) {
        try {
          this.db = await this._openDB();
          console.log(`✅ IndexedDB [${this.dbName}] initialized successfully`);
          return this.db;
        } catch (error) {
          console.warn(`IndexedDB open retry ${i + 1}/${this.retries}:`, error);
          if (i === this.retries - 1) {
            console.error('❌ Failed to open IndexedDB after retries:', error);
            throw error;
          }
          await this.delay(1000);
        }
      }
    })();

    return this.initPromise;
  }

  _openDB() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const tx = event.target.transaction;
        this._createStores(db, tx);
      };
    });
  }

  _createStores(db, tx = null) {
    const stores = [
      {
        name: 'machines',
        keyPath: 'id_machine_registered',
        indexes: [
          { name: 'id', keyPath: 'id', unique: false },
          { name: 'id_zone', keyPath: 'id_zone', unique: false },
          { name: 'famille', keyPath: 'famille', unique: false },
          { name: 'statut', keyPath: 'statut', unique: false },
        ],
      },
      {
        name: 'articles',
        keyPath: 'ref',
        indexes: [
          { name: 'type', keyPath: 'type', unique: false },
          { name: 'zone', keyPath: 'zone', unique: false },
          { name: 'alerte', keyPath: 'alerte', unique: false },
        ],
      },
      {
        name: 'warehouse_items',
        keyPath: 'id_warehouse_item',
        indexes: [
          { name: 'id_machine_registered', keyPath: 'id_machine_registered', unique: false },
          { name: 'category', keyPath: 'category', unique: false },
          { name: 'part_type', keyPath: 'part_type', unique: false },
          { name: 'status', keyPath: 'status', unique: false },
        ],
      },
      {
        name: 'movements',
        keyPath: 'id',
        indexes: [
          { name: 'ref', keyPath: 'ref', unique: false },
          { name: 'date', keyPath: 'date', unique: false },
          { name: 'type', keyPath: 'type', unique: false },
        ],
      },
      {
        name: 'interventions',
        keyPath: 'id',
        indexes: [
          { name: 'code_machine', keyPath: 'code_machine', unique: false },
          { name: 'statut', keyPath: 'statut', unique: false },
          { name: 'type_panne', keyPath: 'type_panne', unique: false },
          { name: 'zone', keyPath: 'zone', unique: false },
        ],
      },
      {
        name: 'preventive',
        keyPath: 'id',
        indexes: [
          { name: 'code_machine', keyPath: 'code_machine', unique: false },
          { name: 'statut', keyPath: 'statut', unique: false },
          { name: 'frequence', keyPath: 'frequence', unique: false },
        ],
      },
      {
        name: 'users',
        keyPath: 'id',
        indexes: [
          { name: 'username', keyPath: 'username', unique: false },
          { name: 'role', keyPath: 'role', unique: false },
        ],
      },
    ];

    for (const s of stores) {
      let objectStore;
      if (!db.objectStoreNames.contains(s.name)) {
        objectStore = db.createObjectStore(s.name, { keyPath: s.keyPath });
      } else {
        objectStore = tx ? tx.objectStore(s.name) : null;
      }

      if (objectStore && s.indexes) {
        for (const idx of s.indexes) {
          if (!objectStore.indexNames.contains(idx.name)) {
            objectStore.createIndex(idx.name, idx.keyPath, { unique: idx.unique || false });
          }
        }
      }
    }
  }

  async getStore(storeName, mode = 'readonly') {
    const db = await this.init();
    if (!db) return null;
    const tx = db.transaction([storeName], mode);
    return tx.objectStore(storeName);
  }

  async getAll(storeName) {
    try {
      const store = await this.getStore(storeName, 'readonly');
      if (!store) return [];

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`IndexedDB getAll [${storeName}] failed:`, err);
      return [];
    }
  }

  async get(storeName, key) {
    try {
      const store = await this.getStore(storeName, 'readonly');
      if (!store) return null;

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`IndexedDB get [${storeName}, ${key}] failed:`, err);
      return null;
    }
  }

  async put(storeName, data) {
    try {
      const store = await this.getStore(storeName, 'readwrite');
      if (!store) return false;

      return new Promise((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`IndexedDB put [${storeName}] failed:`, err);
      return false;
    }
  }

  async bulkPut(storeName, items = []) {
    if (!items || items.length === 0) return true;
    try {
      const db = await this.init();
      if (!db) return false;

      return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);

        for (const item of items) {
          store.put(item);
        }

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`IndexedDB bulkPut [${storeName}] failed:`, err);
      return false;
    }
  }

  async delete(storeName, key) {
    try {
      const store = await this.getStore(storeName, 'readwrite');
      if (!store) return false;

      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`IndexedDB delete [${storeName}, ${key}] failed:`, err);
      return false;
    }
  }

  async clear(storeName) {
    try {
      const store = await this.getStore(storeName, 'readwrite');
      if (!store) return false;

      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`IndexedDB clear [${storeName}] failed:`, err);
      return false;
    }
  }

  async query(storeName, indexName, value) {
    try {
      const store = await this.getStore(storeName, 'readonly');
      if (!store) return [];
      const index = store.index(indexName);

      return new Promise((resolve, reject) => {
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`IndexedDB query [${storeName}.${indexName}] failed:`, err);
      return [];
    }
  }
}

export const indexedDBService = new IndexedDBService();
export default indexedDBService;
