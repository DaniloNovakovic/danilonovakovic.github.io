// Each area authors three parallax bands; the branching is set-dressing data.
// fallow-ignore-file complexity
import type * as Phaser from 'phaser';
import type { RidgeAreaId } from '@/game/core/ridge';
import type { RidgeVisualViewModel } from '../types';
import {
  drawCornStalk,
  drawGroundBand,
  drawHatch,
  drawInkBlob,
  drawMountainRange,
  drawPaperBase,
  drawPaperBacking,
  drawSunOrMoon,
  drawTree,
  GROUND_Y,
  jitter,
  STAGE_WIDTH,
  strokeLeaf
} from './atmosphere';
import { HORIZON_Y, INK, LAYERS, PAPER, PAPER_WARM, SKY_TOP } from './palette';

/**
 * Parallax band being baked.
 * - `far` owns the sky wash and everything past the horizon.
 * - `near` is transparent except for the playable lane and its set dressing.
 * - `fore` is the framing silhouette that slides past the camera fastest.
 */
export type SceneryLayer = 'far' | 'near' | 'fore';

export interface AreaSetContext {
  worldXForProgress: (progress: number) => number;
}

export function drawRidgeAreaLayer(
  g: Phaser.GameObjects.Graphics,
  layer: SceneryLayer,
  areaId: RidgeAreaId,
  crossingOpen: boolean,
  beat: RidgeVisualViewModel['beat'],
  ctx: AreaSetContext
): void {
  if (layer === 'far') {
    drawPaperBase(g, STAGE_WIDTH, HORIZON_Y);
    drawFarBand(g, areaId);
    return;
  }
  if (layer === 'fore') {
    drawForeBand(g, areaId);
    return;
  }

  drawGroundBand(g, STAGE_WIDTH);
  drawTreeline(g, areaId);

  if (areaId === 'bridge') drawBridgeNear(g, crossingOpen, ctx);
  else if (areaId === 'concert') drawConcertNear(g, crossingOpen, ctx);
  else if (areaId === 'danceFestival') drawDanceNear(g, crossingOpen, ctx);
  else drawRelayNear(g, beat, ctx);
}

// --- far band -------------------------------------------------------------

function drawFarBand(g: Phaser.GameObjects.Graphics, areaId: RidgeAreaId): void {
  if (areaId === 'concert') {
    g.fillStyle(INK, 0.1);
    g.fillRect(0, 0, STAGE_WIDTH, HORIZON_Y);
    drawHatch(g, 0, SKY_TOP, STAGE_WIDTH, 90, 44, 0.08, 0.7);
    drawSunOrMoon(g, STAGE_WIDTH - 240, SKY_TOP + 46, 28, 'moon');
    g.fillStyle(INK, 0.4);
    for (let i = 0; i < 26; i += 1) {
      const sx = jitter(i * 3.1) * STAGE_WIDTH;
      const sy = SKY_TOP + 10 + jitter(i * 7.7) * 150;
      g.fillRect(sx, sy, 2, 2);
    }
    drawMountainRange(g, ridgeLine(areaId), 0.14, HORIZON_Y);
    return;
  }

  if (areaId === 'relay') {
    drawSunOrMoon(g, STAGE_WIDTH * 0.66, SKY_TOP + 100, 42, 'sunset');
    drawMountainRange(g, ridgeLine(areaId), 0.12, HORIZON_Y);
    return;
  }

  drawSunOrMoon(g, areaId === 'bridge' ? 210 : 250, SKY_TOP + 56, 27, 'sun');
  drawMountainRange(g, ridgeLine(areaId), areaId === 'bridge' ? 0.09 : 0.075, HORIZON_Y);

  if (areaId === 'bridge') {
    // Distant town on the far ridge — a promise of somewhere to walk toward.
    g.lineStyle(1.6, INK, 0.3);
    const townY = HORIZON_Y - 58;
    for (let i = 0; i < 7; i += 1) {
      const h = 22 + (i % 3) * 12;
      g.strokeRect(1180 + i * 16, townY - h, 11, h);
    }
    g.lineBetween(1170, townY, 1310, townY);
  }
}

