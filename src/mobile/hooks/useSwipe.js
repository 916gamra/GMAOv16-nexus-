import { useState, useCallback } from 'react';

/**
 * Hook to handle swipe gestures (Left, Right, Up, Down).
 */
export function useSwipe(onSwipe, threshold = 50) {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e) => {
    if (!e.touches || !e.touches[0]) return;
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!e.touches || !e.touches[0]) return;
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.x || !touchEnd.x) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipe && onSwipe('LEFT');
        } else {
          onSwipe && onSwipe('RIGHT');
        }
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipe && onSwipe('UP');
        } else {
          onSwipe && onSwipe('DOWN');
        }
      }
    }

    setTouchStart({ x: 0, y: 0 });
    setTouchEnd({ x: 0, y: 0 });
  }, [touchStart, touchEnd, threshold, onSwipe]);

  return {
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

export default useSwipe;
