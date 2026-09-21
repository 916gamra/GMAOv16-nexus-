import { useState } from 'react';
import { storageService } from '../utils/storageService';
import { BASELINE_STOCK_ITEMS } from '../utils/baselineStock';
import { useStockSubState } from './useStockSubState';
import { useMachineSubState } from './useMachineSubState';
import { useWarehouseSubState } from './useWarehouseSubState';
import { useUserSubState } from './useUserSubState';
import { useMovementSubState } from './useMovementSubState';
import { usePreventiveSubState } from './usePreventiveSubState';
import { useSortieExterneSubState } from './useSortieExterneSubState';
import { useGmaoPersistence } from './useGmaoPersistence';

// Re-export baseline stock items for consumers
export { BASELINE_STOCK_ITEMS };

/**
 * Modularized Master GMAO State Orchestrator Hook.
 * Composes domain-specific sub-states: Stock, Machines, Warehouse, Users, Movements, Preventive Maintenance, and Sortie Externe.
 */
export function useGmaoState() {
  const [groupedState, setGroupedState] = useState(() => storageService.getItem('gmao_full_state_v1') || {});

  // 1. Domain sub-hooks
  const stockSub = useStockSubState(groupedState);
  const machineSub = useMachineSubState(groupedState);
  const warehouseSub = useWarehouseSubState(groupedState);
  const userSub = useUserSubState(groupedState);
  const movementSub = useMovementSubState(groupedState);
  const preventiveSub = usePreventiveSubState(groupedState);
  const sortieExterneSub = useSortieExterneSubState(groupedState);

  // 2. Persistence & Multi-tab synchronization
  useGmaoPersistence({
    state: {
      ...stockSub,
      ...machineSub,
      ...warehouseSub,
      ...userSub,
      ...movementSub,
      preventiveTasks: preventiveSub.tasks,
      preventiveActions: preventiveSub.actions,
      preventiveGuides: preventiveSub.guides,
      preventivePlans: preventiveSub.plans,
      sortiesExterne: sortieExterneSub.sortiesExterne,
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
      setPreventiveTasks: preventiveSub.setTasks,
      setPreventiveActions: preventiveSub.setActions,
      setPreventiveGuides: preventiveSub.setGuides,
      setPreventivePlans: preventiveSub.setPlans,
      setSortiesExterne: sortieExterneSub.setSortiesExterne,
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
    // Preventive maintenance state and unified handlers
    preventiveTasks: preventiveSub.tasks,
    setPreventiveTasks: preventiveSub.setTasks,
    preventiveActions: preventiveSub.actions,
    setPreventiveActions: preventiveSub.setActions,
    preventiveGuides: preventiveSub.guides,
    setPreventiveGuides: preventiveSub.setGuides,
    preventivePlans: preventiveSub.plans,
    setPreventivePlans: preventiveSub.setPlans,
    handleUpdateTask: preventiveSub.handleUpdateTask,
    handleDeleteTask: preventiveSub.handleDeleteTask,
    handleUpdateTaskCounter: preventiveSub.handleUpdateTaskCounter,
    handleMarkTaskDone: preventiveSub.handleMarkTaskDone,
    handleCreatePlanWithTasks: preventiveSub.handleCreatePlanWithTasks,
    handleAddAction: preventiveSub.handleAddAction,
    handleUpdateAction: preventiveSub.handleUpdateAction,
    handleDeleteAction: preventiveSub.handleDeleteAction,
    handleAddGuide: preventiveSub.handleAddGuide,
    handleUpdateGuide: preventiveSub.handleUpdateGuide,
    handleDeleteGuide: preventiveSub.handleDeleteGuide,
    handleResetPreventiveToBaseline: preventiveSub.handleResetPreventiveToBaseline,
    handleClearPreventiveForRealFactory: preventiveSub.handleClearPreventiveForRealFactory,
    // Sortie externe & bobinage state and unified handlers
    sortiesExterne: sortieExterneSub.sortiesExterne,
    setSortiesExterne: sortieExterneSub.setSortiesExterne,
    handleAddSortieExterne: sortieExterneSub.handleAddSortieExterne,
    handleUpdateSortieExterne: sortieExterneSub.handleUpdateSortieExterne,
    handleDeleteSortieExterne: sortieExterneSub.handleDeleteSortieExterne,
    handleMarkSortieReturned: sortieExterneSub.handleMarkSortieReturned,
    handleMarkSortieMounted: sortieExterneSub.handleMarkSortieMounted,
    handleClearSortiesForRealFactory: sortieExterneSub.handleClearSortiesForRealFactory,
    handleResetSortiesToBaseline: sortieExterneSub.handleResetSortiesToBaseline,
  };
}
