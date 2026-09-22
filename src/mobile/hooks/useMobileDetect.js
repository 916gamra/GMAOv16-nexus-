import { useState, useEffect } from 'react';

/**
 * Enterprise Automatic Device & Viewport Detection Hook.
 * Automatically identifies mobile phones, tablets, touch devices, and responsive breakpoints.
 */
export function useMobileDetect(breakpoint = 1024) {
  const checkIsMobile = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const isSmallScreen = window.innerWidth < breakpoint;
    return isMobileUA || isSmallScreen;
  };

  const checkIsTouch = () => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  const [isMobile, setIsMobile] = useState(checkIsMobile);
  const [isTouchDevice, setIsTouchDevice] = useState(checkIsTouch);
  const [orientation, setOrientation] = useState(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(checkIsMobile());
      setIsTouchDevice(checkIsTouch());
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Initial check
    handleResize();

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
