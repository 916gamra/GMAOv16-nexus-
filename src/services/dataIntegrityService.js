/**
 * Service de Vérification de l'Intégrité des Données & Moteur Auto-Guérison (Data Integrity & Self-Healing Service)
 * 🏛️ Conforme à la Constitution GMAO : Logique relationnelle stricte, formules jumelles Excel,
 * détection des clés orphelines, calcul d'empreinte Checksum et routines de réparation bidirectionnelle.
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
   * Formule Jumelle Excel: Stock Actuel = Stock Initial + Somme(Entrées) - Somme(Sorties)
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
   * Vérification de l'intégrité relationnelle stricte (Foreign Keys)
   * Détecte les références orphelines entre tous les modules GMAO
   */
  validateReferentialIntegrity({
    rawStock = [],
    mouvements = [],
    machines = [],
    zones = [],
    technicians = [],
    operations = [],
    preventiveTasks = [],
    correctiveInterventions = [],
  } = {}) {
    const errors = [];
    const warnings = [];

    // 1. Dictionnaires de clés valides
    const registeredRefs = new Set(
      (rawStock || []).map((s) => String(s.ref || '').toUpperCase().trim()).filter(Boolean)
    );
    const registeredMachines = new Set(
      (machines || []).map((m) => String(m.id_machine_registered || '').toUpperCase().trim()).filter(Boolean)
    );
    const registeredZones = new Set([
      ...(zones || []).map((z) => String(z.id_zone || '').toUpperCase().trim()).filter(Boolean),
      ...(zones || []).map((z) => String(z.libelle || '').toUpperCase().trim()).filter(Boolean),
      ...(zones || []).map((z) => String(z.nom || '').toUpperCase().trim()).filter(Boolean),
    ]);
    const registeredUsers = new Set([
      ...(technicians || []).map((t) => String(t.nom || '').toUpperCase().trim()).filter(Boolean),
      ...(technicians || []).map((t) => String(t.id_technician || '').toUpperCase().trim()).filter(Boolean),
      ...(operations || []).map((o) => String(o.nom || '').toUpperCase().trim()).filter(Boolean),
      ...(operations || []).map((o) => String(o.id_operation || '').toUpperCase().trim()).filter(Boolean),
    ]);

    // 2. Contrôle des références d'articles orphelines dans les mouvements
    (mouvements || []).forEach((m, idx) => {
      const rowNum = idx + 1;
      const ref = String(m.ref || '').trim();
      if (ref && !registeredRefs.has(ref.toUpperCase())) {
        errors.push({
          type: 'ORPHAN_STOCK_REF',
          entity: 'Mouvement',
          key: ref,
          row: rowNum,
          message: `Ligne de mouvement #${rowNum}: La référence d'article "${ref}" n'existe pas dans le Stock officiel.`,
        });
      }

      // Contrôle Machine dans Mouvement
      const mch = String(m.id_machine_registered || '').trim();
      if (mch && !registeredMachines.has(mch.toUpperCase())) {
        warnings.push({
          type: 'ORPHAN_MACHINE_IN_MOUVEMENT',
          entity: 'Mouvement',
          key: mch,
          row: rowNum,
          message: `Ligne de mouvement #${rowNum}: La machine "${mch}" n'existe pas dans le Parc Machines.`,
        });
      }

      // Contrôle Zone dans Mouvement
      const zn = String(m.id_zone || '').trim();
      if (zn && !registeredZones.has(zn.toUpperCase())) {
        warnings.push({
          type: 'ORPHAN_ZONE_IN_MOUVEMENT',
          entity: 'Mouvement',
          key: zn,
          row: rowNum,
          message: `Ligne de mouvement #${rowNum}: La zone "${zn}" n'existe pas dans le Référentiel Zones.`,
        });
      }

      // Contrôle Technicien dans Mouvement
      const tech = String(m.technicien || '').trim();
      if (tech && !registeredUsers.has(tech.toUpperCase()) && !/^(TECH-|CHEF-|OP-)/i.test(tech)) {
        warnings.push({
          type: 'ORPHAN_TECHNICIAN_IN_MOUVEMENT',
          entity: 'Mouvement',
          key: tech,
          row: rowNum,
          message: `Ligne de mouvement #${rowNum}: L'intervenant "${tech}" n'est pas un utilisateur répertorié.`,
        });
      }
    });

    // 3. Contrôle des machines orphelines dans les interventions correctives
    (correctiveInterventions || []).forEach((interv) => {
      const mch = String(interv.id_machine || interv.machine_id || '').trim();
      if (mch && !registeredMachines.has(mch.toUpperCase())) {
        warnings.push({
          type: 'ORPHAN_MACHINE_IN_CORRECTIVE',
          entity: 'Correctif',
          key: mch,
          id: interv.id || interv.code_bon,
          message: `Intervention ${interv.id || interv.code_bon || 'Sans ID'}: Machine associée "${mch}" non répertoriée.`,
        });
      }
    });

    // 4. Contrôle des machines orphelines dans les tâches préventives
    (preventiveTasks || []).forEach((task) => {
      const mch = String(task.machine_id || task.id_machine || '').trim();
      if (mch && !registeredMachines.has(mch.toUpperCase())) {
        warnings.push({
          type: 'ORPHAN_MACHINE_IN_PREVENTIVE',
          entity: 'Préventif',
          key: mch,
          id: task.id || task.code,
          message: `Tâche préventive ${task.id || task.code || 'Sans ID'}: Machine "${mch}" non répertoriée.`,
        });
      }
    });

    // 5. Contrôle des zones orphelines dans les machines
    (machines || []).forEach((mch) => {
      const zn = String(mch.id_zone_default || mch.id_zone || '').trim();
      if (zn && !registeredZones.has(zn.toUpperCase())) {
        warnings.push({
          type: 'ORPHAN_ZONE_IN_MACHINE',
          entity: 'Machine',
          key: zn,
          id: mch.id_machine_registered,
          message: `Machine "${mch.id_machine_registered}": Zone par défaut "${zn}" inconnue.`,
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checkedCount: (mouvements || []).length + (correctiveInterventions || []).length + (preventiveTasks || []).length + (machines || []).length,
    };
  }

  /**
   * Routine d'auto-guérison avancée (Self-Healing & Auto-Repair)
   * 1. Recalcule le stock actuel selon la formule jumelle exacte
   * 2. Assainit les stocks initiaux et seuils négatifs ou corrompus
   * 3. Retourne les données guéries et le journal des actions correctives
   */
  autoHealData({ rawStock = [], mouvements = [] } = {}) {
    const mvtsByRef = new Map();
    (mouvements || []).forEach((m) => {
      const r = (m.ref || '').toString().trim().toUpperCase();
      if (!r) return;
      if (!mvtsByRef.has(r)) {
        mvtsByRef.set(r, { entrees: 0, sorties: 0 });
      }
      const agg = mvtsByRef.get(r);
      const qte = Number(m.quantite) || 0;
      if (m.type === 'Entrée') agg.entrees += qte;
      else if (m.type === 'Sortie') agg.sorties += qte;
    });

    const fixes = [];
    const repairedStock = (rawStock || []).map((item) => {
      const repaired = { ...item };
      const ref = (repaired.ref || '').trim();
      const refKey = ref.toUpperCase();

      // 1. Correction Stock Initial
      let init = Number(repaired.stockInitial);
      if (isNaN(init) || init < 0) {
        fixes.push({
          ref,
          field: 'stockInitial',
          before: repaired.stockInitial,
          after: 0,
          reason: 'Valeur NaN ou négative corrigée à 0',
        });
        init = 0;
        repaired.stockInitial = 0;
      }

      // 2. Correction Seuil
      const seuil = Number(repaired.seuil);
      if (isNaN(seuil) || seuil < 0) {
        fixes.push({
          ref,
          field: 'seuil',
          before: repaired.seuil,
          after: 0,
          reason: 'Seuil NaN ou négatif corrigé à 0',
        });
        repaired.seuil = 0;
      }

      // 3. Recalcul Formule Jumelle Excel: Stock Actuel = Initial + In - Out
      const agg = mvtsByRef.get(refKey) || { entrees: 0, sorties: 0 };
      const expectedStock = init + agg.entrees - agg.sorties;
      const currentStock = Number(repaired.stockActuel);

      if (isNaN(currentStock) || currentStock !== expectedStock) {
        fixes.push({
          ref,
          field: 'stockActuel',
          before: repaired.stockActuel,
          after: expectedStock,
          reason: `Recalcul Formule Jumelle (Initial: ${init} + Entrées: ${agg.entrees} - Sorties: ${agg.sorties})`,
        });
        repaired.stockActuel = expectedStock;
      }

      return repaired;
    });

    return {
      repairedStock,
      fixedCount: fixes.length,
      fixes,
    };
  }

  /**
   * Réparation automatique unitaire d'un article
   */
  repairData(item) {
    if (!item) return item;
    const repaired = { ...item };

    const init = Number(repaired.stockInitial);
    repaired.stockInitial = isNaN(init) || init < 0 ? 0 : init;

    const seuil = Number(repaired.seuil);
    repaired.seuil = isNaN(seuil) || seuil < 0 ? 0 : seuil;

    return repaired;
  }

  /**
   * Rattachement et cascade d'une clé étrangère erronée (Cascade Re-link)
   * Permet de rediriger un code mal saisi (ex: MCH-001 -> MCH-01) dans tous les mouvements et interventions
   */
  relinkForeignKey({
    entityType, // 'machine' | 'zone' | 'user' | 'article'
    oldKey,
    newKey,
    datasets: {
      mouvements = [],
      correctiveInterventions = [],
      preventiveTasks = [],
      machines = [],
    } = {},
  }) {
    if (!oldKey || !newKey) {
      return { success: false, affectedCount: 0 };
    }

    let affectedCount = 0;
    const oldNormalized = String(oldKey).trim().toUpperCase();

    // 1. Mouvements
    const nextMouvements = (mouvements || []).map((m) => {
      let updated = false;
      const mCopy = { ...m };

      if (entityType === 'article' && String(m.ref || '').trim().toUpperCase() === oldNormalized) {
        mCopy.ref = newKey;
        updated = true;
      }
      if (entityType === 'machine' && String(m.id_machine_registered || '').trim().toUpperCase() === oldNormalized) {
        mCopy.id_machine_registered = newKey;
        updated = true;
      }
      if (entityType === 'zone' && String(m.id_zone || '').trim().toUpperCase() === oldNormalized) {
        mCopy.id_zone = newKey;
        updated = true;
      }
      if (entityType === 'user' && String(m.technicien || '').trim().toUpperCase() === oldNormalized) {
        mCopy.technicien = newKey;
        updated = true;
      }

      if (updated) affectedCount++;
      return mCopy;
    });

    // 2. Interventions Correctives
    const nextInterventions = (correctiveInterventions || []).map((ci) => {
      let updated = false;
      const cCopy = { ...ci };

      if (entityType === 'machine') {
        const mKey = String(ci.id_machine || ci.machine_id || '').trim().toUpperCase();
        if (mKey === oldNormalized) {
          if (ci.id_machine) cCopy.id_machine = newKey;
          if (ci.machine_id) cCopy.machine_id = newKey;
          updated = true;
        }
      }
      if (entityType === 'user') {
        const tKey = String(ci.technicien_id || ci.technicien || '').trim().toUpperCase();
        if (tKey === oldNormalized) {
          if (ci.technicien_id) cCopy.technicien_id = newKey;
          if (ci.technicien) cCopy.technicien = newKey;
          updated = true;
        }
      }

      if (updated) affectedCount++;
      return cCopy;
    });

    // 3. Tâches Préventives
    const nextPreventiveTasks = (preventiveTasks || []).map((pt) => {
      let updated = false;
      const pCopy = { ...pt };

      if (entityType === 'machine') {
        const mKey = String(pt.machine_id || pt.id_machine || '').trim().toUpperCase();
        if (mKey === oldNormalized) {
          if (pt.machine_id) pCopy.machine_id = newKey;
          if (pt.id_machine) pCopy.id_machine = newKey;
          updated = true;
        }
      }

      if (updated) affectedCount++;
      return pCopy;
    });

    // 4. Parc Machines (Zones de défaut)
    const nextMachines = (machines || []).map((mch) => {
      let updated = false;
      const mCopy = { ...mch };

      if (entityType === 'zone') {
        const zKey = String(mch.id_zone_default || mch.id_zone || '').trim().toUpperCase();
        if (zKey === oldNormalized) {
          if (mch.id_zone_default) mCopy.id_zone_default = newKey;
          if (mch.id_zone) mCopy.id_zone = newKey;
          updated = true;
        }
      }

      if (updated) affectedCount++;
      return mCopy;
    });

    return {
      success: true,
      affectedCount,
      nextMouvements,
      nextInterventions,
      nextPreventiveTasks,
      nextMachines,
    };
  }

  /**
   * Diagnostic d'intégrité global et complet
   */
  getIntegrityReport({
    stock = [],
    movements = [],
    machines = [],
    zones = [],
    technicians = [],
    operations = [],
    preventiveTasks = [],
    correctiveInterventions = [],
  } = {}) {
    const stockValidation = this.validateStockIntegrity(stock, movements);
    const movementValidation = this.validateMovementIntegrity(movements);
    const referentialValidation = this.validateReferentialIntegrity({
      rawStock: stock,
      mouvements: movements,
      machines,
      zones,
      technicians,
      operations,
      preventiveTasks,
      correctiveInterventions,
    });

    const totalErrors = stockValidation.errors.length + movementValidation.errors.length + referentialValidation.errors.length;
    const totalWarnings = stockValidation.warnings.length + movementValidation.warnings.length + referentialValidation.warnings.length;

    return {
      timestamp: new Date().toISOString(),
      stock: stockValidation,
      movements: movementValidation,
      referential: referentialValidation,
      overall: {
        valid: totalErrors === 0,
        totalErrors,
        totalWarnings,
      },
    };
  }
}

export const dataIntegrityService = new DataIntegrityService();
export default dataIntegrityService;
