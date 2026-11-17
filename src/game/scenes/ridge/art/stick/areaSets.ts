// Each area authors three parallax bands; the branching is set-dressing data.
// fallow-ignore-file complexity
import type * as Phaser from 'phaser';
import { BLUEPRINT_BRIDGE_PUZZLE, CONCERT_LAYOUT, type RidgeAreaId } from '@/game/core/ridge';
import { GAME_DESIGN_HEIGHT, GAME_DESIGN_WIDTH } from '@/game/sharedSceneRuntime/designSize';
import type { RidgeVisualViewModel } from '../types';
import {
  drawCornStalk,
  drawGroundBand,
  drawHatch,
  drawInkBlob,
  drawMountainRange,
  drawPaperBase,
  drawSunOrMoon,
  drawTree,
  jitter,
  strokeLeaf
} from './atmosphere';
import { drawBuiltBridge, drawInkBolt, type BuiltBridgeShape } from './bridgeInk';
import {
  BRIDGE_CAMP_X,
  CONCERT_STAGE_RISE,
  GROUND_Y,
  HORIZON_Y,
  INK,
  inkTone,
  LAYERS,
  PAPER,
  PAPER_WARM,
  SKY_TOP,
  STAGE_WIDTH,
  VIEW_HEIGHT
} from './palette';

/**
 * Parallax band being baked.
 * - `far` owns the sky wash and everything past the horizon.
 * - `near` is transparent except for the playable lane and its set dressing.
 * - `fore` is the framing silhouette that slides past the camera fastest.
 */
export type SceneryLayer = 'far' | 'near' | 'fore';

