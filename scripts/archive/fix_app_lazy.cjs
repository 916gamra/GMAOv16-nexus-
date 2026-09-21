const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove React.lazy and Suspense since they are not used in App.jsx anymore
content = content.replace("lazy,", "");
content = content.replace("Suspense,", "");
content = content.replace("  Suspense,\n", "");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Lazy/Suspense imports removed.");
