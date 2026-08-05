// Distinct NPC silhouettes intentionally branch on role props.
// fallow-ignore-file complexity
import type * as Phaser from 'phaser';
import type { RidgeFacing } from '@/game/core/ridge';
import { drawContactShadow, drawInkBlob } from './atmosphere';
import { INK, PAPER, PAPER_WARM } from './palette';

/** Thick outer contour, lighter interior marks — the house line-weight rule. */
const CONTOUR = 3.2;
const DETAIL = 1.6;

/**
 * Stepped pose for a figure. Frames advance on the ~11 FPS sketch clock, and a
 * figure is only redrawn when its pose key actually changes.
 */
export interface StickPose {
  frame: number;
  walking: boolean;
  talking: boolean;
}

const STILL: StickPose = { frame: 0, walking: false, talking: false };

/** Walk cycle: contact, pass, contact, pass. */
function legPhaseOf(pose: StickPose): number {
  if (!pose.walking) return 0;
  return [1, 0, -1, 0][pose.frame % 4] ?? 0;
}

/** Figures rise slightly on the passing frames so the walk has bounce. */
function bodyLiftOf(pose: StickPose, s: number): number {
  if (!pose.walking) return 0;
  return pose.frame % 2 === 1 ? -s * 0.07 : 0;
}

export function drawStickPlayer(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1,
  pose: StickPose = STILL
): void {
  const s = 18 * scale;
  const dir = facing === 'left' ? -1 : 1;
  const lift = bodyLiftOf(pose, s);

  drawContactShadow(g, x, y, 34 * scale, 0.18);
  drawBasePerson(g, x, y + lift, facing, scale, pose, {
    hair: 'messy',
    scarf: true,
    eyes: 'determined'
  });

  const top = y + lift;

  // Signature travel pack, worn on the trailing shoulder.
  g.lineStyle(CONTOUR - 0.6, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  g.fillRect(x - dir * s * 0.62, top - s * 1.12, s * 0.4, s * 0.58);
  g.strokeRect(x - dir * s * 0.62, top - s * 1.12, s * 0.4, s * 0.58);
  g.lineStyle(DETAIL, INK, 0.6);
  g.lineBetween(x - dir * s * 0.62, top - s * 0.96, x - dir * s * 0.22, top - s * 0.96);
  g.strokeCircle(x - dir * s * 0.42, top - s * 0.76, s * 0.06);

  // Scarf tail, trailing further when walking.
  const tail = pose.walking ? 0.85 : 0.62;
  g.lineStyle(2.8, INK, 1);
  g.beginPath();
  g.moveTo(x, top - s * 1.26);
  g.lineTo(x - dir * s * 0.42, top - s * 1.14);
  g.lineTo(x - dir * s * tail, top - s * (pose.walking ? 1.12 : 0.95));
  g.strokePath();
}

export function drawStickCicka(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
  pose: StickPose = STILL
): void {
  const s = 12 * scale;
  drawContactShadow(g, x, y, 28 * scale, 0.14);

  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.fillStyle(PAPER, 1);

  drawInkBlob(g, x, y - s * 0.4, s * 0.82, s * 0.5, 11, 10);
  g.fillPath();
  g.strokePath();

  g.fillCircle(x + s * 0.7, y - s * 0.8, s * 0.5);
  g.strokeCircle(x + s * 0.7, y - s * 0.8, s * 0.5);

  // Ears flick between frames — the cheapest sign of a living animal.
  const flick = pose.frame % 8 === 0 ? s * 0.12 : 0;
  g.beginPath();
  g.moveTo(x + s * 0.44, y - s * 1.1);
  g.lineTo(x + s * 0.34 - flick, y - s * 1.54);
  g.lineTo(x + s * 0.66, y - s * 1.16);
  g.strokePath();
  g.beginPath();
  g.moveTo(x + s * 0.86, y - s * 1.1);
  g.lineTo(x + s * 0.99 + flick, y - s * 1.54);
  g.lineTo(x + s * 0.73, y - s * 1.16);
  g.strokePath();

  g.fillStyle(INK, 1);
  g.fillCircle(x + s * 0.86, y - s * 0.85, s * 0.09);
  g.lineStyle(DETAIL, INK, 1);
  g.lineBetween(x + s * 0.96, y - s * 0.8, x + s * 1.03, y - s * 0.77);
  g.lineBetween(x + s * 0.93, y - s * 0.74, x + s * 1.28, y - s * 0.85);
  g.lineBetween(x + s * 0.93, y - s * 0.69, x + s * 1.28, y - s * 0.64);

  // Tail sweeps on the stepped clock.
  const sweep = Math.sin(pose.frame * 0.35) * s * 0.3;
  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.beginPath();
  g.moveTo(x - s * 0.78, y - s * 0.4);
  g.lineTo(x - s * 1.14 - sweep * 0.5, y - s * 0.85);
  g.lineTo(x - s * 0.96 - sweep, y - s * 1.3);
  g.strokePath();

  g.fillStyle(INK, 1);
  g.fillCircle(x - s * 0.3, y + s * 0.08, s * 0.12);
  g.fillCircle(x + s * 0.3, y + s * 0.08, s * 0.12);
}

export function drawStickDraftsperson(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1,
  pose: StickPose = STILL
): void {
  const s = 17 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawContactShadow(g, x, y, 32 * scale);
  drawBasePerson(g, x, y, facing, scale, pose, {
    hair: 'messy',
    glasses: true,
    eyes: 'thoughtful'
  });

  // Blueprint roll tucked under the arm.
  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillRect(x + dir * s * 0.42, y - s * 1.06, s * 0.92, s * 0.56);
  g.strokeRect(x + dir * s * 0.42, y - s * 1.06, s * 0.92, s * 0.56);
  g.lineStyle(DETAIL, INK, 0.45);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.86, x + dir * s * 1.2, y - s * 0.86);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.72, x + dir * s * 1.05, y - s * 0.72);

  g.lineStyle(2, INK, 1);
  g.lineBetween(x - dir * s * 0.15, y - s * 1.86, x + dir * s * 0.35, y - s * 1.96);
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