/** Peaks live in the upper half of the visible sky, never above it. */
function ridgeLine(areaId: RidgeAreaId): ReadonlyArray<readonly [number, number]> {
  const crest = SKY_TOP + 74;
  switch (areaId) {
    case 'bridge':
      return [
        [0, crest + 46],
        [280, crest],
        [560, crest + 34],
        [860, crest - 22],
        [1180, crest + 28],
        [STAGE_WIDTH, crest + 6]
      ];
    case 'concert':
      return [
        [0, crest + 58],
        [340, crest + 12],
        [700, crest + 48],
        [1080, crest + 4],
        [STAGE_WIDTH, crest + 40]
      ];
    case 'relay':
      return [
        [0, crest + 44],
        [360, crest - 18],
        [760, crest + 26],
        [1140, crest - 32],
        [STAGE_WIDTH, crest + 10]
      ];
    default:
      return [
        [0, crest + 62],
        [400, crest + 18],
        [800, crest + 52],
        [1200, crest + 2],
        [STAGE_WIDTH, crest + 36]
      ];
  }
}

/**
 * Two bands of massed canopy stitching the horizon to the playable lane.
 * Individual little trees at this distance read as specks; a silhouette reads
 * as woodland.
 */
function drawTreeline(g: Phaser.GameObjects.Graphics, areaId: RidgeAreaId): void {
  // Haze gap: a pale strip separating the distant ridge from the woodland, so
  // the two masses do not merge into one flat slab.
  g.fillStyle(PAPER, 0.72);
  g.fillRect(0, GROUND_Y - 128, STAGE_WIDTH, 46);
  g.fillStyle(PAPER, 0.4);
  g.fillRect(0, GROUND_Y - 148, STAGE_WIDTH, 20);

  const base = areaId === 'concert' ? 0.14 : 0.11;
  drawCanopyBand(g, GROUND_Y - 6, 72, 54, base, 3.1);
  drawCanopyBand(g, GROUND_Y - 2, 46, 38, base + 0.09, 7.4);
}

function drawCanopyBand(
  g: Phaser.GameObjects.Graphics,
  baseY: number,
  crown: number,
  spacing: number,
  alpha: number,
  seed: number
): void {
  g.fillStyle(INK, alpha);
  g.beginPath();
  g.moveTo(-spacing, baseY);
  for (let x = -spacing; x <= STAGE_WIDTH + spacing; x += spacing) {
    const lift = crown * (0.45 + jitter(x * 0.11 + seed) * 0.75);
    const radius = spacing * (0.52 + jitter(x * 0.07 + seed) * 0.3);
    g.arc(x, baseY - lift, radius, Math.PI, 0);
  }
  g.lineTo(STAGE_WIDTH + spacing, baseY);
  g.closePath();
  g.fillPath();
}

// --- near band ------------------------------------------------------------

