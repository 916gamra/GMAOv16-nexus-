import initialData from '../initialData.json';

// Build a fast lookup dictionary from initial baseline stock data to ensure original quantities and type-based references are never lost
export const INITIAL_STOCK_LOOKUP = new Map();
export const BASELINE_TYPE_COUNTERS = {};
export const BASELINE_USED_REFS = new Set();

export const BASELINE_STOCK_ITEMS = (initialData.Stock_Actuel || []).map((item, idx) => {
  const typeName = String(item['Désignation'] || item.type || 'Divers').trim();
  const lowerType = typeName.toLowerCase();
  BASELINE_TYPE_COUNTERS[lowerType] = (BASELINE_TYPE_COUNTERS[lowerType] || 0) + 1;
  const count = BASELINE_TYPE_COUNTERS[lowerType];
  const pad2 = count < 10 ? `0${count}` : `${count}`;
  let ref = `${typeName}${count}`;
  let refPadded = `${typeName}${pad2}`;

  if (BASELINE_USED_REFS.has(ref.toLowerCase())) {
    let suffix = 2;
    while (BASELINE_USED_REFS.has(`${ref}_${suffix}`.toLowerCase())) {
      suffix++;
    }
    ref = `${ref}_${suffix}`;
    refPadded = `${refPadded}_${suffix}`;
  }
  BASELINE_USED_REFS.add(ref.toLowerCase());

  // Technical specification of the article from Excel
  const designation = String(
    item.Ref != null ? item.Ref : item.ref != null ? item.ref : item['Désignation'] || `Article ${idx + 1}`
  ).trim();

  let initQty = 0;
  if (item.stockInitial != null && item.stockInitial !== '' && !isNaN(Number(item.stockInitial))) {
    initQty = Number(item.stockInitial);
  } else if (item['Stock Initial'] != null && item['Stock Initial'] !== '' && !isNaN(Number(item['Stock Initial']))) {
    initQty = Number(item['Stock Initial']);
  } else if (item['Stock Actuel'] != null && item['Stock Actuel'] !== '' && !isNaN(Number(item['Stock Actuel']))) {
    initQty = Number(item['Stock Actuel']);
  } else if (typeof item.Type === 'number' && !isNaN(item.Type)) {
    initQty = item.Type;
  } else if (!isNaN(Number(item.Type)) && item.Type !== '' && item.Type !== null && typeof item.Type !== 'string') {
    initQty = Number(item.Type);
  }

  const dataObj = {
    id: idx + 1,
    qty: initQty,
    ref,
    refPadded,
    designation,
    type: typeName,
    id_type: typeName,
    seuil: Number(item["Seuil d'Alerte"] || item.seuil) || 3,
    emplacement: item.Emplacement || item.emplacement || `A${(idx % 8) + 1}-R${(idx % 6) + 1}`,
  };

  INITIAL_STOCK_LOOKUP.set(ref.toLowerCase(), dataObj);
  INITIAL_STOCK_LOOKUP.set(refPadded.toLowerCase(), dataObj);
  INITIAL_STOCK_LOOKUP.set(designation.toLowerCase(), dataObj);
  if (item.Ref) {
    INITIAL_STOCK_LOOKUP.set(String(item.Ref).trim().toLowerCase(), dataObj);
  }

  return dataObj;
});

/**
 * Helper to resolve baseline stock item by reference or designation
 */
export function getBaselineStockItem(refOrDesig) {
  if (!refOrDesig) return null;
  const key = String(refOrDesig).trim().toLowerCase();
  return INITIAL_STOCK_LOOKUP.get(key) || null;
}