/**
 * Shared NPC place-and-pose: shadow, base person, and facing metrics.
 * Keeps the per-role drawers from cloning the same 12-line preamble.
 */
function placeStickPerson(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale: number,
  pose: StickPose,
  style: PersonStyle = {},
  personScale = scale
): { s: number; dir: number } {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawContactShadow(g, x, y, 32 * scale);
  drawBasePerson(g, x, y, facing, personScale, pose, style);
  return { s, dir };
}

function drawBasePerson(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale: number,
  pose: StickPose,
  style: PersonStyle = {}
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  const leg = legPhaseOf(pose);
  const headY = y - s * 1.68;

  // Shadow mass first, so contour ink always sits on top of it.
  g.fillStyle(INK, 0.1);
  g.fillRect(x - dir * s * 0.05, y - s * 1.3, dir * s * 0.24, s * 1.15);

  g.lineStyle(CONTOUR, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillCircle(x, headY, s * 0.44);
  g.strokeCircle(x, headY, s * 0.44);

  drawFace(g, x, headY, dir, s, style, pose);
  drawHair(g, x, headY, dir, s, style.hair);

  // Torso
  g.lineStyle(CONTOUR, INK, 1);
  g.lineBetween(x, y - s * 1.26, x, y - s * 0.15);

  if (style.scarf) {
    g.fillStyle(INK, 0.22);
    g.fillRect(x - s * 0.26, y - s * 1.34, s * 0.52, s * 0.19);
    g.lineStyle(DETAIL, INK, 0.8);
    g.strokeRect(x - s * 0.26, y - s * 1.34, s * 0.52, s * 0.19);
    g.lineStyle(CONTOUR, INK, 1);
  }

  drawArms(g, x, y, dir, s, style, pose, leg);

  // Legs
  g.lineStyle(CONTOUR, INK, 1);
  if (style.skirt) {
    g.fillStyle(PAPER, 1);
    g.beginPath();
    g.moveTo(x, y - s * 0.6);
    g.lineTo(x - s * 0.58, y + s * 0.2);
    g.lineTo(x + s * 0.58, y + s * 0.2);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineBetween(x - s * 0.2, y + s * 0.2, x - s * 0.24 + s * 0.4 * leg, y + s * 0.58);
    g.lineBetween(x + s * 0.2, y + s * 0.2, x + s * 0.24 - s * 0.4 * leg, y + s * 0.58);
  } else {
    g.lineBetween(x, y - s * 0.15, x + s * (0.34 + 0.28 * leg), y + s * 0.58);
    g.lineBetween(x, y - s * 0.15, x - s * (0.34 - 0.28 * leg), y + s * 0.58);
  }

  if (style.apron) {
    g.lineStyle(DETAIL + 0.4, INK, 0.9);
    g.strokeRect(x - s * 0.3, y - s * 0.95, s * 0.6, s * 0.72);
    g.lineStyle(DETAIL, INK, 0.4);
    g.lineBetween(x - s * 0.3, y - s * 0.6, x + s * 0.3, y - s * 0.6);
  }

  if (style.walkingStick) {
    g.lineStyle(2.6, INK, 1);
    g.lineBetween(x + dir * s * 0.72, y - s * 0.58, x + dir * s * 0.88, y + s * 0.58);
  }
}

function drawFace(
  g: Phaser.GameObjects.Graphics,
  x: number,
  headY: number,
  dir: number,
  s: number,
  style: PersonStyle,
  pose: StickPose
): void {
  g.fillStyle(INK, 1);
  if (style.eyes === 'happy') {
    g.lineStyle(2, INK, 1);
    g.beginPath();
    g.moveTo(x + dir * s * 0.08, headY - s * 0.04);
    g.lineTo(x + dir * s * 0.17, headY - s * 0.12);
    g.lineTo(x + dir * s * 0.26, headY - s * 0.04);
    g.strokePath();
  } else if (style.eyes === 'thoughtful') {
    g.lineStyle(2, INK, 1);
    g.lineBetween(x + dir * s * 0.06, headY - s * 0.16, x + dir * s * 0.27, headY - s * 0.11);
    g.fillCircle(x + dir * s * 0.19, headY - s * 0.01, s * 0.06);
  } else if (style.eyes === 'focused') {
    g.lineStyle(2.2, INK, 1);
    g.lineBetween(x + dir * s * 0.08, headY - s * 0.14, x + dir * s * 0.28, headY - s * 0.14);
    g.fillCircle(x + dir * s * 0.2, headY - s * 0.02, s * 0.07);
  } else {
    g.fillCircle(x + dir * s * 0.19, headY - s * 0.03, s * 0.075);
  }

  // Mouth: open on alternating frames while talking.
  g.lineStyle(DETAIL, INK, 0.85);
  if (pose.talking && pose.frame % 2 === 0) {
    g.fillStyle(INK, 0.85);
    g.fillCircle(x + dir * s * 0.24, headY + s * 0.19, s * 0.07);
  } else {
    g.lineBetween(x + dir * s * 0.14, headY + s * 0.2, x + dir * s * 0.3, headY + s * 0.19);
  }

  if (style.glasses) {
    g.lineStyle(2, INK, 1);
    g.strokeCircle(x + dir * s * 0.19, headY - s * 0.03, s * 0.15);
    g.lineBetween(x, headY - s * 0.03, x + dir * s * 0.05, headY - s * 0.03);
  }
}

function drawHair(
  g: Phaser.GameObjects.Graphics,
  x: number,
  headY: number,
  dir: number,
  s: number,
  hair: PersonStyle['hair']
): void {
  g.lineStyle(CONTOUR, INK, 1);
  if (hair === 'messy') {
    // A capped fringe rather than raised spikes, which read as horns or ears.
    g.fillStyle(INK, 0.9);
    g.beginPath();
    g.moveTo(x - s * 0.45, headY - s * 0.1);
    g.lineTo(x - s * 0.34, headY - s * 0.42);
    g.lineTo(x - s * 0.02, headY - s * 0.5);
    g.lineTo(x + s * 0.3, headY - s * 0.4);
    g.lineTo(x + s * 0.45, headY - s * 0.08);
    g.lineTo(x + s * 0.24, headY - s * 0.28);
    g.lineTo(x - s * 0.12, headY - s * 0.2);
    g.closePath();
    g.fillPath();
    g.lineStyle(1.8, INK, 0.8);
    g.lineBetween(x - s * 0.2, headY - s * 0.46, x - s * 0.3, headY - s * 0.62);
    g.lineStyle(CONTOUR, INK, 1);
  } else if (hair === 'bun') {
    g.fillStyle(PAPER, 1);
    g.fillCircle(x - dir * s * 0.34, headY - s * 0.3, s * 0.22);
    g.strokeCircle(x - dir * s * 0.34, headY - s * 0.3, s * 0.22);
    g.lineStyle(DETAIL, INK, 0.5);
    g.lineBetween(x - s * 0.3, headY - s * 0.36, x + s * 0.3, headY - s * 0.36);
  } else if (hair === 'beanie') {
    g.fillStyle(INK, 0.85);
    g.beginPath();
    g.moveTo(x - s * 0.46, headY - s * 0.14);
    g.lineTo(x - s * 0.36, headY - s * 0.56);
    g.lineTo(x + s * 0.36, headY - s * 0.56);
    g.lineTo(x + s * 0.46, headY - s * 0.14);
    g.closePath();
    g.fillPath();
    g.strokePath();
  } else if (hair === 'cap') {
    g.fillStyle(INK, 0.8);
    g.fillRect(x - s * 0.38, headY - s * 0.52, s * 0.76, s * 0.36);
    g.strokeRect(x - s * 0.38, headY - s * 0.52, s * 0.76, s * 0.36);
    g.lineStyle(CONTOUR, INK, 1);
    g.lineBetween(x - s * 0.1, headY - s * 0.16, x + dir * s * 0.72, headY - s * 0.2);
  } else if (hair === 'hat') {
    g.fillStyle(PAPER, 1);
    g.fillRect(x - s * 0.3, headY - s * 0.62, s * 0.6, s * 0.42);
    g.strokeRect(x - s * 0.3, headY - s * 0.62, s * 0.6, s * 0.42);
    g.lineBetween(x - s * 0.6, headY - s * 0.2, x + s * 0.6, headY - s * 0.2);
  } else if (hair === 'ponytail') {
    g.fillStyle(PAPER, 1);
    g.beginPath();
    g.moveTo(x - dir * s * 0.3, headY - s * 0.34);
    g.lineTo(x - dir * s * 0.74, headY + s * 0.1);
    g.lineTo(x - dir * s * 0.5, headY + s * 0.18);
    g.closePath();
    g.fillPath();
    g.strokePath();
  }
}

function drawArms(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  dir: number,
  s: number,
  style: PersonStyle,
  pose: StickPose,
  leg: number
): void {
  const shoulder = y - s * 0.98;
  g.lineStyle(CONTOUR, INK, 1);

  if (style.raisedArm) {
    const wave = pose.frame % 2 === 0 ? 0.1 : -0.06;
    g.lineBetween(x, shoulder, x + dir * s * 0.58, shoulder - s * (0.5 + wave));
    g.lineBetween(x, shoulder, x - dir * s * 0.58, shoulder + s * (0.42 - wave));
    return;
  }

  if (pose.talking) {
    // A small gesture beat while speaking.
    const gesture = pose.frame % 2 === 0 ? 0.34 : 0.2;
    g.lineBetween(x, shoulder, x + dir * s * 0.6, shoulder - s * gesture);
    g.lineBetween(x, shoulder, x - dir * s * 0.48, shoulder + s * 0.44);
    return;
  }

  // Arms counter-swing against the legs.
  g.lineBetween(x, shoulder, x + s * (0.62 * dir - 0.3 * leg), shoulder + s * 0.42);
  g.lineBetween(x, shoulder, x - s * (0.46 * dir + 0.3 * leg), shoulder + s * 0.44);
}

export function drawStickGuitarist(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1,
  pose: StickPose = STILL
): void {
  const { s, dir } = placeStickPerson(g, x, y, facing, scale, pose, {
    hair: 'beanie',
    eyes: 'thoughtful'
  });

  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.fillStyle(PAPER, 1);
  drawInkBlob(g, x + dir * s * 0.56, y - s * 0.5, s * 0.36, s * 0.52, 3, 10);
  g.fillPath();
  g.strokePath();
  g.fillStyle(INK, 0.9);
  g.fillCircle(x + dir * s * 0.56, y - s * 0.5, s * 0.13);

  g.lineStyle(CONTOUR - 0.8, INK, 1);
  g.lineBetween(x + dir * s * 0.56, y - s * 0.96, x + dir * s * 0.56, y - s * 1.52);
  g.strokeRect(x + dir * s * 0.46, y - s * 1.7, s * 0.2, s * 0.18);

  g.lineStyle(DETAIL, INK, 0.6);
  g.lineBetween(x - dir * s * 0.3, y - s * 1.16, x + dir * s * 0.62, y - s * 0.36);

  // Arm bandage — the reason this whole beat exists.
  g.lineStyle(3.4, INK, 0.35);
  g.lineBetween(x + dir * s * 0.34, y - s * 0.72, x + dir * s * 0.56, y - s * 0.56);
}

export function drawStickCrowd(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
  pose: StickPose = STILL
): void {
  // Offset frames so the little group never moves in lockstep.
  const at = (offset: number): StickPose => ({
    frame: pose.frame + offset,
    walking: false,
    talking: pose.talking
  });
  drawBasePerson(g, x - 20 * scale, y, 'left', scale * 0.8, at(1), { hair: 'cap' });
  drawBasePerson(g, x, y, 'right', scale * 0.92, at(0), {
    hair: 'messy',
    eyes: 'happy',
    raisedArm: true
  });
  drawBasePerson(g, x + 22 * scale, y, 'left', scale * 0.76, at(2), { hair: 'ponytail' });
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
  drawInkBlob(g, x, y - s * 0.2, s * 0.42, s * 0.62, 5, 10);
  g.fillPath();
  g.strokePath();
  g.strokeCircle(x, y - s * 0.2, s * 0.15);
  g.lineBetween(x, y - s * 0.8, x, y - s * 1.6);
  g.strokeRect(x - s * 0.15, y - s * 1.8, s * 0.3, s * 0.25);
}

export function drawStickTraveler(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1,
  pose: StickPose = STILL
): void {
  const { s, dir } = placeStickPerson(g, x, y, facing, scale, pose, {
    hair: 'ponytail',
    walkingStick: true,
    eyes: 'happy'
  });
  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  g.fillRect(x - dir * s * 0.58, y - s * 1.12, s * 0.4, s * 0.58);
  g.strokeRect(x - dir * s * 0.58, y - s * 1.12, s * 0.4, s * 0.58);
  g.lineStyle(DETAIL, INK, 0.5);
  g.lineBetween(x - dir * s * 0.58, y - s * 0.86, x - dir * s * 0.18, y - s * 0.86);
}

export function drawStickDriver(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1,
  pose: StickPose = STILL
): void {
  const { s, dir } = placeStickPerson(g, x, y, facing, scale, pose, {
    hair: 'cap',
    eyes: 'focused'
  });
  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillRect(x + dir * s * 0.42, y - s * 1.12, s * 0.58, s * 0.78);
  g.strokeRect(x + dir * s * 0.42, y - s * 1.12, s * 0.58, s * 0.78);
  g.fillStyle(INK, 0.8);
  g.fillRect(x + dir * s * 0.56, y - s * 1.22, s * 0.26, s * 0.13);
  g.lineStyle(DETAIL, INK, 0.55);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.88, x + dir * s * 0.9, y - s * 0.88);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.72, x + dir * s * 0.84, y - s * 0.72);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.56, x + dir * s * 0.88, y - s * 0.56);
}

