import type * as Phaser from 'phaser';
import { GROUND_Y, INK, PAPER, PAPER_WARM, STAGE_HEIGHT, STAGE_WIDTH, WASH } from './palette';

/** Stepped sketchbook clock (~11 FPS) so motion reads as hand-drawn. */
export function sketchTick(timeMs: number): number {
  return Math.floor(timeMs / 90);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Stable scatter so baked scenery looks hand-placed but never re-rolls. */
export function jitter(seed: number): number {
  const n = Math.sin(seed * 127.1) * 43758.5453;
  return n - Math.floor(n);
}

/** Soft cream wash with a warm band top and bottom. */
export function drawPaperBase(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number
): void {
  g.fillStyle(PAPER, 1);
  g.fillRect(0, 0, width, height);
  g.fillStyle(PAPER_WARM, 0.5);
  g.fillRect(0, 0, width, 40);
  g.fillRect(0, height - 48, width, 48);
}

/**
 * Parallel hatching for shadow mass. Line count is bounded by `spacing`, so
 * callers control the cost directly.
 */
export function drawHatch(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  spacing: number,
  alpha: number,
  lean = 0.5
): void {
  const shift = Math.max(1, height * lean);
  g.lineStyle(1.4, INK, alpha);
  for (let topX = x; topX < x + width + shift; topX += spacing) {
    // Clip the slanted segment to the band so hatching never bleeds outside it.
    const enter = Math.max(0, (topX - (x + width)) / shift);
    const exit = Math.min(1, (topX - x) / shift);
    if (enter >= exit) continue;
    g.lineBetween(
      topX - enter * shift,
      y + enter * height,
      topX - exit * shift,
      y + exit * height
    );
  }
}

/** Irregular ink silhouette — reads more handmade than a circle or ellipse. */
export function drawInkBlob(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  seed: number,
  points = 9
): void {
  g.beginPath();
  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const wobble = 0.86 + jitter(seed + i) * 0.28;
    const px = x + Math.cos(angle) * radiusX * wobble;
    const py = y + Math.sin(angle) * radiusY * wobble;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
}

/** CRT-ish vignette + tape corners. No per-scanline loops. */
export function drawCrtAtmosphere(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number
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
  alpha = 0.16
): void {
  g.fillStyle(INK, alpha);
  g.fillRect(x - width * 0.5, y + 2, width, 4);
  g.fillStyle(INK, alpha * 0.5);
  g.fillRect(x - width * 0.34, y + 6, width * 0.68, 3);
}

/** Hatched earth band, ink horizon, and a light grass scribble. */
export function drawGroundBand(
  g: Phaser.GameObjects.Graphics,
  width: number,
  groundY = GROUND_Y
): void {
  // Trodden lane, then heavier earth below it.
  g.fillStyle(INK, 0.045);
  g.fillRect(0, groundY, width, 34);
  g.fillStyle(INK, 0.09);
  g.fillRect(0, groundY + 34, width, STAGE_HEIGHT - groundY - 34);
  drawHatch(g, 0, groundY + 34, width, 60, 38, 0.06, 0.9);

  g.lineStyle(5, INK, 1);
  g.lineBetween(0, groundY, width, groundY);
  g.lineStyle(1.8, INK, 0.3);
  g.lineBetween(0, groundY + 34, width, groundY + 33);

  // Pebbles and scuffs along the lane.
  g.fillStyle(INK, 0.3);
  for (let x = 24; x < width; x += 47) {
    g.fillRect(x, groundY + 10 + jitter(x * 1.7) * 18, 3 + jitter(x) * 4, 2);
  }

  g.lineStyle(1.8, INK, 0.38);
  for (let x = 16; x < width; x += 44) {
    const h = 8 + jitter(x) * 11;
    g.lineBetween(x, groundY, x - 3, groundY - h);
    g.lineBetween(x, groundY, x + 4, groundY - h * 0.7);
  }
}

/**
 * Single bumpy outline rather than stacked circles — overlapping strokes on
 * pale fill read as a Venn diagram, not a cloud.
 */
export function drawCloud(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
  alpha = 0.35
): void {
  const s = 16 * scale;
  g.fillStyle(PAPER, 1);
  g.lineStyle(1.8, INK, alpha);
  g.beginPath();
  g.arc(x - s * 0.72, y + 3, s * 0.5, Math.PI, 0);
  g.arc(x, y - 4, s * 0.8, Math.PI, 0);
  g.arc(x + s * 0.78, y + 2, s * 0.55, Math.PI, 0);
  g.lineTo(x - s * 1.22, y + 3);
  g.closePath();
  g.fillPath();
  g.strokePath();
}

export function drawBird(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  wingPhase: number,
  alpha = 0.45
): void {
  const flap = wingPhase % 2 === 0 ? -4 : 3;
  g.lineStyle(2, INK, alpha);
  g.beginPath();
  g.moveTo(x - 8, y + flap);
  g.lineTo(x, y);
  g.lineTo(x + 8, y + flap);
  g.strokePath();
}

/**
 * Distant ridge silhouette.
 *
 * Kept as a clean contour over a pale fill: scattered hatch marks at this
 * distance read as specks of dirt on the page rather than as shading.
 */
export function drawMountainRange(
  g: Phaser.GameObjects.Graphics,
  points: ReadonlyArray<readonly [number, number]>,
  alpha = 0.12,
  baseY = GROUND_Y
): void {
  if (points.length < 2) return;

  // Paler crest behind, offset upward. Two flat tones read as depth; loose
  // hatching this far away just looks like dirt on the page.
  fillRidge(g, points, baseY, INK, alpha * 0.6, -30);
  fillRidge(g, points, baseY, INK, alpha, 0);

  g.lineStyle(2, INK, Math.min(0.7, alpha + 0.4));
  g.beginPath();
  g.moveTo(points[0]![0], points[0]![1]);
  for (let i = 1; i < points.length; i += 1) {
    g.lineTo(points[i]![0], points[i]![1]);
  }
  g.strokePath();
}

function fillRidge(
  g: Phaser.GameObjects.Graphics,
  points: ReadonlyArray<readonly [number, number]>,
  baseY: number,
  color: number,
  alpha: number,
  offsetY: number
): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(points[0]![0], points[0]![1] + offsetY);
  for (let i = 1; i < points.length; i += 1) {
    g.lineTo(points[i]![0], points[i]![1] + offsetY);
  }
  g.lineTo(points[points.length - 1]![0], baseY);
  g.lineTo(points[0]![0], baseY);
  g.closePath();
  g.fillPath();
}

