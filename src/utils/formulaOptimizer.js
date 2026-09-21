/**
 * Formula Optimizer for CIOB GMAO Light UI
 * Provides high-speed indexed calculations, memoization, and batch stats calculation.
 */

export class FormulaOptimizer {
  constructor() {
    this.mouvementsIndex = new Map();
    this.articlesIndex = new Map();
    this.cache = new Map();
  }

  // Static Indexing & Calculation Methods
  static buildMovementIndex(movements = []) {
    const index = new Map();
    if (!Array.isArray(movements)) return index;

    for (let i = 0; i < movements.length; i++) {
      const movement = movements[i];
      if (!movement || !movement.ref) continue;
      
      const refKey = String(movement.ref).trim();
      if (!index.has(refKey)) {
        index.set(refKey, {
          entrees: [],
          sorties: []
        });
      }

      const item = index.get(refKey);
      const mType = String(movement.type || '').toLowerCase();
      if (mType.includes('entrée') || mType.includes('entree')) {
        item.entrees.push(movement);
      } else {
        item.sorties.push(movement);
      }
    }

    return index;
  }

  static calculateStockWithIndex(article, movementIndex) {
    if (!article || !article.ref) return Number(article?.stockInitial || 0);

    const refKey = String(article.ref).trim();
    const item = movementIndex.get ? movementIndex.get(refKey) : movementIndex[refKey];

    if (!item) {
      return Number(article.stockInitial || article.stock_initial || 0);
    }

    const entrees = (item.entrees || []).reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);
    const sorties = (item.sorties || []).reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);

    const stockInitial = Number(article.stockInitial || article.stock_initial || 0);
    return stockInitial + entrees - sorties;
  }

  static calculateAllStocksOptimized(articles = [], movements = []) {
    const start = performance.now();
    const index = this.buildMovementIndex(movements);

    const results = (articles || []).map((article) => {
      const stockActuel = this.calculateStockWithIndex(article, index);
      const itemMovements = index.get(String(article.ref).trim());
      const entreesQty = (itemMovements?.entrees || []).reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);
      const sortiesQty = (itemMovements?.sorties || []).reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);

      const seuil = Number(article.seuil || 0);
      let alerte = 'OK';
      if (stockActuel <= 0) {
        alerte = 'RUPTURE';
      } else if (stockActuel <= seuil) {
        alerte = 'ALERTE';
      }

      return {
        ...article,
        stockActuel,
        entrees: entreesQty,
        sorties: sortiesQty,
        alerte,
      };
    });

    const end = performance.now();
    console.log(`✅ Calculated ${articles.length} stocks in ${(end - start).toFixed(2)}ms`);
    return results;
  }

  static createMemoizedCalculator() {
    const cache = new Map();

    return (articles, movements) => {
      const key = `${articles.length}_${movements.length}`;

      if (cache.has(key)) {
        console.log('💾 Using cached formula results');
        return cache.get(key);
      }

      const results = this.calculateAllStocksOptimized(articles, movements);
      cache.set(key, results);

      if (cache.size > 10) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      return results;
    };
  }

  static calculateStatisticsOptimized(articles = [], movements = []) {
    const start = performance.now();
    const index = this.buildMovementIndex(movements);

    const stats = {
      totalArticles: articles.length,
      totalValue: 0,
      articlesInRupture: 0,
      articlesInAlerte: 0,
      articlesOK: 0,
      totalQuantity: 0,
      ruptureCost: 0,
      alerteCost: 0
    };

    for (const article of articles) {
      const stock = this.calculateStockWithIndex(article, index);
      const unitPrice = Number(article.unitPrice || article.prix_unitaire || 0);
      const value = stock * unitPrice;

      stats.totalValue += value;
      stats.totalQuantity += stock;

      const seuil = Number(article.seuil || 0);
      if (stock <= 0) {
        stats.articlesInRupture++;
        stats.ruptureCost += value;
      } else if (stock <= seuil) {
        stats.articlesInAlerte++;
        stats.alerteCost += value;
      } else {
        stats.articlesOK++;
      }
    }

    const end = performance.now();
    console.log(`✅ Calculated statistics in ${(end - start).toFixed(2)}ms`);
    return stats;
  }

  // Instance methods
  buildMouvementsIndex(mouvements = []) {
    this.mouvementsIndex.clear();
    
    for (const m of mouvements) {
      const key = m.ref;
      if (!key) continue;
      if (!this.mouvementsIndex.has(key)) {
        this.mouvementsIndex.set(key, {
          entrees: [],
          sorties: [],
          all: []
        });
      }
      
      const index = this.mouvementsIndex.get(key);
      index.all.push(m);
      
      const mType = String(m.type || '').toLowerCase();
      if (mType.includes('entrée') || mType.includes('entree')) {
        index.entrees.push(m);
      } else {
        index.sorties.push(m);
      }
    }
  }

  calculateEntrees(ref) {
    const cacheKey = `entrees_${ref}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const index = this.mouvementsIndex.get(ref);
    if (!index) return 0;

    const sum = index.entrees.reduce(
      (total, m) => total + (Number(m.quantite) || 0),
      0
    );

    this.cache.set(cacheKey, sum);
    return sum;
  }

  calculateSorties(ref) {
    const cacheKey = `sorties_${ref}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const index = this.mouvementsIndex.get(ref);
    if (!index) return 0;

    const sum = index.sorties.reduce(
      (total, m) => total + (Number(m.quantite) || 0),
      0
    );

    this.cache.set(cacheKey, sum);
    return sum;
  }

  calculateStock(article) {
    const ref = article.ref || article.code;
    const cacheKey = `stock_${ref}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const entrees = this.calculateEntrees(ref);
    const sorties = this.calculateSorties(ref);
    const stock = Number(article.stockInitial || article.stock_initial || 0) + entrees - sorties;

    this.cache.set(cacheKey, stock);
    return Math.max(0, stock);
  }

  calculateAllStocks(articles = []) {
    return FormulaOptimizer.calculateAllStocksOptimized(articles, Array.from(this.mouvementsIndex.values()).flatMap(v => v.all));
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      mouvementsIndexSize: this.mouvementsIndex.size
    };
  }
}

export default FormulaOptimizer;
