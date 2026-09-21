import { safeNum, calculateStockStatus, sumIfs, countIfs } from '../utils/formulaEngine.js';
import { FormulaEngineOptimizer } from '../utils/formulaEngineOptimizer.js';

export const formulaEngine = {
  safeNum,
  calculateStockStatus,
  sumIfs,
  countIfs,
  clearMemoCache: FormulaEngineOptimizer.clearMemoCache
};

export default formulaEngine;
