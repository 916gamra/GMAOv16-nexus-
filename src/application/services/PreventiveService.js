// src/application/services/PreventiveService.js
// SERVICE PREVENTIVE MAITRE - 4 MODULES INTEGRES :
// 1. Actions (C, N, G, V, R, S, L)
// 2. Guide Composant-Action (Roulement -> C+G, Courroie -> C+N, etc.)
// 3. Plans & Plan Builder (Conception de plans groupés ou par composants)
// 4. Tâches d'Exécution & Matrice S1-S52 (Suivi, validation, liaison Correctif)

import * as XLSX from 'xlsx';
import { Logger } from '../../core/logger/LoggerService.js';
import {
  INITIAL_ACTIONS,
  INITIAL_GUIDES,
} from './preventive/index.js';

export {
  INITIAL_ACTIONS,
  INITIAL_GUIDES,
};

export const INITIAL_TASKS = [];
export const INITIAL_PLANS = [];

const STORAGE_KEY_TASKS = 'gmao_preventive_tasks_v8';
const STORAGE_KEY_ACTIONS = 'gmao_preventive_actions_v2';
const STORAGE_KEY_GUIDES = 'gmao_preventive_guides_v2';
const STORAGE_KEY_PLANS = 'gmao_preventive_plans_v2';

export class PreventiveService {
  // ==========================================
  // GESTION DES ACTIONS (TAB 1)
  // ==========================================
  static getActions() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ACTIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    this.saveActions(INITIAL_ACTIONS);
    return INITIAL_ACTIONS;
  }

  static saveActions(actions) {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(actions));
    } catch {
      // storage error handling
    }
  }

  static addAction(actionData) {
    const current = this.getActions();
    const code = (actionData.code || 'X').trim().toUpperCase();
    const libelle = (actionData.libelle || 'Action').trim();
    const shortLib = libelle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
    const seq = String(current.length + 1).padStart(3, '0');
    
    const newAction = {
      id: actionData.id || `ID-ACT-${code}-${shortLib}-${seq}`,
      code,
      ref: actionData.ref || `ISO-STD-${code}`,
      libelle,
      description: actionData.description || '',
      couleur: actionData.couleur || 'blue',
      icone: actionData.icone || 'CheckCircle',
      duree_standard: actionData.duree_standard || '15 min',
      outils: actionData.outils || '',
      created_at: new Date().toISOString(),
    };

    const updated = [newAction, ...current];
    this.saveActions(updated);
    return updated;
  }

  static updateAction(id, actionData) {
    const current = this.getActions();
    const updated = current.map(a => a.id === id ? { ...a, ...actionData, updated_at: new Date().toISOString() } : a);
    this.saveActions(updated);
    return updated;
  }

  static deleteAction(id) {
    const current = this.getActions();
    const filtered = current.filter(a => a.id !== id);
    this.saveActions(filtered);
    return filtered;
  }

  // ==========================================
  // GESTION DU GUIDE COMPOSANT-ACTION (TAB 2)
  // ==========================================
  static getGuides() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_GUIDES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    this.saveGuides(INITIAL_GUIDES);
    return INITIAL_GUIDES;
  }

  static saveGuides(guides) {
    try {
      localStorage.setItem(STORAGE_KEY_GUIDES, JSON.stringify(guides));
    } catch {
      // storage error handling
    }
  }

  static addGuide(guideData) {
    const current = this.getGuides();
    const nom = (guideData.composant_nom || 'Composant').trim();
    const cleanNom = nom.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    const acts = (guideData.actions_liees || []).join('');
    const seq = String(current.length + 1).padStart(3, '0');

    const newGuide = {
      id: guideData.id || `ID-GUIDE-${cleanNom}-${acts || 'GEN'}-${seq}`,
      code: guideData.code || `GUIDE-${cleanNom}-${acts || 'GEN'}`,
      ref: guideData.ref || `Manuel-Standard-${cleanNom}`,
      composant_nom: nom,
      famille: guideData.famille || 'Général',
      actions_liees: guideData.actions_liees || ['C'],
      fiches_actions: guideData.fiches_actions || {},
      consignes_securite: guideData.consignes_securite || '',
      criticite: guideData.criticite || 'Moyenne',
      created_at: new Date().toISOString(),
    };

    const updated = [newGuide, ...current];
    this.saveGuides(updated);
    return updated;
  }

  static updateGuide(id, guideData) {
    const current = this.getGuides();
    const updated = current.map(g => g.id === id ? { ...g, ...guideData, updated_at: new Date().toISOString() } : g);
    this.saveGuides(updated);
    return updated;
  }

  static deleteGuide(id) {
    const current = this.getGuides();
    const filtered = current.filter(g => g.id !== id);
    this.saveGuides(filtered);
    return filtered;
  }

  // ==========================================
  // GESTION DES PLANS PREVENTIFS (TAB 3)
  // ==========================================
  static getPlans() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PLANS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    this.savePlans(INITIAL_PLANS);
    return INITIAL_PLANS;
  }

  static savePlans(plans) {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
    } catch {
      // storage error handling
    }
  }

  /**
   * Créer un plan complet et générer automatiquement toutes les tâches préventives associées !
   */
  static createPlanWithTasks(planData, taskItems = []) {
    const currentPlans = this.getPlans();
    const currentTasks = this.getTasks();

    const machineId = (planData.id_machine || 'MACH').trim().toUpperCase();
    const cleanMach = machineId.replace(/[^a-zA-Z0-9]/g, '');
    const zone = planData.id_zone || 'ZONE';
    const tech = planData.id_technicien || 'Technicien';
    const yearMonth = new Date().toISOString().slice(0, 7);
    const seq = String(currentPlans.length + 1).padStart(3, '0');

    const planId = planData.id || `ID-PLAN-${cleanMach}-${yearMonth}-${seq}`;
    const planCode = planData.code || `PLAN-${cleanMach}-${yearMonth}`;
    const planRef = planData.ref || `Plan-2025-${zone}-${machineId}-${planData.semaine_cible || 'S1'}`;

    const newPlan = {
      id: planId,
      code: planCode,
      ref: planRef,
      id_machine: machineId,
      nom_machine: planData.nom_machine || `Machine ${machineId}`,
      id_zone: zone,
      id_technicien: tech,
      date_creation: planData.date_creation || new Date().toISOString().split('T')[0],
      is_groupee: Boolean(planData.is_groupee),
      semaine_cible: planData.semaine_cible || 'S1',
      description: planData.description || `Plan de maintenance préventive pour ${machineId}`,
      nb_taches: taskItems.length,
      created_at: new Date().toISOString(),
    };

    // Génération des tâches avec passeport id/ref/code
    const generatedTasks = taskItems.map((item, index) => {
      const compName = item.is_global_machine ? 'Machine entière' : (item.composant || 'Composant');
      const cleanComp = compName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      const actCode = (item.action_code || 'C').toUpperCase();
      const freq = item.frequence || 'Mensuel';
      const taskSeq = String(currentTasks.length + index + 1).padStart(4, '0');

      // Distribution planning sur les 52 semaines selon la fréquence
      const planning = item.planning || this.generatePlanningForFrequency(freq, item.target_week || planData.semaine_cible || 'S1', actCode);

      return {
        id: `ID-PREV-${cleanMach}-${cleanComp}-${freq.slice(0, 3).toUpperCase()}-${taskSeq}`,
        id_plan: planId,
        code: `PREV-${machineId}-${cleanComp}-${taskSeq.slice(-3)}`,
        ref: planRef,
        id_machine: machineId,
        nom_machine: planData.nom_machine || `Machine ${machineId}`,
        id_zone: zone,
        section: `Sections: ${zone}`,
        composant: compName,
        type_intervention: item.type_intervention || this.getActionLabel(actCode),
        action_code: actCode,
        frequence: freq,
        planning,
        is_global_machine: Boolean(item.is_global_machine),
        duree_estimee: item.duree_estimee || '15 min',
        responsable: tech,
        etat: 'À faire',
        priorite: item.priorite || 'Normale',
        prochaine_echeance: planData.date_prevue || new Date().toISOString().split('T')[0],
        derniere_realisation: null,
        id_corrective: null,
        consigne: item.consigne || `Exécuter l'action ${actCode} sur ${compName}`,
        created_at: new Date().toISOString(),
      };
    });

    const updatedPlans = [newPlan, ...currentPlans];
    const updatedTasks = [...generatedTasks, ...currentTasks];

    this.savePlans(updatedPlans);
    this.saveTasks(updatedTasks);

    return { plan: newPlan, tasks: generatedTasks };
  }

  static generatePlanningForFrequency(frequency, startWeek = 'S1', actionCode = 'C') {
    const startNum = parseInt(startWeek.replace('S', ''), 10) || 1;
    const planning = {};

    let step = 1;
    if (frequency === 'Hebdo') step = 1;
    else if (frequency === 'Bi-hebdo' || frequency === 'Bimensuel') step = 2;
    else if (frequency === 'Mensuel') step = 4;
    else if (frequency === 'Trimestriel') step = 12;
    else if (frequency === 'Semestriel') step = 26;
    else if (frequency === 'Annuel') step = 52;

    for (let w = startNum; w <= 52; w += step) {
      planning[`S${w}`] = actionCode;
    }

    return planning;
  }

  static getActionLabel(code) {
    const map = {
      C: 'Contrôle',
      N: 'Nettoyage',
      G: 'Graissage',
      V: 'Vérification',
      R: 'Révision',
      S: 'Serrage',
      L: 'Lubrification',
    };
    return map[code] || 'Intervention';
  }

  // ==========================================
  // GESTION DES TACHES & EXECUTION (TAB 4)
  // ==========================================
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
          // Return any valid array, respecting user modifications and real factory data
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  }

  // Rétrocompatibilité
  static getPreventive() {
    return this.getTasks();
  }

  static saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      localStorage.setItem('gmao_preventive_tasks_v8', JSON.stringify(tasks));
      localStorage.setItem('gmao_preventive_tasks_v7', JSON.stringify(tasks));
    } catch {
      // storage error handling
    }
  }

  // حقن أوتوماتيكي مع تنظيف البيانات وتوليد ID فريد لجميع التمهيدات
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
        planning = this.generatePlanningForFrequency(freq, 'S1', actCode);
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

    // Synchronisation automatique des plans correspondants
    const plansMap = {};
    sanitized.forEach((t) => {
      const planId = t.id_plan || `ID-PLAN-${t.id_machine || 'MACH'}-2025-001`;
      if (!plansMap[planId]) {
        plansMap[planId] = {
          id: planId,
          code: t.ref || planId,
          ref: t.ref || planId,
          id_machine: t.id_machine,
          id_zone: t.id_zone,
          frequence: t.frequence || 'Mensuel',
          responsable: t.responsable || 'Rachid',
          tasks: [],
          created_at: t.created_at || new Date().toISOString(),
        };
      }
      plansMap[planId].tasks.push(t.id);
    });
    this.savePlans(Object.values(plansMap));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('preventive_tasks_updated', { detail: sanitized }));
    }
    return sanitized;
  }

  // استيراد من ملف Excel مباشرة فـ المتصفح
  static async importFromExcel(file) {
    const tasks = await this.parseExcelToPreventive(file);
    return this.injectRealData(tasks);
  }

  // Parseur Excel intelligent via SheetJS
  static async parseExcelToPreventive(file) {
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

        const responsable = String(
          row['Responsable'] ||
          row['Technicien'] ||
          row['RESPONSABLE'] ||
          'Rachid'
        ).trim();

        const consigne = String(
          row['Consigne'] ||
          row['Description'] ||
          row['Instructions'] ||
          ''
        ).trim();

        const duree = String(
          row['Duree'] ||
          row['Durée'] ||
          row['DUREE'] ||
          '15 min'
        ).trim();

        const ref = String(
          row['Ref'] ||
          row['Référence'] ||
          row['Plan'] ||
          `Plan-2025-${zone}-${id_machine}`
        ).trim();

        const id_plan = String(
          row['id_plan'] ||
          `ID-PLAN-${id_machine}-2025-001`
        ).trim();

        // Planning S1 à S52
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
          id_plan: id_plan,
          code: row['code'] || `PREV-${id_machine}-${cleanComp}-${seq.slice(-3)}`,
          ref: ref,
          id_machine: id_machine,
          nom_machine: String(
            row['Nom Machine'] || row['nom_machine'] || `${id_machine} - ${zone}`
          ).trim(),
          id_zone: zone,
          section: `Sections: ${zone}`,
          composant: composant,
          type_intervention: String(
            row['Type'] || row['type_intervention'] || this.getActionLabel(action_code)
          ).trim(),
          action_code: action_code,
          frequence: freq,
          planning: Object.keys(planning).length > 0 ? planning : { S1: action_code },
          is_global_machine:
            composant.toLowerCase().includes('machine entière') ||
            composant.toLowerCase().includes('globale'),
          duree_estimee: duree.includes('min') ? duree : `${duree} min`,
          responsable: responsable,
          etat: String(row['Etat'] || row['État'] || 'À faire').trim(),
          priorite: String(row['Priorite'] || row['Priorité'] || 'Normale').trim(),
          prochaine_echeance: String(row['prochaine_echeance'] || '2025-03-19').trim(),
          derniere_realisation: null,
          consigne:
            consigne || `Intervention préventive ${action_code} sur ${composant}.`,
          created_at: new Date().toISOString(),
        });
      });
    });

    return tasks;
  }

  // Chargement des 6 fichiers JSON d'usine depuis public/data/preventive/ si localStorage vide
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

  static bulkImportTasks(newTasks, overwrite = false) {
    if (!Array.isArray(newTasks)) return this.getTasks();
    const current = overwrite ? [] : this.getTasks();

    const sanitizedNew = newTasks.map((t, idx) => {
      const cleanMach = String(t.id_machine || 'MACH').trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
      const cleanComp = String(t.composant || 'COMP').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      return {
        ...t,
        id: t.id || `ID-PREV-${cleanMach}-${cleanComp}-${Date.now()}-${idx + 1}`,
      };
    });

    const existingIds = new Set(current.map((t) => t.id).filter(Boolean));
    const toAdd = sanitizedNew.filter((t) => !existingIds.has(t.id));
    const merged = [...toAdd, ...current];
    return this.injectRealData(merged);
  }

  static savePreventive(tasks) {
    this.saveTasks(tasks);
  }

  static getISOWeekNumber(d = new Date()) {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  }

  static getStepFromFrequence(frequence) {
    if (frequence === 'Hebdo') return 1;
    if (frequence === 'Bi-hebdo' || frequence === 'Bimensuel') return 2;
    if (frequence === 'Mensuel') return 4;
    if (frequence === 'Trimestriel') return 12;
    if (frequence === 'Semestriel') return 26;
    if (frequence === 'Annuel') return 52;
    return 4;
  }

  /**
   * Recalcule la matrice S1-S52 en mode Glissant ou Fixe avec projection dynamique
   */
  static recalculatePlanningMatrix(task, executionWeekNum, executionDate, actionCode = 'C') {
    const mode = task.mode_calcul_recurrence || 'FIXE';
    const step = this.getStepFromFrequence(task.frequence || 'Mensuel');
    const oldPlanning = task.planning || {};
    const newPlanning = { ...oldPlanning };

    const currentExecW = `S${executionWeekNum}`;
    newPlanning[currentExecW] = 'DONE';

    if (mode === 'GLISSANT') {
      // En mode glissant, réaligner les futures occurrences à partir de la semaine réelle d'exécution + step
      for (let w = executionWeekNum + 1; w <= 52; w++) {
        delete newPlanning[`S${w}`];
      }
      for (let w = executionWeekNum + step; w <= 52; w += step) {
        newPlanning[`S${w}`] = actionCode;
      }
    } else {
      // En mode fixe (calendrier calendaire), on s'assure que les semaines futures prévues restent programmées
      // Si aucune semaine future n'était définie, on continue la projection fixe
      const hasFutureWeeks = Object.keys(oldPlanning).some((wk) => {
        const num = parseInt(wk.replace('S', ''), 10);
        return num > executionWeekNum && oldPlanning[wk] === actionCode;
      });

      if (!hasFutureWeeks && executionWeekNum + step <= 52) {
        for (let w = executionWeekNum + step; w <= 52; w += step) {
          if (!newPlanning[`S${w}`]) {
            newPlanning[`S${w}`] = actionCode;
          }
        }
      }
    }

    return newPlanning;
  }

  static addTask(taskData) {
    const current = this.getTasks();
    const machineId = (taskData.id_machine || 'MACH').trim().toUpperCase();
    const cleanMach = machineId.replace(/[^a-zA-Z0-9]/g, '');
    const compName = taskData.is_global_machine ? 'Machine entière' : (taskData.composant || 'Composant');
    const cleanComp = compName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    const actCode = (taskData.action_code || 'C').toUpperCase();
    const freq = taskData.frequence || 'Mensuel';
    const seq = String(current.length + 1).padStart(4, '0');

    const newTask = {
      id: taskData.id || `ID-PREV-${cleanMach}-${cleanComp}-${freq.slice(0, 3).toUpperCase()}-${seq}`,
      id_plan: taskData.id_plan || null,
      code: taskData.code || `PREV-${machineId}-${cleanComp}-${seq.slice(-3)}`,
      ref: taskData.ref || `Plan-2025-${taskData.id_zone || 'AFM'}-${machineId}`,
      id_machine: machineId,
      nom_machine: taskData.nom_machine || `Machine ${machineId}`,
      id_zone: taskData.id_zone || 'AFM',
      section: `Sections: ${taskData.id_zone || 'AFM'}`,
      composant: compName,
      type_intervention: taskData.type_intervention || this.getActionLabel(actCode),
      action_code: actCode,
      frequence: freq,
      // NOUVELLE FONCTIONNALITÉ 1: Mode de calcul récurrence (FIXE vs GLISSANT)
      mode_calcul_recurrence: taskData.mode_calcul_recurrence || 'FIXE', // 'FIXE' | 'GLISSANT'
      // NOUVELLE FONCTIONNALITÉ 2: Déclenchement par Compteur / Usage
      type_declencheur: taskData.type_declencheur || 'CALENDRIER', // 'CALENDRIER' | 'COMPTEUR' | 'HYBRIDE'
      compteur_unite: taskData.compteur_unite || 'Heures', // 'Heures' | 'Cycles' | 'Km'
      compteur_seuil_intervalle: Number(taskData.compteur_seuil_intervalle || 500),
      compteur_dernier_releve: Number(taskData.compteur_dernier_releve || 0),
      compteur_actuel: Number(taskData.compteur_actuel || 0),
      compteur_prochain_declenchement: Number(taskData.compteur_prochain_declenchement || (Number(taskData.compteur_dernier_releve || 0) + Number(taskData.compteur_seuil_intervalle || 500))),
      planning: taskData.planning || this.generatePlanningForFrequency(freq, taskData.target_week || 'S1', actCode),
      is_global_machine: Boolean(taskData.is_global_machine),
      duree_estimee: taskData.duree_estimee || '15 min',
      responsable: taskData.responsable || 'Rachid',
      etat: taskData.etat || 'À faire',
      priorite: taskData.priorite || 'Normale',
      prochaine_echeance: taskData.prochaine_echeance || new Date().toISOString().split('T')[0],
      derniere_realisation: null,
      id_corrective: null,
      consigne: taskData.consigne || '',
      created_at: new Date().toISOString(),
    };

    const updated = [newTask, ...current];
    this.saveTasks(updated);
    return updated;
  }

  static updateTask(id, taskData) {
    const current = this.getTasks();
    const updated = current.map(t => t.id === id ? { ...t, ...taskData, updated_at: new Date().toISOString() } : t);
    this.saveTasks(updated);
    return updated;
  }

  static deleteTask(id) {
    const current = this.getTasks();
    const filtered = current.filter(t => t.id !== id);
    this.saveTasks(filtered);
    return filtered;
  }

  /**
   * Mise à jour rapide de l'index du compteur d'une machine ou tâche
   */
  static updateCounterIndex(taskId, newIndexValue) {
    const current = this.getTasks();
    const val = Number(newIndexValue) || 0;
    const updated = current.map(t => {
      if (t.id === taskId) {
        const threshold = Number(t.compteur_prochain_declenchement || 500);
        const isTriggered = val >= threshold;
        return {
          ...t,
          compteur_actuel: val,
          etat: isTriggered ? 'À faire' : t.etat,
          compteur_alerte: isTriggered || (val >= threshold * 0.9),
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    this.saveTasks(updated);
    return updated;
  }

  /**
   * Profil préventif complet pour la fiche machine
   */
  static getMachinePreventiveProfile(machineCode) {
    if (!machineCode) return null;
    const cleanCode = String(machineCode).trim().toUpperCase();
    const tasks = this.getTasks().filter(
      (t) => (t.id_machine || '').trim().toUpperCase() === cleanCode
    );
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.etat === 'Fait').length;
    const overdueTasks = tasks.filter((t) => t.etat === 'En retard').length;
    const pendingTasks = tasks.filter((t) => t.etat === 'À faire' || t.etat === 'Planifié').length;

    // Prochaine intervention planifiée
    const sortedDue = [...tasks]
      .filter((t) => t.prochaine_echeance)
      .sort((a, b) => new Date(a.prochaine_echeance) - new Date(b.prochaine_echeance));
    const nextInterventionDate = sortedDue[0]?.prochaine_echeance || null;

    // Historique cumulé des réalisations
    const history = [];
    tasks.forEach((t) => {
      if (Array.isArray(t.historique_executions)) {
        t.historique_executions.forEach((h) => {
          history.push({
            ...h,
            task_id: t.id,
            task_code: t.code,
            composant: t.composant,
            action_code: t.action_code,
            frequence: t.frequence,
          });
        });
      }
    });
    history.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

    const adherenceRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return {
      machineCode: cleanCode,
      tasks,
      totalTasks,
      completedTasks,
      overdueTasks,
      pendingTasks,
      nextInterventionDate,
      history,
      adherenceRate,
    };
  }

  static markTaskAsDone(id, validationData = {}) {
    const current = this.getTasks();
    const task = current.find(t => t.id === id);
    const execDateStr = validationData.date_realisation || new Date().toISOString().split('T')[0];
    const execDate = new Date(execDateStr);
    const execWeekNum = this.getISOWeekNumber(execDate);

    // Calcul de la prochaine échéance calendaire
    const nextEcheance = this.calculateNextEcheanceFromDate(
      execDateStr,
      task?.frequence || 'Mensuel'
    );

    // Calcul de la matrice S1-S52 (Support Fixed vs Floating planning)
    const newPlanning = this.recalculatePlanningMatrix(
      task || {},
      execWeekNum,
      execDateStr,
      task?.action_code || 'C'
    );

    // Détermination de la prochaine semaine planifiée
    const futureWeeks = Object.keys(newPlanning)
      .map(k => parseInt(k.replace('S', ''), 10))
      .filter(w => w > execWeekNum && newPlanning[`S${w}`] && newPlanning[`S${w}`] !== 'DONE')
      .sort((a, b) => a - b);
    const nextPlannedWeek = futureWeeks.length > 0 ? `S${futureWeeks[0]}` : null;

    // Gestion du compteur si présent
    const currentCounter = Number(validationData.compteur_releve || task?.compteur_actuel || 0);
    const counterInterval = Number(task?.compteur_seuil_intervalle || 500);
    const nextCounterTarget = currentCounter + counterInterval;

    const usedPDR = Array.isArray(validationData.usedPDR) ? validationData.usedPDR : [];
    const coutPieces = usedPDR.reduce((sum, p) => sum + (Number(p.quantite || 0) * Number(p.prix_unitaire || 0)), 0);
    const dureeMin = parseInt(String(validationData.duree_reelle || task?.duree_estimee || '15').replace(/[^0-9]/g, ''), 10) || 15;
    const coutMO = Math.round((dureeMin / 60) * (validationData.taux_horaire || 35) * 100) / 100;
    const coutTotal = Math.round((coutPieces + coutMO) * 100) / 100;

    const executionRecord = {
      id_execution: `EXEC-${Date.now()}`,
      date: execDateStr,
      semaine_iso: `S${execWeekNum}`,
      prochaine_semaine_cible: nextPlannedWeek,
      prochaine_echeance_calculee: nextEcheance,
      technicien: validationData.technicien || task?.responsable || 'Technicien',
      duree_reelle_min: dureeMin,
      compteur_valeur: currentCounter,
      observations: validationData.observations || 'Intervention préventive réalisée avec succès et conforme.',
      pieces_consommees: usedPDR,
      cout_pieces: coutPieces,
      cout_mo: coutMO,
      cout_total: coutTotal,
      mode_recurrence_applique: validationData.mode_calcul_recurrence || task?.mode_calcul_recurrence || 'FIXE',
      signature_validee: true,
      created_at: new Date().toISOString(),
    };

    // 1. Déduction automatique du Stock & enregistrement de la sortie de magasin
    if (usedPDR.length > 0) {
      this.recordStockSortie(task, usedPDR, validationData);
    }

    // 2. Enregistrement automatique dans l'historique d'intervention de la machine
    this.recordMachineIntervention(task, executionRecord);

    const updated = current.map((item) => {
      if (item.id === id) {
        const pastExecs = Array.isArray(item.historique_executions) ? item.historique_executions : [];
        const prevCout = Number(item.cout_cumule || 0);
        return {
          ...item,
          etat: 'Fait',
          derniere_realisation: execDateStr,
          derniere_semaine_reelle: `S${execWeekNum}`,
          prochaine_echeance: nextEcheance,
          prochaine_semaine: nextPlannedWeek,
          planning: newPlanning,
          mode_calcul_recurrence: validationData.mode_calcul_recurrence || item.mode_calcul_recurrence || 'FIXE',
          compteur_actuel: currentCounter,
          compteur_dernier_releve: currentCounter,
          compteur_prochain_declenchement: nextCounterTarget,
          compteur_alerte: false,
          effectue_par: validationData.technicien || item.responsable,
          duree_reelle: `${dureeMin} min`,
          observations: validationData.observations || 'Intervention préventive réalisée avec succès et conforme.',
          derniers_pdr_utilises: usedPDR,
          cout_dernier: coutTotal,
          cout_cumule: Math.round((prevCout + coutTotal) * 100) / 100,
          historique_executions: [executionRecord, ...pastExecs],
          updated_at: new Date().toISOString(),
        };
      }
      return item;
    });

    this.saveTasks(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('preventive_tasks_updated', { detail: updated }));
    }

    return updated;
  }

  /**
   * Enregistrement automatique de la sortie de pièces dans le journal de stock
   */
  static recordStockSortie(task, piecesConsommees = [], validationData = {}) {
    if (!Array.isArray(piecesConsommees) || piecesConsommees.length === 0) return;
    try {
      const STORAGE_KEY_MVT = 'gmao_mouvements';
      const existingRaw = localStorage.getItem(STORAGE_KEY_MVT);
      const movements = existingRaw ? JSON.parse(existingRaw) : [];

      const newMouvements = piecesConsommees.map((pdr, idx) => ({
        id: `MVT-PRV-${Date.now()}-${idx}`,
        code_bon: `BS-PRV-${Date.now().toString().slice(-6)}`,
        num_commande: task?.ref || task?.code || 'PREVENTIF',
        date: validationData.date_realisation || new Date().toISOString().split('T')[0],
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        ref: pdr.reference || pdr.ref || '',
        designation: pdr.designation || pdr.nom || 'Pièce de rechange',
        quantite: Number(pdr.quantite || 1),
        unit: pdr.unite || 'U',
        type: 'Sortie',
        action_id: 'PREVENTIVE',
        usage_type: 'technician',
        id_machine_registered: task?.id_machine || '',
        technicien: validationData.technicien || task?.responsable || 'Technicien',
        commentaire: `Sortie automatique sur maintenance préventive ${task?.action_code || 'C'} (${task?.composant || 'Organe'}) - Machine ${task?.id_machine || ''}`,
        created_at: new Date().toISOString(),
      }));

      const updatedMovements = [...newMouvements, ...movements];
      localStorage.setItem(STORAGE_KEY_MVT, JSON.stringify(updatedMovements));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gmao_stock_updated', { detail: { type: 'sortie', items: newMouvements } }));
        window.dispatchEvent(new CustomEvent('gmao_mouvements_updated', { detail: updatedMovements }));
      }
    } catch (err) {
      Logger.warn('Could not record automatic stock sortie:', err);
    }
  }

  /**
   * Enregistrement automatique dans l'historique d'intervention de la machine
   */
  static recordMachineIntervention(task, executionRecord) {
    if (!task || !task.id_machine) return;
    try {
      const STORAGE_KEY_INTERVENTIONS = 'gmao_interventions_history';
      const existingRaw = localStorage.getItem(STORAGE_KEY_INTERVENTIONS);
      const interventions = existingRaw ? JSON.parse(existingRaw) : [];

      const newIntervention = {
        id: executionRecord.id_execution || `INTERV-PRV-${Date.now()}`,
        id_machine: task.id_machine,
        nom_machine: task.nom_machine || `Machine ${task.id_machine}`,
        id_zone: task.id_zone,
        type: 'PREVENTIVE',
        action_code: task.action_code,
        composant: task.composant,
        frequence: task.frequence,
        date: executionRecord.date,
        technicien: executionRecord.technicien,
        duree_min: executionRecord.duree_reelle_min,
        cout_total: executionRecord.cout_total,
        pieces: executionRecord.pieces_consommees || [],
        observations: executionRecord.observations,
        statut: 'CLOTURE',
        created_at: executionRecord.created_at || new Date().toISOString(),
      };

      const updated = [newIntervention, ...interventions];
      localStorage.setItem(STORAGE_KEY_INTERVENTIONS, JSON.stringify(updated));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gmao_machines_updated', { detail: { id_machine: task.id_machine } }));
      }
    } catch (err) {
      Logger.warn('Could not record machine intervention history:', err);
    }
  }

  /**
   * Sauvegarde unifiée et export global de toutes les données liées du système GMAO
   */
  static exportUnifiedVault() {
    try {
      const vault = {
        version: 'GMAO_VAULT_V2',
        exported_at: new Date().toISOString(),
        tasks: this.getTasks(),
        plans: this.getPlans(),
        guides: this.getGuides(),
        actions: this.getActions(),
        machines: JSON.parse(localStorage.getItem('gmao_machines_registered_v6') || '[]'),
        stock: JSON.parse(localStorage.getItem('gmao_raw_stock_v6') || '[]'),
        movements: JSON.parse(localStorage.getItem('gmao_mouvements') || '[]'),
        interventions: JSON.parse(localStorage.getItem('gmao_interventions_history') || '[]'),
      };
      return JSON.stringify(vault, null, 2);
    } catch (err) {
      Logger.error('Erreur export unified vault:', err);
      return null;
    }
  }

  /**
   * Restauration unifiée d'un coffre de données GMAO
   */
  static importUnifiedVault(jsonString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!data) return false;

      if (Array.isArray(data.tasks)) this.saveTasks(data.tasks);
      if (Array.isArray(data.plans)) this.savePlans(data.plans);
      if (Array.isArray(data.guides)) this.saveGuides(data.guides);
      if (Array.isArray(data.actions)) this.saveActions(data.actions);
      if (Array.isArray(data.machines)) localStorage.setItem('gmao_machines_registered_v6', JSON.stringify(data.machines));
      if (Array.isArray(data.stock)) localStorage.setItem('gmao_raw_stock_v6', JSON.stringify(data.stock));
      if (Array.isArray(data.movements)) localStorage.setItem('gmao_mouvements', JSON.stringify(data.movements));
      if (Array.isArray(data.interventions)) localStorage.setItem('gmao_interventions_history', JSON.stringify(data.interventions));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('preventive_tasks_updated'));
        window.dispatchEvent(new CustomEvent('gmao_stock_updated'));
        window.dispatchEvent(new CustomEvent('gmao_mouvements_updated'));
        window.dispatchEvent(new CustomEvent('gmao_machines_updated'));
      }
      return true;
    } catch (err) {
      Logger.error('Erreur import unified vault:', err);
      return false;
    }
  }

  static getRecommendedPDRForAction(actionCode, compName = '') {
    const code = (actionCode || '').toUpperCase();
    const comp = (compName || '').toLowerCase();

    if (code === 'G') {
      return [
        { id_article: 'PDR-GRS-01', designation: 'Graisse SKF LGMT3 (Cartouche 400g)', reference: 'SKF-LGMT3-400', quantite: 1, unite: 'Cartouche', prix_unitaire: 18.5 },
        { id_article: 'PDR-GRS-02', designation: 'Graisse Haute Température Mobil Polyrex EM', reference: 'MOBIL-POLY-400', quantite: 1, unite: 'Cartouche', prix_unitaire: 26.0 },
      ];
    }
    if (code === 'L') {
      return [
        { id_article: 'PDR-OIL-01', designation: 'Huile Réducteur Synthétique ISO VG 220', reference: 'SHELL-OMALA-220', quantite: 2, unite: 'Litre', prix_unitaire: 22.0 },
        { id_article: 'PDR-OIL-02', designation: 'Huile Hydraulique Anti-usure ISO VG 46', reference: 'TOTAL-AZOLLA-46', quantite: 5, unite: 'Litre', prix_unitaire: 14.5 },
      ];
    }
    if (code === 'N') {
      return [
        { id_article: 'PDR-CLN-01', designation: 'Dégraissant & Nettoyant Contacts Diélectrique', reference: 'CRC-ELECTRO-500', quantite: 1, unite: 'Aérosol', prix_unitaire: 12.0 },
        { id_article: 'PDR-FLT-01', designation: 'Filtre de ventilation armoire électrique 200x200', reference: 'RITTAL-SK3182', quantite: 2, unite: 'Pièce', prix_unitaire: 16.0 },
      ];
    }
    if (code === 'S' || code === 'V') {
      return [
        { id_article: 'PDR-VRS-01', designation: 'Frein filet moyen Loctite 243 (50ml)', reference: 'LOCTITE-243-50', quantite: 0.1, unite: 'Flacon', prix_unitaire: 38.0 },
        { id_article: 'PDR-BOU-01', designation: 'Lot visserie classe 8.8 / 10.9 assortie', reference: 'DIN-933-SET', quantite: 1, unite: 'Lot', prix_unitaire: 9.5 },
      ];
    }
    if (code === 'R') {
      if (comp.includes('roulement') || comp.includes('palier')) {
        return [
          { id_article: 'PDR-RLM-01', designation: 'Roulement rigide à billes 6205-2RS1 SKF', reference: 'SKF-6205-2RS', quantite: 2, unite: 'Pièce', prix_unitaire: 24.5 },
          { id_article: 'PDR-JNT-01', designation: 'Bague d\'étanchéité radiale NBR 25x52x7', reference: 'SIMRIT-25-52-7', quantite: 2, unite: 'Pièce', prix_unitaire: 8.5 },
        ];
      }
      if (comp.includes('courroie')) {
        return [
          { id_article: 'PDR-CRW-01', designation: 'Courroie trapézoïdale renforcée Optibelt SPA-1250', reference: 'OPTI-SPA-1250', quantite: 2, unite: 'Pièce', prix_unitaire: 19.0 },
        ];
      }
      return [
        { id_article: 'PDR-REV-01', designation: 'Kit joints d\'étanchéité & révision standard', reference: 'KIT-REV-STD', quantite: 1, unite: 'Kit', prix_unitaire: 45.0 },
      ];
    }
    return [];
  }

  static getPreventiveAnalytics(list = [], correctifs = []) {
    const data = list.length > 0 ? list : this.getTasks();
    const total = data.length;
    const aFaire = data.filter(s => s.etat === 'À faire').length;
    const fait = data.filter(s => s.etat === 'Fait').length;
    const enRetard = data.filter(s => s.etat === 'En retard').length;
    
    // Total coût cumulé PDR & Maintenance
    const totalCout = data.reduce((acc, curr) => acc + (Number(curr.cout_cumule || 0)), 0);

    // Total heures préventives (réalisées ou estimées)
    const totalMinutesPrev = data.reduce((acc, curr) => {
      const min = parseInt((curr.duree_reelle || curr.duree_estimee || '15').replace(/[^0-9]/g, ''), 10) || 15;
      return acc + (curr.etat === 'Fait' ? min : 0);
    }, 0);
    const heuresPrev = Math.round((totalMinutesPrev / 60) * 10) / 10;

    // Correctifs associés ou reçus
    const nbCorrectifs = Array.isArray(correctifs) ? correctifs.length : data.filter(d => d.id_corrective).length;
    const heuresCorr = Math.round((nbCorrectifs * 2.5) * 10) / 10; // Estimation 2.5h par BT moyen

    // INDICATEURS INDUSTRIELS AVANCÉS
    // 1. PMP (Preventive Maintenance Percentage) = (Heures Prev / (Heures Prev + Heures Corr)) * 100
    const totalHeuresMaint = (heuresPrev + heuresCorr) || 1;
    const pmpRatio = Math.round((heuresPrev / totalHeuresMaint) * 100);

    // 2. Schedule Compliance / Respect du Plan (Plan vs Réalisé)
    const onTimeExecs = data.filter(d => d.etat === 'Fait' && !d.id_corrective).length;
    const scheduleCompliance = total > 0 ? Math.round((onTimeExecs / total) * 100) : 0;

    // 3. Taux par zone
    const zones = [...new Set(data.map(d => d.id_zone).filter(Boolean))];
    const zoneBreakdown = zones.map(z => {
      const zTasks = data.filter(d => d.id_zone === z);
      const zFait = zTasks.filter(d => d.etat === 'Fait').length;
      const zRetard = zTasks.filter(d => d.etat === 'En retard').length;
      const rate = zTasks.length > 0 ? Math.round((zFait / zTasks.length) * 100) : 0;
      return {
        zone: z,
        total: zTasks.length,
        fait: zFait,
        retard: zRetard,
        rate,
      };
    });

    // 4. Machine Health Distribution
    const machines = [...new Set(data.map(d => d.id_machine).filter(Boolean))];
    const machineHealth = machines.map(mCode => {
      const mTasks = data.filter(d => d.id_machine === mCode);
      const mFait = mTasks.filter(d => d.etat === 'Fait').length;
      const mRetard = mTasks.filter(d => d.etat === 'En retard').length;
      const rate = mTasks.length > 0 ? Math.round((mFait / mTasks.length) * 100) : 0;
      const status = mRetard > 0 ? 'Critique' : (rate >= 75 ? 'Optimale' : 'À surveiller');
      return {
        machine: mCode,
        nom: mTasks[0]?.nom_machine || mCode,
        zone: mTasks[0]?.id_zone || '',
        totalTasks: mTasks.length,
        fait: mFait,
        retard: mRetard,
        rate,
        status,
      };
    });

    return {
      total,
      aFaire,
      fait,
      enRetard,
      tauxConformite: total > 0 ? Math.round((fait / total) * 100) : 0,
      totalCout: Math.round(totalCout * 100) / 100,
      pmpRatio,
      scheduleCompliance,
      heuresPrev,
      heuresCorr,
      zoneBreakdown,
      machineHealth,
    };
  }

  static calculateNextEcheanceFromDate(startDateStr, frequence) {
    const now = new Date(startDateStr || new Date());
    if (frequence === 'Hebdo') now.setDate(now.getDate() + 7);
    else if (frequence === 'Bi-hebdo' || frequence === 'Bimensuel') now.setDate(now.getDate() + 14);
    else if (frequence === 'Mensuel') now.setMonth(now.getMonth() + 1);
    else if (frequence === 'Trimestriel') now.setMonth(now.getMonth() + 3);
    else if (frequence === 'Semestriel') now.setMonth(now.getMonth() + 6);
    else if (frequence === 'Annuel') now.setFullYear(now.getFullYear() + 1);
    return now.toISOString().split('T')[0];
  }

  static createCorrectiveFromTask(task, anomalyDetails = {}) {
    const btId = `BT-PREV-${task.id_machine}-${Date.now().toString().slice(-4)}`;
    const btPayload = {
      id_bt: btId,
      id_machine: task.id_machine,
      id_zone: task.id_zone,
      technicien: task.responsable,
      composant: task.composant,
      titre: `Anomalie décelée lors du préventif (${task.action_code} - ${task.composant})`,
      description: anomalyDetails.description || `Défaillance ou usure anormale constatée sur ${task.composant} lors de la tournée préventive ${task.code}.`,
      priorite: anomalyDetails.priorite || 'Haute',
      source_preventive_id: task.id,
      date_emission: new Date().toISOString(),
      statut: 'Ouvert',
    };

    // Marquer la tâche liée avec le BT
    this.updateTask(task.id, {
      id_corrective: btId,
      etat: 'En retard',
      remarque_anomalie: btPayload.description,
    });

    return btPayload;
  }

  static getStats(list = []) {
    const data = list.length > 0 ? list : this.getTasks();
    const total = data.length;
    const aFaire = data.filter(s => s.etat === 'À faire').length;
    const fait = data.filter(s => s.etat === 'Fait').length;
    const enRetard = data.filter(s => s.etat === 'En retard').length;
    
    // Total heures estimées
    const totalMinutes = data.reduce((acc, curr) => {
      const min = parseInt((curr.duree_estimee || '15').replace(/[^0-9]/g, ''), 10) || 15;
      return acc + min;
    }, 0);

    return {
      total,
      aFaire,
      fait,
      enRetard,
      tauxConformite: total > 0 ? Math.round((fait / total) * 100) : 0,
      totalHeuresEstimees: (totalMinutes / 60).toFixed(1),
      hebdo: data.filter(s => s.frequence === 'Hebdo').length,
      mensuel: data.filter(s => s.frequence === 'Mensuel').length,
      trimestriel: data.filter(s => s.frequence === 'Trimestriel').length,
      annuel: data.filter(s => s.frequence === 'Annuel').length,
    };
  }

  static getByMachine(machineCode) {
    return this.getTasks().filter(t => t.id_machine === machineCode);
  }

  static getByZone(zone) {
    return this.getTasks().filter(t => t.id_zone === zone);
  }
}

export default PreventiveService;
