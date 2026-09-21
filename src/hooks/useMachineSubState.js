import { useState, useCallback } from 'react';
import { storageService } from '../utils/storageService';
import {
  INITIAL_FAMILIES,
  INITIAL_TEMPLATES,
  INITIAL_BLUEPRINTS,
  INITIAL_MACHINES_REGISTERED,
  INITIAL_ZONES,
} from '../data/seedData';

/**
 * Hook managing Machine hierarchy: Families, Templates, Blueprints, Machines, and Zones
 */
export function useMachineSubState(groupedState = {}) {
  const isStockCorrupted = useCallback((arr) => {
    if (!Array.isArray(arr)) return true;
    if (arr.length === 0) return false;

    // Check that at least 90% of items have valid structure
    const validCount = arr.reduce((count, item) => {
      if (!item || typeof item !== 'object') return count;
      if (
        item.ref ||
        item.designation ||
        item.stockActuel !== undefined ||
        item.stockInitial !== undefined ||
        item.type
      ) {
        return count + 1;
      }
      return count;
    }, 0);

    return (validCount / arr.length) < 0.9;
  }, []);

  const isValidMachineTemplates = useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    if (isStockCorrupted(arr)) return false;

    return arr.every(
      (item) =>
        item &&
        (item.id_templates || item.id) &&
        (item.id_family || item.libelle || item.family)
    );
  }, [isStockCorrupted]);

  const isValidMachineFamilies = useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    if (isStockCorrupted(arr)) return false;

    return arr.every(
      (item) =>
        item &&
        (item.id_family || item.id) &&
        (item.libelle || item.nom || item.name)
    );
  }, [isStockCorrupted]);

  const [families, setFamilies] = useState(() => {
    const candidate = groupedState.families || storageService.getItem('gmao_families');
    if (
      isValidMachineFamilies(candidate) &&
      !candidate.some((f) => f.id_family === 'FAM-TR' || f.id_family === 'FAM-01') &&
      candidate.some((f) => f.id_family === 'FAM-TOUR' || f.id_family === 'FAM-PRES')
    ) {
      return candidate;
    }
    return INITIAL_FAMILIES;
  });

  const [templates, setTemplates] = useState(() => {
    const candidate = groupedState.templates || storageService.getItem('gmao_templates');
    if (
      isValidMachineTemplates(candidate) &&
      !candidate.some((t) => t.id_family === 'FAM-TR' || t.id_family === 'FAM-01' || t.id_templates === 'TPL-TRR') &&
      candidate.some((t) => t.id_templates === 'TPL-TOURDEDETOUR' || t.id_templates === 'TPL-PRESSEHYDRAU')
    ) {
      return candidate;
    }
    if (isStockCorrupted(candidate)) {
      storageService.removeItem('gmao_templates');
    }
    return INITIAL_TEMPLATES;
  });

  const [blueprints, setBlueprints] = useState(() => {
    const candidate = groupedState.blueprints || storageService.getItem('gmao_blueprints_v1');
    if (Array.isArray(candidate) && candidate.length > 0 && !candidate.some((b) => b.id_family === 'FAM-TR' || b.id_family === 'FAM-01')) {
      return candidate;
    }
    return INITIAL_BLUEPRINTS;
  });

  const [machines, setMachines] = useState(() => {
    const candidate = groupedState.machines || storageService.getItem('gmao_machines');
    if (
      Array.isArray(candidate) &&
      candidate.length >= 200 &&
      !candidate.some((m) => m.id_machine_registered === 'MCH-001' || m.id === 'MCH-001' || m.id_family === 'FAM-TR' || m.id_family === 'FAM-01') &&
      candidate.some((m) => m.id_machine_registered === 'DET-01' || m.id_machine_registered === 'DET-09' || m.id_machine_registered === 'PRH-01')
    ) {
      return candidate;
    }
    return INITIAL_MACHINES_REGISTERED;
  });

  const [zones, setZones] = useState(() => {
    const raw =
      groupedState.zones ||
      storageService.getItem('gmao_zones');
    if (
      Array.isArray(raw) &&
      raw.length >= 14 &&
      raw.some((z) => z.id_zone === 'Détourage' || z.id_zone === 'FM' || z.code_zone === 'DETOURAG')
    ) {
      return raw.map((z) => ({
        ...z,
        code_zone: z.code_zone || z.code || z.id_zone,
        id_zone: z.id_zone || z.code_zone || z.code,
      }));
    }
    return INITIAL_ZONES;
  });

  return {
    families,
    setFamilies,
    templates,
    setTemplates,
    blueprints,
    setBlueprints,
    machines,
    setMachines,
    zones,
    setZones,
    isValidMachineFamilies,
    isValidMachineTemplates,
  };
}
