const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Import useDeferredValue
if (!code.includes('useDeferredValue')) {
  code = code.replace(
    /import React, \{ useState, useMemo, useRef, useEffect, lazy, Suspense \} from 'react';/,
    "import React, { useState, useMemo, useRef, useEffect, lazy, Suspense, useDeferredValue } from 'react';"
  );
}

// Add unified state read
const searchStr = `  // Core Data States`;
const replaceStr = `  // Core Data States
  const [groupedState] = useState(() => storageService.getItem('gmao_full_state_v1') || {});`;
code = code.replace(searchStr, replaceStr);

// Replace all individual storageService.getItem in useState initializers
code = code.replace(/storageService\.getItem\('gmao_types_v4'\)/g, "(groupedState.types || storageService.getItem('gmao_types_v4'))");
code = code.replace(/storageService\.getItem\('gmao_families'\)/g, "(groupedState.families || storageService.getItem('gmao_families'))");
code = code.replace(/storageService\.getItem\('gmao_templates'\)/g, "(groupedState.templates || storageService.getItem('gmao_templates'))");
code = code.replace(/storageService\.getItem\('gmao_machines'\)/g, "(groupedState.machines || storageService.getItem('gmao_machines'))");
code = code.replace(/storageService\.getItem\('gmao_zones'\)/g, "(groupedState.zones || storageService.getItem('gmao_zones'))");
code = code.replace(/storageService\.getItem\('gmao_technicians'\)/g, "(groupedState.technicians || storageService.getItem('gmao_technicians'))");
code = code.replace(/storageService\.getItem\('gmao_operations'\)/g, "(groupedState.operations || storageService.getItem('gmao_operations'))");
code = code.replace(/storageService\.getItem\('gmao_mouvements'\)/g, "(groupedState.mouvements || storageService.getItem('gmao_mouvements'))");
code = code.replace(/storageService\.getItem\('gmao_raw_stock_v6'\)/g, "(groupedState.rawStock || storageService.getItem('gmao_raw_stock_v6'))");
code = code.replace(/storageService\.getItem\('gmao_designations_v2'\)/g, "(groupedState.designations || storageService.getItem('gmao_designations_v2'))");

// Replace unified save
const oldSaveStr = `  // Save to LocalStorage and IndexedDB (Debounced to avoid I/O bottlenecks during fast updates)
  useEffect(() => {
    const timer = setTimeout(() => {
      storageService.setItem('gmao_types_v4', types);
      storageService.setItem('gmao_designations_v2', designations);
      storageService.setItem('gmao_families', families);
      storageService.setItem('gmao_templates', templates);
      storageService.setItem('gmao_machines', machines);
      storageService.setItem('gmao_zones', zones);
      storageService.setItem('gmao_technicians', technicians);
      storageService.setItem('gmao_operations', operations);
      storageService.setItem('gmao_mouvements', mouvements);
      storageService.setItem('gmao_raw_stock_v6', rawStock);

      // High capacity IndexedDB backup
      indexedDBService.setItem('gmao_mouvements', mouvements);
      indexedDBService.setItem('gmao_raw_stock_v6', rawStock);
    }, 250);
    return () => clearTimeout(timer);
  }, [types, designations, families, templates, machines, zones, technicians, operations, mouvements, rawStock]);`;

const newSaveStr = `  // Save to LocalStorage and IndexedDB (Debounced to avoid I/O bottlenecks during fast updates)
  useEffect(() => {
    const timer = setTimeout(() => {
      const fullState = {
        types, designations, families, templates, machines, zones, technicians, operations, mouvements, rawStock
      };
      // Grouped state save (Task 10)
      storageService.setItem('gmao_full_state_v1', fullState);

      // High capacity IndexedDB backup
      indexedDBService.setItem('gmao_full_state_v1', fullState);
      
      // Keep individual DB backups for compatibility with export/import tools if they rely on it
      indexedDBService.setItem('gmao_mouvements', mouvements);
      indexedDBService.setItem('gmao_raw_stock_v6', rawStock);
    }, 250);
    return () => clearTimeout(timer);
  }, [types, designations, families, templates, machines, zones, technicians, operations, mouvements, rawStock]);`;

code = code.replace(oldSaveStr, newSaveStr);

// Add useDeferredValue for searches
code = code.replace(/const \[stockSearch, setStockSearch\] = useState\(''\);/, 
  "const [stockSearch, setStockSearch] = useState('');\n  const deferredStockSearch = useDeferredValue(stockSearch);");

code = code.replace(/const \[mchSearch, setMchSearch\] = useState\(''\);/,
  "const [mchSearch, setMchSearch] = useState('');\n  const deferredMchSearch = useDeferredValue(mchSearch);");

// Use deferred values in filtering
code = code.replace(/if \(stockSearch\) \{/, "if (deferredStockSearch) {");
code = code.replace(/const q = stockSearch\.toLowerCase\(\);/, "const q = deferredStockSearch.toLowerCase();");
code = code.replace(/\[stockItems, stockTypeFilter, stockAlertOnly, stockSearch\]/, "[stockItems, stockTypeFilter, stockAlertOnly, deferredStockSearch]");

code = code.replace(/if \(mchSearch\) \{/, "if (deferredMchSearch) {");
code = code.replace(/const q = mchSearch\.toLowerCase\(\);/, "const q = deferredMchSearch.toLowerCase();");
code = code.replace(/\[machines, mchFamilyFilter, mchTemplateFilter, mchZoneFilter, mchSearch\]/, "[machines, mchFamilyFilter, mchTemplateFilter, mchZoneFilter, deferredMchSearch]");

fs.writeFileSync('src/App.jsx', code);
