import { Logger } from '../../../core/logger/LoggerService.js';
import { safeNum, calculateStockStatus } from '../../../utils/formulaEngine.js';
import { multiLevelCacheManager } from '../../../core/cache/MultiLevelCacheManager.js';

/**
 * Enhanced Stock Calculation Service for CIOB GMAO Light
 * Features:
 * - Multi-Level Caching with L1/L2/L3 MultiLevelCacheManager integration
 * - O(1) Lookups & Movement Hash Caching
 * - Pre-dispatch Stock Availability Validation
 * - Concurrent Movement Lock Queueing
 * - Stock Report & Metrics Generation
 */
export class StockCalculationService {
  static cache = new Map();
  static cacheTtlMs = 5000; // 5s cache TTL
  static movementQueue = new Map(); // Key: ref -> Promise chain for concurrency control

  /**
   * Helper to compute unique hash for movement arrays
   */
  static getMovementHash(movements) {
    if (!Array.isArray(movements) || movements.length === 0) return 'mvt_0';
    const last = movements[movements.length - 1];
    return `mvt_${movements.length}_${last?.id || last?.code_bon || Date.now()}`;
  }

  /**
   * Clears calculation cache and invalidates multi-level cache tags
   */
  static clearCache() {
    this.cache.clear();
    multiLevelCacheManager.invalidateByTag('stock');
    multiLevelCacheManager.invalidateByTag('formula');
  }

  /**
   * Calculate total entrees for an article with caching
   * ✅ Excel SUMIFS equivalent
   */
  static calculateEntrees(ref, movements = []) {
    try {
      if (!ref) return 0;
      const refKey = String(ref).toLowerCase().trim();
      const hash = `${refKey}_entrees_${this.getMovementHash(movements)}`;

      if (this.cache.has(hash)) {
        const cached = this.cache.get(hash);
        if (Date.now() - cached.timestamp < this.cacheTtlMs) {
          return cached.value;
        }
      }

      const entrees = movements.reduce((sum, m) => {
        if (!m) return sum;
        const mRef = String(m.ref || m.Ref || '').toLowerCase().trim();
        const mType = String(m.type || '').toLowerCase();
        if (mRef === refKey && (mType.includes('entrée') || mType.includes('entree'))) {
          return sum + safeNum(m.quantite || m.quantity, 0);
        }
        return sum;
      }, 0);

      this.cache.set(hash, { value: entrees, timestamp: Date.now() });
      return entrees;
    } catch (error) {
      Logger.error('❌ Entrees calculation failed', error, 'StockCalc');
      return 0;
    }
  }

  /**
   * Calculate total sorties for an article with caching
   * ✅ Excel SUMIFS equivalent
   */
  static calculateSorties(ref, movements = []) {
    try {
      if (!ref) return 0;
      const refKey = String(ref).toLowerCase().trim();
      const hash = `${refKey}_sorties_${this.getMovementHash(movements)}`;

      if (this.cache.has(hash)) {
        const cached = this.cache.get(hash);
        if (Date.now() - cached.timestamp < this.cacheTtlMs) {
          return cached.value;
        }
      }

      const sorties = movements.reduce((sum, m) => {
        if (!m) return sum;
        const mRef = String(m.ref || m.Ref || '').toLowerCase().trim();
        const mType = String(m.type || '').toLowerCase();
        if (mRef === refKey && (mType.includes('sortie') || mType === 'bon de sortie')) {
          return sum + safeNum(m.quantite || m.quantity, 0);
        }
        return sum;
      }, 0);

      this.cache.set(hash, { value: sorties, timestamp: Date.now() });
      return sorties;
    } catch (error) {
      Logger.error('❌ Sorties calculation failed', error, 'StockCalc');
      return 0;
    }
  }

  /**
   * Calculate current stock balance
   * ✅ Formula: Initial + Entrees - Sorties
   */
  static calculateStockActuel(article, movements = []) {
    try {
      if (!article) return 0;
      const ref = article.ref || article.Ref || '';
      const stockInitial = safeNum(article.stockInitial || article.stock_initial, 0);
      const entrees = this.calculateEntrees(ref, movements);
      const sorties = this.calculateSorties(ref, movements);

      const status = calculateStockStatus(
        stockInitial,
        entrees,
        sorties,
        article.seuil || article.minThreshold || 0,
        article.isAchatUnique
      );

      return status.stockActuel;
    } catch (error) {
      Logger.error('❌ Stock calculation failed', error, 'StockCalc');
      return safeNum(article?.stockInitial, 0);
    }
  }

  /**
   * Get alert status
   * ✅ Logic: RUPTURE (<=0), ALERTE (<=seuil), OK
   */
  static getAlertStatus(article, currentStock) {
    try {
      const seuil = safeNum(article?.seuil || article?.minThreshold, 0);
      if (article?.isAchatUnique) return 'OK';
      if (currentStock <= 0) return 'RUPTURE';
      if (currentStock <= seuil) return 'ALERTE';
      return 'OK';
    } catch (error) {
      Logger.error('❌ Alert status calculation failed', error, 'StockCalc');
      return 'OK';
    }
  }

