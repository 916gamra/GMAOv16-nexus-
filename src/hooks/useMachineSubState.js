import { useState, useCallback } from 'react';
import { storageService } from '../utils/storageService';
import initialFamilies from '../data/machines/seedFamilies.json';
import initialTemplates from '../data/machines/seedTemplates.json';
import initialBlueprints from '../data/machines/seedBlueprints.json';
import initialMachines from '../data/machines/seedMachines.json';
import initialZones from '../data/machines/seedZones.json';
import initialMachineBomLedger from '../data/machines/seedMachineBomLedger.json';

/**
 * Hook managing Machine hierarchy: Families, Templates, Blueprints, Machines, Zones, and BOM Ledger
 * Implements Dedicated Clean Seed Architecture (Standard Corrective Pattern)
 */
export function useMachineSubState(groupedState = {}) {
  const isValidMachineTemplates = useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every(
      (item) =>
        item &&
        (item.id_templates || item.id) &&
        (item.id_family || item.libelle || item.family)
    );
  }, []);

  const isValidMachineFamilies = useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every(
      (item) =>
        item &&
        (item.id_family || item.id) &&
        (item.libelle || item.nom || item.name)
    );
  }, []);

  const [families, setFamilies] = useState(() => {
    if (groupedState.families && Array.isArray(groupedState.families) && groupedState.families.length > 0) {
      return groupedState.families;
    }
    const candidate = storageService.getItem('gmao_families_v2') || storageService.getItem('gmao_families');
    if (
      Array.isArray(candidate) &&
      candidate.length >= 10 &&
      isValidMachineFamilies(candidate)
    ) {
      return candidate;
    }
    return initialFamilies;
  });

  const [templates, setTemplates] = useState(() => {
    if (groupedState.templates && Array.isArray(groupedState.templates) && groupedState.templates.length > 0) {
      return groupedState.templates;
    }
    const candidate = storageService.getItem('gmao_templates_v2') || storageService.getItem('gmao_templates');
    if (
      Array.isArray(candidate) &&
      candidate.length >= 30 &&
      isValidMachineTemplates(candidate)
    ) {
      return candidate;
    }
    return initialTemplates;
  });

  const [blueprints, setBlueprints] = useState(() => {
    if (groupedState.blueprints && Array.isArray(groupedState.blueprints) && groupedState.blueprints.length > 0) {
      return groupedState.blueprints;
    }
    const candidate = storageService.getItem('gmao_blueprints_v2') || storageService.getItem('gmao_blueprints_v1');
    if (Array.isArray(candidate) && candidate.length >= 40) {
      return candidate;
    }
    return initialBlueprints;
  });

  const [machines, setMachines] = useState(() => {
    if (groupedState.machines && Array.isArray(groupedState.machines) && groupedState.machines.length > 0) {
      return groupedState.machines;
    }
    const candidate = storageService.getItem('gmao_machines_v2') || storageService.getItem('gmao_machines');
    if (
      Array.isArray(candidate) &&
      candidate.length >= 300 &&
      candidate.some((m) => m.id_machine_registered === 'DET-01' || m.id_machine_registered === 'PRH-01')
    ) {
      return candidate;
    }
    return initialMachines;
  });

  const [zones, setZones] = useState(() => {
    if (groupedState.zones && Array.isArray(groupedState.zones) && groupedState.zones.length > 0) {
      return groupedState.zones;
    }
    const raw = storageService.getItem('gmao_zones_v2') || storageService.getItem('gmao_zones');
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
    return initialZones;
  });

  const [machineElementsLedger, setMachineElementsLedger] = useState(() => {
    if (groupedState.machineElementsLedger && Array.isArray(groupedState.machineElementsLedger) && groupedState.machineElementsLedger.length > 0) {
      return groupedState.machineElementsLedger;
    }
    const candidate = storageService.getItem('gmao_machine_bom_ledger_v1');
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
    return initialMachineBomLedger;
  });

  const addMachineElement = useCallback((element) => {
    setMachineElementsLedger((prev) => {
      const id = element.id || `BOM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newEntry = { ...element, id };
      const updated = [newEntry, ...prev];
      storageService.setItem('gmao_machine_bom_ledger_v1', updated);
      return updated;
    });
  }, []);

  const updateMachineElement = useCallback((id, updates) => {
    setMachineElementsLedger((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      storageService.setItem('gmao_machine_bom_ledger_v1', updated);
      return updated;
    });
  }, []);

  const deleteMachineElement = useCallback((id) => {
    setMachineElementsLedger((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      storageService.setItem('gmao_machine_bom_ledger_v1', updated);
      return updated;
    });
  }, []);

  const duplicateBOMToTwins = useCallback((sourceMachineId, targetMachineIds = []) => {
    setMachineElementsLedger((prev) => {
      const sourceElements = prev.filter((e) => e.id_machine_registered === sourceMachineId);
      if (sourceElements.length === 0 || !Array.isArray(targetMachineIds) || targetMachineIds.length === 0) {
        return prev;
      }
      const cloned = [];
      targetMachineIds.forEach((targetId) => {
        // Avoid duplicates on target
        sourceElements.forEach((src) => {
          const exists = prev.some((e) => e.id_machine_registered === targetId && e.ref_element === src.ref_element);
          if (!exists) {
            cloned.push({
              ...src,
              id: `BOM-${targetId}-${Math.random().toString(36).substring(2, 7)}`,
              id_machine_registered: targetId,
              date_installation: new Date().toISOString().split('T')[0],
              heures_actuelles: 0,
            });
          }
        });
      });
      const updated = [...cloned, ...prev];
      storageService.setItem('gmao_machine_bom_ledger_v1', updated);
      return updated;
    });
  }, []);

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
    machineElementsLedger,
    setMachineElementsLedger,
    addMachineElement,
    updateMachineElement,
    deleteMachineElement,
    duplicateBOMToTwins,
    isValidMachineFamilies,
    isValidMachineTemplates,
  };
}
