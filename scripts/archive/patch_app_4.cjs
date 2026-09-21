const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const importGmaoStateStr = "import { useGmaoState } from './hooks/useGmaoState';\nimport { useGenericCRUD } from './hooks/useGenericCRUD';\n";
code = code.replace(/import initialData from '\.\/initialData\.json';/, importGmaoStateStr + "import initialData from './initialData.json';");

const stateDefRegex = /\s*\/\/ Core Data States[\s\S]*?(?=\/\/ Filtered Stock Items)/;
const newStateStr = `
  // Core Data States
  const {
    types, setTypes,
    designations, setDesignations,
    families, setFamilies,
    templates, setTemplates,
    machines, setMachines,
    zones, setZones,
    technicians, setTechnicians,
    operations, setOperations,
    mouvements, setMouvements,
    rawStock, setRawStock
  } = useGmaoState();

  const diagnostics = designations;

`;

code = code.replace(stateDefRegex, newStateStr);

fs.writeFileSync('src/App.jsx', code);
