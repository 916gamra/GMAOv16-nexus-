const fs = require('fs');
let content = fs.readFileSync('src/components/MachinesRegisteredView.jsx', 'utf8');

content = content.replace(
  "  // Cascading templates based on selected family",
  "  const [toEdit, setToEdit] = useState(null);\n  const [toDelete, setToDelete] = useState(null);\n\n  // Cascading templates based on selected family"
);

fs.writeFileSync('src/components/MachinesRegisteredView.jsx', content);
console.log('Fixed MachinesRegisteredView');
