const fs = require('fs');
const path = require('path');

const presentationDir = path.join(__dirname, 'src', 'presentation');

const pagesDir = path.join(presentationDir, 'pages');
const modalsDir = path.join(presentationDir, 'components', 'modals');
const layoutDir = path.join(presentationDir, 'components', 'layout');
const commonDir = path.join(presentationDir, 'components', 'common');

const allCommon = fs.readdirSync(commonDir).map(f => f.replace('.jsx', ''));
const allModals = fs.readdirSync(modalsDir).map(f => f.replace('.jsx', ''));
const allLayouts = fs.readdirSync(layoutDir).map(f => f.replace('.jsx', ''));
const allPages = fs.readdirSync(pagesDir).map(f => f.replace('.jsx', ''));

function fixImports(dir, relativePrefixToPresentation) {
  fs.readdirSync(dir).forEach(f => {
    if(!f.endsWith('.jsx')) return;
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix paths to utils, data, hooks (they were ../ before from components, now they are ../../ from pages/modals)
    // Wait, earlier they were in src/components/, so `../utils/`
    // Now from src/presentation/pages/, they need to be `../../utils/`
    content = content.replace(/from '\.\.\/utils/g, "from '" + relativePrefixToPresentation + "../utils");
    content = content.replace(/from '\.\.\/hooks/g, "from '" + relativePrefixToPresentation + "../hooks");
    content = content.replace(/from '\.\.\/data/g, "from '" + relativePrefixToPresentation + "../data");
    content = content.replace(/from '\.\.\/context/g, "from '" + relativePrefixToPresentation + "../context");
    
    // Fix imports to other components. Originally they were `from './X'` or `from '../X'`.
    // Let's replace any `from './ComponentName'` with the correct path.
    const replaceComponentImports = (match, compName) => {
      if (allCommon.includes(compName)) return `from '${relativePrefixToPresentation}components/common/${compName}'`;
      if (allModals.includes(compName)) return `from '${relativePrefixToPresentation}components/modals/${compName}'`;
      if (allLayouts.includes(compName)) return `from '${relativePrefixToPresentation}components/layout/${compName}'`;
      if (allPages.includes(compName)) return `from '${relativePrefixToPresentation}pages/${compName}'`;
      return match; // fallback
    };
    
    content = content.replace(/from '\.\/([a-zA-Z0-9_]+)'/g, replaceComponentImports);
    
    fs.writeFileSync(filePath, content, 'utf8');
  });
}

fixImports(pagesDir, '../');
fixImports(modalsDir, '../../');
fixImports(layoutDir, '../../');
fixImports(commonDir, '../common/'); // If inside common, they might reference each other. Actually from common to common is just './'

// Let's fix common Dir more carefully
fs.readdirSync(commonDir).forEach(f => {
    if(!f.endsWith('.jsx')) return;
    const filePath = path.join(commonDir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/from '\.\.\/utils/g, "from '../../utils");
    content = content.replace(/from '\.\.\/hooks/g, "from '../../hooks");
    content = content.replace(/from '\.\.\/data/g, "from '../../data");
    content = content.replace(/from '\.\.\/context/g, "from '../../context");
    // intra-common imports are fine with './'
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log("Inner imports fixed.");
