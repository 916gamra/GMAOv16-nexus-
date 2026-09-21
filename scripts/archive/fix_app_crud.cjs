const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(/  const handleDeleteMouvement = \(mvtId\) => \{\n    setMouvements\(\(prev\) => prev\.filter\(\(m\) => m\.id !== mvtId\)\);\n  \};\n\n  const handleUpdateMouvement = \(mvtId, updatedMvt\) => \{\n    setMouvements\(\(prev\) =>\n      prev\.map\(\(m\) => \(m\.id === mvtId \? \{ \.\.\.m, \.\.\.updatedMvt \} : m\)\)\n    \);\n  \};\n/, "");

fs.writeFileSync('src/App.jsx', code);
