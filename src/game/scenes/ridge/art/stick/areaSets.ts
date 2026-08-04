import type * as Phaser from 'phaser';
import type { RidgeAreaId } from '@/game/core/ridge';
import type { RidgeVisualViewModel } from '../types';
import {
  drawBird,
  drawCloud,
  drawCornStalk,
  drawGroundBand,
  drawMountainRange,
  drawPaperBase,
  drawPaperBacking,
  drawSunOrMoon,
  drawTree,
  GROUND_Y,
  STAGE_HEIGHT,
  STAGE_WIDTH
} from './atmosphere';
import { INK, PAPER } from './palette';

export interface AreaSetContext {
  worldXForProgress: (progress: number) => number;
  tick: number;
  motion: boolean;
}

/** Keep command counts modest — scenery is baked, but bake cost still matters on area change. */
export function drawRidgeAreaSet(
  g: Phaser.GameObjects.Graphics,
  areaId: RidgeAreaId,
  crossingOpen: boolean,
  beat: RidgeVisualViewModel['beat'],
  ctx: AreaSetContext
): void {
  drawPaperBase(g, STAGE_WIDTH, STAGE_HEIGHT);
  drawGroundBand(g, STAGE_WIDTH);

  if (areaId === 'bridge') {
    drawBridgeSet(g, crossingOpen, ctx);
  } else if (areaId === 'concert') {
    drawConcertSet(g, crossingOpen, ctx);
  } else if (areaId === 'danceFestival') {
    drawDanceSet(g, crossingOpen, ctx);
  } else {
    drawRelaySet(g, beat, ctx);
  }
}

function drawBridgeSet(
  g: Phaser.GameObjects.Graphics,
  bridgeOpen: boolean,
  ctx: AreaSetContext
): void {
  drawMountainRange(
    g,
    [
      [0, 340],
      [280, 250],
      [560, 290],
      [860, 220],
      [1180, 270],
      [STAGE_WIDTH, 240]
    ],
    0.12
  );

  drawSunOrMoon(g, 140, 108, 26, 'sun');
  drawCloud(g, 420, 100, 1.1, 0.3);
  drawCloud(g, 980, 120, 1.2, 0.26);
  drawBird(g, 620, 150, 0);

  for (let i = 0; i < 8; i += 1) {
    const x = 560 + i * 90;
    drawTree(g, x, GROUND_Y - 2, i % 2 === 0 ? 'pine' : 'round', 1, 0.4);
  }
  for (let i = 0; i < 3; i += 1) {
    drawTree(g, 220 + i * 80, GROUND_Y - 2, 'bush', 0.75, 0.22);
  }

  for (let i = 0; i < 8; i += 1) {
    drawCornStalk(g, 80 + i * 36, GROUND_Y, 60 + ((i * 17) % 30), 0);
  }
  for (let i = 0; i < 3; i += 1) {
    drawCornStalk(g, 400 + i * 18, GROUND_Y, 74, 0);
  }

  const riverLeft = ctx.worldXForProgress(0.58);
  const riverRight = ctx.worldXForProgress(0.78);
  g.fillStyle(INK, 0.05);
  g.fillRect(riverLeft - 8, GROUND_Y, riverRight - riverLeft + 16, 70);
  g.lineStyle(2, INK, 0.35);
  for (let y = GROUND_Y + 14; y < GROUND_Y + 64; y += 16) {
    g.lineBetween(riverLeft, y, riverRight, y + 2);
  }

  if (bridgeOpen) {
    g.lineStyle(5, INK, 1);
    g.lineBetween(riverLeft, GROUND_Y - 4, riverRight, GROUND_Y - 4);
    g.lineStyle(2, INK, 0.5);
    g.lineBetween(riverLeft, GROUND_Y - 18, riverRight, GROUND_Y - 18);
  } else {
    const mid = (riverLeft + riverRight) / 2;
    g.lineStyle(5, INK, 1);
    g.lineBetween(riverLeft, GROUND_Y - 4, mid - 40, GROUND_Y - 4);
    g.lineBetween(mid + 40, GROUND_Y - 4, riverRight, GROUND_Y - 4);
    drawPaperBacking(g, mid, GROUND_Y - 28, 88, 52);
  }

  const campX = ctx.worldXForProgress(0.48);
  g.lineStyle(2.4, INK, 0.75);
  g.beginPath();
  g.moveTo(campX - 34, GROUND_Y);
  g.lineTo(campX, GROUND_Y - 42);
  g.lineTo(campX + 34, GROUND_Y);
  g.strokePath();
  g.strokeRect(campX + 42, GROUND_Y - 28, 36, 18);

  // tiny distant city hint
  g.lineStyle(1.6, INK, 0.25);
  const cityX = ctx.worldXForProgress(0.9);
  for (let i = 0; i < 5; i += 1) {
    g.strokeRect(cityX + i * 14, 250 - (24 + (i % 3) * 12), 10, 24 + (i % 3) * 12);
  }
}

