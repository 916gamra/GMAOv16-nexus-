import { AppError, ErrorHandler } from '../utils/errorHandler';
import { PerformanceOptimizer } from '../utils/performanceOptimizer';
import { Logger } from '../core/logger/LoggerService.js';

/**
 * Safe Stock Service with Error Handling & Fallbacks
 */
export class SafeStockService {
  /**
   * Safely load articles and movements data from db/storage with error isolation.
   * @param {Object} db - Database/storage service instance with getAll() method
   * @returns {Promise<{ articles: Array, movements: Array }>}
   */
  static async loadData(db) {
    try {
      Logger.debug('🔄 Loading data safely...');

      if (!db || typeof db.getAll !== 'function') {
        throw new AppError('Invalid database interface provided', 'INVALID_DB');
      }

      const articles = await db.getAll('articles');
      const movements = await db.getAll('movements');

      if (!articles || !Array.isArray(articles) || articles.length === 0) {
        throw new AppError('Aucun article trouvé dans la base de données.', 'NO_ARTICLES');
      }

      Logger.debug('✅ Data loaded successfully');
      return { articles: articles || [], movements: movements || [] };
    } catch (error) {
      Logger.error('❌ Error loading data:', error);

      if (error instanceof AppError) {
        ErrorHandler.handle(error);
      } else {
        ErrorHandler.handle(new AppError(error?.message || 'Erreur lors du chargement', 'LOAD_ERROR'));
      }

      // Safe fallback data return to prevent app crash
      return { articles: [], movements: [] };
    }
  }

  /**
   * Safely calculate all stock balances and alerts without throwing exception on individual item errors.
   * @param {Array} articles - Articles array
   * @param {Array} movements - Movements array
   * @returns {Promise<Array>} Calculated articles
   */
  static async calculateAllStocks(articles = [], movements = []) {
    try {
      Logger.debug('🔄 Safe stock calculation started...');
      
      if (!Array.isArray(articles)) {
        throw new AppError('Invalid articles payload provided', 'INVALID_ARTICLES');
      }

      const movementIndex = PerformanceOptimizer.indexMovementsByRef(movements);

      const results = articles.map((article) => {
        try {
          const stock = PerformanceOptimizer.calculateStockFast(article, movementIndex);
          const seuil = Number(article.seuil || 0);

          let alerte = 'OK';
          if (stock <= 0) {
            alerte = 'RUPTURE';
          } else if (stock <= seuil) {
            alerte = 'ALERTE';
          }

          return {
            ...article,
            stockActuel: stock,
            alerte,
          };
        } catch (itemErr) {
          Logger.warn(`⚠️ Error calculating stock for ${article?.ref || 'item'}:`, itemErr);
          return article; // Return original article item without crashing
        }
      });

      Logger.debug('✅ Stocks calculated successfully');
      return results;
    } catch (error) {
      Logger.error('❌ Error calculating stocks:', error);
      ErrorHandler.handle(error, 'Erreur lors du calcul des stocks.');
      return articles; // Safe fallback
    }
  }
}

export default SafeStockService;
