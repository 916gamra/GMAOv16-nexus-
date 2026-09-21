import { useState, useCallback, useEffect } from 'react';
import { storageService } from '../utils/storageService';
import SortieExterneService, { INITIAL_SORTIES_BOBINAGE } from '../application/services/SortieExterneService';

const STORAGE_KEY = 'gmao_sortie_externe_bobinage_v1';
const STORAGE_KEY_INIT = 'gmao_sortie_externe_initialized_v1';

/**
 * Sub-state Hook for Sortie Externe & Motor Bobinage Repairs.
 * Fully follows the Centralized State Orchestrator Pattern.
 */
export function useSortieExterneSubState(groupedState = {}) {
  const [sorties, setSorties] = useState(() => {
    const saved = groupedState.sortiesExterne || storageService.getItem(STORAGE_KEY);
    if (Array.isArray(saved) && saved.length > 0) return saved;

    // Check if initialized previously (e.g. empty user factory)
    const isInit = storageService.getItem(STORAGE_KEY_INIT);
    if (isInit) return [];

    return INITIAL_SORTIES_BOBINAGE;
  });

  // Listen to broadcast / custom events for cross-tab or external changes
  useEffect(() => {
    const handleSortiesUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSorties(e.detail);
      } else {
        const fresh = SortieExterneService.getSorties();
        if (Array.isArray(fresh)) setSorties(fresh);
      }
    };

    window.addEventListener('sortie_externe_updated', handleSortiesUpdated);
    return () => window.removeEventListener('sortie_externe_updated', handleSortiesUpdated);
  }, []);

  // CRUD Handlers
  const handleAddSortieExterne = useCallback((sortieData) => {
    const created = SortieExterneService.addSortie(sortieData);
    setSorties((prev) => [created, ...prev]);
    storageService.setItem(STORAGE_KEY_INIT, 'true');
    return created;
  }, []);

  const handleUpdateSortieExterne = useCallback((id, sortieData) => {
    const updated = SortieExterneService.updateSortie(id, sortieData);
    setSorties((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const handleDeleteSortieExterne = useCallback((id) => {
    SortieExterneService.deleteSortie(id);
    setSorties((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleMarkSortieReturned = useCallback((id, returnData) => {
    const updated = SortieExterneService.markAsReturned(id, returnData);
    setSorties((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const handleMarkSortieMounted = useCallback((id, mountData) => {
    const updated = SortieExterneService.markAsMounted(id, mountData);
    setSorties((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const handleClearSortiesForRealFactory = useCallback(() => {
    SortieExterneService.saveSorties([]);
    setSorties([]);
    storageService.setItem(STORAGE_KEY_INIT, 'true');
    storageService.setItem(STORAGE_KEY, []);
  }, []);

  const handleResetSortiesToBaseline = useCallback(() => {
    SortieExterneService.saveSorties(INITIAL_SORTIES_BOBINAGE);
    setSorties(INITIAL_SORTIES_BOBINAGE);
    storageService.setItem(STORAGE_KEY_INIT, 'true');
    storageService.setItem(STORAGE_KEY, INITIAL_SORTIES_BOBINAGE);
  }, []);

  return {
    sortiesExterne: sorties,
    setSortiesExterne: setSorties,
    handleAddSortieExterne,
    handleUpdateSortieExterne,
    handleDeleteSortieExterne,
    handleMarkSortieReturned,
    handleMarkSortieMounted,
    handleClearSortiesForRealFactory,
    handleResetSortiesToBaseline,
  };
}
