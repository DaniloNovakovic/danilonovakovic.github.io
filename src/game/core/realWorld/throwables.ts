import { isSolidAt, propsOf, REAL_WORLD_WALL_HEIGHT, type RealWorldMap } from './labRoom';

/** What can be picked up in the lab, and how it bounces. */
export type ThrowableKind = 'ball' | 'paper' | 'brain';

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

const SHAPE: Readonly<Record<ThrowableKind, { radius: number; bounce: number; drag: number }>> = {
  // A rubber ball from somebody's old life: very bouncy.
  ball: { radius: 0.2, bounce: 0.78, drag: 0.6 },
  // A sketchbook page, crumpled: barely bounces, slows fast.
  paper: { radius: 0.16, bounce: 0.25, drag: 2.5 },
  // Squishy: lands with a flop.
  brain: { radius: 0.2, bounce: 0.35, drag: 1.6 }
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

/** Where the loose things start: around the table and Danilo's pod. */
export const LAB_THROWABLES: readonly Throwable[] = [
  { id: 'ball', kind: 'ball', x: 17.5, y: 0.2, z: 11.5, vx: 0, vy: 0, vz: 0 },
  { id: 'paper', kind: 'paper', x: 24.2, y: 0.16, z: 7.4, vx: 0, vy: 0, vz: 0 },
  { id: 'brain', kind: 'brain', x: 23.1, y: 1.25, z: 14, vx: 0, vy: 0, vz: 0 }
];

/** The highest surface under (x, z): the floor, or the top of a prop. */
function groundAt(map: RealWorldMap, x: number, z: number): number {
  let ground = 0;
  for (const prop of propsOf(map)) {
    if (Math.hypot(x - prop.x, z - prop.z) < prop.radius) ground = Math.max(ground, prop.top);
  }
  return ground;
}

/** A prop side the thing would pass into at height `y`, if any. */
function propHit(map: RealWorldMap, x: number, y: number, z: number, radius: number) {
  return propsOf(map).find(
    (prop) => y - radius < prop.top - 0.05 && Math.hypot(x - prop.x, z - prop.z) < prop.radius + radius
  );
}

function bounceOffWalls(map: RealWorldMap, body: Throwable, dt: number) {
  const { radius, bounce } = SHAPE[body.kind];
  const nextX = body.x + body.vx * dt;
  if (isSolidAt(map, nextX + Math.sign(body.vx) * radius, body.z)) body.vx = -body.vx * bounce;
  else body.x = nextX;
  const nextZ = body.z + body.vz * dt;
  if (isSolidAt(map, body.x, nextZ + Math.sign(body.vz) * radius)) body.vz = -body.vz * bounce;
  else body.z = nextZ;

  const prop = propHit(map, body.x, body.y, body.z, radius);
  if (!prop) return;
  // Push out to the prop's edge and reflect off it.
  const dx = body.x - prop.x;
  const dz = body.z - prop.z;
  const distance = Math.hypot(dx, dz) || 1;
  const nx = dx / distance;
  const nz = dz / distance;
  body.x = prop.x + nx * (prop.radius + radius);
  body.z = prop.z + nz * (prop.radius + radius);
  const along = body.vx * nx + body.vz * nz;
  if (along < 0) {
    body.vx -= (1 + bounce) * along * nx;
    body.vz -= (1 + bounce) * along * nz;
  }
}

function bounceVertically(map: RealWorldMap, body: Throwable, dt: number) {
  const { radius, bounce, drag } = SHAPE[body.kind];
  body.vy -= GRAVITY * dt;
  body.y += body.vy * dt;
  const ceiling = REAL_WORLD_WALL_HEIGHT - radius;
  if (body.y > ceiling) {
    body.y = ceiling;
    body.vy = -Math.abs(body.vy) * bounce;
  }
  const ground = groundAt(map, body.x, body.z) + radius;
  if (body.y > ground) return;
  body.y = ground;
  body.vy = Math.abs(body.vy) < SETTLE_SPEED ? 0 : -body.vy * bounce;
  // Rolling and sliding slow it down.
  const friction = Math.exp(-dt * drag * 2);
  body.vx *= friction;
  body.vz *= friction;
  if (Math.hypot(body.vx, body.vz) < 0.05) body.vx = body.vz = 0;
}

/** Advance a loose thing by `dt` seconds: gravity, bounces off walls, props, floor and ceiling. */
export function stepThrowable(map: RealWorldMap, from: Throwable, dt: number): Throwable {
  const body = { ...from };
  bounceOffWalls(map, body, dt);
  bounceVertically(map, body, dt);
  return body;
}

/** Where the eye looks: `yaw` as for walking, `pitch` up is positive. */
export interface View {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
}

function lookDirection({ yaw, pitch }: View) {
  return {
    x: -Math.sin(yaw) * Math.cos(pitch),
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * Math.cos(pitch)
  };
}

/**
 * The thing under the crosshair and within reach, if any: the one the look
 * ray passes closest to. Forgiving on purpose, so a ball by your feet is easy
 * to grab.
 */
export function aimedThrowable(things: readonly Throwable[], view: View): Throwable | null {
  const look = lookDirection(view);
  let best: Throwable | null = null;
  let bestMiss = Infinity;
  for (const thing of things) {
    const dx = thing.x - view.x;
    const dy = thing.y - view.y;
    const dz = thing.z - view.z;
    const along = dx * look.x + dy * look.y + dz * look.z;
    if (along <= 0 || Math.hypot(dx, dy, dz) > REACH) continue;
    const miss = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - along * along));
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
