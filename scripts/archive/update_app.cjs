const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add handleUpdateTechnician and handleDeleteTechnician
const techHandlers = `  const handleAddTechnician = (newTech) => {
    setTechnicians((prev) => [...prev, newTech]);
  };

  const handleUpdateTechnician = (id, updatedTech) => {
    setTechnicians((prev) => prev.map((t) => t.id_technician === id ? updatedTech : t));
    
    // Cascade update to Machines (technician field) if name changed
    const oldTech = technicians.find(t => t.id_technician === id);
    if (oldTech && oldTech.nom !== updatedTech.nom) {
      setMachines((prev) => prev.map(m => m.technician === oldTech.nom ? { ...m, technician: updatedTech.nom } : m));
      // Cascade update to Mouvements if it stores the name
      setMouvements((prev) => prev.map(m => m.technicien === oldTech.nom ? { ...m, technicien: updatedTech.nom } : m));
    }
  };

  const handleDeleteTechnician = (id) => {
    setTechnicians((prev) => prev.filter((t) => t.id_technician !== id));
  };`;

content = content.replace(
  /  const handleAddTechnician = \(newTech\) => \{\s*setTechnicians\(\(prev\) => \[\.\.\.prev, newTech\]\);\s*\};/,
  techHandlers
);

// 2. Pass them to TechniciansView
const techsView = `            <TechniciansView
              technicians={technicians}
              zones={zones}
              mouvements={mouvements}
              techZoneFilter={techZoneFilter}
              setTechZoneFilter={setTechZoneFilter}
              onAddTechnician={handleAddTechnician}
              onUpdateTechnician={handleUpdateTechnician}
              onDeleteTechnician={handleDeleteTechnician}
              onOpenAddZoneModal={() => setCurrentTab('zones')}
              onNavigateToZoneFiltered={handleNavigateToTechsByZone}
            />`;

content = content.replace(
  /<TechniciansView[\s\S]*?onNavigateToZoneFiltered=\{handleNavigateToTechsByZone\}\s*\/>/,
  techsView
);

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx updated');
