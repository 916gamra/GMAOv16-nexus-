// src/utils/baselinePreventive.js
import seedActions from '../data/preventive/seedPreventiveActions.json';
import seedGuides from '../data/preventive/seedPreventiveGuides.json';
import seedTasks from '../data/preventive/seedPreventiveTasks.json';

export const BASELINE_PREVENTIVE_ACTIONS = seedActions;
export const BASELINE_PREVENTIVE_GUIDES = seedGuides;
export const BASELINE_PREVENTIVE_TASKS = seedTasks;

/**
 * Returns clean baseline tasks synchronously with zero network lag
 */
export async function loadBaselinePreventiveTasks() {
  return seedTasks;
}

