import { aimMiss, lookDirection, type View } from './aim';
import {
  distanceTo,
  footprintsOf,
  isSolidAt,
  nearestPoint,
  REAL_WORLD_WALL_HEIGHT,
  type Footprint,
  type RealWorldRoom
} from './labRoom';

/** What can be picked up, in the lab and on the deck, and how it bounces. */
export type ThrowableKind = 'ball' | 'paper' | 'brain' | 'can' | 'spanner';

/** A loose thing in the room: position, velocity, size. */
export interface Throwable {
  id: string;
  kind: ThrowableKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

/** `loudness`: how far off an alien hears it land (0: not at all). */
const SHAPE: Readonly<Record<ThrowableKind, { radius: number; bounce: number; drag: number; loudness: number }>> = {
  // A rubber ball from somebody's old life: very bouncy, a soft thud.
  ball: { radius: 0.2, bounce: 0.78, drag: 0.6, loudness: 5 },
  // A sketchbook page, crumpled: barely bounces, slows fast, makes no sound.
  paper: { radius: 0.16, bounce: 0.25, drag: 2.5, loudness: 0 },
  // Squishy: lands with a flop.
  brain: { radius: 0.2, bounce: 0.35, drag: 1.6, loudness: 2 },
  // An empty drinks can: rattles off everything.
  can: { radius: 0.1, bounce: 0.45, drag: 1.2, loudness: 9 },
  // A spanner off the cleaners' cart: one loud clang.
  spanner: { radius: 0.14, bounce: 0.2, drag: 2.2, loudness: 11 }
};

export const throwableRadius = (kind: ThrowableKind) => SHAPE[kind].radius;

const GRAVITY = 16;
/** Below this, a bounce settles instead. */
const SETTLE_SPEED = 0.8;
const THROW_SPEED = 11;
/** How far Danilo can reach, from the eye. */
const REACH = 3;
/** How far the look ray may pass from a thing and still count as aiming at it. */
const AIM_SLACK = 0.4;
const AIM_SLACK_PER_UNIT = 0.15;

/**
 * Where the loose things start: a rubber ball by the researcher's chair, a
 * crumpled page on the watch desk, a brain on the operating table.
 */
export const LAB_THROWABLES: readonly Throwable[] = [
  { id: 'ball', kind: 'ball', x: 7.4, y: 0.2, z: 9.6, vx: 0, vy: 0, vz: 0 },
  { id: 'paper', kind: 'paper', x: 3.9, y: 1.11, z: 13.9, vx: 0, vy: 0, vz: 0 },
  { id: 'brain', kind: 'brain', x: 14.4, y: 1.25, z: 12.4, vx: 0, vy: 0, vz: 0 }
];

/**
 * Where the deck's loose things start (room coordinates): a spanner on the
 * cleaners' cart in the storeroom, empty cans in the break room, one on the
 * laundry's folding table. Thrown, they clatter, and the aliens come to look.
 */
export const DECK_THROWABLES: readonly Throwable[] = [
  { id: 'spanner', kind: 'spanner', x: 21.4, y: 1.24, z: 24.4, vx: 0, vy: 0, vz: 0 },
  { id: 'can-table', kind: 'can', x: 8.9, y: 0.9, z: 5.6, vx: 0, vy: 0, vz: 0 },
  { id: 'can-machine', kind: 'can', x: 15.3, y: 0.1, z: 4.6, vx: 0, vy: 0, vz: 0 },
  { id: 'can-laundry', kind: 'can', x: 8.1, y: 1, z: 14.8, vx: 0, vy: 0, vz: 0 }
];

/** A sound something made, where it made it, and how far off it carries. */
export interface Noise {
  x: number;
  z: number;
  reach: number;
}

/** Hitting something faster than this makes a sound. */
const CLATTER_SPEED = 2.5;

/**
 * The sound a step from `before` to `after` made, if it hit something hard
 * enough: its velocity changed by more than gravity and friction account for.
 */
export function clatter(before: Throwable, after: Throwable, dt: number): Noise | null {
  const { loudness } = SHAPE[after.kind];
  if (!loudness) return null;
  const hit = Math.hypot(after.vx - before.vx, after.vy - before.vy + GRAVITY * dt, after.vz - before.vz);
  return hit > CLATTER_SPEED ? { x: after.x, z: after.z, reach: loudness } : null;
}

/** The highest surface under (x, z): the floor, or the top of a piece of furniture. */
function groundAt(room: RealWorldRoom, x: number, z: number): number {
  let ground = 0;
  for (const footprint of footprintsOf(room)) {
    if (distanceTo(footprint, x, z) === 0) ground = Math.max(ground, footprint.top);
  }
  return ground;
}

/** A furniture side the thing would pass into at height `y`, if any. */
function furnitureHit(room: RealWorldRoom, x: number, y: number, z: number, radius: number) {
  return footprintsOf(room).find(
    (footprint) => y - radius < footprint.top - 0.05 && distanceTo(footprint, x, z) < radius
  );
}

/** Which way out of `footprint` (x, z) is: away from its nearest edge. */
function outward(footprint: Footprint, x: number, z: number) {
  const nearest = nearestPoint(footprint, x, z);
  const distance = Math.hypot(x - nearest.x, z - nearest.z);
  if (distance > 0) return { nx: (x - nearest.x) / distance, nz: (z - nearest.z) / distance, nearest };
  // Inside (a fast throw got in between frames): out the closest side.
  if ('radius' in footprint) {
    const fromCentre = Math.hypot(x - footprint.x, z - footprint.z) || 1;
    const nx = (x - footprint.x) / fromCentre;
    const nz = (z - footprint.z) / fromCentre;
    return { nx, nz, nearest: { x: footprint.x + nx * footprint.radius, z: footprint.z + nz * footprint.radius } };
  }
  const dx = x - footprint.x;
  const dz = z - footprint.z;
  if (footprint.halfX - Math.abs(dx) < footprint.halfZ - Math.abs(dz)) {
    const nx = Math.sign(dx) || 1;
    return { nx, nz: 0, nearest: { x: footprint.x + nx * footprint.halfX, z } };
  }
  const nz = Math.sign(dz) || 1;
  return { nx: 0, nz, nearest: { x, z: footprint.z + nz * footprint.halfZ } };
}

function bounceOffWalls(room: RealWorldRoom, body: Throwable, dt: number) {
  const { radius, bounce } = SHAPE[body.kind];
  const nextX = body.x + body.vx * dt;
  if (isSolidAt(room.walls, nextX + Math.sign(body.vx) * radius, body.z)) body.vx = -body.vx * bounce;
  else body.x = nextX;
  const nextZ = body.z + body.vz * dt;
  if (isSolidAt(room.walls, body.x, nextZ + Math.sign(body.vz) * radius)) body.vz = -body.vz * bounce;
  else body.z = nextZ;

  const hit = furnitureHit(room, body.x, body.y, body.z, radius);
  if (!hit) return;
  // Push out to the edge and reflect off it.
  const { nx, nz, nearest } = outward(hit, body.x, body.z);
  body.x = nearest.x + nx * radius;
  body.z = nearest.z + nz * radius;
  const along = body.vx * nx + body.vz * nz;
  if (along < 0) {
    body.vx -= (1 + bounce) * along * nx;
    body.vz -= (1 + bounce) * along * nz;
  }
}

function bounceVertically(room: RealWorldRoom, body: Throwable, dt: number) {
  const { radius, bounce, drag } = SHAPE[body.kind];
  body.vy -= GRAVITY * dt;
  body.y += body.vy * dt;
  const ceiling = REAL_WORLD_WALL_HEIGHT - radius;
  if (body.y > ceiling) {
    body.y = ceiling;
    body.vy = -Math.abs(body.vy) * bounce;
  }
  const ground = groundAt(room, body.x, body.z) + radius;
  if (body.y > ground) return;
  body.y = ground;
  body.vy = Math.abs(body.vy) < SETTLE_SPEED ? 0 : -body.vy * bounce;
  // Rolling and sliding slow it down.
  const friction = Math.exp(-dt * drag * 2);
  body.vx *= friction;
  body.vz *= friction;
  if (Math.hypot(body.vx, body.vz) < 0.05) body.vx = body.vz = 0;
}

/** Advance a loose thing by `dt` seconds: gravity, bounces off walls, furniture, floor and ceiling. */
export function stepThrowable(room: RealWorldRoom, from: Throwable, dt: number): Throwable {
  const body = { ...from };
  bounceOffWalls(room, body, dt);
  bounceVertically(room, body, dt);
  return body;
}

/**
 * The thing under the crosshair and within reach, if any: the one the look
 * ray passes closest to. Forgiving on purpose, so a ball by your feet is easy
 * to grab.
 */
export function aimedThrowable(things: readonly Throwable[], view: View): Throwable | null {
  let best: Throwable | null = null;
  let bestMiss = Infinity;
  for (const thing of things) {
    const aim = aimMiss(view, thing, REACH);
    if (!aim) continue;
    const { miss, along } = aim;
    if (miss < AIM_SLACK + along * AIM_SLACK_PER_UNIT && miss < bestMiss) {
      best = thing;
      bestMiss = miss;
    }
  }
  return best;
}

/** Let go of a held thing from `start`, flying along the view. */
export function throwThrowable(held: Throwable, start: { x: number; y: number; z: number }, view: View): Throwable {
  const look = lookDirection(view);
  return {
    ...held,
    ...start,
    vx: look.x * THROW_SPEED,
    vy: look.y * THROW_SPEED + 2,
    vz: look.z * THROW_SPEED
  };
}
