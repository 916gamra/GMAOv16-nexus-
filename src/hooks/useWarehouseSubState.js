import { useState } from 'react';
import { storageService } from '../utils/storageService';
import initialWarehouseItems from '../data/warehouse/seedWarehouseItems.json';
import initialCompGroups from '../data/warehouse/seedCompGroups.json';
import initialCompFamilies from '../data/warehouse/seedCompFamilies.json';
import initialCompTemplates from '../data/warehouse/seedCompTemplates.json';
import initialEntrepotComponents from '../data/warehouse/seedEntrepotComponents.json';
import initialPartTypes from '../data/warehouse/seedPartTypes.json';
import initialPartDesignations from '../data/warehouse/seedPartDesignations.json';

/**
 * Hook managing Entrepôt items, component groups/families/templates, and part types/designations
 * Implements Dedicated Clean Seed Architecture (Standard Corrective Pattern)
 */
export function useWarehouseSubState(groupedState = {}) {
  const [compGroups, setCompGroups] = useState(() => {
    if (groupedState.compGroups && Array.isArray(groupedState.compGroups) && groupedState.compGroups.length > 0) {
      return groupedState.compGroups;
    }
    const cached = storageService.getItem('gmao_comp_groups_v2') || storageService.getItem('gmao_comp_groups_v1');
    if (cached && Array.isArray(cached) && cached.length >= initialCompGroups.length) {
      return cached;
    }
    return initialCompGroups;
  });

  const [warehouseItems, setWarehouseItems] = useState(() => {
    if (groupedState.warehouseItems && Array.isArray(groupedState.warehouseItems) && groupedState.warehouseItems.length > 0) {
      return groupedState.warehouseItems;
    }
    const cached = storageService.getItem('gmao_warehouse_items_v3') || storageService.getItem('gmao_warehouse_items_v2');
    if (cached && Array.isArray(cached) && cached.length > 0 && cached[0]?.ref) {
      return cached;
    }
    return initialWarehouseItems;
  });

  const [entrepotComponents, setEntrepotComponents] = useState(() => {
    if (groupedState.entrepotComponents && Array.isArray(groupedState.entrepotComponents) && groupedState.entrepotComponents.length > 0) {
      return groupedState.entrepotComponents;
    }
    const cached = storageService.getItem('gmao_entrepot_components_v3') || storageService.getItem('gmao_entrepot_components_v2');
    if (cached && Array.isArray(cached) && cached.length > 0 && cached[0]?.ref) {
      return cached;
    }
    return initialEntrepotComponents;
  });

  const [compFamilies, setCompFamilies] = useState(() => {
    if (groupedState.compFamilies && Array.isArray(groupedState.compFamilies) && groupedState.compFamilies.length > 0) {
      return groupedState.compFamilies;
    }
    const cached = storageService.getItem('gmao_comp_families_v3') || storageService.getItem('gmao_comp_families_v2');
    if (cached && Array.isArray(cached) && cached.length >= initialCompFamilies.length) return cached;
    return initialCompFamilies;
  });

  const [compTemplates, setCompTemplates] = useState(() => {
    if (groupedState.compTemplates && Array.isArray(groupedState.compTemplates) && groupedState.compTemplates.length > 0) {
      return groupedState.compTemplates;
    }
    const cached = storageService.getItem('gmao_comp_templates_v3') || storageService.getItem('gmao_comp_templates_v2');
    if (cached && Array.isArray(cached) && cached.length > 0 && cached[0]?.ref) {
      return cached;
    }
    return initialCompTemplates.map((t, idx) => ({
      ...t,
      id_templates: t.id_templates || t.id_template || t.id_comp_template || `TPL-${idx + 1}`
    }));
  });

  const [partTypes, setPartTypes] = useState(() => {
    if (groupedState.partTypes && Array.isArray(groupedState.partTypes) && groupedState.partTypes.length > 0) {
      return groupedState.partTypes;
    }
    const cached = storageService.getItem('gmao_part_types_v2') || storageService.getItem('gmao_part_types_v1');
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    return initialPartTypes;
  });

  const [partDesignations, setPartDesignations] = useState(() => {
    if (groupedState.partDesignations && Array.isArray(groupedState.partDesignations) && groupedState.partDesignations.length > 0) {
      return groupedState.partDesignations;
    }
    const cached = storageService.getItem('gmao_part_designations_v2') || storageService.getItem('gmao_part_designations_v1');
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    return initialPartDesignations;
  });

  return {
    compGroups,
    setCompGroups,
    warehouseItems,
    setWarehouseItems,
    entrepotComponents,
    setEntrepotComponents,
    compFamilies,
    setCompFamilies,
    compTemplates,
    setCompTemplates,
    partTypes,
    setPartTypes,
    partDesignations,
    setPartDesignations,
  };
}

