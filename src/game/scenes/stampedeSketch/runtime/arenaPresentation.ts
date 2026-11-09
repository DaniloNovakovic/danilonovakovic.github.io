import * as Phaser from 'phaser';
import { STAMPEDE_WORLD } from './movement';

const FIELD_TEXTURE_KEY = 'stampede_field';
const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const GRID = 0x7a8ca8;

/**
 * Bakes the field once: graph-paper page, picnic blanket at the center, doodled
 * flowers and grass so movement reads, and a hedge drawn around the edge.
 */
export function drawStampedeArena(scene: Phaser.Scene): void {
  if (!scene.textures.exists(FIELD_TEXTURE_KEY)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    drawField(g);
    g.generateTexture(FIELD_TEXTURE_KEY, STAMPEDE_WORLD.width, STAMPEDE_WORLD.height);
    g.destroy();
  }
  scene.add.image(0, 0, FIELD_TEXTURE_KEY).setOrigin(0, 0).setDepth(0);
}

function drawField(g: Phaser.GameObjects.Graphics): void {
  const { width, height } = STAMPEDE_WORLD;
  g.fillStyle(PAPER, 1);
  g.fillRect(0, 0, width, height);
  drawGrid(g, 40, 0.12);
  drawGrid(g, 200, 0.2);

  const random = seeded(1729);
  const blanket = { x: width / 2, y: height / 2, w: 190, h: 130 };
  for (let index = 0; index < 150; index += 1) {
    const x = 60 + random() * (width - 120);
    const y = 60 + random() * (height - 120);
    const onBlanket = Math.abs(x - blanket.x) < blanket.w * 0.75 && Math.abs(y - blanket.y) < blanket.h * 0.8;
    if (!onBlanket) drawDoodle(g, x, y, random);
  }

  drawBlanket(g, blanket);
  drawHedge(g, random);
}

function drawGrid(g: Phaser.GameObjects.Graphics, spacing: number, alpha: number): void {
  const { width, height } = STAMPEDE_WORLD;
  g.lineStyle(1, GRID, alpha);
  for (let x = 0; x <= width; x += spacing) g.lineBetween(x, 0, x, height);
  for (let y = 0; y <= height; y += spacing) g.lineBetween(0, y, width, y);
}

function drawDoodle(g: Phaser.GameObjects.Graphics, x: number, y: number, random: () => number): void {
  const roll = random();
  if (roll < 0.5) grass(g, x, y, random);
  else if (roll < 0.72) flower(g, x, y, random);
  else if (roll < 0.88) pebble(g, x, y, random);
  else doodleHeart(g, x, y);
}

function drawBlanket(
  g: Phaser.GameObjects.Graphics,
  blanket: { x: number; y: number; w: number; h: number }
): void {
  const cell = 26;
  const left = blanket.x - blanket.w / 2;
  const top = blanket.y - blanket.h / 2;
  g.fillStyle(INK, 0.12);
  g.fillRect(left + 8, top + 8, blanket.w, blanket.h);
  g.fillStyle(PAPER, 1);
  g.fillRect(left, top, blanket.w, blanket.h);
  for (let cx = 0; cx * cell < blanket.w; cx += 1) {
    for (let cy = 0; cy * cell < blanket.h; cy += 1) {
      if ((cx + cy) % 2 !== 0) continue;
      g.fillStyle(0xd9604a, 0.55);
      g.fillRect(
        left + cx * cell,
        top + cy * cell,
        Math.min(cell, blanket.w - cx * cell),
        Math.min(cell, blanket.h - cy * cell)
      );
    }
  }
  g.lineStyle(3, INK, 1);
  g.strokeRect(left, top, blanket.w, blanket.h);
  g.lineStyle(1.5, INK, 0.6);
  for (let x = left + 6; x < left + blanket.w; x += 10) {
    g.lineBetween(x, top + blanket.h, x - 2, top + blanket.h + 7);
    g.lineBetween(x, top, x - 2, top - 7);
  }

  const bx = blanket.x + 52;
  const by = blanket.y - 24;
  g.fillStyle(0xc89b5d, 1);
  g.lineStyle(2.5, INK, 1);
  g.fillRect(bx - 22, by - 10, 44, 26);
  g.strokeRect(bx - 22, by - 10, 44, 26);
  g.lineStyle(1.2, INK, 0.5);
  for (let x = bx - 18; x < bx + 22; x += 7) g.lineBetween(x, by - 10, x + 4, by + 16);
  g.lineStyle(3, INK, 1);
  g.beginPath();
  g.arc(bx, by - 10, 16, Math.PI, 0, false);
  g.strokePath();

  g.fillStyle(0xd13b3b, 1);
  g.lineStyle(2, INK, 1);
  g.fillCircle(blanket.x - 50, blanket.y + 22, 9);
  g.strokeCircle(blanket.x - 50, blanket.y + 22, 9);
  g.lineBetween(blanket.x - 50, blanket.y + 13, blanket.x - 47, blanket.y + 7);
}

