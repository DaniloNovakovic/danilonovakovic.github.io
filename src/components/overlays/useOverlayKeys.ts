/**
 * useOverlayKeys — installs scoped keyboard handlers for an overlay's lifetime.
 *
 * Replaces ad-hoc `window.addEventListener('keydown', …)` calls inside overlay
 * components. Calls `e.preventDefault()` for every handled key so arrow keys /
 * space do not scroll the overlay container (DrawingCanvas / GuitarStrings).
 */
import { useEffect, useLayoutEffect, useRef } from 'react';

type KeyHandlers = Partial<Record<string, (e: KeyboardEvent) => void>>;

export function useOverlayKeys(handlers: KeyHandlers): void {
  const handlersRef = useRef<KeyHandlers>(handlers);

  // Keep ref in sync without re-registering the event listener
  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const handler = handlersRef.current[e.key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
