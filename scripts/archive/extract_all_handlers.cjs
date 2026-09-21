const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = "  // ===== UPDATE & DELETE HANDLERS =====";
const endMarker = "  // ===== EXPORT / IMPORT =====";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  let handlersCode = content.substring(startIndex, endIndex);

  const hookContent = `
import { calculateStockStatus } from '../utils/formulaEngine';

export function useAppComplexHandlers(state) {
  const {
    zones, setZones,
    operations, setOperations,
    technicians, setTechnicians,
    machines, setMachines,
    mouvements, setMouvements,
    types, setTypes,
    rawStock, setRawStock,
    designations, setDesignations,
    families, setFamilies,
    templates, setTemplates,
    compFamilies, setCompFamilies,
    compTemplates, setCompTemplates,
    partTypes, setPartTypes,
    partDesignations, setPartDesignations,
    warehouseItems, setWarehouseItems,
    stockItems
  } = state;

${handlersCode}

  return {
    handleUpdateZone, handleDeleteZone,
    handleUpdateOperation, handleDeleteOperation,
    handleUpdateMachine, handleDeleteMachine,
    handleUpdateType, handleDeleteType,
    handleUpdateDesignation, handleDeleteDesignation,
    handleUpdateDiagnostic, handleDeleteDiagnostic,
    handleUpdateFamily, handleDeleteFamily,
    handleUpdateCompFamily, handleDeleteCompFamily,
    handleUpdateCompTemplate, handleDeleteCompTemplate,
    handleUpdatePartType, handleDeletePartType,
    handleUpdatePartDesignation, handleDeletePartDesignation,
    handleUpdateTemplate, handleDeleteTemplate,
    handleAddTechnician, handleUpdateTechnician, handleDeleteTechnician,
    handleAddOperation, handleAddMachine, handleAddArticle, handleAddMouvement,
    handleUpdateArticle, handleDeleteArticle,
    handleUpdateMouvement, handleDeleteMouvement,
    handleAddWarehouseItem, handleUpdateWarehouseItem, handleDeleteWarehouseItem,
    handleDirectAdjustStock, handleQuickSortie
  };
}
`;
  
  fs.writeFileSync(path.join(__dirname, 'src', 'hooks', 'useAppComplexHandlers.js'), hookContent, 'utf8');
  
  // Replace the extracted block with the hook call in App.jsx
  const replacement = `
  const {
    handleUpdateZone, handleDeleteZone,
    handleUpdateOperation, handleDeleteOperation,
    handleUpdateMachine, handleDeleteMachine,
    handleUpdateType, handleDeleteType,
    handleUpdateDesignation, handleDeleteDesignation,
    handleUpdateDiagnostic, handleDeleteDiagnostic,
    handleUpdateFamily, handleDeleteFamily,
    handleUpdateCompFamily, handleDeleteCompFamily,
    handleUpdateCompTemplate, handleDeleteCompTemplate,
    handleUpdatePartType, handleDeletePartType,
    handleUpdatePartDesignation, handleDeletePartDesignation,
    handleUpdateTemplate, handleDeleteTemplate,
    handleAddTechnician, handleUpdateTechnician, handleDeleteTechnician,
    handleAddOperation, handleAddMachine, handleAddArticle, handleAddMouvement,
    handleUpdateArticle, handleDeleteArticle,
    handleUpdateMouvement, handleDeleteMouvement,
    handleAddWarehouseItem, handleUpdateWarehouseItem, handleDeleteWarehouseItem,
    handleDirectAdjustStock, handleQuickSortie
  } = useAppComplexHandlers(stateProps);

`;

  // Prepend import statement at the top of App.jsx
  content = content.replace(
    "import { useAppHandlers } from './hooks/useAppHandlers';",
    "import { useAppHandlers } from './hooks/useAppHandlers';\nimport { useAppComplexHandlers } from './hooks/useAppComplexHandlers';"
  );
  
  // Insert stateProps object before the hook call
  const statePropsDef = `
  const stateProps = {
    zones, setZones, operations, setOperations, technicians, setTechnicians, machines, setMachines, mouvements, setMouvements,
    types, setTypes, rawStock, setRawStock, designations, setDesignations, families, setFamilies, templates, setTemplates,
    compFamilies, setCompFamilies, compTemplates, setCompTemplates, partTypes, setPartTypes, partDesignations, setPartDesignations,
    warehouseItems, setWarehouseItems, stockItems
  };
  `;

  content = content.substring(0, startIndex) + statePropsDef + replacement + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Extracted complex handlers successfully.");
} else {
  console.log("Could not find start/end markers.");
}
