import { useState } from 'react';
import { storageService } from '../utils/storageService';
import initialStockSeed from '../data/stock/seedStockItems.json';
import initialStockTypes from '../data/stock/seedStockTypes.json';

/**
 * Hook managing Stock articles, raw items, types, and diagnostic designations
 * Implements Dedicated Clean Seed Architecture (Standard Corrective Pattern)
 */
export function useStockSubState(groupedState = {}) {
  const [types, setTypes] = useState(() => {
    if (groupedState.types && Array.isArray(groupedState.types) && groupedState.types.length > 0) {
      return groupedState.types;
    }
    const saved = storageService.getItem('gmao_types_v5');
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return initialStockTypes;
  });

  const [rawStock, setRawStock] = useState(() => {
    if (groupedState.rawStock && Array.isArray(groupedState.rawStock) && groupedState.rawStock.length > 0) {
      return groupedState.rawStock;
    }
    const saved = storageService.getItem('gmao_raw_stock_v7');
    if (saved && Array.isArray(saved) && saved.length >= 800) {
      return saved;
    }
    return initialStockSeed;
  });

  const [designations, setDesignations] = useState(() => {
    if (groupedState.designations && Array.isArray(groupedState.designations) && groupedState.designations.length > 0) {
      return groupedState.designations;
    }
    const saved = storageService.getItem('gmao_designations_v3');
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return initialStockSeed.map((s) => ({
      id: s.id,
      ref: s.ref,
      designation: s.designation,
      id_type: s.id_type,
      type: s.type,
      stockInitial: s.stockInitial,
      seuil: s.seuil,
      emplacement: s.emplacement,
    }));
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