function drawHedge(g: Phaser.GameObjects.Graphics, random: () => number): void {
  const { width, height } = STAMPEDE_WORLD;
  const band = 26;
  g.fillStyle(0x9bb67a, 1);
  g.fillRect(0, 0, width, band);
  g.fillRect(0, height - band, width, band);
  g.fillRect(0, 0, band, height);
  g.fillRect(width - band, 0, band, height);
  g.lineStyle(1.2, INK, 0.35);
  for (let x = 0; x < width; x += 9) {
    g.lineBetween(x, 2, x + 7, band - 3);
    g.lineBetween(x, height - band + 3, x + 7, height - 2);
  }
  for (let y = 0; y < height; y += 9) {
    g.lineBetween(2, y, band - 3, y + 7);
    g.lineBetween(width - band + 3, y, width - 2, y + 7);
  }
  g.lineStyle(3, INK, 1);
  bumpyLine(g, band, band, width - band, band, random);
  bumpyLine(g, band, height - band, width - band, height - band, random);
  bumpyLine(g, band, band, band, height - band, random);
  bumpyLine(g, width - band, band, width - band, height - band, random);
  g.lineStyle(5, INK, 1);
  g.strokeRect(1, 1, width - 2, height - 2);
}

function bumpyLine(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  random: () => number
): void {
  const length = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.floor(length / 22));
  const nx = -(y1 - y0) / length;
  const ny = (x1 - x0) / length;
  g.beginPath();
  g.moveTo(x0, y0);
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const bump = (step % 2 === 0 ? 1 : -1) * (2 + random() * 3);
    g.lineTo(x0 + (x1 - x0) * t + nx * bump, y0 + (y1 - y0) * t + ny * bump);
  }
  g.strokePath();
}

function grass(g: Phaser.GameObjects.Graphics, x: number, y: number, random: () => number): void {
  g.lineStyle(1.6, INK, 0.42);
  const lean = (random() - 0.5) * 4;
  g.lineBetween(x - 4, y, x - 6 + lean, y - 7);
  g.lineBetween(x, y, x + lean, y - 10);
  g.lineBetween(x + 4, y, x + 6 + lean, y - 7);
}

function flower(g: Phaser.GameObjects.Graphics, x: number, y: number, random: () => number): void {
  const petal = random() < 0.5 ? 0xf3c1d0 : 0xf6dd8a;
  g.lineStyle(1.4, INK, 0.45);
  g.lineBetween(x, y, x, y + 9);
  g.fillStyle(petal, 0.85);
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    g.fillCircle(x + Math.cos(angle) * 3.4, y + Math.sin(angle) * 3.4, 2.6);
  }
  g.fillStyle(0xe0892a, 0.9);
  g.fillCircle(x, y, 1.8);
}

function pebble(g: Phaser.GameObjects.Graphics, x: number, y: number, random: () => number): void {
  const w = 6 + random() * 6;
  g.fillStyle(0xd8d2c4, 0.8);
  g.lineStyle(1.4, INK, 0.4);
  g.fillEllipse(x, y, w, w * 0.6);
  g.strokeEllipse(x, y, w, w * 0.6);
}

function doodleHeart(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.lineStyle(1.4, 0xc0263b, 0.32);
  g.beginPath();
  g.arc(x - 2.5, y, 2.5, Math.PI, 0, false);
  g.arc(x + 2.5, y, 2.5, Math.PI, 0, false);
  g.lineTo(x, y + 6);
  g.closePath();
  g.strokePath();
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}
