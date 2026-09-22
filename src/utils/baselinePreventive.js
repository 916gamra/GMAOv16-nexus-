// src/utils/baselinePreventive.js
import { INITIAL_ACTIONS, INITIAL_GUIDES } from '../application/services/preventive/index.js';
import { Logger } from '../core/logger/LoggerService.js';

// Load baseline preventive data
let cachedPreventiveTasks = null;

export const BASELINE_PREVENTIVE_ACTIONS = INITIAL_ACTIONS;
export const BASELINE_PREVENTIVE_GUIDES = INITIAL_GUIDES;

/**
 * Loads baseline tasks synchronously or asynchronously without forcing reload if user data exists
 */
export async function loadBaselinePreventiveTasks() {
  if (cachedPreventiveTasks && cachedPreventiveTasks.length > 0) {
    return cachedPreventiveTasks;
  }

  const files = [
    '/data/preventive/Part1_AFM_Repoussage_SAT.json',
    '/data/preventive/Part2_PRH_Injection.json',
    '/data/preventive/Part3_Detourage_Polissage.json',
    '/data/preventive/Part4_FIN3_Divers.json',
    '/data/preventive/Part5_FIN1_FIN2.json',
    '/data/preventive/Part6_AutoCuivre.json',
  ];

  let allTasks = [];
  for (const url of files) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          allTasks = allTasks.concat(json);
        }
      }
    } catch (err) {
      Logger.warn(`Could not load ${url}:`, err);
    }
  }

  // Format and sanitize baseline tasks
  const sanitized = allTasks.map((t, idx) => {
    const cleanMach = String(t.id_machine || 'MACH').trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
    const cleanComp = String(t.composant || 'COMP').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    const taskSeq = String(idx + 1).padStart(4, '0');
    const actCode = (t.action_code || 'C').toUpperCase();
    const freq = t.frequence || 'Mensuel';

    return {
      ...t,
      id: t.id || `ID-PREV-${cleanMach}-${cleanComp}-${freq.slice(0, 3).toUpperCase()}-${taskSeq}-${idx + 1}`,
      code: t.code || `PREV-${cleanMach}-${cleanComp}-${taskSeq.slice(-3)}`,
      id_machine: String(t.id_machine || 'GLOBAL').trim().toUpperCase(),
      nom_machine: t.nom_machine || `Machine ${t.id_machine || 'GLOBAL'}`,
      id_zone: t.id_zone || 'AFM',
      composant: t.composant || 'Machine entière',
      action_code: actCode,
      frequence: freq,
      planning: t.planning || { S1: actCode },
      etat: t.etat || 'À faire',
      responsable: t.responsable || 'Technicien',
      duree_estimee: t.duree_estimee || '15 min',
    };
  });

  cachedPreventiveTasks = sanitized;
  return sanitized;
}
