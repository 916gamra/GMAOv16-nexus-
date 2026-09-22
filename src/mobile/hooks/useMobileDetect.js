import { useState, useEffect } from 'react';

/**
 * Hook detecting mobile devices, screen width, orientation, and OS.
 */
export function useMobileDetect(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  });

  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  const [orientation, setOrientation] = useState(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const mobileStatus = window.innerWidth < breakpoint || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(mobileStatus);
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoint]);

  return {
    isMobile,
    isTouchDevice,
    orientation,
    isIOS: typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent),
    isAndroid: typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent),
  };
}

export default useMobileDetect;
