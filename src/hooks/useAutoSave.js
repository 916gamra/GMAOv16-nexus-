import { useEffect, useRef, useCallback } from 'react';
import { storageService } from '../utils/storageService';
import { indexedDBService } from '../utils/indexedDBService';
import { Logger } from '../core/logger/LoggerService';
import { AutoBackupService } from '../core/backup/AutoBackupService';

const REALTIME_CHANNEL_NAME = 'gmao_realtime_sync_channel';

/**
 * High-Performance Hook to manage debounced auto-saving of GMAO application state to LocalStorage and IndexedDB,
 * with storage quota checks, persistent storage protection, and instant BroadcastChannel multi-tab broadcasting.
 */
export function useAutoSave(state, debounceMs = 1000, onStateChange = null) {
  const {
    types,
    designations,
    families,
    templates,
    blueprints,
    compGroups,
    compFamilies,
    compTemplates,
    partTypes,
    partDesignations,
    machines,
    warehouseItems,
    zones,
    technicians,
    operations,
    mouvements,
    rawStock,
    preventiveTasks,
    preventiveActions,
    preventiveGuides,
    preventivePlans,
    sortiesExterne,
    correctiveInterventions,
    correctiveActionsByPanne,
    correctivePanneCategories,
    correctiveTravauxAFaire,
    correctiveIntervenants,
  } = state;

  const saveTimer = useRef(null);
  const lastSavedState = useRef(null);
  const broadcastChannelRef = useRef(null);

  // Initialize BroadcastChannel on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        broadcastChannelRef.current = new BroadcastChannel(REALTIME_CHANNEL_NAME);
      } catch (e) {
        Logger.warn('[useAutoSave] BroadcastChannel init error:', e);
      }
    }
    // Request persistent storage protection on mount
    AutoBackupService.requestPersistentStorage();

    return () => {
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const saveAllState = useCallback(() => {
    const fullState = {
      types,
      designations,
      families,
      templates,
      blueprints,
      compGroups,
      compFamilies,
      compTemplates,
      partTypes,
      partDesignations,
      machines,
      warehouseItems,
      zones,
      technicians,
      operations,
      mouvements,
      rawStock,
      preventiveTasks,
      preventiveActions,
      preventiveGuides,
      preventivePlans,
      sortiesExterne,
      correctiveInterventions,
      correctiveActionsByPanne,
      correctivePanneCategories,
      correctiveTravauxAFaire,
      correctiveIntervenants,
    };

    // Avoid saving if state has not changed
    const currentStateStr = JSON.stringify(fullState);
    if (lastSavedState.current === currentStateStr) {
      return;
    }
    lastSavedState.current = currentStateStr;

    try {
      // Check storage quota safety before writing
      AutoBackupService.checkStorageQuota();

      // Save unified state to LocalStorage
      storageService.setItem('gmao_full_state_v1', fullState);
      storageService.setItem('gmao_blueprints_v1', blueprints);
      storageService.setItem('gmao_comp_groups_v1', compGroups);
      storageService.setItem('gmao_comp_families_v1', compFamilies);
      storageService.setItem('gmao_comp_templates_v1', compTemplates);
      storageService.setItem('gmao_part_types_v1', partTypes);
      storageService.setItem('gmao_part_designations_v1', partDesignations);
      if (preventiveTasks) storageService.setItem('gmao_preventive_tasks_v8', preventiveTasks);
      if (preventiveActions) storageService.setItem('gmao_preventive_actions_v2', preventiveActions);
      if (preventiveGuides) storageService.setItem('gmao_preventive_guides_v2', preventiveGuides);
      if (preventivePlans) storageService.setItem('gmao_preventive_plans_v2', preventivePlans);
      if (sortiesExterne) storageService.setItem('gmao_sortie_externe_bobinage_v1', sortiesExterne);
      if (correctiveInterventions) storageService.setItem('gmao_corrective_interventions', correctiveInterventions);
      if (correctiveActionsByPanne) storageService.setItem('gmao_corrective_actions_by_panne_v2', correctiveActionsByPanne);
      if (correctivePanneCategories) storageService.setItem('gmao_corrective_panne_categories_v1', correctivePanneCategories);
      if (correctiveTravauxAFaire) storageService.setItem('gmao_corrective_travaux_v1', correctiveTravauxAFaire);
      if (correctiveIntervenants) storageService.setItem('gmao_corrective_intervenants_v1', correctiveIntervenants);

      // High performance single-transaction batch save to IndexedDB
      indexedDBService.setItemsBatch({
        gmao_full_state_v1: fullState,
        gmao_blueprints_v1: blueprints,
        gmao_warehouse_items_v1: warehouseItems,
        gmao_mouvements: mouvements,
        gmao_raw_stock_v6: rawStock,
        gmao_preventive_tasks_v8: preventiveTasks || [],
        gmao_sortie_externe_bobinage_v1: sortiesExterne || [],
        gmao_corrective_interventions: correctiveInterventions || [],
        gmao_corrective_actions_by_panne_v2: correctiveActionsByPanne || {},
        gmao_corrective_panne_categories_v1: correctivePanneCategories || {},
        gmao_corrective_travaux_v1: correctiveTravauxAFaire || [],
        gmao_corrective_intervenants_v1: correctiveIntervenants || [],
      });

      // Broadcast state update instantly to other open browser tabs
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: 'GMAO_STATE_UPDATE',
            timestamp: Date.now(),
            payload: fullState,
          });
        } catch (bcPostErr) {
          Logger.warn('[useAutoSave] BroadcastChannel postMessage error:', bcPostErr);
        }
      }

      window.dispatchEvent(new CustomEvent('gmao:state_saved', { detail: { timestamp: Date.now() } }));
      if (typeof onStateChange === 'function') {
        onStateChange(fullState);
      }
    } catch (err) {
      Logger.error('Failed to auto-save state:', err, 'useAutoSave');
    }
  }, [
    types,
    designations,
    families,
    templates,
    blueprints,
    compGroups,
    compFamilies,
    compTemplates,
    partTypes,
    partDesignations,
    machines,
    warehouseItems,
    zones,
    technicians,
    operations,
    mouvements,
    rawStock,
    preventiveTasks,
    preventiveActions,
    preventiveGuides,
    preventivePlans,
    sortiesExterne,
    correctiveInterventions,
    correctiveActionsByPanne,
    correctivePanneCategories,
    correctiveTravauxAFaire,
    correctiveIntervenants,
    onStateChange,
  ]);

  // Debounce saving
  useEffect(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    window.dispatchEvent(new CustomEvent('gmao:state_saving'));

    saveTimer.current = setTimeout(() => {
      saveAllState();
    }, debounceMs);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [saveAllState, debounceMs]);

  return { saveAllState };
}
