import type * as Phaser from 'phaser';
import type { RidgeFacing } from '@/game/core/ridge';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;

export function drawStickPlayer(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  const s = 18 * scale;
  const dir = facing === 'left' ? -1 : 1;
  g.lineStyle(3, INK, 1);
  g.fillStyle(PAPER, 1);

  // head
  g.fillCircle(x, y - s * 1.7, s * 0.45);
  g.strokeCircle(x, y - s * 1.7, s * 0.45);

  // body
  g.lineBetween(x, y - s * 1.25, x, y - s * 0.2);

  // arms
  g.lineBetween(x, y - s * 0.95, x + dir * s * 0.7, y - s * 0.55);
  g.lineBetween(x, y - s * 0.95, x - dir * s * 0.55, y - s * 0.5);

  // legs
  g.lineBetween(x, y - s * 0.2, x - s * 0.4, y + s * 0.55);
  g.lineBetween(x, y - s * 0.2, x + s * 0.4, y + s * 0.55);

  // tiny backpack mark
  g.strokeRect(x - dir * s * 0.55, y - s * 1.05, s * 0.28, s * 0.45);
}

export function drawStickCicka(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1
): void {
  const s = 12 * scale;
  g.lineStyle(2.5, INK, 1);
  g.fillStyle(PAPER, 1);

  // body loaf
  g.fillEllipse(x, y - s * 0.35, s * 1.5, s * 0.9);
  g.strokeEllipse(x, y - s * 0.35, s * 1.5, s * 0.9);

  // head
  g.fillCircle(x + s * 0.7, y - s * 0.75, s * 0.45);
  g.strokeCircle(x + s * 0.7, y - s * 0.75, s * 0.45);

  // ears
  g.lineBetween(x + s * 0.45, y - s * 1.05, x + s * 0.35, y - s * 1.45);
  g.lineBetween(x + s * 0.35, y - s * 1.45, x + s * 0.6, y - s * 1.1);
  g.lineBetween(x + s * 0.85, y - s * 1.05, x + s * 0.95, y - s * 1.45);
  g.lineBetween(x + s * 0.95, y - s * 1.45, x + s * 0.7, y - s * 1.1);

  // tail
  g.beginPath();
  g.moveTo(x - s * 0.75, y - s * 0.35);
  g.lineTo(x - s * 1.2, y - s * 0.9);
  g.strokePath();
}

export function drawStickDraftsperson(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  drawStickPerson(g, x, y, facing, scale * 1.05, 'clipboard');
  const s = 17 * scale;
  const dir = facing === 'left' ? -1 : 1;
  // blueprint board (wider than clipboard prop)
  g.strokeRect(x + dir * s * 0.55, y - s * 0.95, s * 0.7, s * 0.5);
  g.lineBetween(
    x + dir * s * 0.65,
    y - s * 0.7,
    x + dir * s * 1.1,
    y - s * 0.7
  );
}

export function drawStickToyCar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1
): void {
  const s = 8 * scale;
  g.lineStyle(2, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillRect(x - s, y - s * 0.7, s * 2, s * 0.8);
  g.strokeRect(x - s, y - s * 0.7, s * 2, s * 0.8);
  g.strokeCircle(x - s * 0.55, y + s * 0.25, s * 0.28);
  g.strokeCircle(x + s * 0.55, y + s * 0.25, s * 0.28);
}

function drawStickPerson(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale: number,
  prop?: 'guitar' | 'clipboard' | 'lantern'
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  g.lineStyle(3, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillCircle(x, y - s * 1.65, s * 0.4);
  g.strokeCircle(x, y - s * 1.65, s * 0.4);
  g.lineBetween(x, y - s * 1.25, x, y - s * 0.15);
  g.lineBetween(x, y - s * 0.95, x + dir * s * 0.7, y - s * 0.55);
  g.lineBetween(x, y - s * 0.95, x - dir * s * 0.5, y - s * 0.5);
  g.lineBetween(x, y - s * 0.15, x - s * 0.35, y + s * 0.55);
  g.lineBetween(x, y - s * 0.15, x + s * 0.35, y + s * 0.55);

  if (prop === 'guitar') {
    g.strokeEllipse(x + dir * s * 0.55, y - s * 0.55, s * 0.55, s * 0.85);
    g.lineBetween(x + dir * s * 0.55, y - s * 1.0, x + dir * s * 0.55, y - s * 1.35);
  } else if (prop === 'clipboard') {
    g.strokeRect(x + dir * s * 0.45, y - s * 0.95, s * 0.45, s * 0.6);
  } else if (prop === 'lantern') {
    g.strokeRect(x + dir * s * 0.55, y - s * 0.85, s * 0.35, s * 0.45);
    g.lineBetween(x + dir * s * 0.72, y - s * 0.85, x + dir * s * 0.72, y - s * 1.1);
  }
}

export function drawStickGuitarist(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  drawStickPerson(g, x, y, facing, scale, 'guitar');
  // tiny wrist wrap
  g.lineStyle(2, INK, 0.8);
  g.lineBetween(x + 8, y - 18 * scale, x + 14, y - 14 * scale);
}

export function drawStickCrowd(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1
): void {
  drawStickPerson(g, x - 14 * scale, y, 'left', scale * 0.85);
  drawStickPerson(g, x, y, 'right', scale * 0.9);
  drawStickPerson(g, x + 16 * scale, y, 'left', scale * 0.8);
}

export function drawStickGuitar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1
): void {
  const s = 10 * scale;
  g.lineStyle(2.5, INK, 1);
  g.strokeEllipse(x, y - s * 0.2, s * 0.7, s);
  g.lineBetween(x, y - s * 0.8, x, y - s * 1.5);
  g.strokeRect(x - s * 0.15, y - s * 1.65, s * 0.3, s * 0.25);
}

export function drawStickNpc(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  drawStickPerson(g, x, y, facing, scale);
}

export function drawStickDriver(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  drawStickPerson(g, x, y, facing, scale, 'clipboard');
}

export function drawStickOperationsHelper(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  drawStickPerson(g, x, y, facing, scale, 'lantern');
}

export function drawStickDanceTeacher(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  drawStickPerson(g, x, y, facing, scale * 1.05);
  g.lineStyle(2, INK, 0.5);
  g.strokeCircle(x, y - 28 * scale, 22 * scale);
}

export function drawStickSteward(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  drawStickPerson(g, x, y, facing, scale);
  g.strokeRect(x - 6 * scale, y - 38 * scale, 12 * scale, 8 * scale);
}

export function drawStickShuttle(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1
): void {
  const s = 14 * scale;
  g.lineStyle(2.5, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillRect(x - s * 1.6, y - s, s * 3.2, s * 0.9);
  g.strokeRect(x - s * 1.6, y - s, s * 3.2, s * 0.9);
  g.strokeCircle(x - s, y + s * 0.1, s * 0.28);
  g.strokeCircle(x + s, y + s * 0.1, s * 0.28);
  g.strokeRect(x - s * 1.3, y - s * 0.75, s * 0.7, s * 0.4);
}
