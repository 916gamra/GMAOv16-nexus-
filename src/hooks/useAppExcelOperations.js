import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { validateImportedData } from '../utils/validation';
import { sanitizeObject } from '../utils/sanitize';
import { storageService } from '../utils/storageService';
import { Logger } from '../core/logger/LoggerService';

/**
 * Hook to handle Excel Export, Import, Direct File System Linking and Save, with automatic versioned backups
 */
export function useAppExcelOperations({
  state,
  stockItems = [],
  diagnostics = [],
  showToast,
  fileInputRef,
}) {
  const {
    rawStock,
    setRawStock,
    mouvements,
    setMouvements,
    machines,
    setMachines,
    warehouseItems,
    setWarehouseItems,
    families,
    setFamilies,
    templates,
    setTemplates,
    blueprints,
    setBlueprints,
    zones,
    setZones,
    technicians,
    setTechnicians,
    operations,
    setOperations,
    types,
    compFamilies,
    setCompFamilies,
    compTemplates,
    setCompTemplates,
    partTypes,
    setPartTypes,
    partDesignations,
    setPartDesignations,
  } = state;

  const [linkedFileHandle, setLinkedFileHandle] = useState(null);
  const [linkedFileName, setLinkedFileName] = useState('');

  // AUTOMATIC BACKUP CREATOR
  const createAutomaticBackup = useCallback(
    (reason = 'Importation Excel') => {
      try {
        const now = new Date();
        const dateStr =
          now.toLocaleDateString('fr-FR') +
          ' À ' +
          now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        const backupKey = `gmao_backup_${now.getTime()}`;
        const backupData = {
          timestamp: now.toISOString(),
          dateFormatted: dateStr,
          reason,
          data: {
            rawStock,
            mouvements,
            machines,
            warehouseItems,
            families,
            templates,
            zones,
            technicians,
            operations,
            types,
            diagnostics,
          },
        };

        storageService.setItem(backupKey, backupData);

        const backupList = storageService.getItem('gmao_backups_list') || [];
        const updatedList = [
          {
            key: backupKey,
            date: dateStr,
            reason,
            itemsCount: (rawStock || []).length,
            mvtsCount: (mouvements || []).length,
          },
          ...backupList,
        ].slice(0, 15);

        storageService.setItem('gmao_backups_list', updatedList);
        return dateStr;
      } catch (err) {
      if (err.name === "AbortError") return;
      if (err.name === "SecurityError" || err.name === "NotAllowedError" || (err.message && err.message.toLowerCase().includes("cross origin"))) {
        showToast("Liaison bloquée par le navigateur (iframe). Basculement vers l'import classique.", "info");
        fileInputRef.current?.click();
        return;
      }
        Logger.error('[ExcelOperations] Backup creation error:', err);
        return new Date().toLocaleString('fr-FR');
      }
    },
    [
      rawStock,
      mouvements,
      machines,
      warehouseItems,
      families,
      templates,
      zones,
      technicians,
      operations,
      types,
      diagnostics,
    ]
  );

  // HELPER TO BUILD COMPLETE EXCEL WORKBOOK
  const buildWorkbook = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // 1. Stock_Actuel
    const stockData = stockItems.map((s) => ({
      Ref: s.ref,
      Désignation: s.designation,
      ID_Type: s.id_type,
      ID_Diagnostic: s.id_diag,
      'Stock Initial': s.stockInitial,
      Entrées: s.entrees,
      Sorties: s.sorties,
      'Stock Actuel': s.stockActuel,
      Seuil: s.seuil,
      Alerte: s.alerte,
      Emplacement: s.emplacement,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockData), 'Stock_Actuel');

    // 2. Machines_Registered
    const mchData = machines.map((m) => ({
      'Code Machine (Ref)': m.id_machine_registered,
      Désignation: m.designation,
      ID_Family: m.id_family,
      ID_Template: m.id_templates,
      Zone_Default: m.id_zone_default,
      Technicien: m.technician,
      Statut: m.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mchData), 'Machines_Registered');

    // 3. Warehouse_Items (Entrepôt)
    const warehouseData = warehouseItems.map((w) => ({
      'Code Entrepôt (Ref)': w.id_warehouse_item || w.id_machine_registered,
      Désignation: w.designation,
      Nature: w.nature || 'COMPOSANT',
      ID_Family: w.id_family,
      ID_Template: w.id_templates,
      Rattachement: w.rattachement_type || 'NON_ASSIGNE',
      'Machine Associée': w.id_machine_associee || '',
      Zone: w.id_zone_default,
      Responsable: w.technician,
      Statut: w.status,
      Quantité: w.quantite || 1,
      Emplacement: w.emplacement || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(warehouseData), 'Warehouse_Items');

    // 4. Mouvements
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mouvements), 'Mouvements');

    // 5. Types
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(types), 'Types');

    // 6. Diagnostics
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(diagnostics), 'Diagnostics');

    // 7. Families
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(families), 'Families');

    // 8. Templates
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(templates), 'Templates');

    // 9. Zones
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(zones), 'Zones');

    // 10. Technicians
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(technicians), 'Technicians');

    // 11. Operations
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(operations), 'Operations');

    // 12. Comp_Families
    if (compFamilies && compFamilies.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compFamilies), 'Comp_Families');
    }

    // 13. Comp_Templates
    if (compTemplates && compTemplates.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compTemplates), 'Comp_Templates');
    }

    // 14. Part_Types
    if (partTypes && partTypes.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partTypes), 'Part_Types');
    }

    // 15. Part_Designations
    if (partDesignations && partDesignations.length > 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(partDesignations),
        'Part_Designations'
      );
    }

    // 16. Blueprints (Technical plans)
    if (blueprints && blueprints.length > 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(blueprints),
        'Blueprints'
      );
    }

    return wb;
  }, [
    stockItems,
    machines,
    warehouseItems,
    mouvements,
    types,
    diagnostics,
    families,
    templates,
    zones,
    technicians,
    operations,
    compFamilies,
    compTemplates,
    partTypes,
    partDesignations,
    blueprints,
  ]);

  // EXCEL EXPORT HANDLER
  const handleExportExcel = useCallback(() => {
    const wb = buildWorkbook();
    XLSX.writeFile(wb, `GMAO_Light_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Export Excel généré et téléchargé avec succès !', 'success');
  }, [buildWorkbook, showToast]);

  // FILE IMPORT HANDLER WITH AUTOMATIC DATED BACKUP
  const handleImportFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        showToast('Fichier trop volumineux. La taille maximale est de 10 MB.', 'error');
        return;
      }

      const validExtensions = ['.json', '.xlsx'];
      const validMimeTypes = [
        'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(fileExt) || (file.type && !validMimeTypes.includes(file.type))) {
        showToast('Format de fichier non supporté. Seuls JSON et XLSX.', 'error');
        return;
      }

      const backupDate = createAutomaticBackup('Importation : ' + file.name);
      showToast('Lecture et importation du fichier en cours...', 'info');
      const reader = new FileReader();

      reader.onerror = () => {
        showToast('Erreur de lecture du fichier sélectionné.', 'error');
      };

      reader.onload = async (evt) => {
        try {
          let importedData = {};
          if (file.name.endsWith('.json')) {
            importedData = JSON.parse(evt.target.result);
          } else {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            if (workbook.SheetNames.includes('Stock_Actuel')) {
              importedData.Stock_Actuel = XLSX.utils.sheet_to_json(workbook.Sheets['Stock_Actuel']);
            }
            if (workbook.SheetNames.includes('Mouvements')) {
              importedData.Mouvement = XLSX.utils.sheet_to_json(workbook.Sheets['Mouvements']);
            }
            if (workbook.SheetNames.includes('Machines_Registered')) {
              importedData.Machines_Registered = XLSX.utils.sheet_to_json(
                workbook.Sheets['Machines_Registered']
              );
            }
            if (workbook.SheetNames.includes('Warehouse_Items')) {
              importedData.Warehouse_Items = XLSX.utils.sheet_to_json(
                workbook.Sheets['Warehouse_Items']
              );
            } else if (workbook.SheetNames.includes('Entrepot')) {
              importedData.Warehouse_Items = XLSX.utils.sheet_to_json(workbook.Sheets['Entrepot']);
            }
            if (workbook.SheetNames.includes('Comp_Families')) {
              importedData.Comp_Families = XLSX.utils.sheet_to_json(workbook.Sheets['Comp_Families']);
            }
            if (workbook.SheetNames.includes('Comp_Templates')) {
              importedData.Comp_Templates = XLSX.utils.sheet_to_json(
                workbook.Sheets['Comp_Templates']
              );
            }
            if (workbook.SheetNames.includes('Part_Types')) {
              importedData.Part_Types = XLSX.utils.sheet_to_json(workbook.Sheets['Part_Types']);
            }
            if (workbook.SheetNames.includes('Part_Designations')) {
              importedData.Part_Designations = XLSX.utils.sheet_to_json(
                workbook.Sheets['Part_Designations']
              );
            }
            if (workbook.SheetNames.includes('Blueprints')) {
              importedData.Blueprints = XLSX.utils.sheet_to_json(
                workbook.Sheets['Blueprints']
              );
            }
          }

          const validation = validateImportedData(importedData);
          if (!validation.valid) {
            const errorMsgs = [];
            if (validation.errors.stock.length > 0)
              errorMsgs.push('Erreurs Stock: ' + validation.errors.stock.length);
            if (validation.errors.movements.length > 0)
              errorMsgs.push('Erreurs Mouvements: ' + validation.errors.movements.length);
            if (validation.errors.general.length > 0) errorMsgs.push(...validation.errors.general);

            showToast('Import échoué: données invalides. ' + errorMsgs.join(', '), 'error');
            Logger.error('[ExcelOperations] Validation failed on import', validation.errors);
            return;
          }

          if (importedData.Stock_Actuel && importedData.Stock_Actuel.length > 0)
            setRawStock(sanitizeObject(importedData.Stock_Actuel));
          if (importedData.Mouvement && importedData.Mouvement.length > 0)
            setMouvements(sanitizeObject(importedData.Mouvement));
          if (importedData.Machines_Registered && importedData.Machines_Registered.length > 0)
            setMachines(sanitizeObject(importedData.Machines_Registered));
          if (importedData.Warehouse_Items && importedData.Warehouse_Items.length > 0)
            setWarehouseItems(sanitizeObject(importedData.Warehouse_Items));
          if (importedData.Families && importedData.Families.length > 0)
            setFamilies(sanitizeObject(importedData.Families));
          if (importedData.Templates && importedData.Templates.length > 0)
            setTemplates(sanitizeObject(importedData.Templates));
          if (importedData.Blueprints && importedData.Blueprints.length > 0)
            setBlueprints(sanitizeObject(importedData.Blueprints));
          if (importedData.Zones && importedData.Zones.length > 0)
            setZones(sanitizeObject(importedData.Zones));
          if (importedData.Technicians && importedData.Technicians.length > 0)
            setTechnicians(sanitizeObject(importedData.Technicians));
          if (importedData.Operations && importedData.Operations.length > 0)
            setOperations(sanitizeObject(importedData.Operations));
          if (importedData.Comp_Families && importedData.Comp_Families.length > 0)
            setCompFamilies(sanitizeObject(importedData.Comp_Families));
          if (importedData.Comp_Templates && importedData.Comp_Templates.length > 0)
            setCompTemplates(sanitizeObject(importedData.Comp_Templates));
          if (importedData.Part_Types && importedData.Part_Types.length > 0)
            setPartTypes(sanitizeObject(importedData.Part_Types));
          if (importedData.Part_Designations && importedData.Part_Designations.length > 0)
            setPartDesignations(sanitizeObject(importedData.Part_Designations));

          showToast('Import réussi ! (Backup daté du ' + backupDate + ')', 'success');
          Logger.info('[ExcelOperations] File imported successfully', { file: file.name });
        } catch (err) {
      if (err.name === "AbortError") return;
      if (err.name === "SecurityError" || err.name === "NotAllowedError" || (err.message && err.message.toLowerCase().includes("cross origin"))) {
        showToast("Liaison bloquée par le navigateur (iframe). Basculement vers l'import classique.", "info");
        fileInputRef.current?.click();
        return;
      }
          showToast('Erreur lors de la lecture du fichier.', 'error');
          Logger.error('[ExcelOperations] Import error:', err);
        }
      };

      if (file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    },
    [
      createAutomaticBackup,
      showToast,
      setRawStock,
      setMouvements,
      setMachines,
      setWarehouseItems,
      setFamilies,
      setTemplates,
      setBlueprints,
      setZones,
      setTechnicians,
      setOperations,
      setCompFamilies,
      setCompTemplates,
      setPartTypes,
      setPartDesignations,
    ]
  );

  // DIRECT FILE SYSTEM ACCESS API LINK
  const handleDirectFileLink = useCallback(async () => {
    if (!('showOpenFilePicker' in window)) {
      showToast(
        "Liaison directe disponible sur Chrome/Edge. Basculement vers l'import classique.",
        'info'
      );
      fileInputRef.current?.click();
      return;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Fichiers Excel GMAO (.xlsx)',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
                '.xlsx',
                '.xls',
              ],
            },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      const backupDate = createAutomaticBackup(`Avant Liaison Directe : ${file.name}`);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

      if (workbook.SheetNames.includes('Stock_Actuel')) {
        const parsedStock = XLSX.utils.sheet_to_json(workbook.Sheets['Stock_Actuel']);
        if (parsedStock.length > 0) setRawStock(parsedStock);
      }
      if (workbook.SheetNames.includes('Machines_Registered')) {
        const parsedMch = XLSX.utils.sheet_to_json(workbook.Sheets['Machines_Registered']);
        if (parsedMch.length > 0) setMachines(parsedMch);
      }
      if (workbook.SheetNames.includes('Mouvements')) {
        const parsedMvt = XLSX.utils.sheet_to_json(workbook.Sheets['Mouvements']);
        if (parsedMvt.length > 0) setMouvements(parsedMvt);
      }

      setLinkedFileHandle(handle);
      setLinkedFileName(file.name);
      showToast(
        `🔗 Fichier "${file.name}" lié en direct ! (Backup sauvegardé : ${backupDate})`,
        'success'
      );
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err.name === "SecurityError" || err.name === "NotAllowedError" || (err.message && err.message.toLowerCase().includes("cross origin"))) {
        showToast("Liaison bloquée par le navigateur (iframe). Basculement vers l'import classique.", "info");
        fileInputRef.current?.click();
        return;
      }
      if (err.name !== 'AbortError') {
        Logger.error('[ExcelOperations] Direct link error:', err);
        showToast("Erreur lors de l'accès au fichier sélectionné.", 'error');
      }
    }
  }, [createAutomaticBackup, fileInputRef, setMachines, setMouvements, setRawStock, showToast]);

  // DIRECT FILE SYSTEM SAVE HANDLER
  const handleDirectSave = useCallback(async () => {
    if (!linkedFileHandle) {
      handleExportExcel();
      return;
    }

    try {
      const wb = buildWorkbook();
      const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const writable = await linkedFileHandle.createWritable();
      await writable.write(wbOut);
      await writable.close();

      showToast(`💾 Écriture directe réussie dans "${linkedFileName}" !`, 'success');
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err.name === "SecurityError" || err.name === "NotAllowedError" || (err.message && err.message.toLowerCase().includes("cross origin"))) {
        showToast("Liaison bloquée par le navigateur (iframe). Basculement vers l'import classique.", "info");
        fileInputRef.current?.click();
        return;
      }
      Logger.error('[ExcelOperations] Direct save error:', err);
      showToast('Écriture directe impossible. Exportation standard...', 'info');
      handleExportExcel();
    }
  }, [buildWorkbook, handleExportExcel, linkedFileHandle, linkedFileName, showToast]);

  return {
    linkedFileHandle,
    linkedFileName,
    buildWorkbook,
    handleExportExcel,
    handleImportFile,
    handleDirectFileLink,
    handleDirectSave,
    createAutomaticBackup,
  };
}
