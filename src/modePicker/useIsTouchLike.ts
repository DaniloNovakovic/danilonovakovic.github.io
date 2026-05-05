import { useEffect, useState } from 'react';

/**
 * Returns true when the primary input looks like a coarse touch pointer.
 *
 * This is a presentation hint for the mode picker, not device detection. It
 * starts false so SSR/test environments without `window.matchMedia` can render
 * safely, then follows `(hover: none) and (pointer: coarse)` when available.
 */
export function useIsTouchLike(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(function syncTouchLikeMediaQuery() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(hover: none) and (pointer: coarse)');
    const update = () => setIsTouch(mql.matches);
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);

  return isTouch;
}
