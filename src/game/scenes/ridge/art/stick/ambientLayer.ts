import type * as Phaser from 'phaser';
import type { RidgeAreaId } from '@/game/core/ridge';
import { drawBird, drawCloud, jitter } from './atmosphere';
import { GROUND_Y, INK, PAPER, SKY_TOP, STAGE_WIDTH } from './palette';

/**
 * Drifting set dressing, redrawn on the stepped sketch clock (~11 FPS) rather
 * than per frame. Every pass stays under ~40 draw commands, so the whole layer
 * costs less than a single character redraw.
 */

const CLOUD_COUNT = 4;
const BIRD_COUNT = 3;
const MOTE_COUNT = 14;

/** Sky band: clouds crawling and birds crossing behind the horizon. */
export function drawAmbientFar(
  g: Phaser.GameObjects.Graphics,
  areaId: RidgeAreaId,
  tick: number
): void {
  g.clear();
  if (areaId === 'concert') return;

  const span = STAGE_WIDTH + 260;
  for (let i = 0; i < CLOUD_COUNT; i += 1) {
    const speed = 0.55 + jitter(i * 3.3) * 0.5;
    const x = (((jitter(i) * span + tick * speed) % span) + span) % span - 130;
    const y = SKY_TOP + 22 + jitter(i * 5.5) * 74;
    drawCloud(g, x, y, 0.95 + jitter(i * 2.1) * 0.55, 0.32);
  }

  for (let i = 0; i < BIRD_COUNT; i += 1) {
    const speed = 1.6 + jitter(i * 7.1) * 1.1;
    const x = (((jitter(i * 1.7) * span + tick * speed) % span) + span) % span - 130;
    const drift = Math.sin((tick + i * 9) * 0.12) * 9;
    drawBird(g, x, SKY_TOP + 34 + jitter(i * 4.4) * 66 + drift, tick + i, 0.42);
  }
}

/** Ground band: the small stuff moving through the playable lane. */
export function drawAmbientNear(
  g: Phaser.GameObjects.Graphics,
  areaId: RidgeAreaId,
  tick: number
): void {
  g.clear();

  if (areaId === 'bridge') {
    drawDriftingSeeds(g, tick);
    return;
  }
  if (areaId === 'concert') {
    drawRisingEmbers(g, tick);
    return;
  }
  if (areaId === 'danceFestival') {
    drawFallingPetals(g, tick);
    return;
  }
  drawSlowMotes(g, tick);
}

/** Bridge: dandelion seeds tumbling on the river breeze. */
function drawDriftingSeeds(g: Phaser.GameObjects.Graphics, tick: number): void {
  const span = STAGE_WIDTH + 160;
  g.lineStyle(1.6, INK, 0.34);
  for (let i = 0; i < MOTE_COUNT; i += 1) {
    const speed = 1.1 + jitter(i * 2.7) * 1.4;
    const x = (((jitter(i) * span + tick * speed) % span) + span) % span - 80;
    const y = GROUND_Y - 60 - jitter(i * 6.3) * 190 + Math.sin((tick + i * 5) * 0.18) * 14;
    g.strokeCircle(x, y, 2.4);
    g.lineBetween(x, y + 2, x - 4, y + 7);
  }
}

/** Concert: sparks and note marks lifting off the stage. */
function drawRisingEmbers(g: Phaser.GameObjects.Graphics, tick: number): void {
  const rise = 260;
  for (let i = 0; i < MOTE_COUNT; i += 1) {
    const speed = 1.5 + jitter(i * 4.9) * 1.6;
    const t = (((jitter(i) * rise + tick * speed) % rise) + rise) % rise;
    const y = GROUND_Y - 30 - t;
    const x = 200 + jitter(i * 3.1) * (STAGE_WIDTH - 340) + Math.sin((tick + i * 7) * 0.2) * 16;
    const fade = 0.5 * (1 - t / rise);

    if (i % 4 === 0) {
      // A stray quaver riding the noise.
      g.lineStyle(2, INK, fade + 0.15);
      g.lineBetween(x, y, x, y - 11);
      g.fillStyle(INK, fade + 0.15);
      g.fillCircle(x - 2.5, y, 3);
    } else {
      g.fillStyle(PAPER, fade + 0.25);
      g.fillCircle(x, y, 2.6);
      g.lineStyle(1.4, INK, fade + 0.2);
      g.strokeCircle(x, y, 2.6);
    }
  }
}

/** Dance Festival: paper petals falling through the bunting. */
function drawFallingPetals(g: Phaser.GameObjects.Graphics, tick: number): void {
  const fall = 300;
  g.lineStyle(1.5, INK, 0.4);
  for (let i = 0; i < MOTE_COUNT + 4; i += 1) {
    const speed = 1.3 + jitter(i * 5.7) * 1.5;
    const t = (((jitter(i * 1.3) * fall + tick * speed) % fall) + fall) % fall;
    const x = 60 + jitter(i) * (STAGE_WIDTH - 120) + Math.sin((tick + i * 11) * 0.16) * 22;
    const y = GROUND_Y - 300 + t;
    const w = 4 + jitter(i * 2.2) * 3;
    // Flip width on the stepped clock so each petal tumbles.
    const flip = (tick + i) % 6 < 3 ? 1 : 0.35;
    g.fillStyle(PAPER, 0.85);
    g.fillTriangle(x, y - w, x + w * flip, y, x, y + w);
    g.strokeTriangle(x, y - w, x + w * flip, y, x, y + w);
  }
}

/** Relay: slow dust in low sun. */
function drawSlowMotes(g: Phaser.GameObjects.Graphics, tick: number): void {
  for (let i = 0; i < MOTE_COUNT; i += 1) {
    const x = 80 + jitter(i) * (STAGE_WIDTH - 160) + Math.sin((tick + i * 6) * 0.09) * 26;
    const y =
      GROUND_Y - 40 + jitter(i * 3.9) * 60 - ((tick * 0.4 + jitter(i * 8.1) * 200) % 200);
    g.fillStyle(INK, 0.16 + jitter(i * 2.6) * 0.14);
    g.fillCircle(x, y, 1.8 + jitter(i * 4.1) * 1.6);
  }
}
