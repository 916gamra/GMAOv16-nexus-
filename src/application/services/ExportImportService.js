import * as XLSX from 'xlsx';
import { Logger } from '../../core/logger/LoggerService.js';
import { NotificationService } from '../../services/NotificationService.js';

/**
 * Service Universel d'Export et d'Import pour GMAO
 * Prise en charge des formats Excel (.xlsx, .xls) et JSON (.json)
 */
export class ExportImportService {
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
   * Exporter une collection vers un classeur Excel
   * @param {Array<Object>} rows - Lignes de données
   * @param {string} sheetName - Nom de l'onglet Excel
   * @param {string} filename - Nom du fichier téléchargé
   */
  static exportToExcel(rows = [], sheetName = 'Feuille1', filename = 'export_gmao.xlsx') {
    try {
      const worksheet = XLSX.utils.json_to_sheet(rows);
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
