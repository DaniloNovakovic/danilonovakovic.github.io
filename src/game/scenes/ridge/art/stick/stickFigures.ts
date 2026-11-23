// Distinct NPC silhouettes intentionally branch on role props.
// fallow-ignore-file complexity
import type * as Phaser from 'phaser';
import type { BachataStance, RidgeEmotion, RidgeFacing } from '@/game/core/ridge';
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
  /** Mood of the line being spoken; overrides the resting face while set. */
  emotion?: RidgeEmotion | null;
  /** Strum-arm position while playing; flips on every landed note. */
  strum?: number;
  /** A guitar slung on the back, or being played. */
  prop?: 'guitar-back' | 'guitar-playing' | null;
  /** Sitting on something (an amp, a curb) instead of standing. */
  seated?: boolean;
  /** Mid-bachata: where the feet are after the last step (screen left/right, not facing). */
  dance?: BachataStance | null;
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
  // Same unit as the base person, so the pack lands on the body's anatomy.
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  const lift = bodyLiftOf(pose, s);
  const top = y + lift;

  drawContactShadow(g, x, y, 34 * scale, 0.18);
  // Pack first: it hangs behind the spine, so torso and arms ink over it.
  drawTravelPack(g, x, top, dir, s);
  // Slung across the back, the neck rises behind the head and over the pack.
  if (pose.prop === 'guitar-back') drawSlungGuitar(g, x, top, dir, s);
  const playing = pose.prop === 'guitar-playing';
  drawBasePerson(g, x, top, facing, scale, pose, {
    hair: 'messy',
    scarf: true,
    eyes: 'determined',
    ...(playing ? { arms: 'none' as const } : {})
  });
  if (playing) drawPlayedGuitar(g, x, top, dir, s, pose.strum ?? 0);
  if (pose.prop === 'guitar-back') {
    // Strap across the chest, over the scarf: worn, not held.
    g.lineStyle(DETAIL + 0.6, INK, 1);
    g.lineBetween(x - dir * s * 0.12, top - s * 1.14, x + dir * s * 0.22, top - s * 0.42);
  }

  // Shoulder strap over the near shoulder onto the chest: the mark that says
  // "worn" rather than "held".
  g.lineStyle(DETAIL + 0.8, INK, 1);
  g.beginPath();
  g.moveTo(x - dir * s * 0.1, top - s * 1.12);
  g.lineTo(x + dir * s * 0.06, top - s * 1.04);
  g.lineTo(x + dir * s * 0.14, top - s * 0.66);
  g.strokePath();

  // Scarf tail, trailing further when walking.
  const tail = pose.walking ? 0.85 : 0.62;
  g.lineStyle(2.8, INK, 1);
  g.beginPath();
  g.moveTo(x, top - s * 1.26);
  g.lineTo(x - dir * s * 0.42, top - s * 1.14);
  g.lineTo(x - dir * s * tail, top - s * (pose.walking ? 1.12 : 0.95));
  g.strokePath();
}

