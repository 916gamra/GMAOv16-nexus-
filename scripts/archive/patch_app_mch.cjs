const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(
  /<MachinesRegisteredView\s+machines=\{machines\}/,
  '<MachinesRegisteredView\n              machines={machines}\n              onUpdateMachine={handleUpdateMachine}\n              onDeleteMachine={handleDeleteMachine}'
);

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx mch patched');
