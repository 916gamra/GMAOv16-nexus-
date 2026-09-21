const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'presentation', 'pages', 'StockView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Import useSpareParts
content = content.replace(
  /import \{[\s\n]*Search,/,
  "import { useSpareParts } from '../hooks/useSpareParts';\nimport {\n  Search,"
);

// Remove stockItems, onUpdateArticle, onDirectAdjustStock from props
content = content.replace(
  /export default function StockView\(\{[\s\S]*?filteredStock = \[\],/,
  `export default function StockView({
  filteredStock = [],`
);

content = content.replace(
  /onUpdateArticle = \(\) => \{\},[\s\n]*onDirectAdjustStock = \(\) => \{\},/,
  ""
);

content = content.replace(
  /export default function StockView\(\{([\s\S]*?)\}\) \{/,
  `export default function StockView({$1}) {
  const { stockItems, loading, updateArticle: onUpdateArticle, directAdjustStock: onDirectAdjustStock } = useSpareParts();`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("StockView updated to use custom hook.");
