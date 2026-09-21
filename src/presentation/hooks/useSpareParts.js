import { useState, useEffect, useCallback, useMemo } from 'react';
import { Container } from '../../core/di/Container.js';
import { SparePartApplicationService } from '../../application/services/SparePartApplicationService.js';
import { TaskApplicationService } from '../../application/services/TaskApplicationService.js';
import { calculateStockStatus } from '../../utils/formulaEngine.js';
import { Logger } from '../../core/logger/LoggerService.js';

export function useSpareParts() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sparePartService = useMemo(() => Container.resolve('sparePartService') ? new SparePartApplicationService() : null, []);
    
  const taskService = useMemo(() => Container.resolve('taskService') ? new TaskApplicationService() : null, []);

  const fetchStock = useCallback(async () => {
    if (!sparePartService || !taskService) return;
    setLoading(true);
    try {
      // Fetch parts and movements to calculate current stock live
      const [parts, tasks] = await Promise.all([
        sparePartService.listSpareParts(),
        taskService.listTasks()
      ]);
      
      const mvtSummary = {};
      tasks.forEach((m) => {
        const r = String(m.ref || m['Référence'] || m['Reference'] || '').trim().toLowerCase();
        if (!r) return;
        if (!mvtSummary[r]) mvtSummary[r] = { entrees: 0, sorties: 0 };
        
        const q = Number(m.quantite != null ? m.quantite : m['Quantité']) || 0;
        const t = String(m.type || m['Type (Entrée/Sortie)'] || '').toLowerCase();
        if (t.includes('entr')) mvtSummary[r].entrees += q;
        else if (t.includes('sort')) mvtSummary[r].sorties += q;
      });

      const calculatedItems = parts.map(item => {
        const itemRefKey = String(item.ref || '').trim().toLowerCase();
        const entrees = mvtSummary[itemRefKey]?.entrees || 0;
        const sorties = mvtSummary[itemRefKey]?.sorties || 0;
        const stockInitial = Number(item.stockInitial) || 0;
        const seuil = Number(item.seuil) || 3;
        
        const { stockActuel, alerte } = calculateStockStatus(stockInitial, entrees, sorties, seuil);
        
        return {
          ...item,
          stockInitial,
          entrees,
          sorties,
          stockActuel,
          alerte
        };
      });
      
      setStockItems(calculatedItems);
      setError(null);
    } catch (err) {
      Logger.error('Failed to fetch stock:', err, 'useSpareParts');
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sparePartService, taskService]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const updateArticle = async (id, articleData) => {
    if (!sparePartService) return;
    try {
      const updated = await sparePartService.updateSparePart(id, articleData);
      await fetchStock(); // Recalculate
      return updated;
    } catch (err) {
      Logger.error('Failed to update article:', err, 'useSpareParts');
      throw err;
    }
  };

  const directAdjustStock = async (article, newTargetStock) => {
    if (!sparePartService) return;
    try {
      const entrees = Number(article.entrees || 0);
      const sorties = Number(article.sorties || 0);
      const newStockInitial = Math.max(0, Number(newTargetStock) - entrees + sorties);
      
      const updatedItem = { ...article, stockInitial: newStockInitial };
      await sparePartService.updateSparePart(article.id, updatedItem);
      await fetchStock();
    } catch (err) {
      Logger.error('Failed to adjust stock:', err, 'useSpareParts');
      throw err;
    }
  };

  return {
    stockItems,
    loading,
    error,
    updateArticle,
    directAdjustStock,
    refetch: fetchStock
  };
}
