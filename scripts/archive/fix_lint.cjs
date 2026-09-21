const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove unused imports in App.jsx
content = content.replace(/import ErrorBoundary from '\.\/presentation\/components\/common\/ErrorBoundary';\n/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Lint fixes applied.");
