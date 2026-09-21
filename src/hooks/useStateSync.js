import { useEffect } from 'react';
import { storageService } from '../utils/storageService';
import { Logger } from '../core/logger/LoggerService';

/**
 * Hook to manage real-time multi-tab and multi-window state synchronization
 */
export function useStateSync(setters, validators) {
  const {
    setTypes,
    setDesignations,
    setFamilies,
    setTemplates,
    setBlueprints,
    setCompFamilies,
    setCompTemplates,
    setPartTypes,
    setPartDesignations,
    setMachines,
    setWarehouseItems,
    setZones,
    setTechnicians,
    setOperations,
    setMouvements,
    setRawStock,
  } = setters;

  const { isValidMachineFamilies, isValidMachineTemplates } = validators;

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'gmao_full_state_v1' && e.newValue) {
        try {
          const fresh = storageService.getItem('gmao_full_state_v1');
          if (fresh) {
            if (fresh.types) setTypes(fresh.types);
            if (fresh.designations) setDesignations(fresh.designations);
            if (fresh.families && isValidMachineFamilies(fresh.families)) setFamilies(fresh.families);
            if (fresh.templates && isValidMachineTemplates(fresh.templates)) setTemplates(fresh.templates);
            if (fresh.blueprints && Array.isArray(fresh.blueprints)) setBlueprints(fresh.blueprints);
            if (fresh.compFamilies) setCompFamilies(fresh.compFamilies);
            if (fresh.compTemplates) setCompTemplates(fresh.compTemplates);
            if (fresh.partTypes) setPartTypes(fresh.partTypes);
            if (fresh.partDesignations) setPartDesignations(fresh.partDesignations);
            if (fresh.machines) setMachines(fresh.machines);
            if (fresh.warehouseItems) setWarehouseItems(fresh.warehouseItems);
            if (fresh.zones) setZones(fresh.zones);
            if (fresh.technicians) setTechnicians(fresh.technicians);
            if (fresh.operations) setOperations(fresh.operations);
            if (fresh.mouvements) setMouvements(fresh.mouvements);
            if (fresh.rawStock) setRawStock(fresh.rawStock);
          }
        } catch (_err) {
          Logger.error('Failed to sync across tabs:', _err, 'useStateSync');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [
    isValidMachineFamilies,
    isValidMachineTemplates,
    setTypes,
    setDesignations,
    setFamilies,
    setTemplates,
    setBlueprints,
    setCompFamilies,
    setCompTemplates,
    setPartTypes,
    setPartDesignations,
    setMachines,
    setWarehouseItems,
    setZones,
    setTechnicians,
    setOperations,
    setMouvements,
    setRawStock,
  ]);
}
