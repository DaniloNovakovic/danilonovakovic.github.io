import { useCallback, useEffect, useRef } from 'react';
import { markerPosition } from './strikeCombo';

/**
 * Drives the timing-bar marker with one rAF loop that writes straight to the
 * marker element (no React re-render per frame). Gameplay reads the position
 * from the same clock at input time, so grading never depends on frame timing.
 */
export function useSweepMarker(initialPeriodMs: number) {
  const markerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(0);
  const periodRef = useRef(initialPeriodMs);

  useEffect(function runSweepMarkerLoop() {
    startRef.current = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const marker = markerRef.current;
      if (marker) {
        marker.style.left = `${markerPosition(now - startRef.current, periodRef.current) * 100}%`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const readPosition = useCallback(
    () => markerPosition(performance.now() - startRef.current, periodRef.current),
    []
  );

  /** Restarts the sweep from the left edge with a new period. */
  const restart = useCallback((periodMs: number) => {
    periodRef.current = periodMs;
    startRef.current = performance.now();
  }, []);

  return { markerRef, readPosition, restart };
}
