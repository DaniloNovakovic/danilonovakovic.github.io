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
  guitar: StampedeGuitarLookFrame | null;
  shell: { x: number; y: number; ready: boolean } | null;
}

export interface StampedeGuitarLookFrame {
  velocity: { x: number; y: number };
  notes: readonly { x: number; y: number; bornAtMs: number; untilMs: number; glyph: number }[];
  chord: { x: number; y: number; atMs: number; radius: number } | null;
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
const GUITAR_RED = 0xb91c1c;
const GUITAR_DARK = 0x7f1d1d;
const FLAME = 0xf97316;
const FLAME_HOT = 0xfde047;
const CHORD_MS = 420;

export function createStampedeKitLook(scene: Phaser.Scene): StampedeKitLook {
  const graphics = scene.add.graphics().setDepth(31);
  const ground = scene.add.graphics().setDepth(16);
  const stink = new StinkCloudLook(graphics, ground);

  return {
    sync(frame) {
      graphics
        .clear()
        .setVisible(true)
        .setAlpha(frame.disarmed ? 0.28 : 1);
      ground.clear().setVisible(true);
      if (frame.disarmed) {
        stink.sync(frame, true);
        drawBeerSplash(graphics, frame.x, frame.y - 16);
      } else {
        if (frame.guitar) drawGuitar(graphics, ground, frame, frame.guitar);
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
    this.trails = frame.stinkPoints.map((point, index) =>
      [{ x: point.x, y: point.y }, ...(this.trails[index] ?? [])].slice(0, TRAIL_LENGTH)
    );
  }
}

function drawGuitar(
  graphics: Phaser.GameObjects.Graphics,
  ground: Phaser.GameObjects.Graphics,
  frame: StampedeKitLookFrame,
  guitar: StampedeGuitarLookFrame
): void {
  guitar.notes.forEach((note) => drawNote(ground, note, frame.nowMs));
  const speed = Math.hypot(guitar.velocity.x, guitar.velocity.y);
  if (speed > 160) drawSpeedLines(graphics, frame, guitar.velocity, speed);
  drawFlyingV(ground, frame.x, frame.y + 19, guitar.velocity, frame.nowMs, speed);
  if (guitar.chord) drawChord(graphics, guitar.chord, frame.nowMs);
}

/** The board: a Flying V lying flat under the rider, headstock pointing where you surf. */
function drawFlyingV(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  velocity: { x: number; y: number },
  nowMs: number,
  speed: number
): void {
  const facing = velocity.x < -1 ? -1 : 1;
  const tilt = Phaser.Math.Clamp(velocity.y / 260, -0.35, 0.35) * facing;
  const bob = speed > 40 ? Math.sin(nowMs / 70) * 0.8 : 0;
  const point = (along: number, side: number) => {
    const ax = along * facing;
    return {
      x: x + ax * Math.cos(tilt) - side * Math.sin(tilt),
      y: y + bob + ax * Math.sin(tilt) + side * Math.cos(tilt)
    };
  };

  graphics.fillStyle(INK, 0.18);
  graphics.fillEllipse(x, y + 6, 54, 9);

  // V body at the tail, two prongs splayed back.
  const body = [point(-4, 0), point(-26, -9), point(-22, -3), point(-12, 0), point(-22, 3), point(-26, 9)];
  graphics.fillStyle(GUITAR_RED, 1);
  tracePoly(graphics, body).fillPath();
  graphics.lineStyle(2, INK, 1);
  tracePoly(graphics, body).strokePath();

  // Neck and headstock up front.
  const neckA = point(-6, -1.6);
  const neckB = point(18, -1.6);
  const neckC = point(18, 1.6);
  const neckD = point(-6, 1.6);
  graphics.fillStyle(0x8b5a2b, 1);
  tracePoly(graphics, [neckA, neckB, neckC, neckD]).fillPath();
  graphics.lineStyle(1.4, INK, 1);
  tracePoly(graphics, [neckA, neckB, neckC, neckD]).strokePath();
  const head = [point(18, -3), point(26, -4.5), point(27, 1), point(18, 3)];
  graphics.fillStyle(INK, 1);
  tracePoly(graphics, head).fillPath();

  // Strings catch the light.
  graphics.lineStyle(0.8, PAPER, 0.85);
  const s1 = point(-14, -0.6);
  const s2 = point(20, -0.6);
  graphics.lineBetween(s1.x, s1.y, s2.x, s2.y);
  const s3 = point(-14, 0.8);
  const s4 = point(20, 0.8);
  graphics.lineBetween(s3.x, s3.y, s4.x, s4.y);
  graphics.fillStyle(GUITAR_DARK, 1);
  const pickup = point(-11, 0);
  graphics.fillCircle(pickup.x, pickup.y, 1.6);
}

type Pt = { x: number; y: number };

function tracePoly(graphics: Phaser.GameObjects.Graphics, points: readonly Pt[]): Phaser.GameObjects.Graphics {
  graphics.beginPath();
  points.forEach((point, index) => {
    if (index === 0) graphics.moveTo(point.x, point.y);
    else graphics.lineTo(point.x, point.y);
  });
  graphics.closePath();
  return graphics;
}

function drawNote(
  graphics: Phaser.GameObjects.Graphics,
  note: { x: number; y: number; bornAtMs: number; untilMs: number; glyph: number },
  nowMs: number
): void {
  const life = Phaser.Math.Clamp((note.untilMs - nowMs) / Math.max(1, note.untilMs - note.bornAtMs), 0, 1);
  const pop = Math.min(1, (nowMs - note.bornAtMs) / 120);
  const alpha = Math.min(1, life * 2.2) * pop;
  if (alpha <= 0.02) return;
  const flicker = Math.sin(nowMs / 55 + note.x * 0.3) * 1.5;
  const x = note.x;
  const y = note.y - (1 - life) * 6;

  // Little floor flame under each note.
  graphics.fillStyle(FLAME, 0.32 * alpha);
  graphics.fillEllipse(x, y + 5, 20, 7);
  graphics.fillStyle(FLAME, 0.75 * alpha);
  graphics.fillTriangle(x - 5, y + 5, x + 5, y + 5, x + flicker * 0.5, y - 6 - flicker);
  graphics.fillStyle(FLAME_HOT, 0.85 * alpha);
  graphics.fillTriangle(x - 2.5, y + 5, x + 2.5, y + 5, x, y - 1 - flicker * 0.5);

  graphics.fillStyle(INK, alpha);
  graphics.lineStyle(1.6, INK, alpha);
  const glyph = note.glyph % 4;
  if (glyph === 1) {
    // Beamed pair.
    graphics.fillEllipse(x - 5, y + 2, 6, 4.4);
    graphics.fillEllipse(x + 4, y + 1, 6, 4.4);
    graphics.lineBetween(x - 2.3, y + 2, x - 2.3, y - 9);
    graphics.lineBetween(x + 6.7, y + 1, x + 6.7, y - 10);
    graphics.lineStyle(2.4, INK, alpha);
    graphics.lineBetween(x - 2.3, y - 9, x + 6.7, y - 10);
    return;
  }
  graphics.fillEllipse(x, y + 2, 6.4, 4.6);
  graphics.lineBetween(x + 2.8, y + 2, x + 2.8, y - 10);
  if (glyph === 0 || glyph === 3) {
    graphics.beginPath();
    graphics.moveTo(x + 2.8, y - 10);
    graphics.lineTo(x + 7, y - 6);
    graphics.lineTo(x + 6, y - 3);
    graphics.strokePath();
  }
  if (glyph === 3) {
    graphics.beginPath();
    graphics.moveTo(x + 2.8, y - 7);
    graphics.lineTo(x + 6.5, y - 3.5);
    graphics.strokePath();
  }
}

function drawSpeedLines(
  graphics: Phaser.GameObjects.Graphics,
  frame: StampedeKitLookFrame,
  velocity: { x: number; y: number },
  speed: number
): void {
  const backX = -velocity.x / speed;
  const backY = -velocity.y / speed;
  const sideX = -backY;
  const sideY = backX;
  const strength = Phaser.Math.Clamp((speed - 160) / 140, 0, 1);
  graphics.lineStyle(1.4, INK, 0.45 * strength);
  [-10, 0, 10].forEach((offset, index) => {
    const jitter = (Math.floor(frame.nowMs / 60) + index) % 3;
    const start = 22 + jitter * 3;
    const length = 10 + strength * 14;
    const sx = frame.x + backX * start + sideX * offset;
    const sy = frame.y + backY * start + sideY * offset;
    graphics.lineBetween(sx, sy, sx + backX * length, sy + backY * length);
  });
}

/** Power chord: a jagged ink ring that slams outward with a few lightning ticks. */
function drawChord(
  graphics: Phaser.GameObjects.Graphics,
  chord: { x: number; y: number; atMs: number; radius: number },
  nowMs: number
): void {
  const age = nowMs - chord.atMs;
  if (age < 0 || age > CHORD_MS) return;
  const t = age / CHORD_MS;
  const radius = chord.radius * Phaser.Math.Easing.Cubic.Out(t);
  const alpha = 1 - t;
  const points: Array<{ x: number; y: number }> = [];
  const spikes = 18;
  for (let index = 0; index < spikes; index += 1) {
    const angle = (index / spikes) * Math.PI * 2;
    const r = radius * (index % 2 === 0 ? 1 : 0.88);
    points.push({ x: chord.x + Math.cos(angle) * r, y: chord.y + Math.sin(angle) * r * 0.82 });
  }
  graphics.fillStyle(FLAME, 0.12 * alpha);
  tracePoly(graphics, points).fillPath();
  graphics.lineStyle(3, INK, alpha);
  tracePoly(graphics, points).strokePath();
  graphics.lineStyle(1.6, GUITAR_RED, alpha);
  [0.3, 1.9, 3.4, 4.9].forEach((angle) => {
    const inner = radius * 0.45;
    const outer = radius * 0.95;
    const mid = (inner + outer) / 2;
    graphics.beginPath();
    graphics.moveTo(chord.x + Math.cos(angle) * inner, chord.y + Math.sin(angle) * inner * 0.82);
    graphics.lineTo(chord.x + Math.cos(angle + 0.12) * mid, chord.y + Math.sin(angle + 0.12) * mid * 0.82);
    graphics.lineTo(chord.x + Math.cos(angle - 0.06) * mid, chord.y + Math.sin(angle - 0.06) * mid * 0.82);
    graphics.lineTo(chord.x + Math.cos(angle) * outer, chord.y + Math.sin(angle) * outer * 0.82);
    graphics.strokePath();
  });
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
    const rise = (nowMs / 9 + line * 13 + index * 5) % 14;
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
  const life = linger ? Math.max(0, Math.min(1, ((point.untilMs ?? nowMs) - nowMs) / 1_100)) : 1;
  const alpha = linger ? 0.32 + life * 0.5 : 0.7 + wave * 0.14;
  drawBubble(graphics, point.x + drift, point.y + bob, radiusBase * (0.8 + wave * 0.22), alpha);
}

function drawShell(graphics: Phaser.GameObjects.Graphics, shell: { x: number; y: number; ready: boolean }): void {
  const radius = shell.ready ? 13 : 8;
  graphics.lineStyle(shell.ready ? 2.6 : 1.5, INK, shell.ready ? 0.95 : 0.35);
  graphics.strokeCircle(shell.x, shell.y, radius);
  if (shell.ready) {
    graphics.lineStyle(1.2, PAPER, 0.95);
    graphics.strokeCircle(shell.x, shell.y, radius - 4);
  }
}

function drawBubble(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, alpha: number): void {
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

function drawLensGlint(graphics: Phaser.GameObjects.Graphics, frame: StampedeKitLookFrame): void {
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
