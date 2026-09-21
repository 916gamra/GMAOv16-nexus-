const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const importLogic = `
  const handleImportFile = async (e) => {
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
    const reader = new FileReader();

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
             importedData.Machines_Registered = XLSX.utils.sheet_to_json(workbook.Sheets['Machines_Registered']);
          }
        }

        const validation = validateImportedData(importedData);
        if (!validation.valid) {
          const errorMsgs = [];
          if (validation.errors.stock.length > 0) errorMsgs.push('Erreurs Stock: ' + validation.errors.stock.length);
          if (validation.errors.movements.length > 0) errorMsgs.push('Erreurs Mouvements: ' + validation.errors.movements.length);
          if (validation.errors.general.length > 0) errorMsgs.push(...validation.errors.general);
          
          showToast('Import échoué: données invalides. ' + errorMsgs.join(', '), 'error');
          logger.error('Validation failed on import', validation.errors);
          return;
        }

        if (importedData.Stock_Actuel && importedData.Stock_Actuel.length > 0) setRawStock(sanitizeObject(importedData.Stock_Actuel));
        if (importedData.Mouvement && importedData.Mouvement.length > 0) setMouvements(sanitizeObject(importedData.Mouvement));
        if (importedData.Machines_Registered && importedData.Machines_Registered.length > 0) setMachines(sanitizeObject(importedData.Machines_Registered));
        if (importedData.Families && importedData.Families.length > 0) setFamilies(sanitizeObject(importedData.Families));
        if (importedData.Templates && importedData.Templates.length > 0) setTemplates(sanitizeObject(importedData.Templates));
        if (importedData.Zones && importedData.Zones.length > 0) setZones(sanitizeObject(importedData.Zones));
        if (importedData.Technicians && importedData.Technicians.length > 0) setTechnicians(sanitizeObject(importedData.Technicians));
        if (importedData.Operations && importedData.Operations.length > 0) setOperations(sanitizeObject(importedData.Operations));

        showToast('Import réussi ! (Backup daté du ' + backupDate + ')', 'success');
        logger.info('File imported successfully', { file: file.name });
      } catch (err) {
        console.error('Import error:', err);
        showToast('Erreur lors de la lecture du fichier.', 'error');
        logger.error('Import error', { error: err.message });
      }
    };
    
    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };
`;

code = code.replace(/  const handleImportFile = \(e\) => \{[\s\S]*?reader\.readAsArrayBuffer\(file\);\n    \}\n  \};\n/m, importLogic);

fs.writeFileSync('src/App.jsx', code);