export function drawStickOperationsHelper(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1,
  pose: StickPose = STILL
): void {
  const { s, dir } = placeStickPerson(g, x, y, facing, scale, pose, {
    hair: 'ponytail',
    apron: true,
    eyes: 'happy'
  });

  // Lantern swings gently on the stepped clock.
  const swing = Math.sin(pose.frame * 0.3) * s * 0.08;
  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.lineBetween(x + dir * s * 0.56, y - s * 0.58, x + dir * s * 0.72 + swing, y - s * 1.18);
  g.fillStyle(PAPER, 1);
  g.fillRect(x + dir * s * 0.52 + swing, y - s * 1.54, s * 0.44, s * 0.44);
  g.strokeRect(x + dir * s * 0.52 + swing, y - s * 1.54, s * 0.44, s * 0.44);
  g.lineBetween(
    x + dir * s * 0.74 + swing,
    y - s * 1.54,
    x + dir * s * 0.74 + swing,
    y - s * 1.72
  );
  g.lineStyle(DETAIL, INK, 0.5);
  g.lineBetween(x + dir * s * 0.6 + swing, y - s * 1.42, x + dir * s * 0.88 + swing, y - s * 1.2);
  g.lineStyle(1.3, INK, 0.32);
  g.lineBetween(x + dir * s * 1.02 + swing, y - s * 1.34, x + dir * s * 1.34, y - s * 1.44);
  g.lineBetween(x + dir * s * 1.02 + swing, y - s * 1.1, x + dir * s * 1.34, y - s * 1.02);
}

