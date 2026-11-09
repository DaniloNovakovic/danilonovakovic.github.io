import * as Phaser from 'phaser';

export interface StampedeKitLookFrame {
  x: number;
  y: number;
  nowMs: number;
  disarmed: boolean;
  breathBubbles: readonly { x: number; y: number }[];
  lingerBubbles: readonly { x: number; y: number; untilMs: number }[];
  stinkPoints: readonly { x: number; y: number }[];
  /** Hit radius of each stink cloud; the drawn cloud fills exactly this circle. */
  stinkRadius: number;
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
const PAPER = 0xfbfbf9;
const POISON = 0x6f9f3a;
const STINK = 0xa3b24e;
const STINK_DARK = 0x6f7a2c;
const AMBER = 0xf0a202;
const STINK_GROW_MS = 380;
const TRAIL_LENGTH = 7;
const TRAIL_EVERY_MS = 45;

export function createStampedeKitLook(scene: Phaser.Scene): StampedeKitLook {
  const graphics = scene.add.graphics().setDepth(31);
  const ground = scene.add.graphics().setDepth(16);
  const stink = new StinkCloudLook(graphics, ground);

  return {
    sync(frame) {
      graphics.clear().setVisible(true).setAlpha(frame.disarmed ? 0.28 : 1);
      ground.clear().setVisible(true);
      if (frame.disarmed) {
        stink.sync(frame, true);
        drawBeerSplash(graphics, frame.x, frame.y - 16);
      } else {
        drawBreath(graphics, frame);
        stink.sync(frame, false);
        drawGear(graphics, frame);
      }
      if (frame.shell) drawShell(graphics, frame.shell);
    },
    reset() {
      graphics.clear().setVisible(false);
      ground.clear().setVisible(false);
      stink.reset();
    }
  };
}

/** Pops out of the player when first owned, then leaves a short trail as it orbits. */
class StinkCloudLook {
  private bornAtMs: number | null = null;
  private trails: Array<Array<{ x: number; y: number }>> = [];
  private lastTrailAtMs = 0;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly ground: Phaser.GameObjects.Graphics;

  constructor(graphics: Phaser.GameObjects.Graphics, ground: Phaser.GameObjects.Graphics) {
    this.graphics = graphics;
    this.ground = ground;
  }

  sync(frame: StampedeKitLookFrame, hidden: boolean): void {
    if (frame.stinkPoints.length === 0) {
      this.reset();
      return;
    }
    if (hidden) return;
    this.bornAtMs ??= frame.nowMs;
    const grow = Math.min(1, (frame.nowMs - this.bornAtMs) / STINK_GROW_MS);
    const growScale = grow < 1 ? Phaser.Math.Easing.Back.Out(grow) : 1;
    const radius = frame.stinkRadius * growScale;
    this.recordTrail(frame);
    this.trails.forEach((trail) => drawStinkTrail(this.graphics, trail, radius));
    frame.stinkPoints.forEach((point, index) => {
      const x = frame.x + (point.x - frame.x) * growScale;
      const y = frame.y + (point.y - frame.y) * growScale;
      drawStinkCloud(this.graphics, this.ground, x, y, radius, frame.nowMs, index);
    });
  }

  reset(): void {
    this.bornAtMs = null;
    this.trails = [];
  }

