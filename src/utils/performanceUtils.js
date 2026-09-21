import { useState, useEffect, useRef } from 'react';

/**
 * Debounce function: Delays function execution until after specified delay ms
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} Debounced function
 */
export function debounce(func, delay = 300) {
  let timeoutId;

  const debouncedFn = function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };

  debouncedFn.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debouncedFn;
}

/**
 * Throttle function: Limits function execution to once per specified limit ms
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle limit in milliseconds (default: 300ms)
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle = false;
  let lastResult;

  const throttledFn = function (...args) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };

  return throttledFn;
}

/**
 * React Hook for Throttling values (e.g. window resize or scroll events)
 * @param {any} value - Value to throttle
 * @param {number} limit - Throttle limit in ms
 * @returns {any} Throttled value
 */
export function useThrottle(value, limit = 300) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(0);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastExecuted.current;

    const handler = setTimeout(() => {
      setThrottledValue(value);
      lastExecuted.current = Date.now();
    }, Math.max(0, limit - elapsed));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}
