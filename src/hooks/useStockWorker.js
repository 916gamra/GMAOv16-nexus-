import { useRef, useEffect, useCallback } from 'react';
import { Logger } from '../core/logger/LoggerService.js';

/**
 * Custom React hook to execute heavy calculations in a background Web Worker.
 * Automatically manages worker lifecycle, request-response IDs, and fallback execution.
 */
export function useStockWorker() {
  const workerRef = useRef(null);
  const pendingRequests = useRef(new Map());
  const reqIdCounter = useRef(0);

  useEffect(() => {
    // Only initialize Web Worker in browser environments where Worker is supported
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        // Vite natively supports Worker instantiation via new URL with import.meta.url
        const worker = new Worker(
          new URL('../workers/stockWorker.js', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (e) => {
          const { id, success, result, error } = e.data || {};
          if (id && pendingRequests.current.has(id)) {
            const { resolve, reject } = pendingRequests.current.get(id);
            pendingRequests.current.delete(id);
            if (success) {
              resolve(result);
            } else {
              reject(new Error(error || 'Worker execution failed'));
            }
          }
        };

        worker.onerror = (err) => {
          Logger.warn('Worker error:', err, 'useStockWorker');
        };

        workerRef.current = worker;
      } catch (e) {
        Logger.warn('Could not initialize Web Worker, using main thread fallback:', e, 'useStockWorker');
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const runCalculation = useCallback((type, payload) => {
    return new Promise((resolve, reject) => {
      if (workerRef.current) {
        const id = ++reqIdCounter.current;
        pendingRequests.current.set(id, { resolve, reject });
        workerRef.current.postMessage({ id, type, payload });
      } else {
        // Synchronous fallback when worker is unavailable (e.g., test environment)
        try {
          if (type === 'RECALCULATE_STOCK_ITEMS') {
            const { rawStock = [], mouvements = [] } = payload;
            const inflowMap = new Map();
            const outflowMap = new Map();

            for (const m of mouvements) {
              if (!m || !m.ref) continue;
              const refKey = String(m.ref).toLowerCase().trim();
              const qty = Number(m.quantite || m.quantity) || 0;
              const mType = String(m.type || '').toLowerCase();

              if (mType.includes('entrée') || mType.includes('entree') || mType.includes('reappro')) {
                inflowMap.set(refKey, (inflowMap.get(refKey) || 0) + qty);
              } else if (mType.includes('sortie') || mType.includes('consommation')) {
                outflowMap.set(refKey, (outflowMap.get(refKey) || 0) + qty);
              }
            }

            const recalculated = rawStock.map((item) => {
              const refKey = String(item.ref || item.Ref || '').toLowerCase().trim();
              const entrees = inflowMap.get(refKey) || 0;
              const sorties = outflowMap.get(refKey) || 0;
              const stockInitial = Number(item.stockInitial ?? item['Stock Initial']) || 0;
              const seuil = Math.max(0, Number(item.seuil ?? item.Seuil ?? item.seuilAlerte) || 0);
              const stockActuel = Math.max(0, stockInitial + entrees - sorties);
              const stockActuelRaw = stockInitial + entrees - sorties;
              let alerte = 'OK';
              if (item.isAchatUnique) alerte = 'NON_STOCKABLE';
              else if (stockActuel <= 0) alerte = 'RUPTURE';
              else if (stockActuel <= seuil) alerte = 'ALERTE';

              return { ...item, entrees, sorties, stockActuel, stockActuelRaw, alerte };
            });

            resolve(recalculated);
          } else {
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      }
    });
  }, []);

  return { runCalculation };
}
