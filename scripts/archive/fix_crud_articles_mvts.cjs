const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const missingHandlers = `
  const { handleUpdate: handleUpdateArticle, handleDelete: handleDeleteArticle } = useGenericCRUD(setRawStock, 'id');
  const { handleUpdate: handleUpdateMouvement, handleDelete: handleDeleteMouvement } = useGenericCRUD(setMouvements, 'id');
`;

code = code.replace(/const handleAddMouvement = .*?\n  };\n/s, (match) => {
  return match + '\n' + missingHandlers;
});

fs.writeFileSync('src/App.jsx', code);
