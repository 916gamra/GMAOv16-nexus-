import * as XLSX from 'xlsx';
import { Logger } from '../../core/logger/LoggerService.js';
import { NotificationService } from '../../services/NotificationService.js';

/**
 * Service Universel d'Export et d'Import pour GMAO
 * Prise en charge des formats Excel (.xlsx, .xls) et JSON (.json)
 * Conforme au modèle Excel Twin
 */
export class ExportImportService {
  /**
   * Helper to set automatic column widths on XLSX worksheet
   */
  static autoFitColumns(worksheet, rows) {
    if (!rows || rows.length === 0) return;
    const keys = Object.keys(rows[0] || {});
    worksheet['!cols'] = keys.map((key) => {
      let maxLen = String(key).length;
      rows.slice(0, 100).forEach((r) => {
        const val = r[key];
        if (val != null) {
          const len = String(val).length;
          if (len > maxLen) maxLen = len;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
    });
  }

  /**
   * Exporter des données au format JSON
   * @param {any} data - Données à exporter
   * @param {string} filename - Nom du fichier de sortie
   */
  static exportToJSON(data, filename = 'export_gmao.json') {
    try {
      const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Logger.info(`[ExportImportService] Fichier JSON exporté avec succès: ${filename}`);
      return true;
    } catch (err) {
      Logger.error(`[ExportImportService] Échec de l'export JSON:`, err);
      return false;
    }
  }

  /**
   * Exporter une collection vers un classeur Excel simple
   * @param {Array<Object>} rows - Lignes de données
   * @param {string} sheetName - Nom de l'onglet Excel
   * @param {string} filename - Nom du fichier téléchargé
   */
  static exportToExcel(rows = [], sheetName = 'Feuille1', filename = 'export_gmao.xlsx') {
    try {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      this.autoFitColumns(worksheet, rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, filename);
      Logger.info(`[ExportImportService] Classeur Excel exporté avec succès: ${filename}`);
      NotificationService.notifyExcelExported(filename);
      return true;
    } catch (err) {
      Logger.error(`[ExportImportService] Échec de l'export Excel:`, err);
      return false;
    }
  }

  /**
   * Exporter l'intégralité du modèle d'usine (Full Factory Excel Twin)
   * Génère un classeur multi-onglets structuré et ordonné
   */
  static exportFullFactoryExcel(factoryData = {}, filename) {
    try {
      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().slice(0, 10);
      const finalFilename = filename || `GMAO_CIOB_Full_Factory_${dateStr}.xlsx`;

      const sheets = [
        { name: 'Stock_Actuel', data: factoryData.stock || factoryData.rawStock || [] },
        { name: 'Machines_Registered', data: factoryData.machines || [] },
        { name: 'Warehouse_Items', data: factoryData.warehouseItems || [] },
        { name: 'Mouvements', data: factoryData.mouvements || [] },
        { name: 'Sortie_Externe', data: factoryData.sortiesExterne || [] },
        { name: 'Demandes_Intervention', data: factoryData.demandes || [] },
        { name: 'Bons_Travail', data: factoryData.bonsTravail || [] },
        { name: 'Preventive_S1_S52', data: factoryData.preventiveTasks || [] },
        { name: 'Preventive_Plans', data: factoryData.preventivePlans || [] },
        { name: 'Zones', data: factoryData.zones || [] },
        { name: 'Techniciens', data: factoryData.technicians || [] },
        { name: 'Operations', data: factoryData.operations || [] },
        { name: 'Familles_Machines', data: factoryData.families || [] },
        { name: 'Templates_Machines', data: factoryData.templates || [] },
        { name: 'Blueprints', data: factoryData.blueprints || [] },
        { name: 'Types_Articles', data: factoryData.types || [] },
        { name: 'Comp_Families', data: factoryData.compFamilies || [] },
        { name: 'Comp_Templates', data: factoryData.compTemplates || [] },
      ];

      let appendedCount = 0;
      sheets.forEach(({ name, data }) => {
        if (Array.isArray(data) && data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          this.autoFitColumns(ws, data);
          XLSX.utils.book_append_sheet(wb, ws, name);
          appendedCount++;
        }
      });

      if (appendedCount === 0) {
        // Fallback with an info sheet
        const ws = XLSX.utils.json_to_sheet([{ Statut: 'Usine vide ou données non chargées', Date: dateStr }]);
        XLSX.utils.book_append_sheet(wb, ws, 'Info_Usine');
      }

      XLSX.writeFile(wb, finalFilename);
      Logger.info(`[ExportImportService] Full Factory Excel exporté (${appendedCount} onglets): ${finalFilename}`);
      NotificationService.notifyExcelExported(finalFilename);
      return true;
    } catch (err) {
      Logger.error(`[ExportImportService] Échec de l'export Full Factory:`, err);
      return false;
    }
  }

  /**
   * Importer un fichier JSON depuis un objet File (input[type=file] ou drag&drop)

   * @param {File} file
   * @returns {Promise<any>}
   */
  static async importFromJSON(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('Aucun fichier fourni.'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const parsed = JSON.parse(content);
          Logger.info(`[ExportImportService] Fichier JSON importé: ${file.name}`);
          resolve(parsed);
        } catch (err) {
          Logger.error(`[ExportImportService] Fichier JSON invalide: ${file.name}`, err);
          reject(new Error('Le fichier JSON est corrompu ou mal formé.'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  }

  /**
   * Importer une feuille de calcul Excel (.xlsx, .xls)
   * @param {File} file
   * @param {number|string} [sheetIndexOrName=0]
   * @returns {Promise<Array<Object>>}
   */
  static async importFromExcel(file, sheetIndexOrName = 0) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('Aucun fichier Excel fourni.'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const targetSheetName = typeof sheetIndexOrName === 'string'
            ? sheetIndexOrName
            : workbook.SheetNames[sheetIndexOrName] || workbook.SheetNames[0];

          const worksheet = workbook.Sheets[targetSheetName];
          if (!worksheet) {
            throw new Error(`Feuille "${targetSheetName}" introuvable dans le classeur.`);
          }

          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          Logger.info(`[ExportImportService] ${rows.length} lignes importées depuis ${file.name}`);
          resolve(rows);
        } catch (err) {
          Logger.error(`[ExportImportService] Échec lecture Excel: ${file.name}`, err);
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
}

export default ExportImportService;
