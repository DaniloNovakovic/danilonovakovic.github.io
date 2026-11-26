/** Browser checks for the real-world takeover (ADR-0007), kept out of the Three.js chunk. */
export function requestFullscreenQuietly() {
  if (typeof document === 'undefined' || document.fullscreenElement) return;
  document.documentElement.requestFullscreen?.().catch(() => {});
}

/** Leave fullscreen if Wake up entered it, so the way back is the page as it was. */
export function exitFullscreenQuietly() {
  if (typeof document === 'undefined' || !document.fullscreenElement) return;
  document.exitFullscreen?.().catch(() => {});
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
