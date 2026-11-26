import {
  findProps,
  isSolidAt,
  REAL_WORLD_PLAYER_RADIUS,
  REAL_WORLD_WALK_SPEED,
  type RealWorldMap,
  type RoundProp
} from './labRoom';

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

const propsByMap = new WeakMap<RealWorldMap, RoundProp[]>();
function propsOf(map: RealWorldMap): RoundProp[] {
  let props = propsByMap.get(map);
  if (!props) {
    props = findProps(map);
    propsByMap.set(map, props);
  }
  return props;
}

function isBlocked(map: RealWorldMap, x: number, z: number, edgeX: number, edgeZ: number): boolean {
  const r = REAL_WORLD_PLAYER_RADIUS;
  if (isSolidAt(map, edgeX, edgeZ)) return true;
  return propsOf(map).some((prop) => Math.hypot(x - prop.x, z - prop.z) < prop.radius + r);
}

/**
 * Advance a walker by `dt` seconds. Each axis moves on its own, so walking
 * into a wall at an angle slides along it instead of sticking.
 */
export function stepWalker(map: RealWorldMap, walker: Walker, input: WalkInput, dt: number): Walker {
  let { forward, strafe } = input;
  const length = Math.hypot(forward, strafe);
  if (length > 1) {
    forward /= length;
    strafe /= length;
  }
  const sin = Math.sin(input.yaw);
  const cos = Math.cos(input.yaw);
  const targetVx = (-sin * forward + cos * strafe) * REAL_WORLD_WALK_SPEED;
  const targetVz = (-cos * forward - sin * strafe) * REAL_WORLD_WALK_SPEED;
  const catchUp = 1 - Math.exp(-dt * ACCELERATION);
  const vx = walker.vx + (targetVx - walker.vx) * catchUp;
  const vz = walker.vz + (targetVz - walker.vz) * catchUp;

  const r = REAL_WORLD_PLAYER_RADIUS;
  let { x, z } = walker;
  const nextX = x + vx * dt;
  const edgeX = nextX + Math.sign(vx) * r;
  if (!isBlocked(map, nextX, z, edgeX, z - r) && !isBlocked(map, nextX, z, edgeX, z + r)) x = nextX;
  const nextZ = z + vz * dt;
  const edgeZ = nextZ + Math.sign(vz) * r;
  if (!isBlocked(map, x, nextZ, x - r, edgeZ) && !isBlocked(map, x, nextZ, x + r, edgeZ)) z = nextZ;

  return { x, z, vx, vz };
}
