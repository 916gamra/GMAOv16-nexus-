import * as XLSX from 'xlsx';
import { Logger } from './Logger.js';
import { NotificationService } from './NotificationService.js';

/**
 * خدمة التصدير والاستيراد الموحدة (Excel & JSON)
 * @module ExportImportService
 */
export class ExportImportService {
  /**
   * تصدير مصفوفة بيانات إلى ملف Excel
   * @param {Array} data - مصفوفة الكائنات
   * @param {string} fileName - اسم الملف بدون الامتداد
   * @param {string} sheetName - اسم ورقة العمل
   */
  static exportToExcel(data, fileName = 'export', sheetName = 'Data') {
    try {
      if (!data || data.length === 0) {
        NotificationService.warning("Aucune donnée à exporter.");
        return false;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);

      Logger.info(`Exportation Excel réussie: ${fileName}`, { count: data.length });
      NotificationService.success(`Exportation réussie (${data.length} lignes)`);
      return true;
    } catch (error) {
      Logger.error("Erreur lors de l'exportation Excel", error);
      NotificationService.error("Échec de l'exportation Excel.");
      return false;
    }
  }

  /**
   * تصدير بيانات إلى ملف JSON
   * @param {any} data - البيانات
   * @param {string} fileName - اسم الملف
   */
  static exportToJSON(data, fileName = 'backup') {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      NotificationService.success("Sauvegarde JSON téléchargée avec succès.");
      return true;
    } catch (error) {
      Logger.error("Erreur lors de l'exportation JSON", error);
      NotificationService.error("Échec de la sauvegarde JSON.");
      return false;
    }
  }

  /**
   * قراءة واستيراد ملف Excel
   * @param {File} file - ملف Excel المرفوع
   * @returns {Promise<Array>}
   */
  static async importFromExcel(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            Logger.info(`Fichier Excel lu avec succès`, { rows: json.length });
            resolve(json);
          } catch (err) {
            Logger.error("Erreur de parsing Excel", err);
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * قراءة ملف JSON
   * @param {File} file
   * @returns {Promise<any>}
   */
  static async importFromJSON(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target.result);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default ExportImportService;
