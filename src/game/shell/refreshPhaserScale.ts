import type * as Phaser from 'phaser';

/**
 * `ScaleManager.refresh()` sizes the canvas from its cached parent size and
 * only re-reads the parent afterwards, so a container resize (not a window
 * resize) leaves the canvas one size behind for good. Read the parent first.
 */
export function refreshPhaserScale(game: Phaser.Game): void {
  game.scale.getParentBounds();
  game.scale.refresh();
}
