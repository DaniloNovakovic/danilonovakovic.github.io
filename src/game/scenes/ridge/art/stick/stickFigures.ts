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

  drawBasePerson(g, x, y, facing, scale, {
    hair: 'messy',
    scarf: true,
    eyes: 'determined'
  });

  // Signature travel backpack with strap detail
  g.lineStyle(2.5, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillRect(x - dir * s * 0.6, y - s * 1.1, s * 0.38, s * 0.55);
  g.strokeRect(x - dir * s * 0.6, y - s * 1.1, s * 0.38, s * 0.55);
  // Backpack flap & buckle
  g.lineBetween(x - dir * s * 0.6, y - s * 0.95, x - dir * s * 0.22, y - s * 0.95);
  g.strokeCircle(x - dir * s * 0.41, y - s * 0.75, s * 0.05);

  // Scarf tail trailing behind
  g.lineStyle(3, INK, 1);
  g.beginPath();
  g.moveTo(x, y - s * 1.25);
  g.lineTo(x - dir * s * 0.4, y - s * 1.1);
  g.lineTo(x - dir * s * 0.65, y - s * 0.95);
  g.strokePath();
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

  // Body
  g.fillEllipse(x, y - s * 0.35, s * 1.5, s * 0.9, 8);
  g.strokeEllipse(x, y - s * 0.35, s * 1.5, s * 0.9, 8);

  // Head
  g.fillCircle(x + s * 0.7, y - s * 0.75, s * 0.48);
  g.strokeCircle(x + s * 0.7, y - s * 0.75, s * 0.48);

  // Pointy ears
  g.beginPath();
  g.moveTo(x + s * 0.45, y - s * 1.05);
  g.lineTo(x + s * 0.35, y - s * 1.5);
  g.lineTo(x + s * 0.65, y - s * 1.12);
  g.strokePath();

  g.beginPath();
  g.moveTo(x + s * 0.85, y - s * 1.05);
  g.lineTo(x + s * 0.98, y - s * 1.5);
  g.lineTo(x + s * 0.72, y - s * 1.12);
  g.strokePath();

  // Expressive cat eyes & nose
  g.fillStyle(INK, 1);
  g.fillCircle(x + s * 0.85, y - s * 0.8, s * 0.08);
  g.lineStyle(1.5, INK, 1);
  g.lineBetween(x + s * 0.95, y - s * 0.75, x + s * 1.02, y - s * 0.72);

  // Whiskers
  g.lineBetween(x + s * 0.92, y - s * 0.7, x + s * 1.25, y - s * 0.8);
  g.lineBetween(x + s * 0.92, y - s * 0.65, x + s * 1.25, y - s * 0.6);

  // Expressive curling cat tail
  g.lineStyle(2.5, INK, 1);
  g.beginPath();
  g.moveTo(x - s * 0.75, y - s * 0.35);
  g.lineTo(x - s * 1.1, y - s * 0.8);
  g.lineTo(x - s * 0.95, y - s * 1.25);
  g.strokePath();

  // Cozy paws
  g.fillCircle(x - s * 0.3, y + s * 0.1, s * 0.12);
  g.fillCircle(x + s * 0.3, y + s * 0.1, s * 0.12);
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
  drawBasePerson(g, x, y, facing, scale, {
    hair: 'messy',
    glasses: true,
    eyes: 'thoughtful'
  });

  // Blueprint roll under arm
  g.lineStyle(2.5, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillRect(x + dir * s * 0.4, y - s * 1.05, s * 0.9, s * 0.55);
  g.strokeRect(x + dir * s * 0.4, y - s * 1.05, s * 0.9, s * 0.55);
  g.strokeEllipse(x + dir * s * 0.85, y - s * 0.78, s * 0.25, s * 0.55);
  // Grid lines on blueprint
  g.lineStyle(1.5, INK, 0.4);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.85, x + dir * s * 1.15, y - s * 0.85);

  // Pencil behind ear
  g.lineStyle(2, INK, 1);
  g.lineBetween(x - dir * s * 0.15, y - s * 1.85, x + dir * s * 0.35, y - s * 1.95);
}

