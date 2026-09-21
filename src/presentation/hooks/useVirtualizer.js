import { useEffect, useState, useCallback } from 'react';
import { Logger } from '../../core/logger/LoggerService.js';

/**
 * Virtualization Hook
 * ✅ لتحسين أداء الجداول الكبيرة
 */
export function useVirtualizer(options = {}) {
  const {
    count = 0,
    getScrollElement = () => null,
    estimateSize = () => 35,
    overscan = 10
  } = options;

  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollElement = getScrollElement();

  useEffect(() => {
    if (!scrollElement) return;

    const handleScroll = () => {
      setScrollOffset(scrollElement.scrollTop);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    Logger.debug('Virtualizer scroll listener attached');

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollElement]);

  const getVirtualItems = useCallback(() => {
    if (!scrollElement) return [];

    const itemSize = estimateSize();
    const visibleCount = Math.ceil(scrollElement.clientHeight / itemSize);
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemSize) - overscan);
    const endIndex = Math.min(count, startIndex + visibleCount + overscan * 2);

    const virtualItems = [];
    for (let i = startIndex; i < endIndex; i++) {
      virtualItems.push({
        key: i,
        index: i,
        start: i * itemSize,
        end: (i + 1) * itemSize,
        size: itemSize
      });
    }

    return virtualItems;
  }, [scrollOffset, scrollElement, count, estimateSize, overscan]);

  const getTotalSize = useCallback(() => {
    return count * estimateSize();
  }, [count, estimateSize]);

  return {
    getVirtualItems,
    getTotalSize,
    scrollOffset
  };
}