export interface AreaSetContext {
  worldXForProgress: (progress: number) => number;
  /** Bridge river banks, in world X. */
  bridgeGap?: { left: number; right: number };
  /** The span the player drew, settled; replaces the authored crossing. */
  builtBridge?: BuiltBridgeShape | null;
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
    drawForeBand(g, areaId, crossingOpen);
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

/**
 * Distant ridges stop above the woodland mass. Filling them to the ground line
 * turns the lower half of the frame into one grey slab behind the corn.
 */
const RIDGE_BASE_Y = GROUND_Y - 118;

/** World units across the frame while exploring (zoom is height-driven). */
const EXPLORE_VIEW_WIDTH = (GAME_DESIGN_WIDTH * VIEW_HEIGHT) / GAME_DESIGN_HEIGHT;

/**
 * Far-band X that sits mid-frame when the player stands at `progress`.
 *
 * The far band scrolls at a fraction of the camera, so only its left ~half is
 * ever on screen. Landmarks authored in stage coordinates past that (a moon at
 * x 1360, say) were baked and never seen. Place them by where the player will
 * be looking instead.
 *
 * Phaser applies the scroll factor to `scrollX`, which is the view centre
 * minus half the *unzoomed* camera width, so that is the width used here.
 */
function farXForProgress(progress: number, offset = 0): number {
  const playerX = 80 + progress * (STAGE_WIDTH - 160);
  const half = EXPLORE_VIEW_WIDTH / 2;
  const centre = Math.min(STAGE_WIDTH - half, Math.max(half, playerX));
  const camHalf = GAME_DESIGN_WIDTH / 2;
  return camHalf + (centre - camHalf) * LAYERS.far.scrollFactor + offset;
}

function drawFarBand(g: Phaser.GameObjects.Graphics, areaId: RidgeAreaId): void {
  if (areaId === 'concert') {
    // Night: the sky is the darkest thing behind the lane, not the trees.
    g.fillStyle(INK, 0.13);
    g.fillRect(0, 0, STAGE_WIDTH, RIDGE_BASE_Y);
    // Moon hangs over the musician-side nook, where the beat turns quiet.
    drawSunOrMoon(g, farXForProgress(0.6, 120), SKY_TOP + 40, 26, 'moon');
    g.fillStyle(INK, 0.35);
    for (let i = 0; i < 26; i += 1) {
      const sx = jitter(i * 3.1) * STAGE_WIDTH;
      const sy = SKY_TOP + 8 + jitter(i * 7.7) * 120;
      g.fillRect(sx, sy, 2, 2);
    }
    drawRidges(g, areaId, 0.05, 0.09);
    return;
  }

  if (areaId === 'relay') {
    // Setting just off the Relay Spire's shoulder: the ending's backdrop.
    drawSunOrMoon(g, farXForProgress(0.85, 130), SKY_TOP + 118, 40, 'sunset');
    drawRidges(g, areaId, 0.04, 0.075);
    return;
  }

  drawSunOrMoon(g, areaId === 'bridge' ? 220 : 250, SKY_TOP + 48, 26, 'sun');
  drawRidges(g, areaId, 0.035, 0.065);

  if (areaId === 'bridge') {
    // Distant town on the near ridge — a promise of somewhere to walk toward.
    g.lineStyle(1.6, INK, 0.26);
    // Comes into view past the gorge, where the crossing leads. Pitched roofs
    // and one steeple: plain rects in a row read as a bar chart.
    const townY = RIDGE_BASE_Y - 30;
    const townX = farXForProgress(0.88, 10);
    g.lineStyle(1.4, INK, 0.3);
    g.fillStyle(PAPER, 1);
    for (let i = 0; i < 6; i += 1) {
      const w = 9 + (i % 2) * 3;
      const h = 6 + jitter(i * 2.3) * 6;
      const hx = townX + i * 14;
      g.fillRect(hx, townY - h, w, h);
      g.strokeRect(hx, townY - h, w, h);
      g.fillTriangle(hx - 1, townY - h, hx + w + 1, townY - h, hx + w / 2, townY - h - 6);
      g.strokeTriangle(hx - 1, townY - h, hx + w + 1, townY - h, hx + w / 2, townY - h - 6);
    }
    const steeple = townX + 3 * 14 + 5;
    g.lineBetween(steeple, townY - 14, steeple, townY - 30);
    g.lineBetween(steeple - 3, townY - 26, steeple + 3, townY - 26);
  }
}

/** Two crests at different heights and tones: the cheapest read of distance. */
function drawRidges(
  g: Phaser.GameObjects.Graphics,
  areaId: RidgeAreaId,
  farAlpha: number,
  nearAlpha: number
): void {
  drawMountainRange(g, ridgeLine(areaId, 0), farAlpha, RIDGE_BASE_Y);
  drawMountainRange(g, ridgeLine(areaId, 1), nearAlpha, RIDGE_BASE_Y);
}

/**
 * Peaks live in the upper half of the visible sky, never above it. `rank` 0 is
 * the far crest; rank 1 sits lower and is seeded differently so the two never
 * trace each other.
 *
 * Sampled densely rather than authored as a handful of corners: six points
 * across 1600px produce enormous straight diagonals that read as ruled lines,
 * not hills.
 */
function ridgeLine(areaId: RidgeAreaId, rank: number): ReadonlyArray<readonly [number, number]> {
  const crest = SKY_TOP + (rank === 0 ? 40 : 84);
  const relief = rank === 0 ? 46 : 34;
  const seed = (areaId === 'concert' ? 4.1 : areaId === 'relay' ? 8.7 : 1.3) + rank * 17;

  const points: Array<readonly [number, number]> = [];
  const step = 58;
  for (let x = -step; x <= STAGE_WIDTH + step; x += step) {
    const t = x / step;
    // Two out-of-phase waves plus a little noise: broad hills carrying smaller
    // shoulders, which is what a ridge actually looks like from a distance.
    const shape =
      Math.sin(t * 0.34 + seed) * 0.6 +
      Math.sin(t * 0.79 + seed * 2.4) * 0.28 +
      (jitter(t + seed) - 0.5) * 0.24;
    points.push([x, crest - shape * relief]);
  }
  return points;
}

/**
 * Massed woodland stitching the horizon to the playable lane.
 *
 * Dense and grounded like the backup pass, but sampled as a union silhouette
 * so overlapping crowns fill solid instead of punching Venn-diagram holes.
 */
function drawTreeline(g: Phaser.GameObjects.Graphics, areaId: RidgeAreaId): void {
  // Haze gap: a pale strip separating the distant ridge from the woodland, so
  // the two masses do not merge into one flat slab.
  // Ramped in fine steps: two flat strips left ruled lines across the sky.
  const hazeTop = GROUND_Y - 150;
  const hazeSteps = 10;
  const hazeStep = 5;
  for (let i = 0; i < hazeSteps; i += 1) {
    g.fillStyle(PAPER, (0.72 * (i + 1)) / hazeSteps);
    g.fillRect(0, hazeTop + i * hazeStep, STAGE_WIDTH, hazeStep);
  }
  g.fillStyle(PAPER, 0.72);
  g.fillRect(0, hazeTop + hazeSteps * hazeStep, STAGE_WIDTH, GROUND_Y - 82 - (hazeTop + hazeSteps * hazeStep));

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
  for (let x = -spacing; x <= STAGE_WIDTH + spacing; x += 8) {
    g.lineTo(x, baseY - canopyHeightAt(x, crown, spacing, seed));
  }
  g.lineTo(STAGE_WIDTH + spacing, baseY);
  g.closePath();
  g.fillPath();

  fadeBelow(g, baseY, alpha);
}

/**
 * Silhouette height of the treeline at `x`: the union of nearby crowns, sampled
 * as a height field.
 *
 * Chaining overlapping `arc()` calls into a single path looks like the obvious
 * way to mass foliage, but the path self-intersects and the fill rule then
 * cancels every overlap, leaving a patchwork of lens-shaped seams. Sampling the
 * outline instead yields one simple polygon that fills solid.
 */
function canopyHeightAt(x: number, crown: number, spacing: number, seed: number): number {
  // Continuous floor, so the band never opens a gap down to the ground.
  let height = crown * 0.2;
  const first = Math.floor(x / spacing) - 1;

  for (let i = first; i <= first + 2; i += 1) {
    const cx = i * spacing;
    const radius = spacing * (0.6 + jitter(cx * 0.07 + seed) * 0.45);
    const dx = x - cx;
    if (Math.abs(dx) >= radius) continue;
    const lift = crown * (0.34 + jitter(cx * 0.11 + seed) * 0.66);
    height = Math.max(height, lift + Math.sqrt(radius * radius - dx * dx) * 0.55);
  }
  return height;
}

/**
 * Ramps a baked mass into the tone below it over a few flat steps.
 *
 * A silhouette that simply stops leaves a ruled horizontal across the stage,
 * and scattering marks along the join to hide it only trades one artefact for a
 * field of blobs. Stepping the alpha down costs five rects and reads as haze.
 */
function fadeBelow(g: Phaser.GameObjects.Graphics, y: number, alpha: number): void {
  const depth = 30;
  const steps = 5;
  for (let i = 0; i < steps; i += 1) {
    const band = depth / steps;
    g.fillStyle(INK, alpha * (1 - i / steps) * 0.8);
    g.fillRect(0, y + band * i, STAGE_WIDTH, band + 1);
  }
}

// --- near band ------------------------------------------------------------

function drawBridgeNear(
  g: Phaser.GameObjects.Graphics,
  bridgeOpen: boolean,
  ctx: AreaSetContext
): void {
  // Grounded timber — trunks meet the lane so crowns never float on haze.
  for (let i = 0; i < 7; i += 1) {
    drawTree(g, 600 + i * 96, GROUND_Y - 2, i % 2 === 0 ? 'pine' : 'round', 1.15, 0.45);
  }

  drawCornField(g, 30, 470);

  const riverLeft = ctx.bridgeGap?.left ?? ctx.worldXForProgress(0.58);
  const riverRight = ctx.bridgeGap?.right ?? ctx.worldXForProgress(0.78);
  drawGorge(g, riverLeft, riverRight);

  if (bridgeOpen && ctx.builtBridge) {
    drawBuiltBridge(g, ctx.builtBridge);
  } else if (bridgeOpen) {
    g.lineStyle(5.5, INK, 1);
    g.lineBetween(riverLeft, GROUND_Y - 4, riverRight, GROUND_Y - 4);
    g.lineStyle(2, INK, 0.5);
    g.lineBetween(riverLeft, GROUND_Y - 20, riverRight, GROUND_Y - 20);
    for (let i = 0; i <= 6; i += 1) {
      const px = riverLeft + ((riverRight - riverLeft) / 6) * i;
      g.lineBetween(px, GROUND_Y - 20, px, GROUND_Y - 4);
    }
  } else {
    // Before: a real gap. Only the bank bolts hint that something belongs here.
    const { cell, anchors, columns } = BLUEPRINT_BRIDGE_PUZZLE;
    for (const anchor of anchors) {
      const x = anchor.x === 0 ? riverLeft : riverLeft + columns * cell;
      drawInkBolt(g, x, GROUND_Y + anchor.y * cell, anchor.x === 0 ? -1 : 1);
    }
  }

  const campX = BRIDGE_CAMP_X;
  g.fillStyle(PAPER_WARM, 1);
  g.lineStyle(2.8, INK, 0.85);
  g.beginPath();
  g.moveTo(campX - 40, GROUND_Y);
  g.lineTo(campX, GROUND_Y - 52);
  g.lineTo(campX + 40, GROUND_Y);
  g.closePath();
  g.fillPath();
  g.strokePath();
  drawHatch(g, campX + 6, GROUND_Y - 34, 32, 34, 8, 0.26, 0.9);

  // Fire ring in front of the tent — the anchor the drifting smoke rises from.
  g.lineStyle(2.4, INK, 0.75);
  g.fillStyle(INK, 0.8);
  for (let i = 0; i < 3; i += 1) {
    const a = -0.7 + i * 0.7;
    g.lineBetween(campX + 62, GROUND_Y, campX + 62 + Math.sin(a) * 16, GROUND_Y - 18);
  }
  g.lineStyle(2.2, INK, 0.55);
  g.lineBetween(campX + 46, GROUND_Y - 1, campX + 78, GROUND_Y - 1);
}

/**
 * River gorge cut through the ground band: cliff faces either side, open air
 * down to the water line, and a few current marks. The water line matches the
 * Blueprint Bridge splash depth so a falling toy car lands on it.
 */
function drawGorge(g: Phaser.GameObjects.Graphics, left: number, right: number): void {
  const waterY = GROUND_Y + BLUEPRINT_BRIDGE_PUZZLE.waterDepth;
  const bottom = GROUND_Y + 200;

  // Erase the ground band and lane line inside the gap.
  g.fillStyle(PAPER, 1);
  g.fillRect(left, GROUND_Y - 3, right - left, bottom - GROUND_Y + 3);
  // Shaded air, darkening toward the water: the gorge sits in the same grey
  // family as the banks so it never reads as a blank paper cut-out.
  const airSteps = 4;
  const airBand = (waterY - GROUND_Y) / airSteps;
  for (let i = 0; i < airSteps; i += 1) {
    g.fillStyle(INK, 0.05 + i * 0.015);
    g.fillRect(left, GROUND_Y + airBand * i, right - left, airBand + 1);
  }

  g.fillStyle(INK, 0.14);
  g.fillRect(left, waterY, right - left, bottom - waterY);
  g.lineStyle(2.4, INK, 0.7);
  g.lineBetween(left, waterY, right, waterY);
  g.lineStyle(1.6, INK, 0.32);
  for (let y = waterY + 10; y < bottom; y += 13) {
    for (let x = left + 10 + ((y / 13) % 2) * 18; x < right - 24; x += 52) {
      g.lineBetween(x, y, x + 22, y + 1);
    }
  }

  // Cliff faces, hatched on the bank side.
  g.lineStyle(4, INK, 1);
  g.lineBetween(left, GROUND_Y, left - 4, waterY);
  g.lineBetween(right, GROUND_Y, right + 4, waterY);
  drawHatch(g, left - 26, GROUND_Y + 6, 22, waterY - GROUND_Y - 6, 7, 0.3, 0.9);
  drawHatch(g, right + 4, GROUND_Y + 6, 22, waterY - GROUND_Y - 6, 7, 0.3, 0.9);
}

/**
 * A worked cornfield: massed leaves first, then a few whole stalks standing in
 * them. Rows of bare stalks alone read as dead winter branches.
 */
function drawCornField(g: Phaser.GameObjects.Graphics, fromX: number, toX: number): void {
  const span = toX - fromX;

  // Opaque leaf tone: translucent leaves darken wherever they cross, which is
  // what turned the field into grey blotches. The field's edge is left to the
  // leaves themselves; a backing rect only drew a ruled box around them.
  g.fillStyle(inkTone(0.34), 1);
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
  const at = (progress: number) => ctx.worldXForProgress(progress);
  drawConcertFacades(g);

  // Street lamps, kept clear of the stage truss.
  for (const x of [150, 505, 1030, 1330]) drawStreetLamp(g, x);

  drawKafana(g, at(CONCERT_LAYOUT.kid) - 110);
  drawGigPoster(g, at(CONCERT_LAYOUT.poster));
  drawBackstageNook(g, at(CONCERT_LAYOUT.guitarist), at(CONCERT_LAYOUT.cicka));
  drawConcertStage(g, at(CONCERT_LAYOUT.stage), CONCERT_LAYOUT.stageHalfWidth * (STAGE_WIDTH - 160));
  drawCrosswalk(g, at(0.555), at(0.69), crossingOpen);

  // The band's corner by the exit: an amp to loaf on, a bench, the way downhill.
  const corner = at(CONCERT_LAYOUT.bandCicka);
  drawStageAmp(g, corner + 14, 30, 34);
  g.lineStyle(2.6, INK, 0.85);
  g.lineBetween(corner - 120, GROUND_Y - 22, corner - 50, GROUND_Y - 22);
  g.lineBetween(corner - 114, GROUND_Y - 22, corner - 114, GROUND_Y);
  g.lineBetween(corner - 56, GROUND_Y - 22, corner - 56, GROUND_Y);
  drawExitSign(g, at(CONCERT_LAYOUT.exit) + 34);
}

/** Small-town night block: hatched facades with a few warm windows. */
function drawConcertFacades(g: Phaser.GameObjects.Graphics): void {
  const facades = [
    { x: 40, w: 120, h: 176 },
    { x: 560, w: 180, h: 150 },
    { x: 900, w: 150, h: 196 },
    { x: 1080, w: 170, h: 164 },
    { x: 1290, w: 150, h: 184 },
    { x: 1450, w: 130, h: 150 }
  ];
  facades.forEach(({ x, w, h }, i) => {
    g.lineStyle(2.6, INK, 0.7);
    g.fillStyle(PAPER, 0.4);
    g.fillRect(x, GROUND_Y - h, w, h);
    g.strokeRect(x, GROUND_Y - h, w, h);
    drawHatch(g, x + 2, GROUND_Y - h + 2, w - 4, h - 4, 22, 0.1, 0.6);
    g.lineStyle(2, INK, 0.7);
    g.lineBetween(x - 6, GROUND_Y - h, x + w + 6, GROUND_Y - h);
    const cols = Math.max(2, Math.floor((w - 20) / 42));
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (jitter(i * 9 + row * 3 + col) < 0.4) continue;
        const wx = x + 16 + col * 42;
        const wy = GROUND_Y - h + 24 + row * 50;
        g.fillStyle(PAPER, 0.95);
        g.fillRect(wx, wy, 24, 30);
        g.lineStyle(1.8, INK, 0.75);
        g.strokeRect(wx, wy, 24, 30);
        g.lineBetween(wx + 12, wy, wx + 12, wy + 30);
      }
    }
  });
}

