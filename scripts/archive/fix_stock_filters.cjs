const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'presentation', 'pages', 'StockView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// We need to import useDeferredValue if it's not imported
if (!content.includes('useDeferredValue')) {
  content = content.replace(/useMemo, useEffect \}/, "useMemo, useEffect, useDeferredValue }");
}

// Remove filteredStock from props
content = content.replace(/filteredStock = \[\],\s*/g, '');

// Insert computation inside StockView
const computation = `
  const deferredStockSearch = useDeferredValue(stockSearch);
  const filteredStock = useMemo(() => {
    return stockItems.filter((item) => {
      if (
        stockTypeFilter !== 'ALL' &&
        item.id_type !== stockTypeFilter &&
        item.type !== stockTypeFilter
      )
        return false;
      if (stockAlertOnly && item.alerte === 'OK') return false;

      if (deferredStockSearch) {
        const s = deferredStockSearch.toLowerCase();
        return (
          (item.ref && item.ref.toLowerCase().includes(s)) ||
          (item.designation && item.designation.toLowerCase().includes(s)) ||
          (item.emplacement && item.emplacement.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [stockItems, stockTypeFilter, stockAlertOnly, deferredStockSearch]);
`;

content = content.replace(
  /const \{ stockItems, loading, updateArticle: onUpdateArticle, directAdjustStock: onDirectAdjustStock \} = useSpareParts\(\);/,
  `const { stockItems, loading, updateArticle: onUpdateArticle, directAdjustStock: onDirectAdjustStock } = useSpareParts();
  ${computation}
  `
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("StockView filters fixed.");
