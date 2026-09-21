const fs = require('fs');
let code = fs.readFileSync('src/utils/formulaEngine.js', 'utf8');

code = code.replace(
  `export function safeNum(val, defaultVal = 0) {
  if (val === null || val === undefined || val === '') return defaultVal;
  const num = Number(val);
  return Number.isFinite(num) ? num : defaultVal;
}`,
  `export function safeNum(val, defaultVal = NaN) {
  if (val === null || val === undefined || val === '') return defaultVal;
  const num = Number(val);
  return Number.isFinite(num) ? num : defaultVal;
}`
);

code = code.replace(
  `const qty = safeNum(mvt.quantite || mvt.quantity);
  if (qty <= 0) {
    errors.push('La quantité doit être un nombre supérieur à 0.');
  }`,
  `const qty = safeNum(mvt.quantite || mvt.quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    errors.push('La quantité doit être un nombre valide et supérieur à 0.');
  }`
);

code = code.replace(
  `  const qty = safeNum(mvt.quantite || mvt.quantity);
  if (qty <= 0) return { isValid: false, errors: ['La quantité doit être supérieure à zéro.'] };`,
  `  const qty = safeNum(mvt.quantite || mvt.quantity);
  if (Number.isNaN(qty) || qty <= 0) return { isValid: false, errors: ['La quantité doit être un nombre valide et supérieure à zéro.'] };`
);

fs.writeFileSync('src/utils/formulaEngine.js', code);
