const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const handleDirectAdjustStock = \(article, newTargetStock\) => \{[\s\S]*?\}\s*\);\s*\};/;

const newMethod = `const handleDirectAdjustStock = async (article, newTargetStock) => {
    const entrees = Number(article.entrees || 0);
    const sorties = Number(article.sorties || 0);
    const newStockInitial = Math.max(0, Number(newTargetStock) - entrees + sorties);

    const updatedItem = { ...article, stockInitial: newStockInitial };
    
    setRawStock((prev) =>
      prev.map((item) =>
        item.id === article.id || item.ref === article.ref
          ? { ...item, stockInitial: newStockInitial }
          : item
      )
    );

    try {
      const service = new SparePartApplicationService();
      await service.updateSparePart(article.id, updatedItem);
    } catch(err) {
      console.error('Failed to sync direct adjust to DB:', err);
    }
  };`;

content = content.replace(regex, newMethod);
fs.writeFileSync(filePath, content, 'utf8');
console.log("handleDirectAdjustStock fixed.");