function drawStreetLamp(g: Phaser.GameObjects.Graphics, x: number): void {
  g.lineStyle(2.6, INK, 0.85);
  g.lineBetween(x, GROUND_Y, x, GROUND_Y - 112);
  g.lineBetween(x, GROUND_Y - 112, x + 16, GROUND_Y - 122);
  g.fillStyle(PAPER, 0.95);
  g.fillCircle(x + 22, GROUND_Y - 122, 9);
  g.strokeCircle(x + 22, GROUND_Y - 122, 9);
  // A pool of light: lighter than the hatched night around it.
  g.fillStyle(PAPER, 0.32);
  g.fillTriangle(x + 22, GROUND_Y - 114, x - 30, GROUND_Y, x + 74, GROUND_Y);
}

/** The kafana: an awning, a lit window, a café table, and a curb out front. */
function drawKafana(g: Phaser.GameObjects.Graphics, x: number): void {
  const w = 230;
  const h = 168;
  g.lineStyle(3, INK, 0.9);
  g.fillStyle(PAPER_WARM, 0.9);
  g.fillRect(x, GROUND_Y - h, w, h);
  g.strokeRect(x, GROUND_Y - h, w, h);
  drawHatch(g, x + 2, GROUND_Y - h + 2, w - 4, 38, 10, 0.16, 0.6);
  // Striped awning.
  const awningY = GROUND_Y - h + 44;
  g.fillStyle(PAPER, 1);
  g.fillRect(x - 12, awningY, w + 24, 22);
  g.strokeRect(x - 12, awningY, w + 24, 22);
  g.fillStyle(INK, 0.75);
  for (let sx = x - 12; sx < x + w + 12; sx += 28) g.fillRect(sx, awningY, 14, 22);
  for (let sx = x - 12; sx < x + w + 12; sx += 14) {
    g.fillStyle(sx % 28 === (x - 12) % 28 ? INK : PAPER, 0.75);
    g.fillTriangle(sx, awningY + 22, sx + 14, awningY + 22, sx + 7, awningY + 30);
  }
  // Sign board with squiggle lettering above the awning.
  g.lineStyle(2.4, INK, 0.9);
  g.fillStyle(PAPER, 1);
  g.fillRect(x + 58, GROUND_Y - h + 8, 114, 26);
  g.strokeRect(x + 58, GROUND_Y - h + 8, 114, 26);
  g.lineStyle(2.2, INK, 0.85);
  for (let i = 0; i < 6; i += 1) {
    const lx = x + 70 + i * 16;
    g.lineBetween(lx, GROUND_Y - h + 14, lx + (i % 2 === 0 ? 8 : 0), GROUND_Y - h + 28);
    g.lineBetween(lx, GROUND_Y - h + 14, lx + 8, GROUND_Y - h + 14);
  }
  // Warm window and door.
  g.fillStyle(PAPER, 1);
  g.fillRect(x + 22, GROUND_Y - 96, 96, 58);
  g.lineStyle(2.4, INK, 0.9);
  g.strokeRect(x + 22, GROUND_Y - 96, 96, 58);
  g.lineBetween(x + 70, GROUND_Y - 96, x + 70, GROUND_Y - 38);
  g.strokeRect(x + 150, GROUND_Y - 92, 44, 92);
  g.fillStyle(INK, 1);
  g.fillCircle(x + 186, GROUND_Y - 46, 2.5);
  // Café table and a chair on the pavement.
  g.lineStyle(2.4, INK, 0.85);
  g.lineBetween(x - 34, GROUND_Y - 30, x - 4, GROUND_Y - 30);
  g.lineBetween(x - 19, GROUND_Y - 30, x - 19, GROUND_Y);
  g.lineBetween(x - 46, GROUND_Y, x - 40, GROUND_Y - 20);
  g.lineBetween(x - 40, GROUND_Y - 20, x - 40, GROUND_Y - 40);
}

