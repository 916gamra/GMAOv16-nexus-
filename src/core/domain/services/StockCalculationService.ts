// ✅ ملف: src/core/domain/services/StockCalculationService.ts

import ExcelFormulaEngine from './ExcelFormulaEngine';

export interface StockCalculationResult {
  ref: string;
  designation: string;
  stockInitial: number;
  entrees: number;
  sorties: number;
  stockActuel: number;
  alerte: 'OK' | 'ALERTE' | 'RUPTURE';
  seuil: number;
  lastUpdated: Date;
}

/**
 * Stock Calculation Service
 * ✅ حساب المخزون بسرعة وكفاءة
 */
export class StockCalculationService {
  /**
   * بناء فهرس للحركات (O(N))
   * الاستخدام: O(1) lookup
   */
  private static buildMovementIndex(movements: any[]): Map<string, any> {
    const index = new Map<string, any>();

    for (const movement of movements) {
      if (!index.has(movement.ref)) {
        index.set(movement.ref, {
          entrees: [],
          sorties: [],
          entreesSum: 0,
          sortiesSum: 0
        });
      }

      const item = index.get(movement.ref);

      if (movement.type === 'Entrée') {
        const qty = Number(movement.quantite) || 0;
        item.entrees.push(movement);
        item.entreesSum += qty;
      } else if (movement.type === 'Sortie') {
        const qty = Number(movement.quantite) || 0;
        item.sorties.push(movement);
        item.sortiesSum += qty;
      }
    }

    return index;
  }

  /**
   * حساب جميع المخزونات بسرعة (O(N))
   */
  static calculateAllStocks(
    articles: any[],
    movements: any[]
  ): StockCalculationResult[] {
    const start = performance.now();

    // بناء الفهرس مرة واحدة (O(M))
    const index = this.buildMovementIndex(movements);

    // حساب جميع المخزونات (O(N))
    const results: StockCalculationResult[] = articles.map(article => {
      const movements = index.get(article.ref);

      if (!movements) {
        return {
          ref: article.ref,
          designation: article.designation,
          stockInitial: article.stockInitial,
          entrees: 0,
          sorties: 0,
          stockActuel: article.stockInitial,
          alerte: article.stockInitial <= 0 ? 'RUPTURE' : 'OK',
          seuil: article.seuil,
          lastUpdated: new Date()
        };
      }

      const stockActuel = article.stockInitial + movements.entreesSum - movements.sortiesSum;

      return {
        ref: article.ref,
        designation: article.designation,
        stockInitial: article.stockInitial,
        entrees: movements.entreesSum,
        sorties: movements.sortiesSum,
        stockActuel: Math.max(0, stockActuel),
        alerte: ExcelFormulaEngine.calculateAlerte(stockActuel, article.seuil),
        seuil: article.seuil,
        lastUpdated: new Date()
      };
    });

    const end = performance.now();
    const duration = (end - start).toFixed(2);

    console.log(`✅ Calculated ${articles.length} stocks in ${duration}ms`);

    return results;
  }

  /**
   * حساب مخزون واحد
   */
  static calculateStockByRef(
    article: any,
    movements: any[]
  ): StockCalculationResult {
    const filteredMovements = movements.filter(m => m.ref === article.ref);
    const result = ExcelFormulaEngine.calculateStockActuel(article, filteredMovements);

    return {
      ref: article.ref,
      designation: article.designation,
      stockInitial: result.stockInitial,
      entrees: result.entrees,
      sorties: result.sorties,
      stockActuel: result.stockActuel,
      alerte: result.alerte,
      seuil: article.seuil,
      lastUpdated: new Date()
    };
  }

  /**
   * الحصول على حالة المخزون
   */
  static getStockStatus(stockActuel: number, seuil: number): 'OK' | 'ALERTE' | 'RUPTURE' {
    return ExcelFormulaEngine.calculateAlerte(stockActuel, seuil);
  }

  /**
   * الحصول على التنبيهات
   */
  static getStockAlerts(stocks: StockCalculationResult[]): {
    rupture: StockCalculationResult[];
    alerte: StockCalculationResult[];
    ok: StockCalculationResult[];
  } {
    return {
      rupture: stocks.filter(s => s.alerte === 'RUPTURE'),
      alerte: stocks.filter(s => s.alerte === 'ALERTE'),
      ok: stocks.filter(s => s.alerte === 'OK')
    };
  }

  /**
   * إحصائيات المخزون
   */
  static getStockStatistics(stocks: StockCalculationResult[]) {
    return {
      totalArticles: stocks.length,
      totalValue: stocks.reduce((sum, s) => sum + (s.stockActuel * 100), 0), // assuming price = 100
      articlesInRupture: stocks.filter(s => s.alerte === 'RUPTURE').length,
      articlesInAlerte: stocks.filter(s => s.alerte === 'ALERTE').length,
      articlesOK: stocks.filter(s => s.alerte === 'OK').length,
      averageStock: stocks.reduce((sum, s) => sum + s.stockActuel, 0) / stocks.length
    };
  }
}

export default StockCalculationService;
