const fs = require('fs');
const path = require('path');

const fixHook = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the inline instantiations with useMemo so they don't change every render
  if (content.includes("const machineService = Container.resolve")) {
    if (!content.includes('useMemo')) {
      content = content.replace(/import \{ (.*?) \} from 'react';/, "import { $1, useMemo } from 'react';");
    }
    content = content.replace(
      /const machineService = Container\.resolve\('machineService'\)[\s\S]*?\: null;/,
      `const machineService = useMemo(() => Container.resolve('machineService') ? new MachineApplicationService() : null, []);`
    );
  }
  
  if (content.includes("const sparePartService = Container.resolve")) {
    if (!content.includes('useMemo')) {
      content = content.replace(/import \{ (.*?) \} from 'react';/, "import { $1, useMemo } from 'react';");
    }
    content = content.replace(
      /const sparePartService = Container\.resolve\('sparePartService'\)[\s\S]*?\: null;/,
      `const sparePartService = useMemo(() => Container.resolve('sparePartService') ? new SparePartApplicationService() : null, []);`
    );
    
    content = content.replace(
      /const taskService = Container\.resolve\('taskService'\)[\s\S]*?\: null;/,
      `const taskService = useMemo(() => Container.resolve('taskService') ? new TaskApplicationService() : null, []);`
    );
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
};

fixHook(path.join(__dirname, 'src', 'presentation', 'hooks', 'useMachines.js'));
fixHook(path.join(__dirname, 'src', 'presentation', 'hooks', 'useSpareParts.js'));

console.log("Hooks fixed.");