  private recordTrail(frame: StampedeKitLookFrame): void {
    if (frame.nowMs - this.lastTrailAtMs < TRAIL_EVERY_MS) return;
    this.lastTrailAtMs = frame.nowMs;
    this.trails = frame.stinkPoints.map((point, index) => (
      [{ x: point.x, y: point.y }, ...(this.trails[index] ?? [])].slice(0, TRAIL_LENGTH)
    ));
  }
}

function drawBreath(graphics: Phaser.GameObjects.Graphics, frame: StampedeKitLookFrame): void {
  frame.lingerBubbles.forEach((point, index) => drawBreathBubble(graphics, point, index, frame.nowMs, true));
  frame.breathBubbles.forEach((point, index) => drawBreathBubble(graphics, point, index, frame.nowMs, false));
}

function drawGear(graphics: Phaser.GameObjects.Graphics, frame: StampedeKitLookFrame): void {
  if (frame.selfieRank > 0) drawPhone(graphics, frame.x - 18, frame.y + 2);
  if (frame.selfieRank >= 2 || frame.selfieRear) drawPhone(graphics, frame.x + 16, frame.y - 8);
  if (frame.glassesRank > 0) drawLensGlint(graphics, frame);
}

function drawStinkCloud(
  graphics: Phaser.GameObjects.Graphics,
  ground: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  nowMs: number,
  index: number
): void {
  if (radius <= 1) return;
  ground.fillStyle(STINK_DARK, 0.16);
  ground.fillEllipse(x, y + radius * 0.95, radius * 2, radius * 0.6);

  const blobs = cloudBlobs(x, y, radius, nowMs, index);
  graphics.fillStyle(INK, 1);
  blobs.forEach((blob) => graphics.fillCircle(blob.x, blob.y, blob.r + 2.4));
  graphics.fillStyle(STINK, 1);
  blobs.forEach((blob) => graphics.fillCircle(blob.x, blob.y, blob.r));
  graphics.fillStyle(0xd7e08f, 0.9);
  graphics.fillCircle(x - radius * 0.35, y - radius * 0.4, radius * 0.18);

  graphics.fillStyle(INK, 1);
  const blink = Math.floor(nowMs / 140 + index * 7) % 23 === 0;
  if (blink) {
    graphics.lineStyle(1.6, INK, 1);
    graphics.lineBetween(x - radius * 0.38, y - radius * 0.05, x - radius * 0.14, y - radius * 0.05);
    graphics.lineBetween(x + radius * 0.14, y - radius * 0.05, x + radius * 0.38, y - radius * 0.05);
  } else {
    graphics.fillCircle(x - radius * 0.26, y - radius * 0.05, Math.max(1.4, radius * 0.09));
    graphics.fillCircle(x + radius * 0.26, y - radius * 0.05, Math.max(1.4, radius * 0.09));
  }
  graphics.lineStyle(1.8, INK, 1);
  graphics.beginPath();
  graphics.moveTo(x - radius * 0.3, y + radius * 0.3);
  graphics.lineTo(x - radius * 0.1, y + radius * 0.2);
  graphics.lineTo(x + radius * 0.1, y + radius * 0.32);
  graphics.lineTo(x + radius * 0.3, y + radius * 0.22);
  graphics.strokePath();

  graphics.lineStyle(2, STINK_DARK, 0.9);
  [-0.45, 0, 0.45].forEach((offset, line) => {
    const rise = ((nowMs / 9 + line * 13 + index * 5) % 14);
    const lx = x + radius * offset;
    const ly = y - radius - 2 - rise;
    graphics.beginPath();
    graphics.moveTo(lx, ly + 8);
    graphics.lineTo(lx + 2.5, ly + 5);
    graphics.lineTo(lx - 2, ly + 2.5);
    graphics.lineTo(lx + 1.5, ly);
    graphics.strokePath();
  });
}

function cloudBlobs(
  x: number,
  y: number,
  radius: number,
  nowMs: number,
  index: number
): Array<{ x: number; y: number; r: number }> {
  const wobble = (seed: number) => 1 + Math.sin(nowMs / 160 + seed + index * 2) * 0.07;
  return [
    { x, y, r: radius * 0.72 * wobble(0) },
    { x: x - radius * 0.45, y: y + radius * 0.18, r: radius * 0.52 * wobble(1) },
    { x: x + radius * 0.45, y: y + radius * 0.18, r: radius * 0.52 * wobble(2) },
    { x: x - radius * 0.25, y: y - radius * 0.38, r: radius * 0.5 * wobble(3) },
    { x: x + radius * 0.3, y: y - radius * 0.33, r: radius * 0.46 * wobble(4) }
  ];
}

function drawStinkTrail(
  graphics: Phaser.GameObjects.Graphics,
  trail: readonly { x: number; y: number }[],
  radius: number
): void {
  trail.forEach((point, age) => {
    if (age === 0) return;
    const fade = 1 - age / TRAIL_LENGTH;
    graphics.fillStyle(STINK, 0.35 * fade);
    graphics.fillCircle(point.x, point.y, radius * 0.5 * fade);
    graphics.lineStyle(1.2, INK, 0.3 * fade);
    graphics.strokeCircle(point.x, point.y, radius * 0.5 * fade);
  });
}

const BREATH_PULSE = {
  linger: { waveMs: 220, driftMs: 340, bobMs: 420, drift: 6, bob: 5 },
  burst: { waveMs: 160, driftMs: 280, bobMs: 240, drift: 2.5, bob: 3.5 }
} as const;

function drawBreathBubble(
  graphics: Phaser.GameObjects.Graphics,
  point: { x: number; y: number; untilMs?: number },
  index: number,
  nowMs: number,
  linger: boolean
): void {
  const pulse = linger ? BREATH_PULSE.linger : BREATH_PULSE.burst;
  const wave = Math.sin(nowMs / pulse.waveMs + index * 1.4);
  const drift = Math.sin(nowMs / pulse.driftMs + index) * pulse.drift;
  const bob = Math.cos(nowMs / pulse.bobMs + index * 0.8) * pulse.bob;
  const radiusBase = linger ? 6 : 7 + (index % 3) * 2;
  const life = linger
    ? Math.max(0, Math.min(1, ((point.untilMs ?? nowMs) - nowMs) / 1_100))
    : 1;
  const alpha = linger ? 0.32 + life * 0.5 : 0.7 + wave * 0.14;
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
    graphics.lineStyle(1.2, PAPER, 0.95);
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
  graphics.fillStyle(POISON, alpha * 0.5);
  graphics.fillCircle(x, y, radius);
  graphics.lineStyle(1.8, INK, alpha);
  graphics.strokeCircle(x, y, radius);
  graphics.fillStyle(0xd9f99d, alpha);
  graphics.fillCircle(x - radius * 0.25, y - radius * 0.28, Math.max(1.2, radius * 0.22));
}

function drawPhone(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
  graphics.fillStyle(PAPER, 1);
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
  graphics.fillStyle(PAPER, 0.95);
  graphics.fillCircle(x - 5, y - 2, 1.4);
  graphics.fillCircle(x + 3, y - 1, 1.2);
}
