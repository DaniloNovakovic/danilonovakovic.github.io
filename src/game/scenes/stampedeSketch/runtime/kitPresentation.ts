import * as Phaser from 'phaser';

export interface StampedeKitLookFrame {
  x: number;
  y: number;
  nowMs: number;
  disarmed: boolean;
  breathBubbles: readonly { x: number; y: number }[];
  lingerBubbles: readonly { x: number; y: number; untilMs: number }[];
  stinkPoints: readonly { x: number; y: number }[];
  stinkFat: boolean;
  selfieRank: 0 | 1 | 2;
  selfieRear: boolean;
  glassesRank: 0 | 1 | 2;
  shell: { x: number; y: number; ready: boolean } | null;
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
        frame.lingerBubbles.forEach((point, index) => drawBreathBubble(graphics, point, index, frame.nowMs, true));
        frame.breathBubbles.forEach((point, index) => drawBreathBubble(graphics, point, index, frame.nowMs, false));
        frame.stinkPoints.forEach((point) => drawStink(graphics, point.x, point.y, frame.stinkFat));
        if (frame.selfieRank > 0) drawPhone(graphics, frame.x - 18, frame.y + 2);
        if (frame.selfieRank >= 2 || frame.selfieRear) drawPhone(graphics, frame.x + 16, frame.y - 8);
        if (frame.glassesRank > 0) drawLensGlint(graphics, frame);
      }
      if (frame.shell) drawShell(graphics, frame.shell);
      if (frame.disarmed) drawBeerSplash(graphics, frame.x, frame.y - 16);
    },
    reset() {
      graphics.clear().setVisible(false);
    }
  };
}

function drawStink(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  fat: boolean
): void {
  const radius = fat ? 26 : 16;
  graphics.fillStyle(STINK, 0.28);
  graphics.fillCircle(x, y, radius);
  graphics.lineStyle(2.5, INK, 0.9);
  graphics.strokeCircle(x, y, radius);
  graphics.lineStyle(1.6, STINK, 1);
  graphics.beginPath();
  graphics.moveTo(x - 4, y + 2);
  graphics.lineTo(x - 1, y - 4);
  graphics.lineTo(x + 2, y + 1);
  graphics.lineTo(x + 5, y - 3);
  graphics.strokePath();
}

function drawBreathBubble(
  graphics: Phaser.GameObjects.Graphics,
  point: { x: number; y: number; untilMs?: number },
  index: number,
  nowMs: number,
  linger: boolean
): void {
  const wave = Math.sin(nowMs / (linger ? 220 : 160) + index * 1.4);
  const drift = Math.sin(nowMs / (linger ? 340 : 280) + index) * (linger ? 6 : 2.5);
  const bob = Math.cos(nowMs / (linger ? 420 : 240) + index * 0.8) * (linger ? 5 : 3.5);
  const radiusBase = linger ? 6 : 7 + (index % 3) * 2;
  const life = linger
    ? Math.max(0, Math.min(1, ((point.untilMs ?? nowMs) - nowMs) / 1_100))
    : 1;
  const alpha = linger ? 0.32 + life * 0.5 : 0.62 + wave * 0.14;
  drawBubble(
    graphics,
    point.x + drift,
    point.y + bob,
    radiusBase * (0.8 + wave * 0.22),
    alpha
  );
}

function drawShell(
  graphics: Phaser.GameObjects.Graphics,
  shell: { x: number; y: number; ready: boolean }
): void {
  const radius = shell.ready ? 13 : 8;
  graphics.lineStyle(shell.ready ? 2.6 : 1.5, INK, shell.ready ? 0.95 : 0.35);
  graphics.strokeCircle(shell.x, shell.y, radius);
  if (shell.ready) {
    graphics.lineStyle(1.2, 0xfbfbf9, 0.95);
    graphics.strokeCircle(shell.x, shell.y, radius - 4);
  }
}

function drawBubble(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  alpha: number
): void {
  graphics.fillStyle(POISON, alpha * 0.45);
  graphics.fillCircle(x, y, radius);
  graphics.lineStyle(1.8, INK, alpha);
  graphics.strokeCircle(x, y, radius);
  graphics.fillStyle(0xd9f99d, alpha);
  graphics.fillCircle(x - radius * 0.25, y - radius * 0.28, Math.max(1.2, radius * 0.22));
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