/** The gig poster, argued with in pen. */
function drawGigPoster(g: Phaser.GameObjects.Graphics, x: number): void {
  // A stretch of brick wall to stick it on.
  g.lineStyle(2.4, INK, 0.8);
  g.fillStyle(PAPER_WARM, 0.85);
  g.fillRect(x - 54, GROUND_Y - 128, 108, 128);
  g.strokeRect(x - 54, GROUND_Y - 128, 108, 128);
  g.lineStyle(1.2, INK, 0.3);
  for (let row = 0; row < 10; row += 1) {
    const y = GROUND_Y - 128 + row * 13;
    g.lineBetween(x - 54, y, x + 54, y);
    for (let bx = x - 54 + (row % 2) * 13; bx < x + 54; bx += 26) g.lineBetween(bx, y, bx, y + 13);
  }
  // The poster, a little crooked.
  g.lineStyle(2.6, INK, 1);
  g.fillStyle(PAPER, 1);
  g.beginPath();
  g.moveTo(x - 26, GROUND_Y - 112);
  g.lineTo(x + 28, GROUND_Y - 116);
  g.lineTo(x + 30, GROUND_Y - 44);
  g.lineTo(x - 24, GROUND_Y - 41);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Guitar doodle and headline scribbles.
  g.lineStyle(2, INK, 0.9);
  g.strokeCircle(x + 1, GROUND_Y - 66, 9);
  g.strokeCircle(x + 1, GROUND_Y - 78, 6);
  g.lineBetween(x + 1, GROUND_Y - 84, x + 1, GROUND_Y - 100);
  g.lineStyle(2.4, INK, 0.85);
  g.lineBetween(x - 18, GROUND_Y - 105, x + 20, GROUND_Y - 107);
  g.lineStyle(1.4, INK, 0.6);
  g.lineBetween(x - 16, GROUND_Y - 52, x + 22, GROUND_Y - 53);
  // "still?" crossed out, "ALWAYS" in heavier pen.
  g.lineStyle(1.6, INK, 0.8);
  g.lineBetween(x + 10, GROUND_Y - 95, x + 24, GROUND_Y - 96);
  g.lineBetween(x + 8, GROUND_Y - 92, x + 26, GROUND_Y - 99);
}

