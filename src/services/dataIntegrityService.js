/**
 * Service de Vérification de l'Intégrité des Données (Data Integrity Service)
 * Contrôle les formules jumelles Excel (stockActuel = stockInitial + Entrées - Sorties),
 * détecte les incohérences, calcule les checksums et fournit des routines de réparation.
 */
class DataIntegrityService {
  constructor() {
    this.checksums = new Map();
  }

  /**
   * Calcul d'une empreinte numérique (Checksum) rapide pour un jeu de données
   */
  calculateChecksum(data) {
    if (!data) return '0';
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir en entier 32-bit
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Vérification de conformité par rapport à un checksum attendu
   */
  verify(data, checksum) {
    const currentChecksum = this.calculateChecksum(data);
    return currentChecksum === checksum;
  }

  /**
   * Enregistrer le checksum actuel d'une entité
   */
  save(key, data) {
    const checksum = this.calculateChecksum(data);
    this.checksums.set(key, checksum);
    return checksum;
  }

  /**
   * Vérifie si les données ont changé par rapport au dernier checksum enregistré
   */
  hasChanged(key, data) {
    const currentChecksum = this.calculateChecksum(data);
    const savedChecksum = this.checksums.get(key);
    return currentChecksum !== savedChecksum;
  }

  /**
   * Vérification approfondie de l'intégrité du Stock par rapport aux Mouvements
   */
  validateStockIntegrity(stock = [], movements = []) {
    const errors = [];
    const warnings = [];

    // Table de pré-agrégation des mouvements par référence d'article
    const mvtsByRef = new Map();
    (movements || []).forEach((m) => {
      const r = (m.ref || '').toString().trim().toUpperCase();
      if (!r) return;
      if (!mvtsByRef.has(r)) {
        mvtsByRef.set(r, { entrees: 0, sorties: 0, count: 0 });
      }
      const agg = mvtsByRef.get(r);
      const qte = Number(m.quantite) || 0;
      if (m.type === 'Entrée') {
        agg.entrees += qte;
      } else if (m.type === 'Sortie') {
        agg.sorties += qte;
      }
      agg.count++;
    });

    (stock || []).forEach((item, index) => {
      const ref = (item.ref || `Ligne ${index + 1}`).toString().trim();
      const refKey = ref.toUpperCase();

      // 1. Contrôle Stock Initial
      const initVal = Number(item.stockInitial);
      if (isNaN(initVal)) {
        errors.push({
          type: 'NAN_INITIAL_STOCK',
          ref,
          message: `Le stock initial de l'article "${ref}" n'est pas un nombre valide.`,
        });
      } else if (initVal < 0) {
        errors.push({
          type: 'NEGATIVE_INITIAL_STOCK',
          ref,
          message: `Le stock initial de l'article "${ref}" est négatif (${initVal}).`,
        });
      }

      // 2. Contrôle Seuil d'Alerte
      const seuilVal = Number(item.seuil);
      if (isNaN(seuilVal)) {
        warnings.push({
          type: 'NAN_THRESHOLD',
          ref,
          message: `Le seuil d'alerte pour "${ref}" n'est pas renseigné ou invalide.`,
        });
      } else if (seuilVal < 0) {
        errors.push({
          type: 'NEGATIVE_THRESHOLD',
          ref,
          message: `Le seuil d'alerte pour "${ref}" est négatif (${seuilVal}).`,
        });
      }

      // 3. Validation de la formule jumelle Excel: Stock Actuel = Initial + Entrées - Sorties
      const agg = mvtsByRef.get(refKey) || { entrees: 0, sorties: 0 };
      const expectedStock = (isNaN(initVal) ? 0 : initVal) + agg.entrees - agg.sorties;

      if (typeof item.stockActuel !== 'undefined') {
        const currentStockVal = Number(item.stockActuel);
        if (!isNaN(currentStockVal) && currentStockVal !== expectedStock) {
          warnings.push({
            type: 'STOCK_CALCULATION_DRIFT',
            ref,
            message: `Décalage détecté sur "${ref}": Stock mémorisé = ${currentStockVal}, Stock recalculé selon formule = ${expectedStock}.`,
            expected: expectedStock,
            actual: currentStockVal,
          });
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checkedCount: stock.length,
    };
  }

  /**
   * Vérification de l'intégrité des lignes du Journal des Mouvements
   */
  validateMovementIntegrity(movements = []) {
    const errors = [];
    const warnings = [];

    (movements || []).forEach((movement, index) => {
      const rowNum = index + 1;
      const ref = movement.ref || `Ligne ${rowNum}`;

      // Contrôle Quantité
      const qte = Number(movement.quantite);
      if (isNaN(qte) || qte <= 0) {
        errors.push({
          type: 'INVALID_QUANTITY',
          row: rowNum,
          ref,
          message: `La quantité du mouvement ligne ${rowNum} (${ref}) doit être strictement positive (valeur: ${movement.quantite}).`,
        });
      }

      // Contrôle Type
      if (!['Entrée', 'Sortie'].includes(movement.type)) {
        errors.push({
          type: 'INVALID_TYPE',
          row: rowNum,
          ref,
          message: `Type de mouvement invalide ligne ${rowNum}: "${movement.type}". Doit être "Entrée" ou "Sortie".`,
        });
      }

      // Contrôle Date
      if (!movement.date) {
        warnings.push({
          type: 'MISSING_DATE',
          row: rowNum,
          ref,
          message: `Date absente pour le mouvement ligne ${rowNum}.`,
        });
      } else {
        const d = new Date(movement.date);
        if (isNaN(d.getTime())) {
          errors.push({
            type: 'INVALID_DATE',
            row: rowNum,
            ref,
            message: `Format de date invalide ligne ${rowNum}: "${movement.date}".`,
          });
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checkedCount: movements.length,
    };
  }

  /**
   * Réparation automatique des données incohérentes ou altérées
   */
  repairData(item) {
    if (!item) return item;
    const repaired = { ...item };

    // Correction stock initial
    const init = Number(repaired.stockInitial);
    if (isNaN(init) || init < 0) {
      repaired.stockInitial = 0;
    } else {
      repaired.stockInitial = init;
    }

    // Correction seuil
    const seuil = Number(repaired.seuil);
    if (isNaN(seuil) || seuil < 0) {
      repaired.seuil = 0;
    } else {
      repaired.seuil = seuil;
    }

    return repaired;
  }

  /**
   * Génération d'un diagnostic d'intégrité global
   */
  getIntegrityReport(stock = [], movements = []) {
    const stockValidation = this.validateStockIntegrity(stock, movements);
    const movementValidation = this.validateMovementIntegrity(movements);

    return {
      timestamp: new Date().toISOString(),
      stock: stockValidation,
      movements: movementValidation,
      overall: {
        valid: stockValidation.valid && movementValidation.valid,
        totalErrors: stockValidation.errors.length + movementValidation.errors.length,
        totalWarnings: stockValidation.warnings.length + movementValidation.warnings.length,
      },
    };
  }
}

export const dataIntegrityService = new DataIntegrityService();
export default dataIntegrityService;
