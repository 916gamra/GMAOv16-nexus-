const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const backupLogic = `
  // Auto Backup and Performance Monitor Initialization
  useEffect(() => {
    logger.info('Application started');
    monitor.measure('App_Init', () => {
      // Start auto backup
      backupService.startAutoBackup(() => {
        return {
          Stock_Actuel: rawStock,
          Mouvement: mouvements,
          Machines_Registered: machines,
          Families: families,
          Templates: templates,
          Zones: zones,
          Diagnostics: designations,
          Types: types,
          Technicians: technicians,
          Operations: operations
        };
      }, currentUser?.nom || 'system');
    });

    return () => {
      backupService.stopAutoBackup();
    };
  }, [currentUser, rawStock, mouvements, machines, families, templates, zones, designations, types, technicians, operations]);

  const diagnostics = designations;
`;

code = code.replace(/  const diagnostics = designations;/, backupLogic);

fs.writeFileSync('src/App.jsx', code);
