const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const stockItemsLogic = `
  // Compute Full Stock with Dynamic Live Calculations (Formula F, G, H, J)
  const stockItems = useMemo(() => {
    // Map entries and sorties by ref
    const mvtSummary = {};
    mouvements.forEach((m) => {
      const r = String(m.ref || m['Référence'] || '').trim().toLowerCase();
      if (!r) return;
      if (!mvtSummary[r]) {
        mvtSummary[r] = { entrees: 0, sorties: 0 };
      }
      const q = safeNum(m.quantite != null ? m.quantite : m['Quantité'], 0);
      const t = String(m.type || m['Type (Entrée/Sortie)'] || '').toLowerCase();
      if (t.includes('entr')) {
        mvtSummary[r].entrees += q;
      } else if (t.includes('sort')) {
        mvtSummary[r].sorties += q;
      }
    });

    return rawStock.map((item) => {
      const itemRefKey = item.ref.toLowerCase();
      let entrees = mvtSummary[itemRefKey]?.entrees || 0;
      let sorties = mvtSummary[itemRefKey]?.sorties || 0;

      const stockInitial = safeNum(item.stockInitial, 0);
      const seuil = safeNum(item.seuil, 0);
      const { stockActuel, alerte } = calculateStockStatus(stockInitial, entrees, sorties, seuil);

      return {
        ...item,
        entrees,
        sorties,
        stockActuel,
        alerte
      };
    });
  }, [rawStock, mouvements]);

  // Filtered Stock Items`;

code = code.replace(/  \/\/ Filtered Stock Items/, stockItemsLogic);
fs.writeFileSync('src/App.jsx', code);
