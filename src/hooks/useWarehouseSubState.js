import { useState } from 'react';
import { storageService } from '../utils/storageService';
import {
  INITIAL_WAREHOUSE_ITEMS,
  INITIAL_COMP_GROUPS,
  INITIAL_COMP_FAMILIES,
  INITIAL_COMP_TEMPLATES,
  INITIAL_ENTREPOT_COMPONENTS,
  INITIAL_PART_TYPES,
  INITIAL_PART_DESIGNATIONS,
} from '../data/seedData';

/**
 * Hook managing Entrepôt items, component groups/families/templates, and part types/designations
 */
export function useWarehouseSubState(groupedState = {}) {
  const [compGroups, setCompGroups] = useState(() => {
    const cached = storageService.getItem('gmao_comp_groups_v1');
    if (cached && Array.isArray(cached) && cached.length >= (INITIAL_COMP_GROUPS || []).length) {
      return cached;
    }
    return INITIAL_COMP_GROUPS || [];
  });

  const [warehouseItems, setWarehouseItems] = useState(() => {
    const cached = storageService.getItem('gmao_warehouse_items_v2');
    if (cached && Array.isArray(cached) && cached.length > 0 && cached[0]?.ref) {
      return cached;
    }
    const cachedV1 = storageService.getItem('gmao_warehouse_items_v1');
    if (cachedV1 && Array.isArray(cachedV1) && cachedV1.length > 0 && cachedV1[0]?.ref) {
      return cachedV1;
    }
    return INITIAL_WAREHOUSE_ITEMS;
  });

  const [entrepotComponents, setEntrepotComponents] = useState(() => {
    const cached = storageService.getItem('gmao_entrepot_components_v2');
    if (cached && Array.isArray(cached) && cached.length > 0 && cached[0]?.ref) {
      return cached;
    }
    const cachedV1 = storageService.getItem('gmao_entrepot_components_v1');
    if (cachedV1 && Array.isArray(cachedV1) && cachedV1.length > 0 && cachedV1[0]?.ref) {
      return cachedV1;
    }
    return INITIAL_ENTREPOT_COMPONENTS;
  });

  const [compFamilies, setCompFamilies] = useState(() => {
    const cached = storageService.getItem('gmao_comp_families_v2') || storageService.getItem('gmao_comp_families_v1');
    if (cached && Array.isArray(cached) && cached.length >= INITIAL_COMP_FAMILIES.length) return cached;
    return INITIAL_COMP_FAMILIES;
  });

  const [compTemplates, setCompTemplates] = useState(() => {
    const cached = storageService.getItem('gmao_comp_templates_v2');
    if (cached && Array.isArray(cached) && cached.length > 0 && cached[0]?.ref) {
      return cached;
    }
    const cachedV1 = storageService.getItem('gmao_comp_templates_v1');
    if (cachedV1 && Array.isArray(cachedV1) && cachedV1.length > 0 && cachedV1[0]?.ref) {
      return cachedV1;
    }
    return (INITIAL_COMP_TEMPLATES || []).map((t, idx) => ({
      ...t,
      id_templates: t.id_templates || t.id_template || t.id_comp_template || `TPL-${idx + 1}`
    }));
  });

  const [partTypes, setPartTypes] = useState(() => {
    return (
      groupedState.partTypes ||
      storageService.getItem('gmao_part_types_v1') ||
      INITIAL_PART_TYPES
    );
  });

  const [partDesignations, setPartDesignations] = useState(() => {
    return (
      groupedState.partDesignations ||
      storageService.getItem('gmao_part_designations_v1') ||
      INITIAL_PART_DESIGNATIONS
    );
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
