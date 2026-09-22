import { useState, useEffect } from 'react';

/**
 * Hook detecting virtual keyboard visibility and layout shifts on mobile.
 */
export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const initialHeight = window.visualViewport.height;

    const handleResize = () => {
      const currentHeight = window.visualViewport.height;
      const heightDiff = initialHeight - currentHeight;

      if (heightDiff > 150) {
        setIsKeyboardOpen(true);
        setKeyboardHeight(heightDiff);
      } else {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isKeyboardOpen, keyboardHeight };
}

export default useMobileKeyboard;
