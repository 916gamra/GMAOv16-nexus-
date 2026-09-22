import { useState, useCallback } from 'react';

/**
 * Hook to manage touch interaction states (tap, press down, active state).
 */
export function useTouch() {
  const [isTouching, setIsTouching] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e) => {
    setIsTouching(true);
    if (e.touches && e.touches[0]) {
      setTouchStartPos({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsTouching(false);
  }, []);

  return {
    isTouching,
    touchStartPos,
    touchProps: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  };
}

export default useTouch;
