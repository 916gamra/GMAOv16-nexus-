const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import for AppRouter
content = content.replace(
  "import AppModals from './presentation/modals/AppModals';",
  "import AppModals from './presentation/modals/AppModals';\nimport AppRouter from './presentation/router/AppRouter';"
);

// Remove the lazy imports from App.jsx as they are now in AppRouter
const lazyImportsRegex = /\/\/ Lazy load views for instant app startup & fast tab transitions\n(const [a-zA-Z]+ = lazy\(\(\) => import\('[^']+'\)\);\n)+/g;
content = content.replace(lazyImportsRegex, '');

// Now we need to replace the Suspense block with AppRouter
const suspenseStart = "<Suspense fallback={<LoadingSkeleton currentTab={currentTab} />}>";
const suspenseEnd = "</Suspense>";

const startIndex = content.indexOf(suspenseStart);
const endIndex = content.lastIndexOf(suspenseEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `<AppRouter 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        props={{
          dashboard: {
            stockItems, machines, warehouseItems: warehouseItemsComputed, mouvements, types, diagnostics, zones, technicians, operations, stockKPIs,
            onNavigateToStock: () => React.startTransition(() => setCurrentTab('stock')),
            onNavigateToMachines: () => React.startTransition(() => setCurrentTab('machines')),
            onNavigateToWarehouse: () => React.startTransition(() => setCurrentTab('entrepot')),
            onNavigateToSortie: () => React.startTransition(() => setCurrentTab('sortie')),
            onNavigateToZones: () => React.startTransition(() => setCurrentTab('zones')),
            onNavigateToUsers: () => React.startTransition(() => setCurrentTab('utilisateurs')),
            onNavigateToSettings: () => React.startTransition(() => setCurrentTab('settings')),
            onQuickSortie: handleQuickSortie, onAddMouvement: handleAddMouvement, onUpdateMouvement: handleUpdateMouvement, onDeleteMouvement: handleDeleteMouvement, onExportExcel: handleExportExcel
          },
          stock: {
            stockItems, filteredStock, stockSearch, setStockSearch, stockTypeFilter, setStockTypeFilter, stockAlertOnly, setStockAlertOnly, types, zones, machines, technicians, operations,
            onOpenAddArticle: () => setShowAddArticleModal(true),
            onQuickSortie: handleQuickSortie, onAddMouvement: handleAddMouvement, onUpdateArticle: handleUpdateArticle, onDirectAdjustStock: handleDirectAdjustStock, stockKPIs, onNavigateToType: handleNavigateToStockFiltered
          },
          sortie: {
            stockItems, warehouseItems: warehouseItemsComputed, zones, technicians, operations, machines, onAddMouvement: handleAddMouvement, onDirectAdjustStock: handleDirectAdjustStock,
            onAddWarehouseItem: handleAddWarehouseItem, onUpdateWarehouseItem: handleUpdateWarehouseItem, onNavigateToWarehouse: () => React.startTransition(() => setCurrentTab('entrepot')), onNavigateToStockFilteredByRef: handleNavigateToStockFilteredByRef
          },
          entrepot: {
            warehouseItems: warehouseItemsComputed, compFamilies, compTemplates, partTypes, partDesignations, machines, whSearch, setWhSearch, whFamilyFilter, setWhFamilyFilter, whTemplateFilter, setWhTemplateFilter, whTypeFilter, setWhTypeFilter, whNatureFilter, setWhNatureFilter,
            onAddWarehouseItem: handleAddWarehouseItem, onUpdateWarehouseItem: handleUpdateWarehouseItem, onDeleteWarehouseItem: handleDeleteWarehouseItem,
            onNavigateToCompFamilies: handleNavigateToCompFamilies, onNavigateToCompTemplates: handleNavigateToCompTemplates, onNavigateToPartTypes: handleNavigateToPartTypes, onNavigateToPartDesignations: handleNavigateToPartDesignations, onNavigateToEntrepotByPart: handleNavigateToEntrepotByPart
          },
          types: {
            types, search: whSearch, setSearch: setWhSearch, onAddType: handleAddType, onUpdateType: handleUpdateType, onDeleteType: handleDeleteType, onNavigateToDesignations: handleNavigateToDesignationsFiltered
          },
          designations: {
            designations, types, search: whSearch, setSearch: setWhSearch, onAddDesignation: handleAddDesignation, onUpdateDesignation: handleUpdateDesignation, onDeleteDesignation: handleDeleteDesignation, onOpenAddTypeModal: () => React.startTransition(() => setCurrentTab('types')), onNavigateToDiag: handleNavigateToDiagFiltered
          },
          machines: {
            machines, effectiveFamilies, effectiveTemplates, zones, technicians, search: mchSearch, setSearch: setMchSearch, familyFilter: mchFamilyFilter, setFamilyFilter: setMchFamilyFilter, templateFilter: mchTemplateFilter, setTemplateFilter: setMchTemplateFilter, zoneFilter: mchZoneFilter, setZoneFilter: setMchZoneFilter,
            onAddMachine: handleAddMachine, onUpdateMachine: handleUpdateMachine, onDeleteMachine: handleDeleteMachine, onOpenAddMachine: () => setShowAddMachineModal(true)
          },
          compFamilies: {
            compFamilies, search: whSearch, setSearch: setWhSearch, onAddCompFamily: handleAddCompFamily, onUpdateCompFamily: handleUpdateCompFamily, onDeleteCompFamily: handleDeleteCompFamily, onNavigateToCompTemplates: handleNavigateToCompTemplates
          },
          compTemplates: {
            compTemplates, compFamilies, search: whSearch, setSearch: setWhSearch, familyFilter: compTemplateFamilyFilter, setFamilyFilter: setCompTemplateFamilyFilter, onAddCompTemplate: handleAddCompTemplate, onUpdateCompTemplate: handleUpdateCompTemplate, onDeleteCompTemplate: handleDeleteCompTemplate, onOpenAddFamilyModal: () => React.startTransition(() => setCurrentTab('families')), onNavigateToEntrepotByComp: handleNavigateToEntrepotByComp
          },
          partTypes: {
            partTypes, search: whSearch, setSearch: setWhSearch, onAddPartType: handleAddPartType, onUpdatePartType: handleUpdatePartType, onDeletePartType: handleDeletePartType, onNavigateToPartDesignations: handleNavigateToPartDesignations
          },
          partDesignations: {
            partDesignations, partTypes, search: whSearch, setSearch: setWhSearch, typeFilter: partDesignationTypeFilter, setTypeFilter: setPartDesignationTypeFilter, onAddPartDesignation: handleAddPartDesignation, onUpdatePartDesignation: handleUpdatePartDesignation, onDeletePartDesignation: handleDeletePartDesignation, onOpenAddTypeModal: () => React.startTransition(() => setCurrentTab('types')), onNavigateToEntrepotByType: handleNavigateToEntrepotByType
          },
          families: {
            families: effectiveFamilies, search: whSearch, setSearch: setWhSearch, onAddFamily: handleAddFamily, onUpdateFamily: handleUpdateFamily, onDeleteFamily: handleDeleteFamily, onNavigateToTemplates: handleNavigateToTemplatesFiltered, onNavigateToMachines: handleNavigateToMachinesByFamily
          },
          templates: {
            templates: effectiveTemplates, families: effectiveFamilies, search: whSearch, setSearch: setWhSearch, familyFilter: templateFamilyFilter, setFamilyFilter: setTemplateFamilyFilter, onAddTemplate: handleAddTemplate, onUpdateTemplate: handleUpdateTemplate, onDeleteTemplate: handleDeleteTemplate, onOpenAddFamilyModal: () => React.startTransition(() => setCurrentTab('families')), onNavigateToMachines: handleNavigateToMachinesByTemplate
          },
          zones: {
            zones, search: whSearch, setSearch: setWhSearch, onAddZone: handleAddZone, onUpdateZone: handleUpdateZone, onDeleteZone: handleDeleteZone, onNavigateToTechs: handleNavigateToTechsByZone, onNavigateToOps: handleNavigateToOpsByZone, onNavigateToMachines: handleNavigateToMachinesByZone, onOpenAddZoneModal: () => setShowAddZoneModal(true)
          },
          utilisateurs: {
            technicians, operations, zones, mouvements, techZoneFilter, setTechZoneFilter, opZoneFilter, setOpZoneFilter,
            onAddTechnician: handleAddTechnician, onUpdateTechnician: handleUpdateTechnician, onDeleteTechnician: handleDeleteTechnician,
            onAddOperation: handleAddOperation, onUpdateOperation: handleUpdateOperation, onDeleteOperation: handleDeleteOperation,
            onOpenAddArticle: () => setShowAddArticleModal(true), onOpenAddMachine: () => setShowAddMachineModal(true), onOpenAddZone: () => setShowAddZoneModal(true),
            onOpenAddTechModal: () => { setAddUserModalType('TECHNICIEN'); setShowAddUserModal(true); },
            onOpenAddRespModal: () => { setAddUserModalType('RESPONSABLE'); setShowAddUserModal(true); },
            onOpenAddOpModal: () => { setAddUserModalType('OPERATEUR'); setShowAddUserModal(true); }
          },
          settings: {
            rawStock, stockItems, machines, mouvements, types, designations, zones, technicians, operations,
            compFamilies, compTemplates, partTypes, partDesignations, families: effectiveFamilies, templates: effectiveTemplates, warehouseItems: warehouseItemsComputed,
            onNavigateToWarehouse: () => React.startTransition(() => setCurrentTab('entrepot'))
          }
        }}
      />`;
  
  // Note: we use endIndex + suspenseEnd.length to replace the whole block
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex + suspenseEnd.length);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("AppRouter integrated successfully.");
} else {
  console.log("Could not find Suspense block in App.jsx.");
}
