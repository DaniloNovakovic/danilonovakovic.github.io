/**
 * StreetCrt — the street sketch-console that accepts the Potassium Circuit.
 * Locked: dead screen with occasional static. Powered: a tiny stick figure
 * waves from inside Ridge so the CRT reads as "something lives in here".
 */
import * as Phaser from 'phaser';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const SCREEN_PAPER = 0xf4f1ea;
const SCREEN_W = 60;
const SCREEN_H = 44;
const STATIC_PERIOD_TICKS = 38;
const STATIC_BURST_TICKS = 3;

export class StreetCrt {
  private readonly body: Phaser.GameObjects.Graphics;
  private readonly screen: Phaser.GameObjects.Graphics;
  private powered: boolean | null = null;
  private lastTick = -1;
  private readonly x: number;
  private readonly y: number;

  constructor(scene: Phaser.Scene, x: number, y: number, depth: number) {
    this.x = x;
    this.y = y;
    this.body = scene.add.graphics().setDepth(depth);
    this.screen = scene.add.graphics().setDepth(depth + 0.5);
  }

  update(powered: boolean, tick: number, motion: boolean): void {
    if (this.powered !== powered) {
      this.powered = powered;
      this.drawBody(powered);
      this.lastTick = -1;
    }
    const frameTick = motion ? tick : 0;
    if (frameTick === this.lastTick) return;
    this.lastTick = frameTick;
    if (powered) this.drawPoweredScreen(frameTick, motion);
    else this.drawLockedScreen(frameTick, motion);
  }

  private drawBody(powered: boolean): void {
    const { x, y } = this;
    const g = this.body;
    g.clear();
    g.lineStyle(3, INK, 1);
    g.fillStyle(PAPER, 1);
    g.fillRect(x - 34, y - 8, 68, 18);
    g.strokeRect(x - 34, y - 8, 68, 18);
    g.fillRect(x - 40, y - 78, 80, 70);
    g.strokeRect(x - 40, y - 78, 80, 70);
    // Knobs.
    g.strokeCircle(x + 34, y - 20, 2.5);
    g.strokeCircle(x + 34, y - 30, 2.5);
    g.lineBetween(x - 10, y - 78, x - 18, y - 96);
    g.lineBetween(x + 10, y - 78, x + 18, y - 96);
    if (powered) {
      g.fillStyle(INK, 1);
      g.fillCircle(x - 18, y - 96, 2.5);
      g.fillCircle(x + 18, y - 96, 2.5);
    }
  }

  private clearScreen(color: number, alpha: number): { left: number; top: number } {
    const left = this.x - SCREEN_W / 2;
    const top = this.y - 68;
    this.screen.clear();
    this.screen.fillStyle(color, alpha);
    this.screen.fillRect(left, top, SCREEN_W, SCREEN_H);
    return { left, top };
  }

  private drawLockedScreen(tick: number, motion: boolean): void {
    const { x, y } = this;
    const g = this.screen;
    const { left, top } = this.clearScreen(INK, 0.12);

    const burst = motion && tick % STATIC_PERIOD_TICKS < STATIC_BURST_TICKS;
    if (burst) {
      g.lineStyle(2, INK, 0.55);
      for (let i = 0; i < 9; i++) {
        const sx = left + 4 + Math.random() * (SCREEN_W - 16);
        const sy = top + 4 + Math.random() * (SCREEN_H - 8);
        g.lineBetween(sx, sy, sx + 4 + Math.random() * 8, sy);
      }
    } else {
      g.lineStyle(2, INK, 0.45);
      g.lineBetween(x - 18, y - 46, x + 18, y - 46);
    }
    this.strokeScreenFrame();
  }

  private drawPoweredScreen(tick: number, motion: boolean): void {
    const { x, y } = this;
    const g = this.screen;
    const { left, top } = this.clearScreen(SCREEN_PAPER, 1);

    // Little ridge line behind the figure.
    g.lineStyle(1.5, INK, 0.55);
    g.beginPath();
    g.moveTo(left + 2, y - 28);
    g.lineTo(x + 4, y - 44);
    g.lineTo(x + 12, y - 36);
    g.lineTo(x + 22, y - 52);
    g.lineTo(left + SCREEN_W - 2, y - 30);
    g.strokePath();

    // Stick figure waving from inside the game.
    const waveUp = Math.floor(tick / 4) % 2 === 0;
    g.lineStyle(2, INK, 0.9);
    g.strokeCircle(x - 12, y - 52, 4.5);
    g.lineBetween(x - 12, y - 47, x - 12, y - 35);
    g.lineBetween(x - 12, y - 35, x - 16, y - 27);
    g.lineBetween(x - 12, y - 35, x - 8, y - 27);
    g.lineBetween(x - 12, y - 43, x - 18, y - 38);
    g.lineBetween(x - 12, y - 43, x - 4, waveUp ? y - 52 : y - 46);

    if (motion) {
      const scanY = top + ((tick * 3) % SCREEN_H);
      g.lineStyle(1, INK, 0.22);
      g.lineBetween(left, scanY, left + SCREEN_W, scanY);

      // Hum marks off the antenna tips.
      if (tick % 6 < 3) {
        g.lineStyle(1.5, INK, 0.6);
        g.lineBetween(x - 24, y - 100, x - 28, y - 104);
        g.lineBetween(x + 24, y - 100, x + 28, y - 104);
      }
    }
    this.strokeScreenFrame();
  }

  private strokeScreenFrame(): void {
    this.screen.lineStyle(3, INK, 1);
    this.screen.strokeRect(this.x - SCREEN_W / 2, this.y - 68, SCREEN_W, SCREEN_H);
  }
}