/** Varied woodland mark — pine, rounded deciduous, or low bush. */
export function drawTree(
  g: Phaser.GameObjects.Graphics,
  x: number,
  groundY: number,
  kind: 'pine' | 'round' | 'bush',
  scale = 1,
  alpha = 0.55
): void {
  const s = 14 * scale;
  g.lineStyle(2.2, INK, alpha);
  g.fillStyle(PAPER, 0.4);

  if (kind === 'pine') {
    g.lineBetween(x, groundY, x, groundY - s * 0.4);
    g.beginPath();
    g.moveTo(x, groundY - s * 2.5);
    g.lineTo(x - s * 0.7, groundY - s * 0.35);
    g.lineTo(x + s * 0.7, groundY - s * 0.35);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.beginPath();
    g.moveTo(x, groundY - s * 1.75);
    g.lineTo(x - s * 0.95, groundY - s * 0.15);
    g.lineTo(x + s * 0.95, groundY - s * 0.15);
    g.closePath();
    g.strokePath();
    g.lineStyle(1.2, INK, alpha * 0.6);
    g.lineBetween(x - s * 0.4, groundY - s * 0.9, x + s * 0.1, groundY - s * 1.2);
  } else if (kind === 'bush') {
    drawInkBlob(g, x, groundY - s * 0.55, s * 0.8, s * 0.62, x, 7);
    g.fillPath();
    g.strokePath();
  } else {
    g.lineBetween(x, groundY, x, groundY - s * 0.7);
    drawInkBlob(g, x, groundY - s * 1.35, s * 1.15, s * 1, x, 9);
    g.fillPath();
    g.strokePath();
    g.lineStyle(1.2, INK, alpha * 0.55);
    g.lineBetween(x - s * 0.5, groundY - s * 1.1, x - s * 0.1, groundY - s * 1.5);
  }
}

/** Corn stalk for the Bridge field: stalk, tassel, and drooping leaves. */
export function drawCornStalk(
  g: Phaser.GameObjects.Graphics,
  x: number,
  groundY: number,
  height: number,
  sway = 0,
  alpha = 0.75
): void {
  const top = groundY - height;
  g.lineStyle(2.4, INK, alpha);
  g.lineBetween(x, groundY, x + sway, top);
  g.lineStyle(1.6, INK, alpha * 0.8);
  g.lineBetween(x + sway, top, x + sway + 5, top - 11);
  g.lineBetween(x + sway, top, x + sway - 3, top - 9);

  g.fillStyle(INK, alpha * 0.85);
  for (let i = 0; i < 4; i += 1) {
    const at = groundY - height * (0.3 + i * 0.19);
    strokeLeaf(g, x + sway * 0.5, at, (i % 2 === 0 ? 1 : -1) * (26 + i * 7), 16 + i * 4);
  }
}

/**
 * Leaf that leaves the stem flat then droops, built from a short polygon so it
 * reads as foliage instead of an arrowhead.
 */
export function strokeLeaf(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  reach: number,
  droop: number
): void {
  g.beginPath();
  g.moveTo(x, y - 2);
  g.lineTo(x + reach * 0.55, y - 1 + droop * 0.18);
  g.lineTo(x + reach, y + droop);
  g.lineTo(x + reach * 0.5, y + droop * 0.28);
  g.lineTo(x, y + 3);
  g.closePath();
  g.fillPath();
}

export function drawSunOrMoon(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  mode: 'sun' | 'moon' | 'sunset'
): void {
  if (mode === 'sunset') {
    g.lineStyle(2, INK, 0.22);
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
  g.lineStyle(2, INK, 0.25);
  g.lineBetween(x - w * 0.5 + 4, y, x + w * 0.5 + 4, y);
  g.lineBetween(x + w * 0.5, y - h + 4, x + w * 0.5 + 4, y);
}

export { STAGE_WIDTH, STAGE_HEIGHT, GROUND_Y };