export function drawStickToyCar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1
): void {
  const s = 8 * scale;
  g.lineStyle(2.5, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillRect(x - s, y - s * 0.7, s * 2, s * 0.8);
  g.strokeRect(x - s, y - s * 0.7, s * 2, s * 0.8);
  g.strokeCircle(x - s * 0.55, y + s * 0.25, s * 0.28);
  g.strokeCircle(x + s * 0.55, y + s * 0.25, s * 0.28);
  // Toy car windshield & spoiler
  g.lineBetween(x - s * 0.2, y - s * 0.7, x + s * 0.2, y - s * 1.1);
  g.lineBetween(x + s * 0.2, y - s * 1.1, x + s * 0.7, y - s * 0.7);
}

interface PersonStyle {
  hair?: 'messy' | 'bun' | 'cap' | 'hat' | 'ponytail' | 'beanie';
  skirt?: boolean;
  apron?: boolean;
  raisedArm?: boolean;
  walkingStick?: boolean;
  glasses?: boolean;
  scarf?: boolean;
  eyes?: 'determined' | 'thoughtful' | 'happy' | 'focused';
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

  // Head
  g.fillCircle(x, y - s * 1.65, s * 0.42);
  g.strokeCircle(x, y - s * 1.65, s * 0.42);

  // Facial features (eyes & expression)
  g.fillStyle(INK, 1);
  if (style.eyes === 'happy') {
    g.lineStyle(1.8, INK, 1);
    g.lineBetween(x + dir * s * 0.1, y - s * 1.75, x + dir * s * 0.25, y - s * 1.75);
  } else if (style.eyes === 'thoughtful') {
    g.lineStyle(1.8, INK, 1);
    g.lineBetween(x + dir * s * 0.05, y - s * 1.8, x + dir * s * 0.25, y - s * 1.75);
    g.fillCircle(x + dir * s * 0.18, y - s * 1.65, s * 0.06);
  } else {
    // Standard eye dot facing direction
    g.fillCircle(x + dir * s * 0.18, y - s * 1.68, s * 0.07);
  }

  // Glasses option
  if (style.glasses) {
    g.lineStyle(2, INK, 1);
    g.strokeCircle(x + dir * s * 0.18, y - s * 1.68, s * 0.14);
    g.lineBetween(x, y - s * 1.68, x + dir * s * 0.08, y - s * 1.68);
  }

  // Hair & Hats
  g.lineStyle(3, INK, 1);
  if (style.hair === 'messy') {
    g.lineBetween(x - s * 0.25, y - s * 1.95, x - s * 0.35, y - s * 2.2);
    g.lineBetween(x, y - s * 2.0, x + s * 0.1, y - s * 2.25);
    g.lineBetween(x + s * 0.25, y - s * 1.95, x + s * 0.4, y - s * 2.15);
  } else if (style.hair === 'bun') {
    g.fillCircle(x, y - s * 2.08, s * 0.22);
    g.strokeCircle(x, y - s * 2.08, s * 0.22);
  } else if (style.hair === 'beanie') {
    g.fillStyle(INK, 0.15);
    g.fillRect(x - s * 0.4, y - s * 2.1, s * 0.8, s * 0.4);
    g.strokeRect(x - s * 0.4, y - s * 2.1, s * 0.8, s * 0.4);
  } else if (style.hair === 'cap') {
    g.lineBetween(x - s * 0.5, y - s * 1.75, x + dir * s * 0.65, y - s * 1.75);
    g.strokeRect(x - s * 0.35, y - s * 2.08, s * 0.7, s * 0.33);
  } else if (style.hair === 'hat') {
    g.strokeRect(x - s * 0.28, y - s * 2.18, s * 0.56, s * 0.38);
    g.lineBetween(x - s * 0.55, y - s * 1.8, x + s * 0.55, y - s * 1.8);
  } else if (style.hair === 'ponytail') {
    g.beginPath();
    g.moveTo(x - dir * s * 0.25, y - s * 1.7);
    g.lineTo(x - dir * s * 0.7, y - s * 1.35);
    g.strokePath();
  }

  // Torso / Body line
  g.lineStyle(3, INK, 1);
  g.lineBetween(x, y - s * 1.25, x, y - s * 0.15);

  // Scarf around neck
  if (style.scarf) {
    g.fillStyle(INK, 0.2);
    g.fillRect(x - s * 0.25, y - s * 1.32, s * 0.5, s * 0.18);
    g.strokeRect(x - s * 0.25, y - s * 1.32, s * 0.5, s * 0.18);
  }

  // Arms
  if (style.raisedArm) {
    g.lineBetween(x, y - s * 0.95, x + dir * s * 0.55, y - s * 1.45);
    g.lineBetween(x, y - s * 0.95, x - dir * s * 0.55, y - s * 0.5);
  } else {
    g.lineBetween(x, y - s * 0.95, x + dir * s * 0.7, y - s * 0.55);
    g.lineBetween(x, y - s * 0.95, x - dir * s * 0.5, y - s * 0.5);
  }

  // Legs / Skirt
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

  drawBasePerson(g, x, y, facing, scale, {
    hair: 'beanie',
    eyes: 'thoughtful'
  });

  // Acoustic Guitar held across body
  g.lineStyle(2.5, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillEllipse(x + dir * s * 0.55, y - s * 0.5, s * 0.65, s * 0.95, 12);
  g.strokeEllipse(x + dir * s * 0.55, y - s * 0.5, s * 0.65, s * 0.95, 12);
  // Soundhole
  g.fillCircle(x + dir * s * 0.55, y - s * 0.5, s * 0.12);
  g.strokeCircle(x + dir * s * 0.55, y - s * 0.5, s * 0.12);

  // Guitar neck & headstock
  g.lineBetween(x + dir * s * 0.55, y - s * 0.95, x + dir * s * 0.55, y - s * 1.5);
  g.strokeRect(x + dir * s * 0.45, y - s * 1.68, s * 0.2, s * 0.18);

  // Guitar strap across torso
  g.lineStyle(1.8, INK, 0.7);
  g.lineBetween(x - dir * s * 0.3, y - s * 1.15, x + dir * s * 0.6, y - s * 0.35);

  // Wrist wrap
  g.lineStyle(3, INK, 0.8);
  g.lineBetween(x + dir * s * 0.35, y - s * 0.7, x + dir * s * 0.55, y - s * 0.55);
}

export function drawStickCrowd(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1
): void {
  drawBasePerson(g, x - 18 * scale, y, 'left', scale * 0.8, { hair: 'cap' });
  drawBasePerson(g, x, y, 'right', scale * 0.9, { hair: 'messy', eyes: 'happy' });
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
  g.fillStyle(PAPER, 1);
  g.fillEllipse(x, y - s * 0.2, s * 0.75, s * 1.1, 8);
  g.strokeEllipse(x, y - s * 0.2, s * 0.75, s * 1.1, 8);
  g.strokeCircle(x, y - s * 0.2, s * 0.15);
  g.lineBetween(x, y - s * 0.8, x, y - s * 1.6);
  g.strokeRect(x - s * 0.15, y - s * 1.8, s * 0.3, s * 0.25);
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
  drawBasePerson(g, x, y, facing, scale, {
    hair: 'ponytail',
    walkingStick: true,
    eyes: 'happy'
  });
  // Travel backpack
  g.lineStyle(2.5, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillRect(x - dir * s * 0.55, y - s * 1.1, s * 0.38, s * 0.55);
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
  drawBasePerson(g, x, y, facing, scale, {
    hair: 'cap',
    eyes: 'focused'
  });
  g.lineStyle(2.5, INK, 1);
  // Big clipboard with clip
  g.fillStyle(PAPER, 1);
  g.fillRect(x + dir * s * 0.4, y - s * 1.1, s * 0.55, s * 0.75);
  g.strokeRect(x + dir * s * 0.4, y - s * 1.1, s * 0.55, s * 0.75);
  g.fillRect(x + dir * s * 0.55, y - s * 1.2, s * 0.25, s * 0.12);
  g.strokeRect(x + dir * s * 0.55, y - s * 1.2, s * 0.25, s * 0.12);
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
  drawBasePerson(g, x, y, facing, scale, {
    hair: 'ponytail',
    apron: true,
    eyes: 'happy'
  });
  // Lantern held high with warm light rays
  g.lineStyle(2.5, INK, 1);
  g.lineBetween(x + dir * s * 0.55, y - s * 0.55, x + dir * s * 0.7, y - s * 1.15);
  g.fillStyle(PAPER, 1);
  g.fillRect(x + dir * s * 0.52, y - s * 1.5, s * 0.42, s * 0.42);
  g.strokeRect(x + dir * s * 0.52, y - s * 1.5, s * 0.42, s * 0.42);
  g.lineBetween(x + dir * s * 0.73, y - s * 1.5, x + dir * s * 0.73, y - s * 1.68);
  // Warm hatch inside lantern
  g.lineStyle(1.5, INK, 0.45);
  g.lineBetween(x + dir * s * 0.6, y - s * 1.4, x + dir * s * 0.86, y - s * 1.18);
  // Light rays
  g.lineStyle(1.2, INK, 0.35);
  g.lineBetween(x + dir * s * 0.98, y - s * 1.3, x + dir * s * 1.3, y - s * 1.4);
  g.lineBetween(x + dir * s * 0.98, y - s * 1.1, x + dir * s * 1.3, y - s * 1.0);
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
    raisedArm: true,
    eyes: 'happy'
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
  // Key on belt
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
  // "LAST SHUTTLE" sign mark on side
  g.lineStyle(2, INK, 0.65);
  g.lineBetween(x - s * 0.2, y - s * 0.55, x + s * 0.9, y - s * 0.55);
}
