import { useEffect, useRef } from 'react';

/**
 * Runs callback on mount and on an interval only while the browser tab is visible.
 * Reduces background network load and speeds up perceived performance.
 */
export function useRefreshInterval(callback: () => void, ms = 30000) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === 'visible') {
        saved.current();
      }
    };

    run();

    const intervalId = window.setInterval(run, ms);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        saved.current();
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ms]);
}
