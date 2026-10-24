import * as Phaser from 'phaser';
import { getBreathBeam } from './auras';

export interface StampedeKitLookFrame {
  x: number;
  y: number;
  facingX: number;
  facingY: number;
  disarmed: boolean;
  breathRank: 0 | 1 | 2;
  stinkPoints: readonly { x: number; y: number }[];
  selfieRank: 0 | 1 | 2;
  glassesRank: 0 | 1 | 2;
}

export interface StampedeKitLook {
  sync(frame: StampedeKitLookFrame): void;
  reset(): void;
}

const INK = 0x1a1a1a;
const POISON = 0x6f9f3a;
const STINK = 0x7d8f3a;
const AMBER = 0xf0a202;

export function createStampedeKitLook(scene: Phaser.Scene): StampedeKitLook {
  const graphics = scene.add.graphics().setDepth(31);
  return {
    sync(frame) {
      graphics.clear().setVisible(true).setAlpha(frame.disarmed ? 0.28 : 1);
      if (!frame.disarmed) {
        if (frame.breathRank > 0) drawPoisonLine(graphics, frame);
        frame.stinkPoints.forEach((point) => drawStink(graphics, point.x, point.y));
        if (frame.selfieRank > 0) drawPhone(graphics, frame.x - 18, frame.y + 2);
        if (frame.selfieRank >= 2) drawPhone(graphics, frame.x + 16, frame.y - 8);
        if (frame.glassesRank > 0) drawLensGlint(graphics, frame);
      }
      if (frame.disarmed) drawBeerSplash(graphics, frame.x, frame.y - 16);
    },
    reset() {
      graphics.clear().setVisible(false);
    }
  };
}

function drawStink(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
  graphics.fillStyle(STINK, 0.28);
  graphics.fillCircle(x, y, 16);
  graphics.lineStyle(2.5, INK, 0.9);
  graphics.strokeCircle(x, y, 16);
  graphics.lineStyle(1.6, STINK, 1);
  graphics.beginPath();
  graphics.moveTo(x - 4, y + 2);
  graphics.lineTo(x - 1, y - 4);
  graphics.lineTo(x + 2, y + 1);
  graphics.lineTo(x + 5, y - 3);
  graphics.strokePath();
}

function drawPoisonLine(
  graphics: Phaser.GameObjects.Graphics,
  frame: StampedeKitLookFrame
): void {
  const beam = getBreathBeam(frame.breathRank === 2 ? 2 : 1);
  const length = Math.hypot(frame.facingX, frame.facingY) || 1;
  const facingX = frame.facingX / length;
  const facingY = frame.facingY / length;
  const startX = frame.x + facingX * 16;
  const startY = frame.y + facingY * 16;
  const endX = frame.x + facingX * beam.range;
  const endY = frame.y + facingY * beam.range;
  graphics.lineStyle(frame.breathRank >= 2 ? 14 : 10, POISON, 0.28);
  graphics.lineBetween(startX, startY, endX, endY);
  graphics.lineStyle(2.4, INK, 0.75);
  graphics.lineBetween(startX, startY, endX, endY);
  const sideX = -facingY;
  const sideY = facingX;
  graphics.lineStyle(1.5, POISON, 0.95);
  for (let step = 0; step < 4; step += 1) {
    const along = 28 + step * (beam.range / 5);
    const wobble = (step % 2 === 0 ? 1 : -1) * 7;
    const x = frame.x + facingX * along + sideX * wobble;
    const y = frame.y + facingY * along + sideY * wobble;
    graphics.beginPath();
    graphics.moveTo(x - 3, y);
    graphics.lineTo(x, y - 4);
    graphics.lineTo(x + 3, y);
    graphics.strokePath();
  }
}

function drawPhone(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
  graphics.fillStyle(0xfbfbf9, 1);
  graphics.fillRoundedRect(x - 4, y - 6, 8, 12, 1.5);
  graphics.lineStyle(1.6, INK, 1);
  graphics.strokeRoundedRect(x - 4, y - 6, 8, 12, 1.5);
  graphics.strokeCircle(x, y - 1, 2);
}

function drawLensGlint(
  graphics: Phaser.GameObjects.Graphics,
  frame: StampedeKitLookFrame
): void {
  graphics.lineStyle(1.5, INK, 0.85);
  graphics.strokeCircle(frame.x - 4, frame.y - 18, 3);
  graphics.strokeCircle(frame.x + 4, frame.y - 18, 3);
  graphics.lineBetween(frame.x - 1, frame.y - 18, frame.x + 1, frame.y - 18);
  if (frame.glassesRank >= 2) {
    graphics.lineBetween(frame.x, frame.y - 22, frame.x, frame.y - 20);
    graphics.lineBetween(frame.x - 1, frame.y - 21, frame.x + 1, frame.y - 21);
  }
}

function drawBeerSplash(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
  graphics.fillStyle(AMBER, 0.9);
  graphics.fillEllipse(x, y, 18, 10);
  graphics.lineStyle(2, INK, 1);
  graphics.strokeEllipse(x, y, 18, 10);
  graphics.fillStyle(0xfbfbf9, 0.95);
  graphics.fillCircle(x - 5, y - 2, 1.4);
  graphics.fillCircle(x + 3, y - 1, 1.2);
}
