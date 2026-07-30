// Distinct NPC silhouettes intentionally branch on role props.
// fallow-ignore-file complexity
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

  g.fillCircle(x, y - s * 1.7, s * 0.45);
  g.strokeCircle(x, y - s * 1.7, s * 0.45);
  g.lineBetween(x, y - s * 1.25, x, y - s * 0.2);
  g.lineBetween(x, y - s * 0.95, x + dir * s * 0.7, y - s * 0.55);
  g.lineBetween(x, y - s * 0.95, x - dir * s * 0.55, y - s * 0.5);
  g.lineBetween(x, y - s * 0.2, x - s * 0.4, y + s * 0.55);
  g.lineBetween(x, y - s * 0.2, x + s * 0.4, y + s * 0.55);
  // backpack — player signature
  g.fillStyle(INK, 0.12);
  g.fillRect(x - dir * s * 0.55, y - s * 1.05, s * 0.32, s * 0.5);
  g.strokeRect(x - dir * s * 0.55, y - s * 1.05, s * 0.32, s * 0.5);
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
  g.fillEllipse(x, y - s * 0.35, s * 1.5, s * 0.9);
  g.strokeEllipse(x, y - s * 0.35, s * 1.5, s * 0.9);
  g.fillCircle(x + s * 0.7, y - s * 0.75, s * 0.45);
  g.strokeCircle(x + s * 0.7, y - s * 0.75, s * 0.45);
  g.lineBetween(x + s * 0.45, y - s * 1.05, x + s * 0.35, y - s * 1.45);
  g.lineBetween(x + s * 0.35, y - s * 1.45, x + s * 0.6, y - s * 1.1);
  g.lineBetween(x + s * 0.85, y - s * 1.05, x + s * 0.95, y - s * 1.45);
  g.lineBetween(x + s * 0.95, y - s * 1.45, x + s * 0.7, y - s * 1.1);
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
  const s = 17 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawBasePerson(g, x, y, facing, scale, { hair: 'messy' });
  g.lineStyle(2.5, INK, 1);
  g.strokeRect(x + dir * s * 0.5, y - s * 1.05, s * 0.85, s * 0.6);
  g.lineBetween(x + dir * s * 0.6, y - s * 0.75, x + dir * s * 1.15, y - s * 0.75);
  g.lineBetween(x + dir * s * 0.6, y - s * 0.6, x + dir * s * 1.0, y - s * 0.6);
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

interface PersonStyle {
  hair?: 'messy' | 'bun' | 'cap' | 'hat' | 'ponytail';
  skirt?: boolean;
  apron?: boolean;
  raisedArm?: boolean;
  walkingStick?: boolean;
}

function drawBasePerson(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale: number,
  style: PersonStyle = {}
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  g.lineStyle(3, INK, 1);
  g.fillStyle(PAPER, 1);

  g.fillCircle(x, y - s * 1.65, s * 0.4);
  g.strokeCircle(x, y - s * 1.65, s * 0.4);

  if (style.hair === 'messy') {
    g.lineBetween(x - s * 0.25, y - s * 1.95, x - s * 0.35, y - s * 2.2);
    g.lineBetween(x, y - s * 2.0, x + s * 0.1, y - s * 2.25);
    g.lineBetween(x + s * 0.25, y - s * 1.95, x + s * 0.4, y - s * 2.15);
  } else if (style.hair === 'bun') {
    g.fillCircle(x, y - s * 2.05, s * 0.22);
    g.strokeCircle(x, y - s * 2.05, s * 0.22);
  } else if (style.hair === 'cap') {
    g.lineBetween(x - s * 0.45, y - s * 1.75, x + s * 0.45, y - s * 1.75);
    g.strokeRect(x - s * 0.35, y - s * 2.05, s * 0.7, s * 0.3);
  } else if (style.hair === 'hat') {
    g.strokeRect(x - s * 0.28, y - s * 2.15, s * 0.56, s * 0.35);
    g.lineBetween(x - s * 0.5, y - s * 1.8, x + s * 0.5, y - s * 1.8);
  } else if (style.hair === 'ponytail') {
    g.beginPath();
    g.moveTo(x - dir * s * 0.25, y - s * 1.7);
    g.lineTo(x - dir * s * 0.7, y - s * 1.35);
    g.strokePath();
  }

  g.lineBetween(x, y - s * 1.25, x, y - s * 0.15);

  if (style.raisedArm) {
    g.lineBetween(x, y - s * 0.95, x + dir * s * 0.55, y - s * 1.45);
    g.lineBetween(x, y - s * 0.95, x - dir * s * 0.55, y - s * 0.5);
  } else {
    g.lineBetween(x, y - s * 0.95, x + dir * s * 0.7, y - s * 0.55);
    g.lineBetween(x, y - s * 0.95, x - dir * s * 0.5, y - s * 0.5);
  }

  if (style.skirt) {
    g.lineBetween(x, y - s * 0.15, x - s * 0.55, y + s * 0.55);
    g.lineBetween(x, y - s * 0.15, x + s * 0.55, y + s * 0.55);
    g.lineBetween(x - s * 0.55, y + s * 0.55, x + s * 0.55, y + s * 0.55);
  } else {
    g.lineBetween(x, y - s * 0.15, x - s * 0.35, y + s * 0.55);
    g.lineBetween(x, y - s * 0.15, x + s * 0.35, y + s * 0.55);
  }

  if (style.apron) {
    g.strokeRect(x - s * 0.28, y - s * 0.95, s * 0.56, s * 0.7);
  }

  if (style.walkingStick) {
    g.lineStyle(2.5, INK, 1);
    g.lineBetween(x + dir * s * 0.7, y - s * 0.55, x + dir * s * 0.85, y + s * 0.55);
  }
}