/** Behind the stage: a tarp backdrop, Steve's guitar case, cables, the amp stack. */
function drawBackstageNook(g: Phaser.GameObjects.Graphics, steveX: number, cickaX: number): void {
  g.fillStyle(INK, 0.1);
  g.fillRect(steveX - 70, GROUND_Y - 132, cickaX - steveX + 120, 132);
  g.lineStyle(2.2, INK, 0.5);
  g.strokeRect(steveX - 70, GROUND_Y - 132, cickaX - steveX + 120, 132);
  drawHatch(g, steveX - 68, GROUND_Y - 130, cickaX - steveX + 116, 128, 14, 0.12, 0.5);
  // Guitar case leaning on the backdrop.
  g.lineStyle(2.6, INK, 1);
  g.fillStyle(INK, 0.8);
  g.beginPath();
  g.moveTo(steveX - 48, GROUND_Y);
  g.lineTo(steveX - 66, GROUND_Y - 30);
  g.lineTo(steveX - 50, GROUND_Y - 90);
  g.lineTo(steveX - 36, GROUND_Y - 92);
  g.lineTo(steveX - 30, GROUND_Y - 32);
  g.lineTo(steveX - 34, GROUND_Y);
  g.closePath();
  g.fillPath();
  // Coiled cable on the floor.
  g.lineStyle(1.8, INK, 0.7);
  g.strokeEllipse(steveX + 34, GROUND_Y - 4, 34, 9);
  g.strokeEllipse(steveX + 34, GROUND_Y - 5, 26, 6);
  // The amp stack Cicka hides behind.
  drawStageAmp(g, cickaX + 26, 34, 64);
  drawStageAmp(g, cickaX + 26, 30, 32, 64);
}

