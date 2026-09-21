import { useAutoSave } from './useAutoSave';
import { useStateSync } from './useStateSync';
import { useEnterpriseDbSync } from './useEnterpriseDbSync';

/**
 * Handles persistence, debounced storage, multi-tab sync, and Enterprise database sync
 * Modularized and composed of useAutoSave, useStateSync, and useEnterpriseDbSync
 */
export function useGmaoPersistence({
  state,
  setters,
  validators,
  onStateChange,
}) {
  // 1. Debounced auto-save to LocalStorage and IndexedDB batch writes
  const { saveAllState } = useAutoSave(state, 1000, onStateChange);

  // 2. Real-time Multi-Window / Multi-Tab Synchronization via storage events
  useStateSync(setters, validators);

  // 3. Enterprise Domain Repositories synchronization with IndexedDB
  useEnterpriseDbSync(state, setters);

  return { saveAllState };
}
