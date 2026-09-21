import { useState } from 'react';
import { storageService } from '../utils/storageService';
import { BASELINE_STOCK_ITEMS } from '../utils/baselineStock';
import { useStockSubState } from './useStockSubState';
import { useMachineSubState } from './useMachineSubState';
import { useWarehouseSubState } from './useWarehouseSubState';
import { useUserSubState } from './useUserSubState';
import { useMovementSubState } from './useMovementSubState';
import { useGmaoPersistence } from './useGmaoPersistence';

// Re-export baseline stock items for consumers
export { BASELINE_STOCK_ITEMS };

/**
 * Modularized Master GMAO State Orchestrator Hook.
 * Composes domain-specific sub-states: Stock, Machines, Warehouse, Users, and Movements.
 */
export function useGmaoState() {
  const [groupedState, setGroupedState] = useState(() => storageService.getItem('gmao_full_state_v1') || {});

  // 1. Domain sub-hooks
  const stockSub = useStockSubState(groupedState);
  const machineSub = useMachineSubState(groupedState);
  const warehouseSub = useWarehouseSubState(groupedState);
  const userSub = useUserSubState(groupedState);
  const movementSub = useMovementSubState(groupedState);

  // 2. Persistence & Multi-tab synchronization
  useGmaoPersistence({
    state: {
      ...stockSub,
      ...machineSub,
      ...warehouseSub,
      ...userSub,
      ...movementSub,
    },
    setters: {
      setTypes: stockSub.setTypes,
      setDesignations: stockSub.setDesignations,
      setRawStock: stockSub.setRawStock,
      setFamilies: machineSub.setFamilies,
      setTemplates: machineSub.setTemplates,
      setBlueprints: machineSub.setBlueprints,
      setMachines: machineSub.setMachines,
      setZones: machineSub.setZones,
      setWarehouseItems: warehouseSub.setWarehouseItems,
      setEntrepotComponents: warehouseSub.setEntrepotComponents,
      setCompGroups: warehouseSub.setCompGroups,
      setCompFamilies: warehouseSub.setCompFamilies,
      setCompTemplates: warehouseSub.setCompTemplates,
      setPartTypes: warehouseSub.setPartTypes,
      setPartDesignations: warehouseSub.setPartDesignations,
      setTechnicians: userSub.setTechnicians,
      setOperations: userSub.setOperations,
      setMouvements: movementSub.setMouvements,
    },
    validators: {
      isValidMachineFamilies: machineSub.isValidMachineFamilies,
      isValidMachineTemplates: machineSub.isValidMachineTemplates,
    },
    onStateChange: (newState) => {
      setGroupedState(newState);
    },
  });

  return {
    types: stockSub.types,
    setTypes: stockSub.setTypes,
    designations: stockSub.designations,
    setDesignations: stockSub.setDesignations,
    rawStock: stockSub.rawStock,
    setRawStock: stockSub.setRawStock,
    families: machineSub.families,
    setFamilies: machineSub.setFamilies,
    templates: machineSub.templates,
    setTemplates: machineSub.setTemplates,
    blueprints: machineSub.blueprints,
    setBlueprints: machineSub.setBlueprints,
    machines: machineSub.machines,
    setMachines: machineSub.setMachines,
    zones: machineSub.zones,
    setZones: machineSub.setZones,
    warehouseItems: warehouseSub.warehouseItems,
    setWarehouseItems: warehouseSub.setWarehouseItems,
    entrepotComponents: warehouseSub.entrepotComponents,
    setEntrepotComponents: warehouseSub.setEntrepotComponents,
    compGroups: warehouseSub.compGroups,
    setCompGroups: warehouseSub.setCompGroups,
    compFamilies: warehouseSub.compFamilies,
    setCompFamilies: warehouseSub.setCompFamilies,
    compTemplates: warehouseSub.compTemplates,
    setCompTemplates: warehouseSub.setCompTemplates,
    partTypes: warehouseSub.partTypes,
    setPartTypes: warehouseSub.setPartTypes,
    partDesignations: warehouseSub.partDesignations,
    setPartDesignations: warehouseSub.setPartDesignations,
    technicians: userSub.technicians,
    setTechnicians: userSub.setTechnicians,
    operations: userSub.operations,
    setOperations: userSub.setOperations,
    mouvements: movementSub.mouvements,
    setMouvements: movementSub.setMouvements,
  };
}
