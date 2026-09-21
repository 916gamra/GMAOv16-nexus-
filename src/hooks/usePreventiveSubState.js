import { useState, useCallback, useEffect } from 'react';
import { storageService } from '../utils/storageService';
import {
  BASELINE_PREVENTIVE_ACTIONS,
  BASELINE_PREVENTIVE_GUIDES,
  loadBaselinePreventiveTasks,
} from '../utils/baselinePreventive';
import PreventiveService from '../application/services/PreventiveService';

const STORAGE_KEY_TASKS = 'gmao_preventive_tasks_v8';
const STORAGE_KEY_ACTIONS = 'gmao_preventive_actions_v2';
const STORAGE_KEY_GUIDES = 'gmao_preventive_guides_v2';
const STORAGE_KEY_PLANS = 'gmao_preventive_plans_v2';
const STORAGE_KEY_PREV_INIT = 'gmao_preventive_initialized_v1';

/**
 * Hook for managing Preventive Maintenance state (Primary Matrix + Secondary Plans/Guides/Actions).
 * Follows the same clean, persistent baseline-vs-user-data pattern as useStockSubState.
 */
export function usePreventiveSubState(groupedState = {}) {
  // 1. Actions State (C, N, G, V, R, S, L...)
  const [actions, setActions] = useState(() => {
    const saved = groupedState.actions || storageService.getItem(STORAGE_KEY_ACTIONS);
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return BASELINE_PREVENTIVE_ACTIONS;
  });

  // 2. Guides State (Technical instruction sheets)
  const [guides, setGuides] = useState(() => {
    const saved = groupedState.guides || storageService.getItem(STORAGE_KEY_GUIDES);
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return BASELINE_PREVENTIVE_GUIDES;
  });

  // 3. Plans State (Engineered maintenance plans)
  const [plans, setPlans] = useState(() => {
    const saved = groupedState.plans || storageService.getItem(STORAGE_KEY_PLANS);
    if (Array.isArray(saved)) return saved;
    return [];
  });

  // 4. Preventive Execution Tasks State (Primary S1-S52 matrix)
  const [tasks, setTasks] = useState(() => {
    // Priority: groupedState -> localStorage
    const saved = groupedState.tasks || storageService.getItem(STORAGE_KEY_TASKS);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    // Return empty initially if not in storage, but trigger baseline loading asynchronously
    return [];
  });

  // Synchronize with external events (Excel import, vault restore, service updates)
  useEffect(() => {
    const handleTasksUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setTasks(e.detail);
      } else {
        const current = PreventiveService.getTasks();
        if (Array.isArray(current)) setTasks(current);
      }
    };

    window.addEventListener('preventive_tasks_updated', handleTasksUpdated);

    // Initial Bootstrap: Only load factory pack if NEVER initialized or if storage is completely empty
    const isAlreadyInitialized = storageService.getItem(STORAGE_KEY_PREV_INIT);
    const existingInStorage = storageService.getItem(STORAGE_KEY_TASKS);

    if (!isAlreadyInitialized && (!existingInStorage || existingInStorage.length === 0)) {
      loadBaselinePreventiveTasks().then((baselineTasks) => {
        if (baselineTasks && baselineTasks.length > 0) {
          setTasks((prev) => {
            if (prev && prev.length > 0) return prev; // Don't overwrite if user added data
            storageService.setItem(STORAGE_KEY_TASKS, baselineTasks);
            storageService.setItem(STORAGE_KEY_PREV_INIT, 'true');
            PreventiveService.saveTasks(baselineTasks);
            return baselineTasks;
          });
        }
      });
    }

    return () => {
      window.removeEventListener('preventive_tasks_updated', handleTasksUpdated);
    };
  }, []);

  // Handlers for Tasks
  const handleUpdateTask = useCallback((id, updates) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
      PreventiveService.saveTasks(next);
      return next;
    });
  }, []);

  const handleDeleteTask = useCallback((id) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      PreventiveService.saveTasks(next);
      return next;
    });
  }, []);

  const handleUpdateTaskCounter = useCallback((id, newCounterValue) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, dernier_releve: Number(newCounterValue || 0), updated_at: new Date().toISOString() } : t));
      PreventiveService.saveTasks(next);
      return next;
    });
  }, []);

  const handleMarkTaskDone = useCallback((id, validationData) => {
    setTasks(() => {
      const updated = PreventiveService.markTaskAsDone(id, validationData);
      return updated;
    });
  }, []);

  const handleCreatePlanWithTasks = useCallback((planData, taskItems) => {
    const result = PreventiveService.createPlanWithTasks(planData, taskItems);
    setPlans((prev) => [result.plan, ...prev]);
    setTasks((prev) => [...result.tasks, ...prev]);
    return result;
  }, []);

  // Handlers for Actions
  const handleAddAction = useCallback((actionData) => {
    const updated = PreventiveService.addAction(actionData);
    setActions(updated);
    return updated;
  }, []);

  const handleUpdateAction = useCallback((id, actionData) => {
    const updated = PreventiveService.updateAction(id, actionData);
    setActions(updated);
    return updated;
  }, []);

  const handleDeleteAction = useCallback((id) => {
    const updated = PreventiveService.deleteAction(id);
    setActions(updated);
    return updated;
  }, []);

  // Handlers for Guides
  const handleAddGuide = useCallback((guideData) => {
    const updated = PreventiveService.addGuide(guideData);
    setGuides(updated);
    return updated;
  }, []);

  const handleUpdateGuide = useCallback((id, guideData) => {
    const updated = PreventiveService.updateGuide(id, guideData);
    setGuides(updated);
    return updated;
  }, []);

  const handleDeleteGuide = useCallback((id) => {
    const updated = PreventiveService.deleteGuide(id);
    setGuides(updated);
    return updated;
  }, []);

  // Clear / Reset to baseline explicitly (User-initiated only, no automatic overwrite!)
  const handleResetPreventiveToBaseline = useCallback(async () => {
    const baselineTasks = await loadBaselinePreventiveTasks();
    setTasks(baselineTasks);
    setActions(BASELINE_PREVENTIVE_ACTIONS);
    setGuides(BASELINE_PREVENTIVE_GUIDES);
    setPlans([]);
    PreventiveService.saveTasks(baselineTasks);
    PreventiveService.saveActions(BASELINE_PREVENTIVE_ACTIONS);
    PreventiveService.saveGuides(BASELINE_PREVENTIVE_GUIDES);
    PreventiveService.savePlans([]);
    storageService.setItem(STORAGE_KEY_PREV_INIT, 'true');
    return baselineTasks;
  }, []);

  // Clear all preventive data to start empty for real factory deployment
  const handleClearPreventiveForRealFactory = useCallback(() => {
    setTasks([]);
    setPlans([]);
    PreventiveService.saveTasks([]);
    PreventiveService.savePlans([]);
    storageService.setItem(STORAGE_KEY_PREV_INIT, 'true'); // marks initialized so baseline won't reload
    storageService.setItem(STORAGE_KEY_TASKS, []);
  }, []);

  return {
    tasks,
    setTasks,
    actions,
    setActions,
    guides,
    setGuides,
    plans,
    setPlans,
    handleUpdateTask,
    handleDeleteTask,
    handleUpdateTaskCounter,
    handleMarkTaskDone,
    handleCreatePlanWithTasks,
    handleAddAction,
    handleUpdateAction,
    handleDeleteAction,
    handleAddGuide,
    handleUpdateGuide,
    handleDeleteGuide,
    handleResetPreventiveToBaseline,
    handleClearPreventiveForRealFactory,
  };
}
