const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. ADD HANDLERS TO APP.JSX
const updateHandlers = `  // ===== UPDATE & DELETE HANDLERS =====
  const handleUpdateZone = (id, updatedZone) => {
    setZones(prev => prev.map(z => z.id_zone === id ? updatedZone : z));
    const oldZone = zones.find(z => z.id_zone === id);
    if (oldZone && oldZone.id_zone !== updatedZone.id_zone) {
      setTechnicians(prev => prev.map(t => t.id_zone === id ? { ...t, id_zone: updatedZone.id_zone } : t));
      setOperations(prev => prev.map(o => o.id_zone === id ? { ...o, id_zone: updatedZone.id_zone } : o));
      setMachines(prev => prev.map(m => m.id_zone_default === id ? { ...m, id_zone_default: updatedZone.id_zone } : m));
      setMouvements(prev => prev.map(m => m.id_zone === id ? { ...m, id_zone: updatedZone.id_zone } : m));
    }
  };
  const handleDeleteZone = (id) => setZones(prev => prev.filter(z => z.id_zone !== id));

  const handleUpdateOperation = (id, updatedOp) => {
    setOperations(prev => prev.map(o => o.id_operation === id ? updatedOp : o));
    const oldOp = operations.find(o => o.id_operation === id);
    if (oldOp && oldOp.nom !== updatedOp.nom) {
      setMouvements(prev => prev.map(m => m.operation === oldOp.nom ? { ...m, operation: updatedOp.nom } : m));
    }
  };
  const handleDeleteOperation = (id) => setOperations(prev => prev.filter(o => o.id_operation !== id));

  const handleUpdateMachine = (id, updatedMch) => {
    setMachines(prev => prev.map(m => m.id_machine_registered === id ? updatedMch : m));
    if (id !== updatedMch.id_machine_registered) {
      setMouvements(prev => prev.map(m => m.id_machine_registered === id ? { ...m, id_machine_registered: updatedMch.id_machine_registered } : m));
    }
  };
  const handleDeleteMachine = (id) => setMachines(prev => prev.filter(m => m.id_machine_registered !== id));

  const handleUpdateType = (id, updatedType) => {
    setTypes(prev => prev.map(t => t.id_type === id ? updatedType : t));
    if (id !== updatedType.id_type) {
      setRawStock(prev => prev.map(s => s.type === id || s.id_type === id ? { ...s, type: updatedType.id_type, id_type: updatedType.id_type } : s));
    }
  };
  const handleDeleteType = (id) => setTypes(prev => prev.filter(t => t.id_type !== id));

  const handleUpdateDesignation = (id, updatedDesig) => {
    setRawStock(prev => prev.map(s => s.ref === id ? { 
      ...s, 
      ref: updatedDesig.ref, 
      designation: updatedDesig.designation, 
      type: updatedDesig.id_type, 
      id_type: updatedDesig.id_type,
      stockInitial: Number(updatedDesig.stockInitial),
      seuil: Number(updatedDesig.seuil),
      emplacement: updatedDesig.emplacement
    } : s));
  };
  const handleDeleteDesignation = (id) => setRawStock(prev => prev.filter(s => s.ref !== id));
  const handleUpdateDiagnostic = handleUpdateDesignation;
  const handleDeleteDiagnostic = handleDeleteDesignation;

  const handleUpdateFamily = (id, updatedFamily) => {
    setFamilies(prev => prev.map(f => f.id_family === id ? updatedFamily : f));
    if (id !== updatedFamily.id_family) {
      setTemplates(prev => prev.map(t => t.id_family === id ? { ...t, id_family: updatedFamily.id_family } : t));
      setMachines(prev => prev.map(m => m.id_family === id ? { ...m, id_family: updatedFamily.id_family } : m));
    }
  };
  const handleDeleteFamily = (id) => setFamilies(prev => prev.filter(f => f.id_family !== id));

  const handleUpdateTemplate = (id, updatedTemplate) => {
    setTemplates(prev => prev.map(t => t.id_templates === id ? updatedTemplate : t));
    if (id !== updatedTemplate.id_templates) {
      setMachines(prev => prev.map(m => m.id_templates === id ? { ...m, id_templates: updatedTemplate.id_templates } : m));
    }
  };
  const handleDeleteTemplate = (id) => setTemplates(prev => prev.filter(t => t.id_templates !== id));
  // ===================================
`;
if(!app.includes('handleUpdateZone')) {
  app = app.replace('const handleAddTechnician', updateHandlers + '\n  const handleAddTechnician');
}

// 2. PASS HANDLERS TO COMPONENTS IN APP.JSX
app = app.replace(
  /onAddZone=\{handleAddZone\}/,
  'onAddZone={handleAddZone}\n              onUpdateZone={handleUpdateZone}\n              onDeleteZone={handleDeleteZone}'
);
app = app.replace(
  /onAddOperation=\{handleAddOperation\}/,
  'onAddOperation={handleAddOperation}\n              onUpdateOperation={handleUpdateOperation}\n              onDeleteOperation={handleDeleteOperation}'
);
app = app.replace(
  /onAddMachine=\{handleAddMachine\}/,
  'onAddMachine={handleAddMachine}\n              onUpdateMachine={handleUpdateMachine}\n              onDeleteMachine={handleDeleteMachine}'
);
app = app.replace(
  /onAddType=\{handleAddType\}/,
  'onAddType={handleAddType}\n              onUpdateType={handleUpdateType}\n              onDeleteType={handleDeleteType}'
);
app = app.replace(
  /onAddDesignation=\{handleAddDesignation\}/g,
  'onAddDesignation={handleAddDesignation}\n              onUpdateDesignation={handleUpdateDesignation}\n              onDeleteDesignation={handleDeleteDesignation}'
);
app = app.replace(
  /onAddFamily=\{handleAddFamily\}/,
  'onAddFamily={handleAddFamily}\n              onUpdateFamily={handleUpdateFamily}\n              onDeleteFamily={handleDeleteFamily}'
);
app = app.replace(
  /onAddTemplate=\{handleAddTemplate\}/,
  'onAddTemplate={handleAddTemplate}\n              onUpdateTemplate={handleUpdateTemplate}\n              onDeleteTemplate={handleDeleteTemplate}'
);

fs.writeFileSync('src/App.jsx', app);
console.log('App.jsx patched.');