function drawBridgeNear(
  g: Phaser.GameObjects.Graphics,
  bridgeOpen: boolean,
  ctx: AreaSetContext
): void {
  for (let i = 0; i < 7; i += 1) {
    drawTree(g, 600 + i * 96, GROUND_Y - 2, i % 2 === 0 ? 'pine' : 'round', 1.15, 0.45);
  }
  for (let i = 0; i < 4; i += 1) {
    drawTree(g, 214 + i * 74, GROUND_Y - 2, 'bush', 0.8, 0.26);
  }

  drawCornField(g, 30, 470);

  const riverLeft = ctx.worldXForProgress(0.58);
  const riverRight = ctx.worldXForProgress(0.78);
  g.fillStyle(INK, 0.06);
  g.fillRect(riverLeft - 8, GROUND_Y, riverRight - riverLeft + 16, 78);
  g.lineStyle(2, INK, 0.32);
  for (let y = GROUND_Y + 14; y < GROUND_Y + 70; y += 15) {
    g.lineBetween(riverLeft, y, riverRight - 30, y + 2);
    g.lineBetween(riverRight - 18, y + 6, riverRight, y + 5);
  }

  if (bridgeOpen) {
    g.lineStyle(5.5, INK, 1);
    g.lineBetween(riverLeft, GROUND_Y - 4, riverRight, GROUND_Y - 4);
    g.lineStyle(2, INK, 0.5);
    g.lineBetween(riverLeft, GROUND_Y - 20, riverRight, GROUND_Y - 20);
    for (let i = 0; i <= 6; i += 1) {
      const px = riverLeft + ((riverRight - riverLeft) / 6) * i;
      g.lineBetween(px, GROUND_Y - 20, px, GROUND_Y - 4);
    }
  } else {
    const mid = (riverLeft + riverRight) / 2;
    g.lineStyle(5.5, INK, 1);
    g.lineBetween(riverLeft, GROUND_Y - 4, mid - 40, GROUND_Y - 4);
    g.lineBetween(mid + 40, GROUND_Y - 4, riverRight, GROUND_Y - 4);
    drawPaperBacking(g, mid, GROUND_Y - 28, 88, 52);
    g.lineStyle(1.4, INK, 0.4);
    g.lineBetween(mid - 36, GROUND_Y - 56, mid + 36, GROUND_Y - 56);
    g.lineBetween(mid - 36, GROUND_Y - 44, mid + 20, GROUND_Y - 44);
  }

  const campX = ctx.worldXForProgress(0.46);
  g.fillStyle(PAPER_WARM, 0.9);
  g.lineStyle(2.6, INK, 0.8);
  g.beginPath();
  g.moveTo(campX - 36, GROUND_Y);
  g.lineTo(campX, GROUND_Y - 46);
  g.lineTo(campX + 36, GROUND_Y);
  g.closePath();
  g.fillPath();
  g.strokePath();
  drawHatch(g, campX + 6, GROUND_Y - 30, 28, 30, 8, 0.28, 0.9);
  g.lineStyle(2.2, INK, 0.7);
  g.strokeRect(campX + 48, GROUND_Y - 30, 38, 20);
}

/**
 * A worked cornfield: massed leaves first, then a few whole stalks standing in
 * them. Rows of bare stalks alone read as dead winter branches.
 */
function drawCornField(g: Phaser.GameObjects.Graphics, fromX: number, toX: number): void {
  const span = toX - fromX;

  g.fillStyle(INK, 0.09);
  g.fillRect(fromX, GROUND_Y - 62, span, 62);

  g.fillStyle(INK, 0.26);
  for (let i = 0; i < 46; i += 1) {
    const x = fromX + jitter(i * 1.9) * span;
    const y = GROUND_Y - 12 - jitter(i * 4.7) * 52;
    const side = i % 2 === 0 ? 1 : -1;
    strokeLeaf(g, x, y, side * (18 + jitter(i * 2.3) * 20), 10 + jitter(i * 5.1) * 12);
  }

  for (let i = 0; i < 11; i += 1) {
    const x = fromX + 18 + (span / 11) * i + jitter(i * 3.3) * 16;
    drawCornStalk(g, x, GROUND_Y, 76 + jitter(i) * 30, 0, 0.55);
  }
}

