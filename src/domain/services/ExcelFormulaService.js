/**
 * Excel Formula Service
 * ✅ تطبيق دقيق لـ Excel Formulas (SUMIFS, COUNTIFS, FILTER, VLOOKUP, calculateStockActuel)
 */
export class ExcelFormulaService {
  /**
   * SUMIFS Implementation
   * =SUMIFS(Mouvements!D:D, Mouvements!C:C, [@Ref], Mouvements!E:E, "Entrée")
   */
  static sumifs(data, sumRange, criteriaRange1, criterion1, criteriaRange2, criterion2) {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let sum = 0;

    for (const row of data) {
      const value1 = this._getNestedValue(row, criteriaRange1);
      const value2 = this._getNestedValue(row, criteriaRange2);
      const sumValue = this._getNestedValue(row, sumRange);

      if (value1 === criterion1 && value2 === criterion2) {
        const numValue = Number(sumValue);
        if (Number.isFinite(numValue)) {
          sum += numValue;
        }
      }
    }

    return sum;
  }

  /**
   * COUNTIFS Implementation
   */
  static countifs(data, criteriaRange1, criterion1, criteriaRange2, criterion2) {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let count = 0;

    for (const row of data) {
      const value1 = this._getNestedValue(row, criteriaRange1);
      const value2 = this._getNestedValue(row, criteriaRange2);

      if (value1 === criterion1 && value2 === criterion2) {
        count++;
      }
    }

    return count;
  }

  /**
   * FILTER Implementation
   */
  static filter(data, criteriaRange, criterion) {
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.filter(row => {
      const value = this._getNestedValue(row, criteriaRange);
      return value === criterion;
    });
  }

  /**
   * VLOOKUP Implementation
   */
  static vlookup(lookupValue, tableArray, colIndexNum, rangeLookup = false) {
    if (!Array.isArray(tableArray) || tableArray.length === 0) return null;

    for (const row of tableArray) {
      const firstValue = Array.isArray(row) ? row[0] : row[Object.keys(row)[0]];

      if (rangeLookup) {
        if (firstValue >= lookupValue) {
          return Array.isArray(row) ? row[colIndexNum - 1] : row[Object.keys(row)[colIndexNum - 1]];
        }
      } else {
        if (firstValue === lookupValue) {
          return Array.isArray(row) ? row[colIndexNum - 1] : row[Object.keys(row)[colIndexNum - 1]];
        }
      }
    }

    return null;
  }

  /**
   * حساب المخزون الفعلي
   * Stock Actuel = Stock Initial + Entrées - Sorties
   */
  static calculateStockActuel(article, movements) {
    if (!article || !Array.isArray(movements)) {
      throw new Error('Invalid article or movements');
    }

    const entrees = this.sumifs(
      movements,
      'quantite',
      'ref',
      article.ref,
      'type',
      'Entrée'
    );

    const sorties = this.sumifs(
      movements,
      'quantite',
      'ref',
      article.ref,
      'type',
      'Sortie'
    );

    const stockInitial = Number(article.stockInitial) || 0;
    const stockActuel = stockInitial + entrees - sorties;

    return {
      stockInitial,
      entrees,
      sorties,
      stockActuel: Math.max(0, stockActuel),
      alerte: this.calculateAlerte(stockActuel, article.seuil || 3)
    };
  }

  /**
   * حساب حالة التنبيه
   */
  static calculateAlerte(stockActuel, seuil = 3) {
    if (stockActuel <= 0) return 'RUPTURE';
    if (stockActuel <= seuil) return 'ALERTE';
    return 'OK';
  }

  /**
   * التحقق من الحسابات
   */
  static verifyCalculations(articles, movements) {
    const errors = [];

    for (const article of articles) {
      try {
        const calculated = this.calculateStockActuel(article, movements);

        if (article.stockActuel !== undefined && article.stockActuel !== calculated.stockActuel) {
          errors.push({
            ref: article.ref,
            field: 'stockActuel',
            expected: article.stockActuel,
            calculated: calculated.stockActuel,
            difference: article.stockActuel - calculated.stockActuel
          });
        }

        if (article.alerte !== undefined && article.alerte !== calculated.alerte) {
          errors.push({
            ref: article.ref,
            field: 'alerte',
            expected: article.alerte,
            calculated: calculated.alerte
          });
        }
      } catch (error) {
        errors.push({
          ref: article.ref,
          error: error.message
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errorCount: errors.length,
      errors
    };
  }

  static _getNestedValue(obj, path) {
    if (!obj) return undefined;
    if (typeof path === 'string') {
      return obj[path];
    }
    return obj[path];
  }
}

export default ExcelFormulaService;
