/**
 * Web Worker for heavy stock & formula calculations.
 * Offloads compute-heavy array aggregations, SUMIFS, and metric calculations
 * from the main UI thread.
 */

// Helper to safely parse numeric values
function safeNum(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

// Calculate stock status according to Excel Twin rules
function calculateStatus(stockInitial, entrees, sorties, seuil, isAchatUnique = false) {
  const init = safeNum(stockInitial, 0);
  const ent = safeNum(entrees, 0);
  const sor = safeNum(sorties, 0);
  const s = Math.max(0, safeNum(seuil, 0));

  const stockActuel = init + ent - sor;
  const displayStock = Math.max(0, stockActuel);

  let alerte = 'OK';
  if (isAchatUnique) {
    alerte = 'NON_STOCKABLE';
  } else if (stockActuel <= 0) {
    alerte = 'RUPTURE';
  } else if (stockActuel <= s) {
    alerte = 'ALERTE';
  }

  return {
    stockActuel: displayStock,
    stockActuelRaw: stockActuel,
    alerte,
  };
}

// Handler for Web Worker messages
self.onmessage = function (e) {
  const { id, type, payload } = e.data || {};

  try {
    switch (type) {
      case 'RECALCULATE_STOCK_ITEMS': {
        const { rawStock = [], mouvements = [] } = payload;

        // Group movement inflows and outflows by normalized ref
        const inflowMap = new Map();
        const outflowMap = new Map();

        for (const m of mouvements) {
          if (!m || !m.ref) continue;
          const refKey = String(m.ref).toLowerCase().trim();
          const qty = safeNum(m.quantite || m.quantity);
          const mType = String(m.type || '').toLowerCase();

          if (mType.includes('entrée') || mType.includes('entree') || mType.includes('reappro')) {
            inflowMap.set(refKey, (inflowMap.get(refKey) || 0) + qty);
          } else if (mType.includes('sortie') || mType.includes('consommation')) {
            outflowMap.set(refKey, (outflowMap.get(refKey) || 0) + qty);
          }
        }

        // Recalculate each stock item
        const recalculated = rawStock.map((item) => {
          if (!item) return item;
          const refKey = String(item.ref || item.Ref || '').toLowerCase().trim();
          const entrees = inflowMap.get(refKey) || 0;
          const sorties = outflowMap.get(refKey) || 0;
          const stockInitial = safeNum(item.stockInitial ?? item['Stock Initial'], 0);
          const seuil = safeNum(item.seuil ?? item.Seuil ?? item.seuilAlerte, 0);
          const isAchatUnique = Boolean(item.isAchatUnique || item.is_achat_unique);

          const { stockActuel, stockActuelRaw, alerte } = calculateStatus(
            stockInitial,
            entrees,
            sorties,
            seuil,
            isAchatUnique
          );

          return {
            ...item,
            entrees,
            sorties,
            stockActuel,
            stockActuelRaw,
            alerte,
          };
        });

        self.postMessage({ id, success: true, result: recalculated });
        break;
      }

      case 'CALCULATE_METRICS': {
        const { stockItems = [] } = payload;
        let totalArticles = stockItems.length;
        let countOk = 0;
        let countAlerte = 0;
        let countRupture = 0;
        let totalQuantity = 0;

        for (const item of stockItems) {
          if (!item) continue;
          const status = item.alerte || 'OK';
          if (status === 'RUPTURE') countRupture++;
          else if (status === 'ALERTE') countAlerte++;
          else countOk++;

          totalQuantity += safeNum(item.stockActuel, 0);
        }

        self.postMessage({
          id,
          success: true,
          result: {
            totalArticles,
            countOk,
            countAlerte,
            countRupture,
            totalQuantity,
          },
        });
        break;
      }

      default:
        self.postMessage({ id, success: false, error: `Unknown worker action: ${type}` });
    }
  } catch (err) {
    self.postMessage({ id, success: false, error: err.message || String(err) });
  }
};
