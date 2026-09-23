import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { stockIndexStore } from '../application/StockIndexStore';

export function useStockTotals(ref: string) {
  const subscribe = useCallback(
    (cb: () => void) => stockIndexStore.subscribeRef(ref, cb),
    [ref]
  );
  const getSnapshot = useCallback(
    () => stockIndexStore.getRefVersion(ref),
    [ref]
  );

  const version = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () => stockIndexStore.index.getTotals(ref),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ref, version]
  );
}

export function useStockValue(ref: string, initialStock?: number): number {
  const subscribe = useCallback(
    (cb: () => void) => stockIndexStore.subscribeRef(ref, cb),
    [ref]
  );
  const getSnapshot = useCallback(
    () => stockIndexStore.getRefVersion(ref),
    [ref]
  );

  const version = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  return useMemo(
    () => stockIndexStore.index.calculateCurrentStock(ref, initialStock),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ref, initialStock, version]
  );
}
