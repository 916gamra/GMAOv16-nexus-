import { useMemo, useSyncExternalStore, useEffect, useRef } from 'react';
import { safeNum, calculateStockStatus } from '../utils/formulaEngine';
import { INITIAL_STOCK_LOOKUP } from '../utils/baselineStock';
import { INITIAL_FAMILIES, INITIAL_TEMPLATES } from '../data/seedData';
import { stockIndexStore } from '../application/StockIndexStore';

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
  const hydratedRef = useRef(false);

  // Sync initial movements once on startup or when bulk data changes
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!mouvements || mouvements.length === 0) return;

    if (stockIndexStore.isHydrated()) {
      hydratedRef.current = true;
      return;
    }

    const deltas = mouvements.map((m) => ({
      ref: m.ref || m['Référence'] || m['Reference'] || '',
      type: m.type || m['Type (Entrée/Sortie)'] || '',
      quantity: safeNum(m.quantite != null ? m.quantite : m['Quantité'], 0),
    }));
    stockIndexStore.index.rebuild(deltas);
    stockIndexStore.markHydrated();
    stockIndexStore.notifyAll();
    hydratedRef.current = true;
  }, [mouvements]);

  // Subscribe to index version changes
  const globalVersion = useSyncExternalStore(
    stockIndexStore.subscribeAll,
    stockIndexStore.getGlobalVersion,
    () => 0
  );

  // Compute Full Stock with Dynamic Live Calculations (Formula F, G, H, J)
  const stockItems = useMemo(() => {
    return rawStock.map((item) => {
      const itemRef = String(item.ref || '').trim();
      const itemRefKey = itemRef.toLowerCase();
      const itemDesigKey = String(item.designation || '')
        .trim()
        .toLowerCase();

      let totals = stockIndexStore.index.getTotals(itemRef);
      if (totals.entrees === 0 && totals.sorties === 0 && mouvements && mouvements.length > 0) {
        let e = 0;
        let s = 0;
        const refLower = itemRef.toLowerCase();
        mouvements.forEach((m) => {
          const mRef = String(m.ref || m['Référence'] || m['Reference'] || '').trim().toLowerCase();
          if (mRef === refLower) {
            const qty = safeNum(m.quantite != null ? m.quantite : m['Quantité'], 0);
            const typeStr = String(m.type || m['Type (Entrée/Sortie)'] || '').toLowerCase();
            if (typeStr.includes('sort')) s += qty;
            else if (typeStr.includes('entr')) e += qty;
          }
        });
        if (e > 0 || s > 0) {
          totals = { ...totals, entrees: e, sorties: s };
        }
      }

      let stockInitial = 0;
      if (
        item.stockInitial !== undefined &&
        item.stockInitial !== null &&
        item.stockInitial !== '' &&
        !isNaN(Number(item.stockInitial))
      ) {
        stockInitial = Number(item.stockInitial);
      } else {
        const baseline =
          INITIAL_STOCK_LOOKUP.get(itemRefKey) ||
          (itemDesigKey ? INITIAL_STOCK_LOOKUP.get(itemDesigKey) : null);
        if (baseline && baseline.qty > 0) {
          stockInitial = baseline.qty;
        }
      }

      const seuil = safeNum(item.seuil, 3);
      const { stockActuel, alerte } = calculateStockStatus(
        stockInitial,
        totals.entrees,
        totals.sorties,
        seuil
      );

      return {
        ...item,
        stockInitial,
        entrees: totals.entrees,
        sorties: totals.sorties,
        commandes: totals.commandes,
        stockActuel,
        alerte,
      };
    });
  }, [rawStock, globalVersion]);

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
    return warehouseItems.map((item) => {
      const itemKey = String(item.id_warehouse_item || item.ref || '').trim();
      const initial = safeNum(item.stockInitial, 1);
      const totals = stockIndexStore.index.getTotals(itemKey);
      const stockActuel = initial + totals.entrees - totals.sorties;

      const seuil = safeNum(item.seuil, 0);
      let alerte = 'OK';
      if (stockActuel <= 0) alerte = 'RUPTURE';
      else if (stockActuel <= seuil && seuil > 0) alerte = 'ALERTE';

      return {
        ...item,
        stockInitial: initial,
        entrees: totals.entrees,
        sorties: totals.sorties,
        commandes: totals.commandes,
        stockActuel,
        seuil,
        alerte,
      };
    });
  }, [warehouseItems, globalVersion]);

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
