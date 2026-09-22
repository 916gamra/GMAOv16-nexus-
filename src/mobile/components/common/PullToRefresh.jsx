import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Pull to Refresh Container with async callback support.
 */
export function PullToRefresh({ onRefresh, children }) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const threshold = 70;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && e.touches[0]) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY > 0 && e.touches[0]) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.5, 100));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setStartY(0);
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div
          style={{ height: `${isRefreshing ? 50 : pullDistance}px` }}
          className="flex items-center justify-center overflow-hidden transition-all text-blue-600"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-xs font-semibold ml-2">
            {isRefreshing ? 'Mise à jour...' : pullDistance >= threshold ? 'Relâchez pour rafraîchir' : 'Tirez pour rafraîchir'}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

export default PullToRefresh;
