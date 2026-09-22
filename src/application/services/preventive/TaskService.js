import * as XLSX from 'xlsx';
import { Logger } from '../../../core/logger/LoggerService.js';

export const STORAGE_KEY_TASKS = 'gmao_preventive_tasks_v8';
export const INITIAL_TASKS = [];

export class TaskService {
  static getTasks() {
    try {
      const keys = [
        STORAGE_KEY_TASKS,
        'gmao_preventive_tasks_v8',
        'gmao_preventive_tasks_v7',
        'gmao_preventive_tasks_v6',
        'gmao_preventive_tasks_v2',
        'gmao_preventive_tasks',
      ];
      for (const k of keys) {
        const data = localStorage.getItem(k);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_TASKS;
  }

  static saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      localStorage.setItem('gmao_preventive_tasks_v8', JSON.stringify(tasks));
      localStorage.setItem('gmao_preventive_tasks_v7', JSON.stringify(tasks));
    } catch {
      // storage error
    }
  }

  static deleteTask(taskId) {
    const current = this.getTasks();
    const filtered = current.filter(t => t.id !== taskId);
    this.saveTasks(filtered);
    return filtered;
  }

  static updateTask(taskId, updatedFields) {
    const current = this.getTasks();
    const updated = current.map(t => t.id === taskId ? { ...t, ...updatedFields, updated_at: new Date().toISOString() } : t);
    this.saveTasks(updated);
    return updated;
  }

  /**
   * Nettoyage et injection de données réelles d'usine avec normalisation
   */
  static injectRealData(tasksArray) {
    if (!Array.isArray(tasksArray)) return [];

    const sanitized = tasksArray.map((t, idx) => {
      const cleanMach = String(t.id_machine || 'MACH').trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
      const cleanComp = String(t.composant || 'COMP').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      const taskSeq = String(idx + 1).padStart(4, '0');
      const actCode = (t.action_code || 'C').toUpperCase();
      const freq = t.frequence || 'Mensuel';

      let planning = t.planning;
      if (!planning || typeof planning !== 'object' || Object.keys(planning).length === 0) {
        planning = { S1: actCode };
      }

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
        planning,
        etat: t.etat || 'À faire',
        responsable: t.responsable || 'Technicien',
        duree_estimee: t.duree_estimee || '15 min',
      };
    });

    this.saveTasks(sanitized);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('preventive_tasks_updated', { detail: sanitized }));
    }
    return sanitized;
  }

  /**
   * Import et parsing intelligent depuis fichier Excel
   */
  static async importFromExcel(file) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const tasks = [];

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      rows.forEach((row, idx) => {
        const machRaw =
          row['Machine'] ||
          row['Code Machine'] ||
          row['id_machine'] ||
          row['MACHINE'] ||
          row['machine'] ||
          row['Équipement'] ||
          sheetName;
        const id_machine = String(machRaw || '').trim().toUpperCase();
        if (!id_machine || id_machine === 'TOTAL' || id_machine === 'MACHINE') return;

        const composant = String(
          row['Composant'] ||
          row['Organe'] ||
          row['COMPOSANT'] ||
          row['Element'] ||
          row['Élément'] ||
          'Machine entière'
        ).trim();

        const actionRaw = String(
          row['Action'] ||
          row['Code Action'] ||
          row['ACTION'] ||
          row['Action Code'] ||
          'C'
        ).trim().toUpperCase();
        const action_code = actionRaw.charAt(0) || 'C';

        const freq = String(
          row['Frequence'] ||
          row['Fréquence'] ||
          row['FREQUENCE'] ||
          row['Périodicité'] ||
          'Mensuel'
        ).trim();

        const zone = String(
          row['Zone'] ||
          row['id_zone'] ||
          row['ZONE'] ||
          row['Section'] ||
          'AFM'
        ).trim();

        const planning = {};
        for (let s = 1; s <= 52; s++) {
          const keyS = `S${s}`;
          const val =
            row[keyS] !== undefined
              ? row[keyS]
              : row[s] !== undefined
              ? row[s]
              : row[`Semaine ${s}`] || '';
          if (val && String(val).trim() !== '' && String(val).trim() !== '0') {
            const vStr = String(val).trim().toUpperCase();
            planning[keyS] =
              vStr === '1' || vStr === 'X' || vStr === 'TRUE' ? action_code : vStr;
          }
        }

        const seq = String(idx + 1).padStart(4, '0');
        const cleanMach = id_machine.replace(/[^a-zA-Z0-9]/g, '');
        const cleanComp = composant.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();

        tasks.push({
          id: row['id'] || row['ID'] || `ID-PREV-${cleanMach}-${cleanComp}-${seq}`,
          id_plan: String(row['id_plan'] || `ID-PLAN-${id_machine}-2025-001`).trim(),
          code: row['code'] || `PREV-${id_machine}-${cleanComp}-${seq.slice(-3)}`,
          ref: String(row['Ref'] || row['Référence'] || `Plan-2025-${zone}-${id_machine}`).trim(),
          id_machine: id_machine,
          nom_machine: String(row['Nom Machine'] || row['nom_machine'] || `${id_machine} - ${zone}`).trim(),
          id_zone: zone,
          section: `Sections: ${zone}`,
          composant: composant,
          action_code: action_code,
          frequence: freq,
          planning: Object.keys(planning).length > 0 ? planning : { S1: action_code },
          duree_estimee: '15 min',
          responsable: String(row['Responsable'] || 'Technicien').trim(),
          etat: String(row['Etat'] || 'À faire').trim(),
          priorite: String(row['Priorite'] || 'Normale').trim(),
          created_at: new Date().toISOString(),
        });
      });
    });

    return this.injectRealData(tasks);
  }

  /**
   * Charger les jeux de données d'usine pré-configurés
   */
  static async loadFromPublicJson() {
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
    if (allTasks.length > 0) {
      this.injectRealData(allTasks);
    }
    return allTasks;
  }
}

export default TaskService;
