/**
 * خدمة التخزين المؤقت متعددة المستويات (L1 Memory, L2 LocalStorage)
 * @module CacheService
 */
export class CacheService {
  static #memoryCache = new Map();
  static #defaultTTL = 5 * 60 * 1000; // 5 دقائق افتراضياً

  /**
   * حفظ قيمة في الكاش
   * @param {string} key - المفتاح
   * @param {any} value - القيمة
   * @param {number} ttl - مدة الصلاحية بالمللي ثانية
   * @param {boolean} persist - هل يتم الحفظ في LocalStorage
   */
  static set(key, value, ttl = this.#defaultTTL, persist = false) {
    const expiresAt = Date.now() + ttl;
    const cacheItem = { value, expiresAt };

    // L1: Memory Cache
    this.#memoryCache.set(key, cacheItem);

    // L2: LocalStorage Cache
    if (persist) {
      try {
        localStorage.setItem(`gmao_cache_${key}`, JSON.stringify(cacheItem));
      } catch (e) {
        console.warn('فشل حفظ العنصر في LocalStorage Cache:', e);
      }
    }
  }

  /**
   * استرجاع قيمة من الكاش
   * @param {string} key - المفتاح
   * @returns {any|null}
   */
  static get(key) {
    // 1. فحص L1 Memory
    if (this.#memoryCache.has(key)) {
      const item = this.#memoryCache.get(key);
      if (item.expiresAt > Date.now()) {
        return item.value;
      }
      this.#memoryCache.delete(key);
    }

    // 2. فحص L2 LocalStorage
    try {
      const raw = localStorage.getItem(`gmao_cache_${key}`);
      if (raw) {
        const item = JSON.parse(raw);
        if (item.expiresAt > Date.now()) {
          // ترقية إلى L1 Memory
          this.#memoryCache.set(key, item);
          return item.value;
        }
        localStorage.removeItem(`gmao_cache_${key}`);
      }
    } catch {
      // خطأ في القراءة أو التحليل
    }

    return null;
  }

  /**
   * حذف عنصر من الكاش
   */
  static remove(key) {
    this.#memoryCache.delete(key);
    try {
      localStorage.removeItem(`gmao_cache_${key}`);
    } catch {
      // ignore
    }
  }

  /**
   * مسح جميع عناصر الكاش
   */
  static clear() {
    this.#memoryCache.clear();
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('gmao_cache_'));
      keys.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }
}

export const cache = CacheService;
export default CacheService;
