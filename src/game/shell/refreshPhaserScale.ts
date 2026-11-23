import type * as Phaser from 'phaser';

/**
 * `ScaleManager.refresh()` sizes the canvas from its cached parent size and
 * only re-reads the parent afterwards, so a container resize (not a window
 * resize) leaves the canvas one size behind for good. Read the parent first.
 *
 * Then nudge the canvas onto whole CSS pixels: a centred layout can land it
 * half a pixel off-grid, and the browser then resamples the whole frame, so
 * moving line art shimmers. `translate` is used because Phaser owns the
 * canvas margins for centering.
 */
export function refreshPhaserScale(game: Phaser.Game): void {
  game.scale.getParentBounds();
  game.scale.refresh();
  snapCanvasToWholePixels(game.canvas);
}

function snapCanvasToWholePixels(canvas: HTMLCanvasElement | undefined): void {
  if (!canvas) return;
  canvas.style.translate = '';
  const { left, top } = canvas.getBoundingClientRect();
  const dx = Number((Math.round(left) - left).toFixed(4));
  const dy = Number((Math.round(top) - top).toFixed(4));
  canvas.style.translate = dx === 0 && dy === 0 ? '' : `${dx}px ${dy}px`;
}