/** Acoustic body outline: two lobes and a waist, centred on (cx, cy). */
function drawGuitarBody(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number, tilt: number): void {
  const along = (d: number) => ({ x: cx + Math.sin(tilt) * d, y: cy - Math.cos(tilt) * d });
  const lower = along(-s * 0.2);
  const upper = along(s * 0.2);
  g.lineStyle(CONTOUR - 0.8, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  g.fillCircle(lower.x, lower.y, s * 0.34);
  g.fillCircle(upper.x, upper.y, s * 0.26);
  g.strokeCircle(lower.x, lower.y, s * 0.34);
  g.strokeCircle(upper.x, upper.y, s * 0.26);
  // Paint over the seam so the lobes read as one body.
  g.fillCircle(cx, cy, s * 0.2);
  g.fillStyle(INK, 1);
  g.fillCircle(cx, cy, s * 0.09);
}

function drawSlungGuitar(g: Phaser.GameObjects.Graphics, x: number, top: number, dir: number, s: number): void {
  // Body low behind the hip; neck up across the back and out above the head.
  const bodyX = x - dir * s * 0.62;
  const bodyY = top - s * 0.4;
  const headX = x - dir * s * 0.02;
  const headY = top - s * 2.5;
  g.lineStyle(CONTOUR - 0.4, INK, 1);
  g.lineBetween(bodyX, bodyY, headX, headY);
  g.fillStyle(INK, 1);
  g.fillRect(headX - s * 0.09, headY - s * 0.2, s * 0.18, s * 0.22);
  drawGuitarBody(g, bodyX, bodyY, s, dir * -0.3);
}

/**
 * Held for playing: body at the hip, neck angled up the facing side, the
 * fretting hand up the neck and the strumming hand over the soundhole.
 */
function drawPlayedGuitar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  top: number,
  dir: number,
  s: number,
  strum: number
): void {
  const bodyX = x + dir * s * 0.12;
  const bodyY = top - s * 0.5;
  const headX = x + dir * s * 1.3;
  const headY = top - s * 1.22;
  g.lineStyle(CONTOUR - 0.4, INK, 1);
  g.lineBetween(bodyX, bodyY, headX, headY);
  g.fillStyle(INK, 1);
  g.fillRect(headX - s * 0.08, headY - s * 0.14, s * 0.2, s * 0.16);
  drawGuitarBody(g, bodyX, bodyY, s, dir * 1.15);
  g.lineStyle(1, INK, 0.5);
  g.lineBetween(bodyX + dir * s * 0.1, bodyY - s * 0.02, headX, headY + s * 0.02);

  const shoulder = top - s * 0.98;
  g.lineStyle(CONTOUR, INK, 1);
  // Fretting arm up the neck.
  g.beginPath();
  g.moveTo(x, shoulder);
  g.lineTo(x + dir * s * 0.5, top - s * 0.7);
  g.lineTo(x + dir * s * 0.92, top - s * 0.98);
  g.strokePath();
  // Strumming arm: up on one note, down on the next.
  const hand = strum % 2 === 0 ? -0.66 : -0.38;
  g.beginPath();
  g.moveTo(x, shoulder);
  g.lineTo(x - dir * s * 0.22, top - s * 0.6);
  g.lineTo(x + dir * s * 0.12, top + s * hand * 0.9);
  g.strokePath();
}

/**
 * Rucksack hugging the back from shoulder to small of the back, with a rolled
 * bedroll strapped on top: a traveller at thumbnail size, and nothing a viewer
 * could mistake for a camera or a radio.
 */
