const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const crudInit = `
  // Generic CRUD Hooks
  const { handleAdd: handleAddType, handleUpdate: handleUpdateType, handleDelete: handleDeleteType } = useGenericCRUD(setTypes, 'id_type');
  const { handleAdd: handleAddDesignation, handleUpdate: handleUpdateDesignation, handleDelete: handleDeleteDesignation } = useGenericCRUD(setDesignations, 'id_diag');
  const handleAddDiagnostic = handleAddDesignation;
  const handleUpdateDiagnostic = handleUpdateDesignation;
  const handleDeleteDiagnostic = handleDeleteDesignation;
  const { handleAdd: handleAddFamily, handleUpdate: handleUpdateFamily, handleDelete: handleDeleteFamily } = useGenericCRUD(setFamilies, 'id_family');
  const { handleAdd: handleAddTemplate, handleUpdate: handleUpdateTemplate, handleDelete: handleDeleteTemplate } = useGenericCRUD(setTemplates, 'id_templates');
  
  // Custom side effects for Zones
  const onZoneUpdate = (oldZone, updatedZone) => {
    if (oldZone && oldZone.id_zone !== updatedZone.id_zone) {
      setTechnicians(prev => prev.map(t => t.id_zone === oldZone.id_zone ? { ...t, id_zone: updatedZone.id_zone } : t));
      setOperations(prev => prev.map(o => o.id_zone === oldZone.id_zone ? { ...o, id_zone: updatedZone.id_zone } : o));
      setMachines(prev => prev.map(m => m.id_zone_default === oldZone.id_zone ? { ...m, id_zone_default: updatedZone.id_zone } : m));
    }
  };
  const { handleAdd: handleAddZone, handleUpdate: handleUpdateZone, handleDelete: handleDeleteZone } = useGenericCRUD(setZones, 'id_zone', onZoneUpdate);

  const { handleAdd: handleAddTechnician, handleUpdate: handleUpdateTechnician, handleDelete: handleDeleteTechnician } = useGenericCRUD(setTechnicians, 'id_technician');
  const { handleAdd: handleAddOperation, handleUpdate: handleUpdateOperation, handleDelete: handleDeleteOperation } = useGenericCRUD(setOperations, 'id_operation');
  const { handleAdd: handleAddMachine, handleUpdate: handleUpdateMachine, handleDelete: handleDeleteMachine } = useGenericCRUD(setMachines, 'id_machine_registered');
`;

const oldCrudRegex = /\/\/ ===== CRUD & ACTION HANDLERS =====[\s\S]*?(?=\/\/ ===== APP STARTUP & MIGRATION)/;

code = code.replace(oldCrudRegex, (match) => {
  // Keep handleAddArticle and handleAddMouvement which have special logic.
  let remainder = match.substring(match.indexOf('const handleAddArticle'));
  return `// ===== CRUD & ACTION HANDLERS =====\n${crudInit}\n\n  ${remainder}`;
});

fs.writeFileSync('src/App.jsx', code);
