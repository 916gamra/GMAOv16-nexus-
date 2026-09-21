const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Add import sanitizeObject
if (!code.includes('sanitizeObject')) {
  code = code.replace(/import \{ storageService \} from '\.\/utils\/storageService';/, 
  "import { storageService } from './utils/storageService';\nimport { sanitizeObject } from './utils/sanitize';");
}

// Patch B1: Cascading update matching
code = code.replace(
`      if (oldZone && oldZone.id_zone !== updatedZone.id_zone) {
        setTechnicians(prev => prev.map(t => t.id_zone === id ? { ...t, id_zone: updatedZone.id_zone } : t));
        setOperations(prev => prev.map(o => o.id_zone === id ? { ...o, id_zone: updatedZone.id_zone } : o));
        setMachines(prev => prev.map(m => m.id_zone_default === id ? { ...m, id_zone_default: updatedZone.id_zone } : m));
      }`,
`      if (oldZone && oldZone.id_zone !== updatedZone.id_zone) {
        setTechnicians(prev => prev.map(t => t.id_zone === oldZone.id_zone ? { ...t, id_zone: updatedZone.id_zone } : t));
        setOperations(prev => prev.map(o => o.id_zone === oldZone.id_zone ? { ...o, id_zone: updatedZone.id_zone } : o));
        setMachines(prev => prev.map(m => m.id_zone_default === oldZone.id_zone ? { ...m, id_zone_default: updatedZone.id_zone } : m));
      }`
);

// Patch B2: Search contamination between ref and designation
code = code.replace(
`      const itemRefKey = String(item.ref).trim().toLowerCase();
      const itemDesigKey = String(item.designation).trim().toLowerCase();
      let entrees = (mvtSummary[itemRefKey]?.entrees || 0) + (mvtSummary[itemDesigKey]?.entrees || 0);
      let sorties = (mvtSummary[itemRefKey]?.sorties || 0) + (mvtSummary[itemDesigKey]?.sorties || 0);`,
`      const itemRefKey = String(item.ref).trim().toLowerCase();
      let entrees = (mvtSummary[itemRefKey]?.entrees || 0);
      let sorties = (mvtSummary[itemRefKey]?.sorties || 0);`
);

// Patch B4: Default date '2026-07-16' -> new Date().toISOString().split('T')[0]
code = code.replace(
`date: m.date || (m.Date ? String(m.Date).split('T')[0] : '2026-07-16')`,
`date: m.date || (m.Date ? String(m.Date).split('T')[0] : new Date().toISOString().split('T')[0])`
);

// Patch B5: handleAddArticle no duplicate ref check
const addArticleFunc = `  const handleAddArticle = (newArt) => {`;
const newAddArticleFunc = `  const handleAddArticle = (newArt) => {
    if (rawStock.some(s => String(s.ref).toLowerCase() === String(newArt.ref).toLowerCase())) {
      showToast('Erreur: La référence existe déjà.', 'error');
      return;
    }`;
code = code.replace(addArticleFunc, newAddArticleFunc);

// Patch A3: Sanitization in handleImportFile
code = code.replace(
`          if (json.Stock_Actuel) setRawStock(json.Stock_Actuel);
          if (json.Mouvement) setMouvements(json.Mouvement);
          if (json.Machines_Registered) setMachines(json.Machines_Registered);
          if (json.Families) setFamilies(json.Families);
          if (json.Templates) setTemplates(json.Templates);
          if (json.Zones) setZones(json.Zones);
          if (json.Technicians) setTechnicians(json.Technicians);
          if (json.Operations) setOperations(json.Operations);`,
`          if (json.Stock_Actuel) setRawStock(sanitizeObject(json.Stock_Actuel));
          if (json.Mouvement) setMouvements(sanitizeObject(json.Mouvement));
          if (json.Machines_Registered) setMachines(sanitizeObject(json.Machines_Registered));
          if (json.Families) setFamilies(sanitizeObject(json.Families));
          if (json.Templates) setTemplates(sanitizeObject(json.Templates));
          if (json.Zones) setZones(sanitizeObject(json.Zones));
          if (json.Technicians) setTechnicians(sanitizeObject(json.Technicians));
          if (json.Operations) setOperations(sanitizeObject(json.Operations));`
);
code = code.replace(
`            if (parsedStock.length > 0) setRawStock(parsedStock);`,
`            if (parsedStock.length > 0) setRawStock(sanitizeObject(parsedStock));`
);
code = code.replace(
`            if (parsedMch.length > 0) setMachines(parsedMch);`,
`            if (parsedMch.length > 0) setMachines(sanitizeObject(parsedMch));`
);
code = code.replace(
`            if (parsedFam.length > 0) setFamilies(parsedFam);`,
`            if (parsedFam.length > 0) setFamilies(sanitizeObject(parsedFam));`
);
code = code.replace(
`            if (parsedTem.length > 0) setTemplates(parsedTem);`,
`            if (parsedTem.length > 0) setTemplates(sanitizeObject(parsedTem));`
);
code = code.replace(
`            if (parsedZon.length > 0) setZones(parsedZon);`,
`            if (parsedZon.length > 0) setZones(sanitizeObject(parsedZon));`
);
code = code.replace(
`            if (parsedTech.length > 0) setTechnicians(parsedTech);`,
`            if (parsedTech.length > 0) setTechnicians(sanitizeObject(parsedTech));`
);
code = code.replace(
`            if (parsedOp.length > 0) setOperations(parsedOp);`,
`            if (parsedOp.length > 0) setOperations(sanitizeObject(parsedOp));`
);
code = code.replace(
`            if (parsedMvt.length > 0) setMouvements(parsedMvt);`,
`            if (parsedMvt.length > 0) setMouvements(sanitizeObject(parsedMvt));`
);

// Patch C1: Replace Date.now() with crypto.randomUUID()
code = code.replace(/id: Date\.now\(\)/g, 'id: crypto.randomUUID()');

fs.writeFileSync('src/App.jsx', code);
