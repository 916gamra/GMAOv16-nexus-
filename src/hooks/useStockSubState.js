import { useState } from 'react';
import { storageService } from '../utils/storageService';
import initialData from '../initialData.json';
import { INITIAL_DIAGNOSTICS } from '../data/seedData';
import { BASELINE_STOCK_ITEMS, INITIAL_STOCK_LOOKUP } from '../utils/baselineStock';

/**
 * Hook managing Stock articles, raw items, types, and diagnostic designations
 */
export function useStockSubState(groupedState = {}) {
  const [types, setTypes] = useState(() => {
    if (groupedState.types) return groupedState.types;
    const saved = storageService.getItem('gmao_types_v4');
    if (saved) return saved;
    const set = new Set();
    (initialData.Stock_Actuel || []).forEach((item) => {
      const t = String(
        item['Désignation'] || item['D\u00c3\u00a9signation'] || item.type || ''
      ).trim();
      if (t && t !== '3' && !/^\d+$/.test(t)) set.add(t);
    });
    if (!set.size) {
      [
        'Foret',
        'Tenaille',
        'Vis',
        'Roulement',
        'Courroie',
        'Raccord',
        'Cheville',
        'Capteur',
        'teflon',
      ].forEach((t) => set.add(t));
    }
    return Array.from(set).map((t) => ({ id_type: t, libelle: t }));
  });

  const [rawStock, setRawStock] = useState(() => {
    const saved = groupedState.rawStock || storageService.getItem('gmao_raw_stock_v6');
    const rawList = saved && Array.isArray(saved) && saved.length > 0 ? saved : BASELINE_STOCK_ITEMS;
    const usedStockRefs = new Set();
    const usedStockIds = new Set();

    return rawList
      .map((s, idx) => {
        const itemRef = String(s.ref || s.Ref || s['Référence'] || s['Reference'] || '').trim();
        const refKey = itemRef.toLowerCase();

        const itemDesig = String(
          s.designation || s.Ref || s.ref || s['Désignation'] || s['D\u00c3\u00a9signation'] || ''
        ).trim();
        const desigKey = itemDesig.toLowerCase();
        
        // Find baseline by ref or by designation
        const baseline = INITIAL_STOCK_LOOKUP.get(refKey) || INITIAL_STOCK_LOOKUP.get(desigKey) || BASELINE_STOCK_ITEMS[idx];

        let stockInitial = 0;
        let hasExplicitInitial = false;
        if (s.stockInitial != null && s.stockInitial !== '' && !isNaN(Number(s.stockInitial))) {
          stockInitial = Number(s.stockInitial);
          hasExplicitInitial = true;
        } else if (s['Stock Initial'] != null && s['Stock Initial'] !== '' && !isNaN(Number(s['Stock Initial']))) {
          stockInitial = Number(s['Stock Initial']);
          hasExplicitInitial = true;
        } else if (s['Stock Actuel'] != null && s['Stock Actuel'] !== '' && !isNaN(Number(s['Stock Actuel']))) {
          stockInitial = Number(s['Stock Actuel']);
          hasExplicitInitial = true;
        } else if (typeof s.Type === 'number' && !isNaN(s.Type)) {
          stockInitial = s.Type;
        } else if (s.Type != null && !isNaN(Number(s.Type)) && s.Type !== '' && typeof s.Type !== 'string') {
          stockInitial = Number(s.Type);
        }

        // If stored quantity was null or completely missing, fallback to authentic Excel baseline data
        if (!hasExplicitInitial && baseline && baseline.qty > 0) {
          stockInitial = baseline.qty;
        }

        let finalRef = itemRef;
        let finalDesignation = itemDesig;
        let finalType = s.type || s.id_type || s['Désignation'];

        // If ref is identical to designation or starts with generic ART, restore the authentic type-based ref from baseline
        if (baseline) {
          if (!finalRef || finalRef === finalDesignation || finalRef.startsWith('ART') || finalRef === baseline.designation) {
            finalRef = baseline.ref;
          }
          if (!finalDesignation || finalDesignation === finalRef) {
            finalDesignation = baseline.designation;
          }
          finalType = s.type || s.id_type || baseline.type;
        } else {
          finalRef = finalRef || `ART${String(idx + 1).padStart(3, '0')}`;
          finalDesignation = finalDesignation || finalRef;
          finalType = finalType || 'Divers';
        }

        // Guarantee ref uniqueness
        let uniqueRef = finalRef;
        if (usedStockRefs.has(uniqueRef.toLowerCase())) {
          let suffix = 2;
          while (usedStockRefs.has(`${uniqueRef}_${suffix}`.toLowerCase())) {
            suffix++;
          }
          uniqueRef = `${uniqueRef}_${suffix}`;
        }
        usedStockRefs.add(uniqueRef.toLowerCase());

        let uniqueId = Number(s.id) || idx + 1;
        if (usedStockIds.has(uniqueId)) {
          uniqueId = Math.max(...usedStockIds, 0) + 1;
        }
        usedStockIds.add(uniqueId);

        const finalSeuil =
          Number(s.seuil != null ? s.seuil : s["Seuil d'Alerte"] != null ? s["Seuil d'Alerte"] : (baseline ? baseline.seuil : 3)) || 3;
        const finalEmplacement =
          s.emplacement ||
          s.Emplacement ||
          (baseline ? baseline.emplacement : `A${(idx % 8) + 1}-R${(idx % 6) + 1}`);

        return {
          id: uniqueId,
          ref: uniqueRef,
          designation: finalDesignation,
          id_type: s.id_type || finalType,
          id_diag: s.id_diag || s.diag || s.Diag || '',
          type: finalType,
          stockInitial,
          seuil: finalSeuil,
          emplacement: finalEmplacement,
        };
      })
      .sort((a, b) => {
        const typeComp = String(a.type || '').localeCompare(String(b.type || ''), undefined, { sensitivity: 'base' });
        if (typeComp !== 0) return typeComp;
        return String(a.ref || '').localeCompare(String(b.ref || ''), undefined, { numeric: true, sensitivity: 'base' });
      });
  });

  const [designations, setDesignations] = useState(() => {
    const saved = groupedState.designations || storageService.getItem('gmao_designations_v2');
    if (Array.isArray(saved) && saved.length > 0) {
      const hasValid = saved.some(
        (d) => (d.ref || d.id_designation) && (d.designation || d.libelle)
      );
      if (hasValid) return saved;
    }

    if (Array.isArray(initialData.Stock_Actuel) && initialData.Stock_Actuel.length > 0) {
      return initialData.Stock_Actuel.map((s, idx) => {
        const itemRef = String(s.Ref || s.ref || s['Référence'] || s['Reference'] || '').trim();
        const itemDesig = String(s['Désignation'] || s.designation || '').trim();
        const refKey = itemRef.toLowerCase();
        const desigKey = itemDesig.toLowerCase();
        const baseline = INITIAL_STOCK_LOOKUP.get(refKey) || INITIAL_STOCK_LOOKUP.get(desigKey);

        const finalRef = itemRef || (baseline ? baseline.ref : `ART${String(idx + 1).padStart(3, '0')}`);
        let finalDesignation = itemDesig;
        let finalType = s.type || s.id_type || s['Désignation'];
        if (baseline) {
          finalDesignation = baseline.designation;
          finalType = baseline.type;
        } else {
          finalDesignation = finalDesignation || finalRef;
          finalType = finalType || 'Divers';
        }

        let stockInitial = 0;
        if (s.stockInitial != null && !isNaN(Number(s.stockInitial))) {
          stockInitial = Number(s.stockInitial);
        } else if (s['Stock Initial'] != null && !isNaN(Number(s['Stock Initial']))) {
          stockInitial = Number(s['Stock Initial']);
        } else if (s['Stock Actuel'] != null && !isNaN(Number(s['Stock Actuel']))) {
          stockInitial = Number(s['Stock Actuel']);
        } else if (typeof s.Type === 'number' && !isNaN(s.Type)) {
          stockInitial = s.Type;
        } else if (baseline && baseline.qty > 0) {
          stockInitial = baseline.qty;
        }

        const seuil = Number(s.seuil || s["Seuil d'Alerte"] || (baseline ? baseline.seuil : 3)) || 3;
        const emplacement = s.emplacement || s.Emplacement || (baseline ? baseline.emplacement : `A${(idx % 8) + 1}-R${(idx % 6) + 1}`);

        return {
          id: s.id || `desig-${idx + 1}`,
          ref: finalRef,
          designation: finalDesignation,
          id_type: s.id_type || finalType,
          type: finalType,
          stockInitial,
          seuil,
          emplacement,
        };
      });
    }

    return (initialData.Diagnostics?.length ? initialData.Diagnostics : INITIAL_DIAGNOSTICS);
  });

  return {
    types,
    setTypes,
    rawStock,
    setRawStock,
    designations,
    setDesignations,
  };
}