function drawConcertNear(
  g: Phaser.GameObjects.Graphics,
  crossingOpen: boolean,
  ctx: AreaSetContext
): void {
  for (let i = 0; i < 5; i += 1) {
    const x = 130 + i * 268;
    const h = 150 + (i % 2) * 34;
    g.lineStyle(2.8, INK, 0.9);
    g.fillStyle(PAPER, 0.4);
    g.fillRect(x, GROUND_Y - h, 146, h);
    g.strokeRect(x, GROUND_Y - h, 146, h);
    drawHatch(g, x + 2, GROUND_Y - h + 2, 142, h - 4, 22, 0.1, 0.6);
    // Lit windows read as warm negative space against the hatching.
    g.fillStyle(PAPER, 0.95);
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (jitter(i * 9 + row * 3 + col) < 0.35) continue;
        const wx = x + 18 + col * 42;
        const wy = GROUND_Y - h + 26 + row * 52;
        g.fillRect(wx, wy, 28, 34);
        g.lineStyle(2, INK, 0.85);
        g.strokeRect(wx, wy, 28, 34);
      }
    }
    g.lineStyle(2.4, INK, 0.85);
    g.strokeRect(x + 54, GROUND_Y - 62, 40, 62);
  }

  // Street lamps with a hatched pool of light beneath each.
  for (let i = 0; i < 5; i += 1) {
    const x = 210 + i * 300;
    g.lineStyle(2.6, INK, 0.85);
    g.lineBetween(x, GROUND_Y, x, GROUND_Y - 108);
    g.lineBetween(x, GROUND_Y - 108, x + 16, GROUND_Y - 118);
    g.fillStyle(PAPER, 0.9);
    g.fillCircle(x + 22, GROUND_Y - 118, 9);
    g.strokeCircle(x + 22, GROUND_Y - 118, 9);
    g.fillStyle(INK, 0.05);
    g.fillTriangle(x + 22, GROUND_Y - 110, x - 26, GROUND_Y, x + 70, GROUND_Y);
  }

  const stage = ctx.worldXForProgress(0.4);
  g.lineStyle(3, INK, 0.9);
  g.fillStyle(PAPER_WARM, 0.85);
  g.fillRect(stage - 90, GROUND_Y - 30, 180, 30);
  g.strokeRect(stage - 90, GROUND_Y - 30, 180, 30);
  g.lineBetween(stage - 96, GROUND_Y - 120, stage - 96, GROUND_Y - 30);
  g.lineBetween(stage + 96, GROUND_Y - 120, stage + 96, GROUND_Y - 30);
  g.lineBetween(stage - 96, GROUND_Y - 120, stage + 96, GROUND_Y - 120);
  g.lineStyle(2, INK, 0.45);
  for (let i = 0; i < 5; i += 1) {
    const bx = stage - 72 + i * 36;
    g.lineBetween(bx, GROUND_Y - 120, bx, GROUND_Y - 104);
    g.strokeRect(bx - 6, GROUND_Y - 104, 12, 10);
  }

  const gate = ctx.worldXForProgress(0.55);
  g.lineStyle(3.4, INK, crossingOpen ? 0.18 : 0.95);
  g.lineBetween(gate, GROUND_Y - 6, gate, GROUND_Y - 84);
  if (!crossingOpen) {
    g.lineBetween(gate - 46, GROUND_Y - 44, gate + 46, GROUND_Y - 44);
    drawHatch(g, gate - 46, GROUND_Y - 44, 92, 38, 10, 0.2, 0.9);
  }

  const nook = ctx.worldXForProgress(0.72);
  g.fillStyle(INK, 0.09);
  g.fillRect(nook - 38, GROUND_Y - 94, 84, 94);
  g.lineStyle(2.2, INK, 0.4);
  g.strokeRect(nook - 38, GROUND_Y - 94, 84, 94);
  drawHatch(g, nook - 36, GROUND_Y - 92, 80, 90, 14, 0.14, 0.5);
}

