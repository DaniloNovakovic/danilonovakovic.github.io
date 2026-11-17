import type * as Phaser from 'phaser';
import { DEPTH, INK, PAPER } from '../art/stick/palette';
import { pinToScreen, visibleSlice } from './screenOverlay';

/** How long the paper flash on each cut takes to clear, in ms. */
const FLASH_MS = 520;
/** CSS sizes; converted to canvas pixels through the cover crop. */
const MARGIN_CSS = 10;
/** Ink wash over a night memory: the plaza after dark, without redrawing it. */
const NIGHT_WASH = 0.24;

/**
 * Presentation for a remembered scene (the Relay ending's cuts): a page-white
 * flash on every cut, a ruled sketchbook border while the memory holds (so it
 * never reads as the place you are standing), and an ink wash for night.
 */
export class MemoryFrameView {
  private readonly scene: Phaser.Scene;
  private readonly g: Phaser.GameObjects.Graphics;
  private shot: string | null = null;
  private cutAt = Number.NEGATIVE_INFINITY;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(DEPTH.presence + 4).setScrollFactor(0);
  }

  sync(shotKey: string | null, night: boolean, now: number): void {
    if (shotKey !== this.shot) {
      // Flash into a memory and between memories; coming back to the overlook cuts too.
      this.cutAt = now;
      this.shot = shotKey;
    }
    const g = this.g;
    g.clear();
    pinToScreen(this.scene, g);
    const { k, left, top, width, height } = visibleSlice(this.scene);
    const flash = 1 - (now - this.cutAt) / FLASH_MS;
    if (shotKey && night) {
      g.fillStyle(INK, NIGHT_WASH);
      g.fillRect(left, top, width, height);
    }
    if (shotKey) this.drawFrame(left, top, width, height, k);
    if (flash > 0) {
      g.fillStyle(PAPER, 0.92 * flash);
      g.fillRect(left, top, width, height);
    }
  }

  destroy(): void {
    this.g.destroy();
  }

  private drawFrame(left: number, top: number, width: number, height: number, k: number): void {
    const g = this.g;
    const m = MARGIN_CSS * k;
    // A paper mat around the edge, then a ruled ink border inside it.
    g.fillStyle(PAPER, 0.9);
    g.fillRect(left, top, width, m);
    g.fillRect(left, top + height - m, width, m);
    g.fillRect(left, top, m, height);
    g.fillRect(left + width - m, top, m, height);
    g.lineStyle(2 * k, INK, 0.55);
    g.strokeRect(left + m, top + m, width - m * 2, height - m * 2);
  }
}
