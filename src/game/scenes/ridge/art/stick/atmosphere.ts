import type * as Phaser from 'phaser';
import { GROUND_Y, INK, PAPER, PAPER_WARM, STAGE_HEIGHT, STAGE_WIDTH, WASH } from './palette';

/** Stepped sketchbook clock (~10–12 FPS) so motion feels hand-drawn. */
export function sketchTick(timeMs: number): number {
  return Math.floor(timeMs / 90);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Soft cream wash. No notebook ruling lines / grain loops. */
export function drawPaperBase(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
  g.fillStyle(PAPER, 1);
  g.fillRect(0, 0, width, height);
  g.fillStyle(PAPER_WARM, 0.5);
  g.fillRect(0, 0, width, 40);
  g.fillRect(0, height - 48, width, 48);
}

/** CRT-ish vignette + tape corners. No per-scanline loops. */
export function drawCrtAtmosphere(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  _tick: number,
  _motion: boolean
): void {
  g.fillStyle(WASH, 0.1);
  g.fillRect(0, 0, width, 16);
  g.fillRect(0, height - 18, width, 18);
  g.fillRect(0, 0, 14, height);
  g.fillRect(width - 14, 0, 14, height);

  g.fillStyle(WASH, 0.07);
  g.fillTriangle(0, 0, 100, 0, 0, 80);
  g.fillTriangle(width, 0, width - 100, 0, width, 80);
  g.fillTriangle(0, height, 120, height, 0, height - 90);
  g.fillTriangle(width, height, width - 120, height, width, height - 90);

  g.lineStyle(2.2, INK, 0.5);
  g.fillStyle(PAPER_WARM, 0.9);
  drawTape(g, 16, 12, 54, 14, -12);
  drawTape(g, width - 72, 14, 54, 14, 10);
  drawTape(g, 20, height - 30, 48, 12, 8);
  drawTape(g, width - 74, height - 28, 50, 12, -6);
}

function drawTape(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  tiltHint: number
): void {
  // tiltHint only shifts one corner slightly for imperfect tape
  g.fillRect(x, y, w, h);
  g.strokeRect(x, y, w, h);
  g.lineStyle(1, INK, 0.2);
  g.lineBetween(x + 4, y + h * 0.35, x + w - 4 + tiltHint * 0.05, y + h * 0.35);
  g.lineStyle(2, INK, 0.35);
}

/** Tiny foot shadow — avoid fillEllipse (32-point tessellation per call). */
export function drawContactShadow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width = 28,
  alpha = 0.14
): void {
  g.fillStyle(INK, alpha);
  g.fillRect(x - width * 0.5, y + 2, width, 4);
}

/** Soft ground band + a light grass scribble. */
export function drawGroundBand(
  g: Phaser.GameObjects.Graphics,
  width: number,
  groundY = GROUND_Y
): void {
  g.fillStyle(INK, 0.04);
  g.fillRect(0, groundY, width, STAGE_HEIGHT - groundY);
  g.lineStyle(4, INK, 1);
  g.lineBetween(0, groundY, width, groundY);

  g.lineStyle(1.6, INK, 0.3);
  for (let x = 16; x < width; x += 64) {
    const h = 7 + ((x * 3) % 8);
    g.lineBetween(x, groundY, x - 2, groundY - h);
    g.lineBetween(x, groundY, x + 3, groundY - h * 0.7);
  }
}

export function drawCloud(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
  alpha = 0.35
): void {
  g.lineStyle(1.8, INK, alpha);
  g.fillStyle(PAPER, 0.65);
  const s = 16 * scale;
  // Circles instead of default 32-point ellipses
  g.fillCircle(x, y, s * 0.85);
  g.fillCircle(x - s * 0.55, y + 2, s * 0.55);
  g.fillCircle(x + s * 0.6, y + 1, s * 0.6);
  g.strokeCircle(x, y, s * 0.85);
  g.strokeCircle(x - s * 0.55, y + 2, s * 0.55);
  g.strokeCircle(x + s * 0.6, y + 1, s * 0.6);
}

export function drawBird(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  wingPhase: number
): void {
  const flap = wingPhase % 2 === 0 ? -4 : 3;
  g.lineStyle(2, INK, 0.45);
  g.beginPath();
  g.moveTo(x - 8, y + flap);
  g.lineTo(x, y);
  g.lineTo(x + 8, y + flap);
  g.strokePath();
}

/** Distant mountain silhouette (solid fill, not translucent). */
export function drawMountainRange(
  g: Phaser.GameObjects.Graphics,
  points: ReadonlyArray<readonly [number, number]>,
  alpha = 0.12
): void {
  if (points.length < 2) return;
  g.fillStyle(INK, alpha);
  g.beginPath();
  g.moveTo(points[0]![0], points[0]![1]);
  for (let i = 1; i < points.length; i += 1) {
    g.lineTo(points[i]![0], points[i]![1]);
  }
  g.lineTo(points[points.length - 1]![0], GROUND_Y);
  g.lineTo(points[0]![0], GROUND_Y);
  g.closePath();
  g.fillPath();

  g.lineStyle(1.5, INK, alpha + 0.15);
  g.beginPath();
  g.moveTo(points[0]![0], points[0]![1]);
  for (let i = 1; i < points.length; i += 1) {
    g.lineTo(points[i]![0], points[i]![1]);
  }
  g.strokePath();
}