function drawTravelPack(g: Phaser.GameObjects.Graphics, x: number, top: number, dir: number, s: number): void {
  const near = -0.06;
  const far = -0.54;
  const packTop = top - s * 1.16;
  const packH = s * 0.74;
  const left = spanLeft(x, dir, far, near, s);
  const w = s * (near - far);

  g.lineStyle(CONTOUR - 0.6, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  g.fillRoundedRect(left, packTop, w, packH, s * 0.12);
  g.strokeRoundedRect(left, packTop, w, packH, s * 0.12);

  // Flap and buckle.
  g.lineStyle(DETAIL, INK, 0.75);
  g.lineBetween(left + 2, packTop + packH * 0.3, left + w - 2, packTop + packH * 0.3);
  const buckle = x + dir * s * (far + (near - far) * 0.45);
  g.lineBetween(buckle, packTop + packH * 0.3, buckle, packTop + packH * 0.48);

  // Bedroll across the top.
  const rollH = s * 0.2;
  const rollLeft = spanLeft(x, dir, far - 0.06, near + 0.02, s);
  g.lineStyle(CONTOUR - 0.8, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillRoundedRect(rollLeft, packTop - rollH + 1, s * (near - far + 0.08), rollH, rollH / 2);
  g.strokeRoundedRect(rollLeft, packTop - rollH + 1, s * (near - far + 0.08), rollH, rollH / 2);
}

/**
 * Left edge of a box spanning `[from, to]` body units along the facing
 * direction (negative = behind). Mirroring only the start point and keeping a
 * positive width throws the box off the far side of the figure when it faces
 * left, which is how the pack came to float away from the body.
 */
function spanLeft(x: number, dir: number, from: number, to: number, s: number): number {
  return x + Math.min(dir * from, dir * to) * s;
}

export function drawStickCicka(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
  pose: StickPose = STILL,
  coat: 'pale' | 'dark' = 'pale'
): void {
  const s = 12 * scale;
  const dark = coat === 'dark';
  drawContactShadow(g, x, y, 28 * scale, 0.14);

  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.fillStyle(dark ? INK : PAPER, dark ? 0.9 : 1);

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

  // A dark coat gets paper eyes, so his face still reads.
  g.fillStyle(dark ? PAPER : INK, 1);
  g.fillCircle(x + s * 0.86, y - s * 0.85, s * (dark ? 0.12 : 0.09));
  g.lineStyle(DETAIL, dark ? PAPER : INK, 1);
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
  // Hard hat, not the player's fringe: the two stand side by side for the
  // whole Bridge beat and must never read as the same person.
  drawBasePerson(g, x, y, facing, scale, pose, {
    hair: 'hardhat',
    glasses: true,
    eyes: 'thoughtful'
  });

  // Blueprint roll tucked under the arm.
  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.fillStyle(PAPER, 1);
  const sheet = spanLeft(x, dir, 0.42, 1.34, s);
  g.fillRect(sheet, y - s * 1.06, s * 0.92, s * 0.56);
  g.strokeRect(sheet, y - s * 1.06, s * 0.92, s * 0.56);
  g.lineStyle(DETAIL, INK, 0.45);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.86, x + dir * s * 1.2, y - s * 0.86);
  g.lineBetween(x + dir * s * 0.5, y - s * 0.72, x + dir * s * 1.05, y - s * 0.72);

  // Pencil tucked behind the ear, under the brim.
  const ear = y - s * 1.6;
  g.lineStyle(2.4, INK, 1);
  g.lineBetween(x - dir * s * 0.42, ear - s * 0.18, x - dir * s * 0.06, ear + s * 0.02);
  g.fillStyle(INK, 1);
  g.fillCircle(x - dir * s * 0.06, ear + s * 0.02, 1.4);
}

export function drawStickToyCar(g: Phaser.GameObjects.Graphics, x: number, y: number, scale = 1): void {
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
  hair?: 'messy' | 'bun' | 'cap' | 'capBack' | 'hat' | 'ponytail' | 'beanie' | 'hardhat' | 'shaggy';
  /** `none`: the caller draws its own arms (holding something, in a sling). */
  arms?: 'none';
  moustache?: boolean;
  /** Solid ink torso: a leather jacket, the one heavy mass on a rocker. */
  jacket?: boolean;
  skirt?: boolean;
  apron?: boolean;
  raisedArm?: boolean;
  walkingStick?: boolean;
  glasses?: boolean;
  scarf?: boolean;
  eyes?: FaceEyes;
}

/** How far a seated figure's body drops, in body units. */
const SEATED_DROP = 0.24;

type FaceEyes = 'determined' | 'thoughtful' | 'happy' | 'focused' | 'wide' | 'closed';

/** Line moods borrow an existing eye shape where one already reads right. */
const EMOTION_EYES: Partial<Record<RidgeEmotion, FaceEyes>> = {
  playful: 'happy',
  thoughtful: 'thoughtful',
  determined: 'focused',
  surprised: 'wide',
  curious: 'wide',
  sleepy: 'closed'
};

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
  // Sitting drops the body onto a seat; the feet stay on the ground.
  const ground = y + s * 0.58;
  if (pose.seated) y += SEATED_DROP * s;
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

  if (style.jacket) {
    g.fillStyle(INK, 0.88);
    g.beginPath();
    g.moveTo(x - s * 0.3, y - s * 1.26);
    g.lineTo(x + s * 0.3, y - s * 1.26);
    g.lineTo(x + s * 0.26, y - s * 0.42);
    g.lineTo(x - s * 0.26, y - s * 0.42);
    g.closePath();
    g.fillPath();
    // Lapels as paper notches, so the mass still reads as clothing.
    g.lineStyle(DETAIL, PAPER, 0.9);
    g.lineBetween(x + dir * s * 0.02, y - s * 1.24, x + dir * s * 0.14, y - s * 0.92);
    g.lineBetween(x - dir * s * 0.06, y - s * 1.24, x - dir * s * 0.14, y - s * 0.98);
    g.lineStyle(CONTOUR, INK, 1);
  }

  if (style.scarf) {
    // Solid ink: the player's one signature mass, readable at any size.
    g.fillStyle(INK, 1);
    g.fillRect(x - s * 0.28, y - s * 1.34, s * 0.56, s * 0.2);
    g.lineStyle(CONTOUR, INK, 1);
  }

  if (style.arms !== 'none') drawArms(g, x, y, dir, s, style, pose, leg);

  // Legs
  g.lineStyle(CONTOUR, INK, 1);
  if (pose.seated) {
    // Thigh forward along the seat, shin straight down to the ground.
    const hip = y - s * 0.15;
    g.beginPath();
    g.moveTo(x, hip);
    g.lineTo(x + dir * s * 0.5, hip);
    g.lineTo(x + dir * s * 0.56, ground);
    g.strokePath();
    g.beginPath();
    g.moveTo(x, hip);
    g.lineTo(x + dir * s * 0.38, hip + s * 0.04);
    g.lineTo(x + dir * s * 0.36, ground);
    g.strokePath();
  } else if (style.skirt) {
    const feet = pose.dance ? danceFeet(pose.dance, x, y, s) : null;
    // The skirt swings toward the tapping foot.
    const sway = feet ? feet.hipDx * 2.2 : 0;
    g.fillStyle(PAPER, 1);
    g.beginPath();
    g.moveTo(x, y - s * 0.6);
    g.lineTo(x - s * 0.58 + sway, y + s * 0.2);
    g.lineTo(x + s * 0.58 + sway, y + s * 0.2);
    g.closePath();
    g.fillPath();
    g.strokePath();
    if (feet) {
      g.lineBetween(x - s * 0.2 + sway, y + s * 0.2, feet.left.x, feet.left.y);
      g.lineBetween(x + s * 0.2 + sway, y + s * 0.2, feet.right.x, feet.right.y);
    } else {
      g.lineBetween(x - s * 0.2, y + s * 0.2, x - s * 0.24 + s * 0.4 * leg, y + s * 0.58);
      g.lineBetween(x + s * 0.2, y + s * 0.2, x + s * 0.24 - s * 0.4 * leg, y + s * 0.58);
    }
  } else if (pose.dance) {
    const feet = danceFeet(pose.dance, x, y, s);
    const hip = { x: x + feet.hipDx, y: y - s * 0.15 };
    g.lineBetween(hip.x, hip.y, feet.left.x, feet.left.y);
    g.lineBetween(hip.x, hip.y, feet.right.x, feet.right.y);
    if (feet.tapping) {
      // Two quick motion ticks off the hip: it popped on the four.
      g.lineStyle(DETAIL, INK, 0.7);
      const side = Math.sign(feet.hipDx) || 1;
      g.lineBetween(hip.x + side * s * 0.3, hip.y - s * 0.2, hip.x + side * s * 0.48, hip.y - s * 0.26);
      g.lineBetween(hip.x + side * s * 0.32, hip.y, hip.x + side * s * 0.52, hip.y);
      g.lineStyle(CONTOUR, INK, 1);
    }
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

/**
 * Where a dancer's feet land for a bachata stance, in screen left/right:
 * mid-stride, closed together, or one foot pointed out on the tap with the
 * hip shifted over the standing leg.
 */
function danceFeet(
  stance: BachataStance,
  x: number,
  y: number,
  s: number
): { left: { x: number; y: number }; right: { x: number; y: number }; hipDx: number; tapping: boolean } {
  const ground = y + s * 0.58;
  switch (stance) {
    case 'open':
      return { left: { x: x - s * 0.5, y: ground }, right: { x: x + s * 0.5, y: ground }, hipDx: 0, tapping: false };
    case 'together':
      return { left: { x: x - s * 0.12, y: ground }, right: { x: x + s * 0.12, y: ground }, hipDx: 0, tapping: false };
    case 'tap-left':
      // Weight on the right; the left toe points out and the hip pops right.
      return {
        left: { x: x - s * 0.62, y: ground - s * 0.06 },
        right: { x: x + s * 0.2, y: ground },
        hipDx: s * 0.1,
        tapping: true
      };
    case 'tap-right':
      return {
        left: { x: x - s * 0.2, y: ground },
        right: { x: x + s * 0.62, y: ground - s * 0.06 },
        hipDx: -s * 0.1,
        tapping: true
      };
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
  const emotion = pose.emotion ?? null;
  const eyes = (emotion && EMOTION_EYES[emotion]) || style.eyes;
  drawEyes(g, x, headY, dir, s, eyes);
  drawMouth(g, x, headY, dir, s, pose, emotion);
  if (style.moustache) {
    g.fillStyle(INK, 1);
    g.beginPath();
    g.moveTo(x + dir * s * 0.1, headY + s * 0.16);
    g.lineTo(x + dir * s * 0.36, headY + s * 0.1);
    g.lineTo(x + dir * s * 0.38, headY + s * 0.17);
    g.lineTo(x + dir * s * 0.14, headY + s * 0.2);
    g.closePath();
    g.fillPath();
  }

  if (style.glasses) {
    g.lineStyle(2, INK, 1);
    g.strokeCircle(x + dir * s * 0.19, headY - s * 0.03, s * 0.15);
    g.lineBetween(x, headY - s * 0.03, x + dir * s * 0.05, headY - s * 0.03);
  }
}

function drawEyes(
  g: Phaser.GameObjects.Graphics,
  x: number,
  headY: number,
  dir: number,
  s: number,
  eyes: FaceEyes | undefined
): void {
  g.fillStyle(INK, 1);
  if (eyes === 'happy') {
    g.lineStyle(2, INK, 1);
    g.beginPath();
    g.moveTo(x + dir * s * 0.08, headY - s * 0.04);
    g.lineTo(x + dir * s * 0.17, headY - s * 0.12);
    g.lineTo(x + dir * s * 0.26, headY - s * 0.04);
    g.strokePath();
  } else if (eyes === 'thoughtful') {
    g.lineStyle(2, INK, 1);
    g.lineBetween(x + dir * s * 0.06, headY - s * 0.16, x + dir * s * 0.27, headY - s * 0.11);
    g.fillCircle(x + dir * s * 0.19, headY - s * 0.01, s * 0.06);
  } else if (eyes === 'focused') {
    g.lineStyle(2.2, INK, 1);
    g.lineBetween(x + dir * s * 0.08, headY - s * 0.14, x + dir * s * 0.28, headY - s * 0.14);
    g.fillCircle(x + dir * s * 0.2, headY - s * 0.02, s * 0.07);
  } else if (eyes === 'wide') {
    // Raised brow over an open eye: surprise, or leaning in to listen.
    g.lineStyle(2, INK, 1);
    g.lineBetween(x + dir * s * 0.1, headY - s * 0.24, x + dir * s * 0.28, headY - s * 0.27);
    g.fillStyle(PAPER, 1);
    g.fillCircle(x + dir * s * 0.19, headY - s * 0.05, s * 0.12);
    g.strokeCircle(x + dir * s * 0.19, headY - s * 0.05, s * 0.12);
    g.fillStyle(INK, 1);
    g.fillCircle(x + dir * s * 0.21, headY - s * 0.05, s * 0.055);
  } else if (eyes === 'closed') {
    g.lineStyle(2, INK, 1);
    g.lineBetween(x + dir * s * 0.1, headY - s * 0.02, x + dir * s * 0.28, headY - s * 0.01);
  } else {
    g.fillCircle(x + dir * s * 0.19, headY - s * 0.03, s * 0.075);
  }
}

function drawMouth(
  g: Phaser.GameObjects.Graphics,
  x: number,
  headY: number,
  dir: number,
  s: number,
  pose: StickPose,
  emotion: RidgeEmotion | null
): void {
  g.lineStyle(DETAIL, INK, 0.85);
  // A surprised mouth stays open between syllables.
  if (emotion === 'surprised') {
    g.strokeCircle(x + dir * s * 0.24, headY + s * 0.2, s * (pose.frame % 2 === 0 ? 0.09 : 0.07));
    return;
  }
  // Open on alternating frames while talking.
  if (pose.talking && pose.frame % 2 === 0) {
    g.fillStyle(INK, 0.85);
    g.fillCircle(x + dir * s * 0.24, headY + s * 0.19, s * 0.07);
    return;
  }
  if (emotion === 'playful') {
    g.beginPath();
    g.moveTo(x + dir * s * 0.12, headY + s * 0.15);
    g.lineTo(x + dir * s * 0.22, headY + s * 0.23);
    g.lineTo(x + dir * s * 0.32, headY + s * 0.15);
    g.strokePath();
    return;
  }
  g.lineBetween(x + dir * s * 0.14, headY + s * 0.2, x + dir * s * 0.3, headY + s * 0.19);
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
  } else if (hair === 'hardhat') {
    // Dome with a ridge and a long brim: a builder at thumbnail size.
    g.fillStyle(PAPER_WARM, 1);
    g.beginPath();
    g.arc(x, headY - s * 0.12, s * 0.5, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineStyle(DETAIL, INK, 0.7);
    g.lineBetween(x, headY - s * 0.62, x, headY - s * 0.14);
    g.lineStyle(CONTOUR, INK, 1);
    g.lineBetween(x - dir * s * 0.56, headY - s * 0.12, x + dir * s * 0.74, headY - s * 0.12);
  } else if (hair === 'shaggy') {
    // Rocker hair: a heavy fringe swept back and down past the collar.
    g.fillStyle(INK, 0.92);
    g.beginPath();
    g.moveTo(x + dir * s * 0.42, headY - s * 0.14);
    g.lineTo(x + dir * s * 0.24, headY - s * 0.46);
    g.lineTo(x - dir * s * 0.12, headY - s * 0.52);
    g.lineTo(x - dir * s * 0.46, headY - s * 0.3);
    g.lineTo(x - dir * s * 0.6, headY + s * 0.3);
    g.lineTo(x - dir * s * 0.5, headY + s * 0.62);
    g.lineTo(x - dir * s * 0.3, headY + s * 0.34);
    g.lineTo(x - dir * s * 0.18, headY - s * 0.1);
    g.lineTo(x + dir * s * 0.18, headY - s * 0.26);
    g.closePath();
    g.fillPath();
  } else if (hair === 'capBack') {
    // Cap on backwards: the brim points behind. Unmistakably a kid.
    g.fillStyle(INK, 0.8);
    g.beginPath();
    g.arc(x, headY - s * 0.12, s * 0.44, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineStyle(CONTOUR, INK, 1);
    g.lineBetween(x - dir * s * 0.3, headY - s * 0.16, x - dir * s * 0.78, headY - s * 0.1);
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

  if (pose.dance) {
    // Elbows soft, hands at the waist; they lift a little on the tap.
    const lift = pose.dance === 'tap-left' || pose.dance === 'tap-right' ? s * 0.12 : 0;
    g.beginPath();
    g.moveTo(x, shoulder);
    g.lineTo(x + dir * s * 0.34, shoulder + s * 0.36);
    g.lineTo(x + dir * s * 0.62, shoulder + s * 0.12 - lift);
    g.strokePath();
    g.beginPath();
    g.moveTo(x, shoulder);
    g.lineTo(x - dir * s * 0.3, shoulder + s * 0.38);
    g.lineTo(x - dir * s * 0.5, shoulder + s * 0.2 - lift);
    g.strokePath();
    return;
  }

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

/**
 * Steve: forty-six, a local legend. Long rocker hair, moustache, leather
 * jacket, and his strumming wrist strapped in a sling. He sits on his amp
 * backstage; on show night he stands in the wings and cheers.
 */
export function drawStickGuitarist(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1,
  pose: StickPose = STILL
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawContactShadow(g, x, y, 32 * scale);
  if (pose.seated) drawAmp(g, x - dir * s * 0.06, y + s * 0.58, s);
  drawBasePerson(g, x, y, facing, scale, pose, {
    hair: 'shaggy',
    moustache: true,
    jacket: true,
    arms: 'none',
    eyes: 'thoughtful'
  });

  const top = pose.seated ? y + SEATED_DROP * s : y;
  const shoulder = top - s * 0.98;
  // Good arm: up in a fist when the night is going well, else at rest.
  g.lineStyle(CONTOUR, INK, 1);
  if (pose.emotion === 'playful' && !pose.seated) {
    const pump = pose.frame % 2 === 0 ? 0 : s * 0.08;
    g.lineBetween(x, shoulder, x - dir * s * 0.34, shoulder - s * 0.42 - pump);
    g.lineBetween(x - dir * s * 0.34, shoulder - s * 0.42 - pump, x - dir * s * 0.3, shoulder - s * 0.86 - pump);
    g.fillStyle(INK, 1);
    g.fillCircle(x - dir * s * 0.3, shoulder - s * 0.9 - pump, s * 0.1);
  } else if (pose.talking) {
    const gesture = pose.frame % 2 === 0 ? 0.3 : 0.16;
    g.lineBetween(x, shoulder, x - dir * s * 0.56, shoulder + s * gesture);
  } else {
    g.lineBetween(x, shoulder, x - dir * s * 0.4, shoulder + s * 0.5);
  }

  // Bad arm bent across the chest in a paper sling.
  g.lineBetween(x, shoulder, x + dir * s * 0.24, top - s * 0.62);
  g.lineBetween(x + dir * s * 0.24, top - s * 0.62, x - dir * s * 0.12, top - s * 0.78);
  g.lineStyle(CONTOUR - 0.8, INK, 1);
  g.fillStyle(PAPER, 1);
  g.beginPath();
  g.moveTo(x + dir * s * 0.32, top - s * 0.56);
  g.lineTo(x - dir * s * 0.2, top - s * 0.74);
  g.lineTo(x + dir * s * 0.06, top - s * 0.44);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Strap up to the far side of the neck.
  g.lineStyle(DETAIL + 0.4, INK, 0.9);
  g.lineBetween(x - dir * s * 0.16, top - s * 0.74, x - dir * s * 0.1, top - s * 1.22);
  g.lineBetween(x + dir * s * 0.3, top - s * 0.58, x + dir * s * 0.08, top - s * 1.24);
}

/** A little practice amp: box, grille hatching, one knob. */
function drawAmp(g: Phaser.GameObjects.Graphics, x: number, ground: number, s: number): void {
  const w = s * 0.86;
  const h = s * 0.66;
  g.lineStyle(CONTOUR - 0.6, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  g.fillRect(x - w / 2, ground - h, w, h);
  g.strokeRect(x - w / 2, ground - h, w, h);
  g.lineStyle(1.2, INK, 0.45);
  for (let i = 1; i < 5; i += 1) {
    g.lineBetween(x - w / 2 + 3, ground - h + (h * i) / 5, x + w / 2 - 3, ground - h + (h * i) / 5);
  }
}

/**
 * The skater kid: small, cap on backwards, with the cracked board. Sulking on
 * the curb before the show; board under his arm once he is up and about.
 */
export function drawStickKid(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: RidgeFacing,
  scale = 1,
  pose: StickPose = STILL
): void {
  const s = 16 * scale;
  const dir = facing === 'left' ? -1 : 1;
  drawContactShadow(g, x, y, 24 * scale);
  if (pose.seated) {
    // The curb he is sulking on, and the board face-up at his feet.
    g.lineStyle(CONTOUR - 0.8, INK, 1);
    g.fillStyle(PAPER_WARM, 1);
    g.fillRect(x - s * 0.5, y + s * 0.08, s * 0.92, s * 0.5);
    g.strokeRect(x - s * 0.5, y + s * 0.08, s * 0.92, s * 0.5);
    drawSkateboard(g, x + dir * s * 1.2, y + s * 0.46, s, 0);
  }
  drawBasePerson(g, x, y, facing, scale, pose, { hair: 'capBack', eyes: 'focused' });
  if (!pose.seated) {
    const top = y;
    drawSkateboard(g, x - dir * s * 0.42, top - s * 0.7, s, dir * 1.35);
  }
}

/** Deck, two wheels, and the crack that started all this. */
function drawSkateboard(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number, tilt: number): void {
  const half = s * 0.62;
  const ax = cx - Math.cos(tilt) * half;
  const ay = cy - Math.sin(tilt) * half;
  const bx = cx + Math.cos(tilt) * half;
  const by = cy + Math.sin(tilt) * half;
  g.lineStyle(s * 0.16, INK, 1);
  g.lineBetween(ax, ay, bx, by);
  g.fillStyle(INK, 1);
  const nx = -Math.sin(tilt) * s * 0.14;
  const ny = Math.cos(tilt) * s * 0.14;
  g.fillCircle(ax + (bx - ax) * 0.2 + nx, ay + (by - ay) * 0.2 + ny, s * 0.08);
  g.fillCircle(ax + (bx - ax) * 0.8 + nx, ay + (by - ay) * 0.8 + ny, s * 0.08);
  // The crack: a paper zigzag across the deck.
  g.lineStyle(1.4, PAPER, 1);
  g.lineBetween(cx - nx * 0.5, cy - ny * 0.5, cx + Math.cos(tilt) * 2 + nx * 0.2, cy + Math.sin(tilt) * 2 + ny * 0.2);
}

/**
 * The waiting crowd, facing the stage: the impatient uncle with folded arms,
 * the grandma on her folding chair, and the fans. Arms go up as it warms up.
 */
export function drawStickCrowd(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
  pose: StickPose = STILL
): void {
  const cheering = pose.emotion === 'playful';
  // Offset frames so the group never moves in lockstep.
  const at = (offset: number, seated = false): StickPose => ({
    frame: pose.frame + offset,
    walking: false,
    talking: pose.talking,
    emotion: pose.emotion,
    seated
  });
  const u = 16 * scale;
  // Back to front, so the nearer heads ink over the further shoulders.
  drawBasePerson(g, x + 2.7 * u, y, 'left', scale * 0.78, at(3), { hair: 'beanie', raisedArm: cheering });
  drawBasePerson(g, x + 1.5 * u, y, 'left', scale * 0.84, at(2), { hair: 'ponytail', raisedArm: true });
  drawBasePerson(g, x + 0.3 * u, y, 'left', scale * 0.92, at(0), {
    hair: 'messy',
    eyes: 'happy',
    raisedArm: cheering
  });
  // Grandma on her folding chair: she has been here since six.
  drawFoldingChair(g, x - 1.05 * u, y + 0.58 * u, u * 0.86);
  drawBasePerson(g, x - 1.0 * u, y, 'left', scale * 0.82, at(1, true), { hair: 'bun', skirt: false });
  drawBasePerson(g, x - 2.3 * u, y, 'left', scale * 0.9, at(4), { hair: 'cap', raisedArm: cheering });
}

function drawFoldingChair(g: Phaser.GameObjects.Graphics, x: number, ground: number, s: number): void {
  const seat = ground - s * 0.5;
  g.lineStyle(2.2, INK, 1);
  g.lineBetween(x - s * 0.36, ground, x + s * 0.3, seat);
  g.lineBetween(x + s * 0.3, ground, x - s * 0.36, seat);
  g.lineBetween(x - s * 0.42, seat, x + s * 0.34, seat);
  // Backrest on the far side from the stage (she faces left).
  g.lineBetween(x + s * 0.3, seat, x + s * 0.38, seat - s * 0.74);
}

export function drawStickGuitar(g: Phaser.GameObjects.Graphics, x: number, y: number, scale = 1): void {
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
  if (pose.seated) {
    const u = 16 * scale;
    g.lineStyle(CONTOUR - 0.8, INK, 1);
    g.fillStyle(PAPER_WARM, 1);
    g.fillRect(x - u * 0.55, y + u * 0.04, u * 1.0, u * 0.54);
    g.strokeRect(x - u * 0.55, y + u * 0.04, u * 1.0, u * 0.54);
    g.lineBetween(x - u * 0.2, y + u * 0.04, x - u * 0.2, y - u * 0.06);
    g.lineBetween(x + u * 0.1, y + u * 0.04, x + u * 0.1, y - u * 0.06);
    g.lineBetween(x - u * 0.2, y - u * 0.06, x + u * 0.1, y - u * 0.06);
  }
  const { s, dir } = placeStickPerson(g, x, y, facing, scale, pose, {
    hair: 'ponytail',
    walkingStick: !pose.seated,
    eyes: 'happy'
  });
  g.lineStyle(CONTOUR - 0.7, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  const pack = spanLeft(x, dir, -0.58, -0.18, s);
  g.fillRect(pack, y - s * 1.12, s * 0.4, s * 0.58);
  g.strokeRect(pack, y - s * 1.12, s * 0.4, s * 0.58);
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
  const board = spanLeft(x, dir, 0.42, 1.0, s);
  g.fillRect(board, y - s * 1.12, s * 0.58, s * 0.78);
  g.strokeRect(board, y - s * 1.12, s * 0.58, s * 0.78);
  g.fillStyle(INK, 0.8);
  g.fillRect(spanLeft(x, dir, 0.56, 0.82, s), y - s * 1.22, s * 0.26, s * 0.13);
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
  const lantern = spanLeft(x, dir, 0.52, 0.96, s) + swing;
  g.fillRect(lantern, y - s * 1.54, s * 0.44, s * 0.44);
  g.strokeRect(lantern, y - s * 1.54, s * 0.44, s * 0.44);
  g.lineBetween(x + dir * s * 0.74 + swing, y - s * 1.54, x + dir * s * 0.74 + swing, y - s * 1.72);
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
  if (!pose.dance) drawGuira(g, x, y, facing === 'left' ? -1 : 1, 16 * scale * 1.08, pose.frame);
}

/** A güira: a ridged metal tube held up in the raised hand, scraper and all. */
function drawGuira(g: Phaser.GameObjects.Graphics, x: number, y: number, dir: number, s: number, frame: number): void {
  const shoulder = y - s * 0.98;
  const wave = frame % 2 === 0 ? 0.1 : -0.06;
  const hx = x + dir * s * 0.58;
  const hy = shoulder - s * (0.5 + wave);
  g.lineStyle(CONTOUR - 0.8, INK, 1);
  g.fillStyle(PAPER_WARM, 1);
  g.fillRect(hx - s * 0.1, hy - s * 0.46, s * 0.2, s * 0.5);
  g.strokeRect(hx - s * 0.1, hy - s * 0.46, s * 0.2, s * 0.5);
  g.lineStyle(1, INK, 0.6);
  for (let i = 1; i < 5; i += 1)
    g.lineBetween(hx - s * 0.1, hy - s * 0.46 + i * s * 0.1, hx + s * 0.1, hy - s * 0.46 + i * s * 0.1);
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

export function drawStickShuttle(g: Phaser.GameObjects.Graphics, x: number, y: number, scale = 1): void {
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