export function drawStickDanceTeacher(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1,
  pose: StickPose = STILL
): void {
  drawContactShadow(g, x, y, 34 * scale);
  drawBasePerson(g, x, y, facing, scale * 1.08, pose, {
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
  scale = 1,
  pose: StickPose = STILL
): void {
  const { s, dir } = placeStickPerson(g, x, y, facing, scale, pose, { hair: 'hat' }, scale * 1.05);
  g.lineStyle(2, INK, 1);
  g.strokeCircle(x + dir * s * 0.36, y - s * 0.2, s * 0.12);
  g.lineBetween(x + dir * s * 0.36, y - s * 0.08, x + dir * s * 0.36, y + s * 0.15);
  g.lineBetween(x + dir * s * 0.36, y + s * 0.06, x + dir * s * 0.46, y + s * 0.06);
}

export function drawStickShuttle(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1
): void {
  const s = 14 * scale;
  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  g.fillRect(x - s * 1.6, y - s * 1.05, s * 3.2, s * 0.95);
  g.strokeRect(x - s * 1.6, y - s * 1.05, s * 3.2, s * 0.95);
  g.fillStyle(PAPER, 1);
  for (let i = 0; i < 3; i += 1) {
    g.fillRect(x - s * 1.34 + i * s * 0.78, y - s * 0.9, s * 0.6, s * 0.42);
    g.strokeRect(x - s * 1.34 + i * s * 0.78, y - s * 0.9, s * 0.6, s * 0.42);
  }
  g.fillStyle(INK, 0.85);
  g.fillCircle(x - s, y + s * 0.1, s * 0.3);
  g.fillCircle(x + s, y + s * 0.1, s * 0.3);
  g.fillStyle(PAPER, 1);
  g.fillCircle(x - s, y + s * 0.1, s * 0.12);
  g.fillCircle(x + s, y + s * 0.1, s * 0.12);
  g.lineStyle(2, INK, 0.65);
  g.lineBetween(x - s * 0.4, y - s * 0.34, x + s * 0.9, y - s * 0.34);
}