/** Varied woodland mark — pine or rounded deciduous blob. */
export function drawTree(
  g: Phaser.GameObjects.Graphics,
  x: number,
  groundY: number,
  kind: 'pine' | 'round' | 'bush',
  scale = 1,
  alpha = 0.55
): void {
  const s = 14 * scale;
  g.lineStyle(2, INK, alpha);
  g.fillStyle(PAPER, 0.35);

  if (kind === 'pine') {
    g.lineBetween(x, groundY, x, groundY - s * 0.4);
    g.beginPath();
    g.moveTo(x, groundY - s * 2.4);
    g.lineTo(x - s * 0.7, groundY - s * 0.35);
    g.lineTo(x + s * 0.7, groundY - s * 0.35);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.beginPath();
    g.moveTo(x, groundY - s * 1.7);
    g.lineTo(x - s * 0.95, groundY - s * 0.15);
    g.lineTo(x + s * 0.95, groundY - s * 0.15);
    g.closePath();
    g.strokePath();
  } else if (kind === 'bush') {
    g.fillCircle(x, groundY - s * 0.55, s * 0.7);
    g.strokeCircle(x, groundY - s * 0.55, s * 0.7);
  } else {
    g.lineBetween(x, groundY, x, groundY - s * 0.7);
    g.fillCircle(x, groundY - s * 1.35, s * 0.85);
    g.strokeCircle(x, groundY - s * 1.35, s * 0.85);
    g.fillCircle(x - s * 0.45, groundY - s * 1.15, s * 0.5);
    g.strokeCircle(x - s * 0.45, groundY - s * 1.15, s * 0.5);
    g.fillCircle(x + s * 0.4, groundY - s * 1.2, s * 0.55);
    g.strokeCircle(x + s * 0.4, groundY - s * 1.2, s * 0.55);
  }
}

/** Corn stalk silhouette for Bridge field. */
export function drawCornStalk(
  g: Phaser.GameObjects.Graphics,
  x: number,
  groundY: number,
  height: number,
  sway = 0
): void {
  g.lineStyle(2.2, INK, 0.75);
  g.lineBetween(x, groundY, x + sway, groundY - height);
  g.lineBetween(x + sway, groundY - height, x + sway + 7, groundY - height - 9);
  g.lineStyle(1.5, INK, 0.4);
  g.lineBetween(x + sway * 0.5, groundY - height * 0.55, x + sway * 0.5 - 10, groundY - height * 0.45);
  g.lineBetween(x + sway * 0.5, groundY - height * 0.4, x + sway * 0.5 + 9, groundY - height * 0.32);
}

export function drawSunOrMoon(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  mode: 'sun' | 'moon' | 'sunset'
): void {
  if (mode === 'sunset') {
    g.lineStyle(2, INK, 0.25);
    for (let i = 0; i < 5; i += 1) {
      g.strokeCircle(x, y, radius + i * 26);
    }
    g.fillStyle(INK, 0.08);
    g.fillCircle(x, y, radius);
    g.lineStyle(2.5, INK, 0.7);
    g.strokeCircle(x, y, radius);
    return;
  }

  if (mode === 'moon') {
    g.fillStyle(PAPER, 0.9);
    g.fillCircle(x, y, radius);
    g.lineStyle(2.2, INK, 0.7);
    g.strokeCircle(x, y, radius);
    g.lineStyle(1.4, INK, 0.35);
    g.strokeCircle(x - radius * 0.25, y - radius * 0.15, radius * 0.18);
    g.strokeCircle(x + radius * 0.3, y + radius * 0.2, radius * 0.12);
    // crescent hint
    g.fillStyle(PAPER_WARM, 0.5);
    g.fillCircle(x + radius * 0.35, y - radius * 0.1, radius * 0.72);
    return;
  }

  g.lineStyle(2, INK, 0.45);
  g.strokeCircle(x, y, radius);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    g.lineBetween(
      x + Math.cos(a) * (radius + 4),
      y + Math.sin(a) * (radius + 4),
      x + Math.cos(a) * (radius + 14),
      y + Math.sin(a) * (radius + 14)
    );
  }
}

/** Tiny margin caption — storytelling scrap, not UI. */
export function drawMarginNote(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number
): void {
  g.lineStyle(1.5, INK, 0.28);
  g.strokeRect(x, y, width, 22);
  g.lineBetween(x + 6, y + 8, x + width - 8, y + 8);
  g.lineBetween(x + 6, y + 14, x + width * 0.55, y + 14);
}

export function drawPaperBacking(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  g.fillStyle(PAPER_WARM, 0.9);
  g.fillRect(x - w * 0.5, y - h, w, h);
  g.lineStyle(2, INK, 0.55);
  g.strokeRect(x - w * 0.5, y - h, w, h);
  // hard offset shadow
  g.lineStyle(2, INK, 0.25);
  g.lineBetween(x - w * 0.5 + 4, y, x + w * 0.5 + 4, y);
  g.lineBetween(x + w * 0.5, y - h + 4, x + w * 0.5 + 4, y);
}

export { STAGE_WIDTH, STAGE_HEIGHT, GROUND_Y };