  /**
   * Stock Availability Validation before dispatching sorties
   */
  static checkAvailability(ref, requestedQty, article, movements = []) {
    try {
      const qty = safeNum(requestedQty, 0);
      if (qty <= 0) {
        return {
          available: false,
          currentStock: 0,
          requestedQty: qty,
          shortage: 0,
          message: 'La quantité demandée doit être supérieure à 0.',
        };
      }

      const currentStock = this.calculateStockActuel(article, movements);

      if (currentStock < qty) {
        const shortage = qty - currentStock;
        return {
          available: false,
          currentStock,
          requestedQty: qty,
          shortage,
          message: `Stock insuffisant pour la référence "${ref}". Mousse disponible: ${currentStock}, Demandé: ${qty}, Manquant: ${shortage}.`,
        };
      }

      return {
        available: true,
        currentStock,
        requestedQty: qty,
        shortage: 0,
        message: 'Stock disponible suffisant.',
      };
    } catch (error) {
      Logger.error('❌ Stock availability check error', error, 'StockCalc');
      return {
        available: false,
        currentStock: 0,
        requestedQty: safeNum(requestedQty, 0),
        shortage: safeNum(requestedQty, 0),
        message: 'Erreur lors de la vérification du stock.',
      };
    }
  }

  /**
   * Concurrent Movement Handler with Serial Promise Queueing
   * Guarantees atomic sequential processing when multiple movements affect the same stock reference simultaneously.
   */
  static async queueConcurrentMovement(ref, movementTaskFn) {
    const key = String(ref || 'global').toLowerCase().trim();
    const currentQueue = this.movementQueue.get(key) || Promise.resolve();

    const nextTask = currentQueue
      .then(async () => {
        this.clearCache();
        return await movementTaskFn();
      })
      .catch((err) => {
        Logger.error(`Concurrent movement queue error for [${key}]:`, err, 'StockCalc');
        throw err;
      });

    this.movementQueue.set(key, nextTask);
    return nextTask;
  }

  /**
   * Generates a comprehensive Stock Report according to Excel Twin rules.
   */
  static generateStockReport(articles = [], movements = []) {
    try {
      let totalValue = 0;
      let totalQuantity = 0;
      let countRupture = 0;
      let countAlerte = 0;
      let countOK = 0;
      const ruptureItems = [];
      const alerteItems = [];

      articles.forEach((art) => {
        if (!art) return;
        const currentStock = this.calculateStockActuel(art, movements);
        const status = this.getAlertStatus(art, currentStock);
        const unitPrice = safeNum(art.prixUnitaire || art.unitPrice || art.prix_unitaire, 0);
        const itemVal = currentStock * unitPrice;

        totalValue += itemVal;
        totalQuantity += currentStock;

        const reportItem = {
          ref: art.ref,
          designation: art.designation || art.name || '',
          stockInitial: safeNum(art.stockInitial, 0),
          stockActuel: currentStock,
          unitPrice,
          totalValue: itemVal,
          status,
        };

        if (status === 'RUPTURE') {
          countRupture++;
          ruptureItems.push(reportItem);
        } else if (status === 'ALERTE') {
          countAlerte++;
          alerteItems.push(reportItem);
        } else {
          countOK++;
        }
      });

      return {
        generatedAt: new Date().toISOString(),
        totalArticles: articles.length,
        totalQuantity,
        totalValue: Number(totalValue.toFixed(2)),
        summary: {
          rupture: countRupture,
          alerte: countAlerte,
          ok: countOK,
        },
        ruptureItems,
        alerteItems,
      };
    } catch (error) {
      Logger.error('❌ Error generating stock report', error, 'StockCalc');
      return {
        generatedAt: new Date().toISOString(),
        totalArticles: 0,
        totalQuantity: 0,
        totalValue: 0,
        summary: { rupture: 0, alerte: 0, ok: 0 },
        error: error.message,
      };
    }
  }

  /**
   * Verify calculations against expected values
   */
  static async verifyCalculations(articles = [], movements = []) {
    try {
      const mismatches = [];

      for (const article of articles) {
        const calculatedStock = this.calculateStockActuel(article, movements);
        const calculatedAlert = this.getAlertStatus(article, calculatedStock);

        if (article.stockActuel !== undefined && Math.abs(article.stockActuel - calculatedStock) > 0.01) {
          mismatches.push({
            ref: article.ref,
            field: 'stockActuel',
            expected: article.stockActuel,
            calculated: calculatedStock,
            difference: article.stockActuel - calculatedStock,
          });
        }

        if (article.alerte && article.alerte !== calculatedAlert) {
          mismatches.push({
            ref: article.ref,
            field: 'alerte',
            expected: article.alerte,
            calculated: calculatedAlert,
          });
        }
      }

      return {
        isValid: mismatches.length === 0,
        mismatches,
      };
    } catch (error) {
      Logger.error('❌ Verification failed', error, 'StockCalc');
      return { isValid: false, error: error.message };
    }
  }
}

export default StockCalculationService;
