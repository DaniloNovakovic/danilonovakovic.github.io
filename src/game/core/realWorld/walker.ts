import {
  distanceTo,
  footprintsOf,
  isSolidAt,
  REAL_WORLD_PLAYER_RADIUS,
  REAL_WORLD_WALK_SPEED,
  type RealWorldRoom
} from './labRoom';
import { crawlAmount, isOpenDuct } from './vent';

/** Someone walking on the floor plan: position and current velocity. */
export interface Walker {
  x: number;
  z: number;
  vx: number;
  vz: number;
}

/**
 * One frame of movement intent. `forward` and `strafe` are -1..1 (stick or
 * keys); `yaw` is the facing in radians, 0 looking towards -z (north).
 */
export interface WalkInput {
  forward: number;
  strafe: number;
  yaw: number;
}

/** How fast velocity catches up with the intent: quick, but never a snap. */
const ACCELERATION = 14;
/** On hands and knees, world units per second. */
export const REAL_WORLD_CRAWL_SPEED = 1.8;

function isBlockedInRoom(room: RealWorldRoom, x: number, z: number, edgeX: number, edgeZ: number): boolean {
  if (isSolidAt(room.walls, edgeX, edgeZ)) return true;
  return footprintsOf(room).some((footprint) => distanceTo(footprint, x, z) < REAL_WORLD_PLAYER_RADIUS);
}

/**
 * The two leading corners of the walker's square, `a` and `b`, block a move
 * unless both fit in the room or, with the vent open, both fit in the duct.
 * The duct's mouth overlaps the room floor, so the hand-over is seamless.
 */
function isBlocked(
  room: RealWorldRoom,
  ventOpen: boolean,
  x: number,
  z: number,
  a: readonly [number, number],
  b: readonly [number, number]
): boolean {
  if (!isBlockedInRoom(room, x, z, ...a) && !isBlockedInRoom(room, x, z, ...b)) return false;
  const vent = room.vent;
  return !(ventOpen && vent && isOpenDuct(vent, ...a) && isOpenDuct(vent, ...b));
}

/**
 * Advance a walker by `dt` seconds. Each axis moves on its own, so walking
 * into a wall at an angle slides along it instead of sticking. With the vent
 * open, the walker can duck into the duct and crawls, slower, inside it.
 */
export function stepWalker(
  room: RealWorldRoom,
  walker: Walker,
  input: WalkInput,
  dt: number,
  ventOpen = false
): Walker {
  let { forward, strafe } = input;
  const length = Math.hypot(forward, strafe);
  if (length > 1) {
    forward /= length;
    strafe /= length;
  }
  const sin = Math.sin(input.yaw);
  const cos = Math.cos(input.yaw);
  const crawl = crawlAmount(room.vent, ventOpen, walker.x, walker.z);
  const speed = REAL_WORLD_WALK_SPEED + (REAL_WORLD_CRAWL_SPEED - REAL_WORLD_WALK_SPEED) * crawl;
  const targetVx = (-sin * forward + cos * strafe) * speed;
  const targetVz = (-cos * forward - sin * strafe) * speed;
  const catchUp = 1 - Math.exp(-dt * ACCELERATION);
  const vx = walker.vx + (targetVx - walker.vx) * catchUp;
  const vz = walker.vz + (targetVz - walker.vz) * catchUp;

  const r = REAL_WORLD_PLAYER_RADIUS;
  let { x, z } = walker;
  const nextX = x + vx * dt;
  const edgeX = nextX + Math.sign(vx) * r;
  if (!isBlocked(room, ventOpen, nextX, z, [edgeX, z - r], [edgeX, z + r])) x = nextX;
  const nextZ = z + vz * dt;
  const edgeZ = nextZ + Math.sign(vz) * r;
  if (!isBlocked(room, ventOpen, x, nextZ, [x - r, edgeZ], [x + r, edgeZ])) z = nextZ;

  return { x, z, vx, vz };
}
