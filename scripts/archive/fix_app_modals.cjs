const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import MainLayout from './presentation/components/layout/MainLayout';",
  "import MainLayout from './presentation/components/layout/MainLayout';\nimport AppModals from './presentation/modals/AppModals';"
);

// Remove lazy modals from App.jsx
content = content.replace(/const AddArticleModal = lazy[^\n]*\n/g, '');
content = content.replace(/const AddMachineModal = lazy[^\n]*\n/g, '');
content = content.replace(/const AddUserModal = lazy[^\n]*\n/g, '');
content = content.replace(/const AddZoneModal = lazy[^\n]*\n/g, '');

const modalStart = "{/* Quick Add Modals with Suspense */}";
const modalEnd = "{/* 100% Offline Status Indicator */}";

const startIndex = content.indexOf(modalStart);
const endIndex = content.indexOf(modalEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `<AppModals 
        showAddArticleModal={showAddArticleModal} setShowAddArticleModal={setShowAddArticleModal}
        showAddMachineModal={showAddMachineModal} setShowAddMachineModal={setShowAddMachineModal}
        showAddUserModal={showAddUserModal} setShowAddUserModal={setShowAddUserModal} addUserModalType={addUserModalType} setAddUserModalType={setAddUserModalType}
        showAddZoneModal={showAddZoneModal} setShowAddZoneModal={setShowAddZoneModal}
        types={types} effectiveFamilies={effectiveFamilies} effectiveTemplates={effectiveTemplates} zones={zones} technicians={technicians} machines={machines} operations={operations}
        handleAddArticle={handleAddArticle} handleAddMachine={handleAddMachine} handleUpdateMachine={handleUpdateMachine} handleDeleteMachine={handleDeleteMachine}
        handleAddTechnician={handleAddTechnician} handleAddOperation={handleAddOperation} handleAddZone={handleAddZone}
        setCurrentTab={setCurrentTab}
        toast={toast} setToast={setToast}
      />\n\n      `;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("App.jsx modals extracted successfully.");
} else {
  console.log("Could not find modal markers.");
}
