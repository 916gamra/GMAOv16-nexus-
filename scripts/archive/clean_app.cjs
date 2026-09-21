const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const filterRegex = /const filteredStock = useMemo\(\(\) => \{[\s\S]*?\}, \[stockItems, stockTypeFilter, stockAlertOnly, deferredStockSearch\]\);/;
content = content.replace(filterRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("App.jsx cleaned.");
