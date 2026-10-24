import * as Phaser from 'phaser';
import { getSmellMoteAura, sampleOrbitPoints } from './auras';

export interface StampedeKitLookFrame {
  x: number;
  y: number;
  elapsedMs: number;
  disarmed: boolean;
  breathPoints: readonly { x: number; y: number }[];
  smellRank: 0 | 1 | 2;
  selfieRank: 0 | 1 | 2;
  glassesRank: 0 | 1 | 2;
}

export interface StampedeKitLook {
  sync(frame: StampedeKitLookFrame): void;
  reset(): void;
}

const INK = 0x1a1a1a;
const STINK = 0x7d8f3a;
const SMELL = 0xc45c8a;
const AMBER = 0xf0a202;

export function createStampedeKitLook(scene: Phaser.Scene): StampedeKitLook {
  const graphics = scene.add.graphics().setDepth(31);
  return {
    sync(frame) {
      graphics.clear().setVisible(true).setAlpha(frame.disarmed ? 0.28 : 1);
      if (!frame.disarmed && frame.smellRank > 0) {
        drawSmell(graphics, frame);
      }
      if (!frame.disarmed) {
        frame.breathPoints.forEach((point) => drawStink(graphics, point.x, point.y));
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

function drawSmell(
  graphics: Phaser.GameObjects.Graphics,
  frame: StampedeKitLookFrame
): void {
  const aura = getSmellMoteAura(frame.smellRank === 2 ? 2 : 1);
  graphics.lineStyle(2, SMELL, 0.55);
  graphics.strokeCircle(frame.x, frame.y, aura.radius);
  sampleOrbitPoints({ x: frame.x, y: frame.y }, aura, frame.elapsedMs).forEach((point) => {
    graphics.fillStyle(SMELL, 0.85);
    graphics.fillCircle(point.x, point.y, frame.smellRank >= 2 ? 3.4 : 2.6);
    graphics.lineStyle(1.2, INK, 0.8);
    graphics.strokeCircle(point.x, point.y, frame.smellRank >= 2 ? 3.4 : 2.6);
  });
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
