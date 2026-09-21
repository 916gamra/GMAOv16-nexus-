import { useMemo } from 'react';
import { safeNum, calculateStockStatus } from '../utils/formulaEngine';
import { INITIAL_STOCK_LOOKUP } from '../utils/baselineStock';
import { INITIAL_FAMILIES, INITIAL_TEMPLATES } from '../data/seedData';

/**
 * Hook to compute real-time stock calculations, warehouse stock, KPIs, and fallback lists
 */
export function useAppCalculations({
  rawStock = [],
  mouvements = [],
  designations = [],
  families = [],
  templates = [],
  warehouseItems = [],
}) {
  // Compute Full Stock with Dynamic Live Calculations (Formula F, G, H, J)
  const stockItems = useMemo(() => {
    // Map entries and sorties by ref
    const mvtSummary = {};
    mouvements.forEach((m) => {
      const r = String(m.ref || m['Référence'] || m['Reference'] || '')
        .trim()
        .toLowerCase();
      if (!r) return;
      if (!mvtSummary[r]) {
        mvtSummary[r] = { entrees: 0, sorties: 0 };
      }
      const q = safeNum(m.quantite != null ? m.quantite : m['Quantité'], 0);
      const t = String(m.type || m['Type (Entrée/Sortie)'] || '').toLowerCase();
      if (t.includes('entr')) {
        mvtSummary[r].entrees += q;
      } else if (t.includes('sort')) {
        mvtSummary[r].sorties += q;
      }
    });

    return rawStock.map((item) => {
      const itemRefKey = String(item.ref || '')
        .trim()
        .toLowerCase();
      const itemDesigKey = String(item.designation || '')
        .trim()
        .toLowerCase();

      // Support matching unpadded and padded variants (e.g. courroie1 vs courroie01)
      const normRefKey = itemRefKey.replace(/^([a-zA-Z\u00C0-\u017F\s_-]+?)0+(\d+)$/, '$1$2');
      const padRefKey = itemRefKey.replace(/^([a-zA-Z\u00C0-\u017F\s_-]+?)(\d+)$/, (_match, p1, p2) =>
        p2.length === 1 ? `${p1}0${p2}` : `${p1}${p2}`
      );

      const entrees =
        mvtSummary[itemRefKey]?.entrees ||
        mvtSummary[normRefKey]?.entrees ||
        mvtSummary[padRefKey]?.entrees ||
        (itemDesigKey ? mvtSummary[itemDesigKey]?.entrees || 0 : 0);
      const sorties =
        mvtSummary[itemRefKey]?.sorties ||
        mvtSummary[normRefKey]?.sorties ||
        mvtSummary[padRefKey]?.sorties ||
        (itemDesigKey ? mvtSummary[itemDesigKey]?.sorties || 0 : 0);

      let stockInitial = 0;
      if (item.stockInitial !== undefined && item.stockInitial !== null && item.stockInitial !== '' && !isNaN(Number(item.stockInitial))) {
        stockInitial = Number(item.stockInitial);
      } else {
        const baseline =
          INITIAL_STOCK_LOOKUP.get(itemRefKey) ||
          INITIAL_STOCK_LOOKUP.get(normRefKey) ||
          INITIAL_STOCK_LOOKUP.get(padRefKey) ||
          (itemDesigKey ? INITIAL_STOCK_LOOKUP.get(itemDesigKey) : null);
        if (baseline && baseline.qty > 0) {
          stockInitial = baseline.qty;
        }
      }

      const seuil = safeNum(item.seuil, 3);
      const { stockActuel, alerte } = calculateStockStatus(stockInitial, entrees, sorties, seuil);

      return {
        ...item,
        stockInitial,
        entrees,
        sorties,
        stockActuel,
        alerte,
      };
    });
  }, [rawStock, mouvements]);

  const effectiveDesignations = useMemo(() => {
    if (
      Array.isArray(designations) &&
      designations.length > 0 &&
      designations.some((d) => (d.ref || d.id_designation) && (d.designation || d.libelle))
    ) {
      return designations;
    }
    if (Array.isArray(stockItems) && stockItems.length > 0) {
      return stockItems.map((s) => ({
        id: s.id,
        ref: s.ref,
        designation: s.designation,
        id_type: s.id_type || s.type || 'Standard',
        type: s.type || s.id_type || 'Standard',
        stockInitial: s.stockInitial || 0,
        seuil: s.seuil || 3,
        emplacement: s.emplacement || 'A1-R1',
      }));
    }
    return designations || [];
  }, [designations, stockItems]);

  const effectiveFamilies = useMemo(() => {
    if (
      Array.isArray(families) &&
      families.length >= 10 &&
      !families.some((f) => f.ref || f.stockInitial !== undefined || f.stockActuel !== undefined) &&
      families.some((f) => f.id_family === 'FAM-TOUR' || f.id_family === 'FAM-PRES')
    ) {
      return families;
    }
    return INITIAL_FAMILIES;
  }, [families]);

  const effectiveTemplates = useMemo(() => {
    if (
      Array.isArray(templates) &&
      templates.length >= 14 &&
      !templates.some(
        (t) => t.ref || t.stockInitial !== undefined || t.stockActuel !== undefined
      ) &&
      templates.some((t) => t.id_templates === 'TPL-TOURDEDETOUR' || t.id_templates === 'TPL-PRESSEHYDRAU')
    ) {
      return templates;
    }
    return INITIAL_TEMPLATES;
  }, [templates]);

  const diagnostics = effectiveDesignations;

  const warehouseItemsComputed = useMemo(() => {
    const mvtSummary = {};
    mouvements.forEach((m) => {
      const r = String(m.ref || m['Référence'] || m['Reference'] || '')
        .trim()
        .toLowerCase();
      if (!r) return;
      if (!mvtSummary[r]) {
        mvtSummary[r] = { entrees: 0, sorties: 0 };
      }
      const q = safeNum(m.quantite != null ? m.quantite : m['Quantité'], 0);
      const t = String(m.type || m['Type (Entrée/Sortie)'] || '').toLowerCase();
      if (t.includes('entr')) {
        mvtSummary[r].entrees += q;
      } else if (t.includes('sort')) {
        mvtSummary[r].sorties += q;
      }
    });

    return warehouseItems.map((item) => {
      const r = String(item.id_warehouse_item || '')
        .trim()
        .toLowerCase();
      const initial = safeNum(item.stockInitial, 1);
      const entrees = mvtSummary[r]?.entrees || 0;
      const sorties = mvtSummary[r]?.sorties || 0;
      const stockActuel = initial + entrees - sorties;

      const seuil = safeNum(item.seuil, 0);
      let alerte = 'OK';
      if (stockActuel <= 0) alerte = 'RUPTURE';
      else if (stockActuel <= seuil && seuil > 0) alerte = 'ALERTE';

      return {
        ...item,
        stockInitial: initial,
        entrees,
        sorties,
        stockActuel,
        seuil,
        alerte,
      };
    });
  }, [warehouseItems, mouvements]);

  // Stock KPIs
  const stockKPIs = useMemo(() => {
    let totalEntrees = 0;
    let totalSorties = 0;
    let totalStockActuel = 0;
    let ruptures = 0;
    let alertes = 0;

    stockItems.forEach((s) => {
      totalEntrees += s.entrees;
      totalSorties += s.sorties;
      totalStockActuel += s.stockActuel;
      if (s.alerte === 'RUPTURE') ruptures++;
      else if (s.alerte === 'ALERTE') alertes++;
    });

    return {
      totalArticles: stockItems.length,
      totalEntrees,
      totalSorties,
      totalStockActuel,
      ruptures,
      alertes,
    };
  }, [stockItems]);

  return {
    stockItems,
    effectiveDesignations,
    effectiveFamilies,
    effectiveTemplates,
    diagnostics,
    warehouseItemsComputed,
    stockKPIs,
  };
}
