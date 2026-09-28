import { useEffect, useRef } from 'react';
import { storageService } from '../utils/storageService';
import { Logger } from '../core/logger/LoggerService';
import { ConflictResolutionService } from '../services/ConflictResolutionService';

const REALTIME_CHANNEL_NAME = 'gmao_realtime_sync_channel';

/**
 * High-Performance Hook to manage real-time multi-tab and multi-window state synchronization.
 * Leverages BroadcastChannel API for zero-latency instant messaging across open browser windows
 * and integrates ConflictResolutionService for deterministic Last Write Wins conflict resolution.
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
    setPreventiveTasks,
    setPreventiveActions,
    setPreventiveGuides,
    setPreventivePlans,
    setSortiesExterne,
  } = setters;

  const { isValidMachineFamilies, isValidMachineTemplates } = validators || {};
  const channelRef = useRef(null);

  useEffect(() => {
    // Process incoming fresh state payload and apply deterministic conflict resolution
    const applyStateSync = (fresh, isBroadcast = false) => {
      if (!fresh) return;

      try {
        if (fresh.types && setTypes) setTypes(fresh.types);
        if (fresh.designations && setDesignations) setDesignations(fresh.designations);
        if (fresh.families && setFamilies && (!isValidMachineFamilies || isValidMachineFamilies(fresh.families))) {
          setFamilies(fresh.families);
        }
        if (fresh.templates && setTemplates && (!isValidMachineTemplates || isValidMachineTemplates(fresh.templates))) {
          setTemplates(fresh.templates);
        }
        if (fresh.blueprints && Array.isArray(fresh.blueprints) && setBlueprints) setBlueprints(fresh.blueprints);
        if (fresh.compFamilies && setCompFamilies) setCompFamilies(fresh.compFamilies);
        if (fresh.compTemplates && setCompTemplates) setCompTemplates(fresh.compTemplates);
        if (fresh.partTypes && setPartTypes) setPartTypes(fresh.partTypes);
        if (fresh.partDesignations && setPartDesignations) setPartDesignations(fresh.partDesignations);

        // Apply conflict resolution for transactional collections if broadcast conflict occurs
        if (fresh.machines && setMachines) setMachines(fresh.machines);
        if (fresh.warehouseItems && setWarehouseItems) setWarehouseItems(fresh.warehouseItems);
        if (fresh.zones && setZones) setZones(fresh.zones);
        if (fresh.technicians && setTechnicians) setTechnicians(fresh.technicians);
        if (fresh.operations && setOperations) setOperations(fresh.operations);

        if (fresh.mouvements && setMouvements) {
          if (isBroadcast) {
            setMouvements((prevMouvementList) => {
              if (!Array.isArray(prevMouvementList) || prevMouvementList.length === 0) return fresh.mouvements;
              return ConflictResolutionService.resolveMultipleConflicts(
                prevMouvementList,
                fresh.mouvements,
                ConflictResolutionService.STRATEGIES.LAST_WRITE_WINS
              );
            });
          } else {
            setMouvements(fresh.mouvements);
          }
        }

        if (fresh.rawStock && setRawStock) setRawStock(fresh.rawStock);
        if (fresh.preventiveTasks && setPreventiveTasks) setPreventiveTasks(fresh.preventiveTasks);
        if (fresh.preventiveActions && setPreventiveActions) setPreventiveActions(fresh.preventiveActions);
        if (fresh.preventiveGuides && setPreventiveGuides) setPreventiveGuides(fresh.preventiveGuides);
        if (fresh.preventivePlans && setPreventivePlans) setPreventivePlans(fresh.preventivePlans);
        if (fresh.sortiesExterne && setSortiesExterne) setSortiesExterne(fresh.sortiesExterne);

        Logger.info(`[useStateSync] State synchronized across tabs via ${isBroadcast ? 'BroadcastChannel' : 'StorageEvent'}`);
      } catch (err) {
        Logger.error('Failed to sync across tabs:', err, 'useStateSync');
      }
    };

    // 1. Initialize BroadcastChannel for zero-latency multi-tab sync
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        const bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
        channelRef.current = bc;

        bc.onmessage = (event) => {
          if (event && event.data && event.data.type === 'GMAO_STATE_UPDATE') {
            applyStateSync(event.data.payload, true);
          }
        };
      } catch (bcErr) {
        Logger.warn('[useStateSync] BroadcastChannel initialization failed:', bcErr);
      }
    }

    // 2. Fallback window storage event handler
    const handleStorageChange = (e) => {
      if (e.key === 'gmao_full_state_v1' && e.newValue) {
        try {
          const fresh = storageService.getItem('gmao_full_state_v1');
          applyStateSync(fresh, false);
        } catch (_err) {
          Logger.error('Failed to sync via storage event:', _err, 'useStateSync');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channelRef.current) {
        try {
          channelRef.current.close();
        } catch {
          // ignore
        }
      }
    };
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
    setPreventiveTasks,
    setPreventiveActions,
    setPreventiveGuides,
    setPreventivePlans,
    setSortiesExterne,
  ]);
}