function drawConcertSet(
  g: Phaser.GameObjects.Graphics,
  crossingOpen: boolean,
  ctx: AreaSetContext
): void {
  // night wash — few bands, not 100 hatch lines
  g.fillStyle(INK, 0.07);
  g.fillRect(0, 0, STAGE_WIDTH, GROUND_Y);
  g.lineStyle(1.2, INK, 0.12);
  for (let x = 0; x < STAGE_WIDTH; x += 48) {
    g.lineBetween(x, 20, x + 12, 110);
  }

  drawSunOrMoon(g, STAGE_WIDTH - 170, 96, 26, 'moon');
  drawCloud(g, 360, 80, 1, 0.18);

  for (let i = 0; i < 5; i += 1) {
    const x = 140 + i * 260;
    g.lineStyle(2.6, INK, 0.9);
    g.fillStyle(PAPER, 0.35);
    g.fillRect(x, GROUND_Y - 160, 140, 160);
    g.strokeRect(x, GROUND_Y - 160, 140, 160);
    g.strokeRect(x + 20, GROUND_Y - 110, 40, 48);
    g.strokeRect(x + 80, GROUND_Y - 110, 40, 48);
    g.strokeRect(x + 50, GROUND_Y - 70, 40, 70);
  }

  for (let i = 0; i < 4; i += 1) {
    const x = 220 + i * 320;
    g.lineStyle(2.4, INK, 0.8);
    g.lineBetween(x, GROUND_Y, x, GROUND_Y - 100);
    g.strokeCircle(x, GROUND_Y - 112, 9);
  }

  const gate = ctx.worldXForProgress(0.55);
  g.lineStyle(3.2, INK, crossingOpen ? 0.2 : 0.95);
  g.lineBetween(gate, GROUND_Y - 6, gate, GROUND_Y - 78);
  if (!crossingOpen) {
    g.lineBetween(gate - 44, GROUND_Y - 42, gate + 44, GROUND_Y - 42);
  }

  const nook = ctx.worldXForProgress(0.72);
  g.fillStyle(INK, 0.08);
  g.fillRect(nook - 36, GROUND_Y - 90, 80, 90);
  g.lineStyle(2, INK, 0.35);
  g.strokeRect(nook - 36, GROUND_Y - 90, 80, 90);
}

function drawDanceSet(
  g: Phaser.GameObjects.Graphics,
  crossingOpen: boolean,
  ctx: AreaSetContext
): void {
  drawSunOrMoon(g, 160, 100, 28, 'sun');
  drawCloud(g, 520, 95, 1, 0.26);
  drawCloud(g, 1020, 120, 1.15, 0.22);
  drawMountainRange(
    g,
    [
      [0, 380],
      [400, 300],
      [800, 340],
      [1200, 280],
      [STAGE_WIDTH, 320]
    ],
    0.08
  );

  // bunting
  g.lineStyle(1.8, INK, 0.4);
  g.beginPath();
  g.moveTo(100, GROUND_Y - 120);
  for (let x = 100; x < STAGE_WIDTH - 80; x += 120) {
    g.lineTo(x + 60, GROUND_Y - 108);
    g.lineTo(x + 120, GROUND_Y - 120);
  }
  g.strokePath();

  for (let i = 0; i < 6; i += 1) {
    const x = 180 + i * 220;
    g.lineStyle(2.2, INK, 0.8);
    g.lineBetween(x, GROUND_Y, x, GROUND_Y - 90);
    g.strokeRect(x - 8, GROUND_Y - 108, 16, 18);
  }

  g.lineStyle(2, INK, 0.35);
  g.strokeEllipse(ctx.worldXForProgress(0.4), GROUND_Y - 18, 110, 28, 10);

  const gate = ctx.worldXForProgress(0.68);
  g.lineStyle(3, INK, crossingOpen ? 0.2 : 1);
  g.strokeRect(gate - 36, GROUND_Y - 90, 72, 90);
  if (crossingOpen) {
    g.lineStyle(2, INK, 0.35);
    g.lineBetween(gate + 36, GROUND_Y - 90, gate + 80, GROUND_Y - 40);
  }
}

function drawRelaySet(
  g: Phaser.GameObjects.Graphics,
  beat: RidgeVisualViewModel['beat'],
  ctx: AreaSetContext
): void {
  drawSunOrMoon(g, STAGE_WIDTH * 0.7, 190, 40, 'sunset');
  drawMountainRange(
    g,
    [
      [0, 360],
      [360, 280],
      [760, 320],
      [1140, 250],
      [STAGE_WIDTH, 290]
    ],
    0.12
  );

  g.lineStyle(4, INK, 1);
  g.lineBetween(ctx.worldXForProgress(0.12), GROUND_Y, ctx.worldXForProgress(0.9), GROUND_Y);
  g.lineBetween(
    ctx.worldXForProgress(0.85),
    GROUND_Y,
    ctx.worldXForProgress(0.96),
    GROUND_Y + 44
  );

  const bench = ctx.worldXForProgress(0.55);
  g.lineStyle(2.4, INK, 0.85);
  g.lineBetween(bench - 34, GROUND_Y - 18, bench + 34, GROUND_Y - 18);
  g.lineBetween(bench - 28, GROUND_Y - 18, bench - 28, GROUND_Y);
  g.lineBetween(bench + 28, GROUND_Y - 18, bench + 28, GROUND_Y);

  const tx = ctx.worldXForProgress(0.85);
  const complete = beat === 'relay_complete';
  g.lineStyle(2.2, INK, complete ? 0.18 : 0.7);
  g.strokeCircle(tx, GROUND_Y - 78, 34);
  g.lineBetween(tx - 18, GROUND_Y - 78, tx + 18, GROUND_Y - 78);

  drawCloud(g, 280, 100, 0.9, 0.2);
}