export function drawStickGuitarist(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawBasePerson(g, x, y, facing, scale, { hair: 'messy' });
  g.lineStyle(2.5, INK, 1);
  g.strokeEllipse(x + dir * s * 0.55, y - s * 0.5, s * 0.6, s * 0.95);
  g.lineBetween(x + dir * s * 0.55, y - s * 1.0, x + dir * s * 0.55, y - s * 1.4);
  // wrist wrap
  g.lineStyle(3, INK, 0.7);
  g.lineBetween(x + dir * s * 0.35, y - s * 0.7, x + dir * s * 0.55, y - s * 0.55);
}

export function drawStickCrowd(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1
): void {
  drawBasePerson(g, x - 18 * scale, y, 'left', scale * 0.8, { hair: 'cap' });
  drawBasePerson(g, x, y, 'right', scale * 0.9, { hair: 'messy' });
  drawBasePerson(g, x + 20 * scale, y, 'left', scale * 0.75, { hair: 'ponytail' });
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

export function drawStickTraveler(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawBasePerson(g, x, y, facing, scale, { hair: 'ponytail', walkingStick: true });
  // travel pack
  g.lineStyle(2.5, INK, 1);
  g.strokeRect(x - dir * s * 0.55, y - s * 1.1, s * 0.38, s * 0.55);
}

export function drawStickDriver(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawBasePerson(g, x, y, facing, scale, { hair: 'cap' });
  g.lineStyle(2.5, INK, 1);
  // big clipboard
  g.fillStyle(PAPER, 1);
  g.fillRect(x + dir * s * 0.4, y - s * 1.1, s * 0.55, s * 0.75);
  g.strokeRect(x + dir * s * 0.4, y - s * 1.1, s * 0.55, s * 0.75);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.85, x + dir * s * 0.85, y - s * 0.85);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.65, x + dir * s * 0.8, y - s * 0.65);
}

export function drawStickOperationsHelper(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawBasePerson(g, x, y, facing, scale, { hair: 'ponytail', apron: true });
  // lantern held high
  g.lineStyle(2.5, INK, 1);
  g.lineBetween(x + dir * s * 0.55, y - s * 0.55, x + dir * s * 0.7, y - s * 1.15);
  g.strokeRect(x + dir * s * 0.55, y - s * 1.45, s * 0.4, s * 0.4);
  g.lineBetween(x + dir * s * 0.75, y - s * 1.45, x + dir * s * 0.75, y - s * 1.65);
  // warm hatch inside lantern
  g.lineStyle(1.5, INK, 0.45);
  g.lineBetween(x + dir * s * 0.62, y - s * 1.35, x + dir * s * 0.88, y - s * 1.15);
}

export function drawStickDanceTeacher(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  drawBasePerson(g, x, y, facing, scale * 1.08, {
    hair: 'bun',
    skirt: true,
    raisedArm: true
  });
}

export function drawStickSteward(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawBasePerson(g, x, y, facing, scale * 1.05, { hair: 'hat' });
  // key on belt
  g.lineStyle(2, INK, 1);
  g.strokeCircle(x + dir * s * 0.35, y - s * 0.2, s * 0.12);
  g.lineBetween(x + dir * s * 0.35, y - s * 0.08, x + dir * s * 0.35, y + s * 0.15);
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
  // "LAST" mark on side
  g.lineStyle(2, INK, 0.55);
  g.lineBetween(x - s * 0.2, y - s * 0.55, x + s * 0.9, y - s * 0.55);
}
