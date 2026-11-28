/**
 * Walking a fixed round (#145): an alien's patrol, or a drone's way out and
 * its cleaning beat. Plain data, stepped by frame.
 *
 * Yaw is the same as the player's: 0 faces north (-z), π/2 west (-x).
 */

/** A stop on a round: where, how long to stand there, and which way to look while standing. */
export interface Post {
  x: number;
  z: number;
  wait?: number;
  look?: number;
}

export interface Route {
  posts: readonly Post[];
  /** World units per second. */
  speed: number;
  /** Radians per second. */
  turnSpeed: number;
  /** `pingPong` walks there and back for ever; `once` stops at the last post. */
  mode: 'pingPong' | 'once';
}

export interface Patrol {
  x: number;
  z: number;
  yaw: number;
  /** The post it's heading for (or standing at). */
  target: number;
  /** Which way along the posts it's going: 1 forwards, -1 back. */
  direction: 1 | -1;
  /** Seconds stood at the current post. */
  waited: number;
  /** Walking, as opposed to standing or turning on the spot: for the walk cycle. */
  moving: boolean;
  /** A `once` route has reached its last post. */
  done: boolean;
}

/** The yaw that faces from (x, z) towards (tx, tz). */
export const yawTowards = (x: number, z: number, tx: number, tz: number) => Math.atan2(-(tx - x), -(tz - z));

/** The shortest signed turn from `from` to `to`, in -π..π. */
export function angleBetween(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** Turn `yaw` towards `target` by at most `step`. */
export function turnTowards(yaw: number, target: number, step: number): number {
  const delta = angleBetween(yaw, target);
  return Math.abs(delta) <= step ? target : yaw + Math.sign(delta) * step;
}

export function startPatrol(route: Route): Patrol {
  const [first, second] = route.posts;
  const yaw = first.look ?? (second ? yawTowards(first.x, first.z, second.x, second.z) : 0);
  return { x: first.x, z: first.z, yaw, target: 0, direction: 1, waited: 0, moving: false, done: false };
}

function nextTarget(route: Route, patrol: Patrol): Pick<Patrol, 'target' | 'direction' | 'done'> {
  const last = route.posts.length - 1;
  if (route.mode === 'once') {
    const done = patrol.target >= last;
    return { target: done ? patrol.target : patrol.target + 1, direction: 1, done };
  }
  let direction = patrol.direction;
  if (patrol.target + direction > last || patrol.target + direction < 0) direction = -direction as 1 | -1;
  return { target: last ? patrol.target + direction : 0, direction, done: false };
}

/** Facing a heading this closely, it walks; any more off, it turns on the spot first. */
const WALK_WHILE_TURNING = 0.6;

/** One frame: walk to the next post, turning to face the way; stand and look; move on. */
export function stepPatrol(route: Route, patrol: Patrol, dt: number): Patrol {
  if (patrol.done) return { ...patrol, moving: false };
  const post = route.posts[patrol.target];
  const dx = post.x - patrol.x;
  const dz = post.z - patrol.z;
  const distance = Math.hypot(dx, dz);
  const turn = route.turnSpeed * dt;
  if (distance > 1e-3) {
    const heading = yawTowards(patrol.x, patrol.z, post.x, post.z);
    const yaw = turnTowards(patrol.yaw, heading, turn);
    if (Math.abs(angleBetween(yaw, heading)) > WALK_WHILE_TURNING) return { ...patrol, yaw, moving: false };
    const step = Math.min(distance, route.speed * dt);
    return { ...patrol, yaw, x: patrol.x + (dx / distance) * step, z: patrol.z + (dz / distance) * step, moving: true };
  }
  const yaw = post.look === undefined ? patrol.yaw : turnTowards(patrol.yaw, post.look, turn);
  const waited = patrol.waited + dt;
  if (waited < (post.wait ?? 0)) return { ...patrol, yaw, waited, moving: false };
  return { ...patrol, ...nextTarget(route, patrol), x: post.x, z: post.z, yaw, waited: 0, moving: false };
}
