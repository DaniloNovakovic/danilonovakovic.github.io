/** Stepped sketchbook clock (~11 FPS) so motion reads as hand-drawn. */
export function sketchTick(timeMs: number): number {
  return Math.floor(timeMs / 90);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