function drawStageAmp(
  g: Phaser.GameObjects.Graphics,
  x: number,
  halfW: number,
  h: number,
  lift = 0
): void {
  const top = GROUND_Y - lift - h;
  g.lineStyle(2.6, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  g.fillRect(x - halfW, top, halfW * 2, h);
  g.strokeRect(x - halfW, top, halfW * 2, h);
  g.fillStyle(INK, 0.7);
  g.fillRect(x - halfW + 5, top + 6, halfW * 2 - 10, h - 16);
  g.lineStyle(1, PAPER, 0.5);
  for (let gx = x - halfW + 9; gx < x + halfW - 5; gx += 6) g.lineBetween(gx, top + 6, gx, top + h - 10);
}

/** Raised platform, truss, string lights, a mic, a monitor wedge. */
function drawConcertStage(g: Phaser.GameObjects.Graphics, x: number, halfW: number): void {
  const deck = GROUND_Y - CONCERT_STAGE_RISE;
  const left = x - halfW;
  const right = x + halfW;
  // Truss and string lights.
  g.lineStyle(3, INK, 0.9);
  g.lineBetween(left - 6, deck, left - 6, GROUND_Y - 176);
  g.lineBetween(right + 6, deck, right + 6, GROUND_Y - 176);
  g.lineBetween(left - 14, GROUND_Y - 176, right + 14, GROUND_Y - 176);
  g.lineStyle(1.4, INK, 0.5);
  for (let tx = left; tx < right; tx += 14) {
    g.lineBetween(tx, GROUND_Y - 176, tx + 7, GROUND_Y - 168);
    g.lineBetween(tx + 7, GROUND_Y - 168, tx + 14, GROUND_Y - 176);
  }
  g.lineStyle(1.6, INK, 0.7);
  g.beginPath();
  for (let i = 0; i <= 10; i += 1) {
    const lx = left + (i / 10) * (right - left);
    const ly = GROUND_Y - 160 + Math.sin((i / 10) * Math.PI) * 14;
    if (i === 0) g.moveTo(lx, ly);
    else g.lineTo(lx, ly);
  }
  g.strokePath();
  for (let i = 1; i < 10; i += 1) {
    const lx = left + (i / 10) * (right - left);
    const ly = GROUND_Y - 160 + Math.sin((i / 10) * Math.PI) * 14;
    g.fillStyle(PAPER, 1);
    g.fillCircle(lx, ly + 5, 4);
    g.lineStyle(1.4, INK, 0.9);
    g.strokeCircle(lx, ly + 5, 4);
  }
  // Banner with squiggle lettering hung from the truss.
  g.fillStyle(PAPER, 1);
  g.lineStyle(2.4, INK, 0.9);
  g.fillRect(x - 54, GROUND_Y - 150, 108, 24);
  g.strokeRect(x - 54, GROUND_Y - 150, 108, 24);
  g.lineStyle(2.2, INK, 0.8);
  for (let i = 0; i < 7; i += 1) {
    const lx = x - 44 + i * 13;
    g.lineBetween(lx, GROUND_Y - 145, lx + 6, GROUND_Y - 131);
    g.lineBetween(lx + 6, GROUND_Y - 131, lx + 9, GROUND_Y - 145);
  }
  // The platform itself.
  g.lineStyle(3, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  g.fillRect(left, deck, right - left, CONCERT_STAGE_RISE);
  g.strokeRect(left, deck, right - left, CONCERT_STAGE_RISE);
  drawHatch(g, left + 2, deck + 6, right - left - 4, CONCERT_STAGE_RISE - 8, 9, 0.22, 0.7);
  g.lineStyle(2, INK, 0.9);
  g.lineBetween(left, deck + 4, right, deck + 4);
  // Steps up on the near side.
  g.lineStyle(2.2, INK, 0.9);
  g.strokeRect(left - 18, GROUND_Y - 12, 18, 12);
  // Mic stand and a monitor wedge.
  const mic = x + 26;
  g.lineStyle(2.4, INK, 1);
  g.lineBetween(mic, deck, mic, deck - 58);
  g.lineBetween(mic - 10, deck, mic + 10, deck);
  g.lineBetween(mic, deck - 58, mic - 12, deck - 64);
  g.fillStyle(INK, 1);
  g.fillCircle(mic - 14, deck - 65, 4);
  g.fillStyle(PAPER, 1);
  g.lineStyle(2.4, INK, 1);
  g.beginPath();
  g.moveTo(right - 34, deck);
  g.lineTo(right - 8, deck);
  g.lineTo(right - 12, deck - 16);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // The setlist taped to the floor.
  g.fillStyle(PAPER, 1);
  g.fillRect(left + 18, deck - 3, 18, 4);
}

/** Zebra crossing, traffic light, and (until the show) a barrier. */
function drawCrosswalk(
  g: Phaser.GameObjects.Graphics,
  from: number,
  to: number,
  crossingOpen: boolean
): void {
  g.fillStyle(PAPER, 0.95);
  g.lineStyle(1.6, INK, 0.6);
  for (let x = from; x < to; x += 30) {
    g.beginPath();
    g.moveTo(x, GROUND_Y + 2);
    g.lineTo(x + 18, GROUND_Y + 2);
    g.lineTo(x + 12, GROUND_Y + 34);
    g.lineTo(x - 8, GROUND_Y + 34);
    g.closePath();
    g.fillPath();
    g.strokePath();
  }
  // Traffic light: red while the crowd holds the street, green once it opens.
  const pole = to + 20;
  g.lineStyle(3, INK, 0.9);
  g.lineBetween(pole, GROUND_Y, pole, GROUND_Y - 118);
  g.fillStyle(PAPER_WARM, 1);
  g.fillRect(pole - 10, GROUND_Y - 150, 20, 40);
  g.strokeRect(pole - 10, GROUND_Y - 150, 20, 40);
  g.fillStyle(INK, 1);
  if (crossingOpen) g.fillCircle(pole, GROUND_Y - 120, 6);
  else g.fillCircle(pole, GROUND_Y - 140, 6);
  g.lineStyle(1.6, INK, 1);
  g.strokeCircle(pole, GROUND_Y - 140, 6);
  g.strokeCircle(pole, GROUND_Y - 120, 6);
  if (crossingOpen) return;
  // A striped sawhorse at the near edge of the crossing.
  g.lineStyle(2.6, INK, 1);
  g.lineBetween(from - 8, GROUND_Y, from + 2, GROUND_Y - 34);
  g.lineBetween(from + 46, GROUND_Y, from + 36, GROUND_Y - 34);
  g.fillStyle(PAPER, 1);
  g.fillRect(from - 6, GROUND_Y - 40, 56, 12);
  g.strokeRect(from - 6, GROUND_Y - 40, 56, 12);
  g.fillStyle(INK, 0.85);
  for (let x = from - 2; x < from + 46; x += 14) g.fillRect(x, GROUND_Y - 40, 7, 12);
}

/** Way downhill: a signpost leaning toward the festival. */
function drawExitSign(g: Phaser.GameObjects.Graphics, x: number): void {
  g.lineStyle(2.8, INK, 0.9);
  g.lineBetween(x, GROUND_Y, x, GROUND_Y - 84);
  g.fillStyle(PAPER, 1);
  g.beginPath();
  g.moveTo(x - 30, GROUND_Y - 84);
  g.lineTo(x + 24, GROUND_Y - 84);
  g.lineTo(x + 38, GROUND_Y - 74);
  g.lineTo(x + 24, GROUND_Y - 64);
  g.lineTo(x - 30, GROUND_Y - 64);
  g.closePath();
  g.fillPath();
  g.strokePath();
  g.lineStyle(1.8, INK, 0.7);
  g.lineBetween(x - 22, GROUND_Y - 74, x + 18, GROUND_Y - 74);
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

  drawRelaySpire(g, ctx.worldXForProgress(0.85), beat === 'relay_complete');
}

/**
 * Lattice relay mast: tapering legs, cross-braced, a beacon at the tip and
 * signal arcs while it still has something to send.
 *
 * Earlier this was an A-frame inside a ring, which at thumbnail size is the
 * anarchy symbol, not a tower.
 */
function drawRelaySpire(g: Phaser.GameObjects.Graphics, x: number, complete: boolean): void {
  const alpha = complete ? 0.25 : 0.85;
  const top = GROUND_Y - 128;
  const baseHalf = 24;
  const topHalf = 5;
  const halfAt = (y: number) => topHalf + ((y - top) / (GROUND_Y - top)) * (baseHalf - topHalf);

  g.lineStyle(2.8, INK, alpha);
  g.lineBetween(x - baseHalf, GROUND_Y, x - topHalf, top);
  g.lineBetween(x + baseHalf, GROUND_Y, x + topHalf, top);

  // X-bracing between rungs, thinner than the legs.
  const rungs = [top, GROUND_Y - 92, GROUND_Y - 58, GROUND_Y - 26, GROUND_Y];
  g.lineStyle(1.4, INK, alpha * 0.8);
  for (let i = 0; i < rungs.length - 1; i += 1) {
    const y0 = rungs[i]!;
    const y1 = rungs[i + 1]!;
    g.lineBetween(x - halfAt(y0), y0, x + halfAt(y1), y1);
    g.lineBetween(x + halfAt(y0), y0, x - halfAt(y1), y1);
    g.lineBetween(x - halfAt(y1), y1, x + halfAt(y1), y1);
  }

  // Mast and beacon.
  g.lineStyle(2.4, INK, alpha);
  g.lineBetween(x, top, x, top - 22);
  g.fillStyle(complete ? PAPER : INK, alpha);
  g.fillCircle(x, top - 26, 4.5);
  g.lineStyle(2, INK, alpha);
  g.strokeCircle(x, top - 26, 4.5);

  if (complete) return;
  g.lineStyle(1.8, INK, 0.38);
  for (let i = 0; i < 2; i += 1) {
    const r = 13 + i * 10;
    g.beginPath();
    g.arc(x, top - 26, r, -Math.PI * 0.32, Math.PI * 0.32, false);
    g.strokePath();
    g.beginPath();
    g.arc(x, top - 26, r, Math.PI * 0.68, Math.PI * 1.32, false);
    g.strokePath();
  }
}

// --- foreground band ------------------------------------------------------

/**
 * Heavy ink silhouettes that frame the playable lane. Drawn in the layer's own
 * space, so y = LAYERS.fore.height is the bottom of the screen.
 */
function drawForeBand(g: Phaser.GameObjects.Graphics, areaId: RidgeAreaId, crossingOpen: boolean): void {
  const width = LAYERS.fore.width;
  const base = LAYERS.fore.height;

  if (areaId === 'concert') {
    // Backs of heads: you are standing inside the crowd, not watching it.
    // Once the show is over only a few stragglers are left.
    g.fillStyle(INK, 0.88);
    for (let i = 0; i < 22; i += 1) {
      if (crossingOpen && i % 4 !== 0) continue;
      const x = 30 + i * 94 + jitter(i * 4.2) * 36;
      const r = 20 + jitter(i * 8.9) * 10;
      const shoulder = base - 30 + jitter(i * 1.9) * 16;
      g.fillCircle(x, shoulder - r, r);
      g.fillTriangle(x - r * 1.5, base, x + r * 1.5, base, x, shoulder - r * 1.4);
      if (i % 5 === 1) {
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
  g.fillStyle(inkTone(0.8), 1);
  g.fillTriangle(x - 4, base, x + 4, base, x + 2, base - height);
  g.fillTriangle(x - 1, base - height, x + 4, base - height, x + 4, base - height - 26);

  for (let i = 0; i < 4; i += 1) {
    const at = base - height * (0.3 + i * 0.19);
    const side = i % 2 === 0 ? 1 : -1;
    const reach = side * (36 + jitter(x + i) * 22);
    strokeLeaf(g, x + 1, at, reach, 22 + i * 4);
  }
}