function drawDanceNear(
  g: Phaser.GameObjects.Graphics,
  crossingOpen: boolean,
  ctx: AreaSetContext
): void {
  // Bunting strung between poles, sagging between each pair.
  g.lineStyle(1.9, INK, 0.45);
  g.beginPath();
  g.moveTo(90, GROUND_Y - 132);
  for (let x = 90; x < STAGE_WIDTH - 80; x += 110) {
    g.lineTo(x + 55, GROUND_Y - 112);
    g.lineTo(x + 110, GROUND_Y - 132);
  }
  g.strokePath();
  g.fillStyle(PAPER_WARM, 0.9);
  g.lineStyle(1.6, INK, 0.5);
  for (let i = 0; i < 26; i += 1) {
    const x = 110 + i * 55;
    const sag = i % 2 === 0 ? 118 : 128;
    g.fillTriangle(x - 9, GROUND_Y - sag, x + 9, GROUND_Y - sag, x, GROUND_Y - sag + 20);
    g.strokeTriangle(x - 9, GROUND_Y - sag, x + 9, GROUND_Y - sag, x, GROUND_Y - sag + 20);
  }

  for (let i = 0; i < 6; i += 1) {
    const x = 170 + i * 224;
    g.lineStyle(2.4, INK, 0.8);
    g.lineBetween(x, GROUND_Y, x, GROUND_Y - 134);
    g.fillStyle(PAPER, 0.9);
    g.fillRect(x - 9, GROUND_Y - 118, 18, 22);
    g.strokeRect(x - 9, GROUND_Y - 118, 18, 22);
    g.lineStyle(1.4, INK, 0.35);
    g.lineBetween(x - 5, GROUND_Y - 112, x + 5, GROUND_Y - 102);
  }

  // Trodden dance circle.
  const circle = ctx.worldXForProgress(0.4);
  g.lineStyle(2, INK, 0.3);
  g.strokeEllipse(circle, GROUND_Y - 16, 220, 52, 14);
  g.lineStyle(1.4, INK, 0.16);
  g.strokeEllipse(circle, GROUND_Y - 14, 170, 40, 12);

  // Market stall.
  const stall = ctx.worldXForProgress(0.24);
  g.lineStyle(2.6, INK, 0.8);
  g.fillStyle(PAPER_WARM, 0.9);
  g.fillRect(stall - 54, GROUND_Y - 78, 108, 78);
  g.strokeRect(stall - 54, GROUND_Y - 78, 108, 78);
  g.beginPath();
  g.moveTo(stall - 66, GROUND_Y - 78);
  g.lineTo(stall, GROUND_Y - 104);
  g.lineTo(stall + 66, GROUND_Y - 78);
  g.closePath();
  g.strokePath();
  drawHatch(g, stall - 52, GROUND_Y - 60, 104, 58, 12, 0.16, 0.7);

  const gate = ctx.worldXForProgress(0.68);
  g.lineStyle(3.2, INK, crossingOpen ? 0.2 : 1);
  g.strokeRect(gate - 38, GROUND_Y - 96, 76, 96);
  if (crossingOpen) {
    g.lineStyle(2, INK, 0.35);
    g.lineBetween(gate + 38, GROUND_Y - 96, gate + 84, GROUND_Y - 42);
  } else {
    drawHatch(g, gate - 36, GROUND_Y - 94, 72, 92, 11, 0.18, 0.8);
  }
}

function drawRelayNear(
  g: Phaser.GameObjects.Graphics,
  beat: RidgeVisualViewModel['beat'],
  ctx: AreaSetContext
): void {
  g.lineStyle(4, INK, 1);
  g.lineBetween(ctx.worldXForProgress(0.12), GROUND_Y, ctx.worldXForProgress(0.9), GROUND_Y);
  g.lineBetween(
    ctx.worldXForProgress(0.85),
    GROUND_Y,
    ctx.worldXForProgress(0.96),
    GROUND_Y + 46
  );

  // Cairn of stacked stones — a quiet marker for the last walk.
  const cairn = ctx.worldXForProgress(0.3);
  g.lineStyle(2.2, INK, 0.75);
  g.fillStyle(PAPER, 0.6);
  for (let i = 0; i < 4; i += 1) {
    const w = 34 - i * 6;
    drawInkBlob(g, cairn, GROUND_Y - 12 - i * 17, w * 0.5, 9, cairn + i, 8);
    g.fillPath();
    g.strokePath();
  }

  const bench = ctx.worldXForProgress(0.55);
  g.lineStyle(2.6, INK, 0.85);
  g.lineBetween(bench - 38, GROUND_Y - 20, bench + 38, GROUND_Y - 20);
  g.lineBetween(bench - 30, GROUND_Y - 20, bench - 30, GROUND_Y);
  g.lineBetween(bench + 30, GROUND_Y - 20, bench + 30, GROUND_Y);
  g.lineBetween(bench - 38, GROUND_Y - 34, bench + 38, GROUND_Y - 34);

  const spire = ctx.worldXForProgress(0.85);
  const complete = beat === 'relay_complete';
  g.lineStyle(2.6, INK, complete ? 0.2 : 0.8);
  g.lineBetween(spire - 26, GROUND_Y, spire, GROUND_Y - 132);
  g.lineBetween(spire + 26, GROUND_Y, spire, GROUND_Y - 132);
  g.strokeCircle(spire, GROUND_Y - 96, 34);
  g.lineBetween(spire - 20, GROUND_Y - 96, spire + 20, GROUND_Y - 96);
  if (!complete) {
    g.lineStyle(1.5, INK, 0.3);
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      g.lineBetween(
        spire + Math.cos(a) * 42,
        GROUND_Y - 96 + Math.sin(a) * 42,
        spire + Math.cos(a) * 58,
        GROUND_Y - 96 + Math.sin(a) * 58
      );
    }
  }
}

