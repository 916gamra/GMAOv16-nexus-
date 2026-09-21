const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(/types=\{stockTypesList\}/g, "types={types}");
fs.writeFileSync('src/App.jsx', code);
