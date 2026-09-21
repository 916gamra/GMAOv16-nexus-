const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add imports to App.jsx
const importsToAdd = `
import { SparePartApplicationService } from './application/services/SparePartApplicationService.js';
import { MachineApplicationService } from './application/services/MachineApplicationService.js';
import { TaskApplicationService } from './application/services/TaskApplicationService.js';
`;
content = content.replace(/import { sanitizeObject } from '\.\/utils\/sanitize';/, importsToAdd + "\nimport { sanitizeObject } from './utils/sanitize';");

// Replace handleAddMachine
content = content.replace(
  /const handleAddMachine = \(newMch\) => \{\s+setMachines\(\(prev\) => \[\.\.\.prev, newMch\]\);\s+\};/g,
  `const handleAddMachine = async (newMch) => {
    const service = new MachineApplicationService();
    const saved = await service.createMachine(newMch);
    setMachines((prev) => [...prev, saved]);
  };`
);

// Replace handleUpdateMachine
content = content.replace(
  /const handleUpdateMachine = \(id, updatedMch\) => \{\s+setMachines\(\(prev\) =>\s+prev\.map\(\(m\) => \(m\.id_machine_registered === id \|\| m\.id === id \? updatedMch : m\)\)\s+\);\s+\};/g,
  `const handleUpdateMachine = async (id, updatedMch) => {
    const service = new MachineApplicationService();
    const saved = await service.updateMachine(id, updatedMch);
    setMachines((prev) => prev.map((m) => (m.id_machine_registered === id || m.id === id ? saved : m)));
  };`
);

// Replace handleDeleteMachine
content = content.replace(
  /const handleDeleteMachine = \(id\) =>\s+setMachines\(\(prev\) => prev\.filter\(\(m\) => m\.id_machine_registered !== id && m\.id !== id\)\);/g,
  `const handleDeleteMachine = async (id) => {
    const service = new MachineApplicationService();
    await service.deleteMachine(id);
    setMachines((prev) => prev.filter((m) => m.id_machine_registered !== id && m.id !== id));
  };`
);

// Replace handleAddArticle
content = content.replace(
  /const handleAddArticle = \(newArt\) => \{[\s\S]*?\.\.\.prev,\s+\]\);\s+\};/g,
  `const handleAddArticle = async (newArt) => {
    if (rawStock.some((s) => String(s.ref).toLowerCase() === String(newArt.ref).toLowerCase())) {
      showToast('Erreur: La référence existe déjà.', 'error');
      return;
    }
    const service = new SparePartApplicationService();
    const saved = await service.createSparePart({
      id: crypto.randomUUID(),
      ...newArt,
    });
    setRawStock((prev) => [saved, ...prev]);
  };`
);

// Replace handleDeleteArticle
// Actually it uses useGenericCRUD for Article and Mouvement. Let's rewrite them manually.
const oldCrudArticle = `const { handleUpdate: handleUpdateArticle, handleDelete: handleDeleteArticle } = useGenericCRUD(
    setRawStock,
    'id'
  );`;

const newCrudArticle = `
  const handleUpdateArticle = async (id, updatedArt) => {
    const service = new SparePartApplicationService();
    const saved = await service.updateSparePart(id, updatedArt);
    setRawStock(prev => prev.map(a => a.id === id ? saved : a));
  };
  const handleDeleteArticle = async (id) => {
    const service = new SparePartApplicationService();
    await service.deleteSparePart(id);
    setRawStock(prev => prev.filter(a => a.id !== id));
  };
`;
content = content.replace(oldCrudArticle, newCrudArticle);

const oldCrudMvt = `const { handleUpdate: handleUpdateMouvement, handleDelete: handleDeleteMouvement } =
    useGenericCRUD(setMouvements, 'id');`;
    
const newCrudMvt = `
  const handleUpdateMouvement = async (id, updatedMvt) => {
    const service = new TaskApplicationService();
    const saved = await service.updateTask(id, updatedMvt);
    setMouvements(prev => prev.map(m => m.id === id ? saved : m));
  };
  const handleDeleteMouvement = async (id) => {
    const service = new TaskApplicationService();
    await service.deleteTask(id);
    setMouvements(prev => prev.filter(m => m.id !== id));
  };
`;
content = content.replace(oldCrudMvt, newCrudMvt);

// Replace handleAddMouvement
content = content.replace(
  /const handleAddMouvement = \(newMvtOrArray\) => \{[\s\S]*?\}\s+\};/g,
  `const handleAddMouvement = async (newMvtOrArray) => {
    const service = new TaskApplicationService();
    if (Array.isArray(newMvtOrArray)) {
      const saved = await Promise.all(newMvtOrArray.map(m => service.createTask(m)));
      setMouvements((prev) => [...saved, ...prev]);
    } else {
      const saved = await service.createTask(newMvtOrArray);
      setMouvements((prev) => [saved, ...prev]);
    }
  };`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("App.jsx mutations replaced with Service calls.");