// --- foreground band ------------------------------------------------------

/**
 * Heavy ink silhouettes that frame the playable lane. Drawn in the layer's own
 * space, so y = LAYERS.fore.height is the bottom of the screen.
 */
function drawForeBand(g: Phaser.GameObjects.Graphics, areaId: RidgeAreaId): void {
  const width = LAYERS.fore.width;
  const base = LAYERS.fore.height;

  if (areaId === 'concert') {
    // Backs of heads: you are standing inside the crowd, not watching it.
    g.fillStyle(INK, 0.88);
    for (let i = 0; i < 22; i += 1) {
      const x = 30 + i * 94 + jitter(i * 4.2) * 36;
      const r = 20 + jitter(i * 8.9) * 10;
      const shoulder = base - 30 + jitter(i * 1.9) * 16;
      g.fillCircle(x, shoulder - r, r);
      g.fillTriangle(x - r * 1.5, base, x + r * 1.5, base, x, shoulder - r * 1.4);
      if (i % 5 === 1) {
        // An arm up in the air, holding the moment.
        g.fillRect(x + r * 0.8, shoulder - r * 3.4, 7, r * 2.6);
      }
    }
    return;
  }

  if (areaId === 'danceFestival') {
    g.fillStyle(INK, 0.8);
    for (let i = 0; i < 12; i += 1) {
      const x = 70 + i * 170 + jitter(i * 3.7) * 44;
      g.fillRect(x, base - 82, 5, 82);
      drawInkBlob(g, x + 2, base - 92, 14, 17, i, 8);
      g.fillPath();
    }
    drawForeGrass(g, width, base, 0.7);
    return;
  }

  drawForeGrass(g, width, base, areaId === 'relay' ? 0.62 : 0.76);
  if (areaId === 'bridge') {
    for (let i = 0; i < 8; i += 1) {
      drawForeCorn(g, 60 + i * 252 + jitter(i * 6.1) * 70, base, 110 + jitter(i * 2.9) * 50);
    }
  }
}

/** Dense tuft line. Short and overlapping, so it reads as grass, not spikes. */
function drawForeGrass(
  g: Phaser.GameObjects.Graphics,
  width: number,
  base: number,
  alpha: number
): void {
  g.fillStyle(INK, alpha * 0.55);
  for (let x = -6; x < width; x += 6) {
    const h = 20 + jitter(x * 1.9) * 34;
    const lean = (jitter(x * 2.7) - 0.5) * 20;
    g.fillTriangle(x - 4, base, x + 4, base, x + lean, base - h);
  }
  g.fillStyle(INK, alpha);
  for (let x = -6; x < width; x += 7) {
    const h = 12 + jitter(x * 0.7) * 26;
    const lean = (jitter(x * 1.3) - 0.5) * 14;
    g.fillTriangle(x - 4, base, x + 4, base, x + lean, base - h);
  }
}

/** Tall corn framing the near foreground: stalk, tassel, and drooping leaves. */
function drawForeCorn(
  g: Phaser.GameObjects.Graphics,
  x: number,
  base: number,
  height: number
): void {
  g.fillStyle(INK, 0.8);
  g.fillTriangle(x - 4, base, x + 4, base, x + 2, base - height);
  g.fillTriangle(x - 1, base - height, x + 4, base - height, x + 4, base - height - 26);

  for (let i = 0; i < 4; i += 1) {
    const at = base - height * (0.3 + i * 0.19);
    const side = i % 2 === 0 ? 1 : -1;
    const reach = side * (36 + jitter(x + i) * 22);
    strokeLeaf(g, x + 1, at, reach, 22 + i * 4);
  }
}
