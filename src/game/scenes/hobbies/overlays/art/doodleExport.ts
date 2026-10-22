/** Max street-billboard doodle size; keeps the pinned PNG data URL small. */
export const DOODLE_EXPORT_MAX_WIDTH = 240;
export const DOODLE_EXPORT_MAX_HEIGHT = 160;

const PAPER = '#fbfbf9';
const INK = '#1a1a1a';

/** Scales `width` x `height` down (never up) to fit the box, keeping aspect ratio. */
export function fitWithin(
  width: number,
  height: number,
  maxWidth = DOODLE_EXPORT_MAX_WIDTH,
  maxHeight = DOODLE_EXPORT_MAX_HEIGHT
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** True when any pixel of RGBA data is not fully transparent. */
export function hasInk(rgba: ArrayLike<number>): boolean {
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i]! > 0) return true;
  }
  return false;
}

export function canvasHasInk(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext('2d');
  if (!context || canvas.width === 0 || canvas.height === 0) return false;
  return hasInk(context.getImageData(0, 0, canvas.width, canvas.height).data);
}

/** Downscaled, signed PNG data URL of the doodle on paper, or null if canvas is unavailable. */
export function exportSignedDoodle(source: HTMLCanvasElement, signature: string): string | null {
  const { width, height } = fitWithin(source.width, source.height);
  if (width === 0) return null;
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const context = output.getContext('2d');
  if (!context) return null;
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, width, height);
  context.strokeStyle = INK;
  context.lineWidth = 2;
  context.strokeRect(1, 1, width - 2, height - 2);
  context.fillStyle = INK;
  context.font = 'italic bold 11px sans-serif';
  context.textAlign = 'right';
  context.textBaseline = 'bottom';
  context.fillText(signature, width - 6, height - 4);
  return output.toDataURL('image/png');
}
