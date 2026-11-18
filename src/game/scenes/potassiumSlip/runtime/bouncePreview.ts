import type { PotassiumPoint } from './projectileControl';

/**
 * Something the sponge ricochets off: an enemy or a boss soda can.
 * Arcade tests the sponge's circle against the body's box, but the live
 * ricochet reflects off the sprite-center-to-sponge direction (see
 * `ricochetProjectileFromEnemy`). That is why bounces off wide or odd-shaped
 * enemies are hard to guess, and why this preview takes both.
 */
export interface PotassiumBounceObstacle {
  /** Sprite center. The ricochet normal points from here to the sponge. */
  x: number;
  y: number;
  /** Arcade body box. */
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** Current body velocity, so the preview leads falling enemies. */
  vx: number;
  vy: number;
  /**
   * Set for boss soda cans: they are placed on an ellipse around the boss
   * each frame (body velocity stays 0), so `vx`/`vy` say nothing about them.
   */
  orbit?: PotassiumBounceOrbit;
}

/** Sprite center at time T (s): center + centerV*T + (cos, sin)(angle + angularSpeed*T) * radius. */
export interface PotassiumBounceOrbit {
  centerX: number;
  centerY: number;
  centerVx: number;
  centerVy: number;
  radiusX: number;
  radiusY: number;
  /** Radians, now. */
  angle: number;
  /** Radians per second. */
  angularSpeed: number;
}

export interface PotassiumBouncePreviewInput {
  origin: PotassiumPoint;
  /** Launch velocity in px/s. */
  velocity: PotassiumPoint;
  /** Sponge body radius. */
  radius: number;
  arena: { left: number; right: number; top: number; bottom: number };
  obstacles: readonly PotassiumBounceObstacle[];
  /** How far to draw the path after the first bounce. */
  afterBounceLength: number;
}

export interface PotassiumBouncePreview {
  /** Sponge center at the first bounce. */
  contact: PotassiumPoint;
  hit: 'enemy' | 'wall';
  /** Where the post-bounce line stops: the length cap, or the next contact. */
  bounceEnd: PotassiumPoint;
}

/** Ignore hits further out than this. Any real launch reaches a wall well before. */
const MAX_PREVIEW_SECONDS = 6;
const EPSILON = 1e-6;

/**
 * Where the sponge's first bounce happens and which way it goes afterwards.
 * Assumes straight-line flight at launch speed, with obstacles moving at
 * their current velocity (or along their orbit). Drag and mid-flight enemy
 * steering are ignored.
 */
export function predictPotassiumBounce(input: PotassiumBouncePreviewInput): PotassiumBouncePreview | null {
  const { origin, velocity, radius, arena, obstacles } = input;
  if (velocity.x * velocity.x + velocity.y * velocity.y <= EPSILON) return null;

  const first = findFirstContact(origin, velocity, radius, arena, obstacles, 0, -1);
  if (!first) return null;

  const contact = { x: origin.x + velocity.x * first.t, y: origin.y + velocity.y * first.t };
  const bounced = first.obstacleIndex >= 0
    ? reflectPotassiumRicochet(velocity, first.normal)
    : reflectOffWall(velocity, first.normal);
  const bouncedSpeed = Math.hypot(bounced.x, bounced.y);
  if (bouncedSpeed <= EPSILON) return null;

  // The second leg keeps launch speed so the obstacle lead stays roughly honest.
  const launchSpeed = Math.hypot(velocity.x, velocity.y);
  const afterVelocity = {
    x: (bounced.x / bouncedSpeed) * launchSpeed,
    y: (bounced.y / bouncedSpeed) * launchSpeed
  };
  const legSeconds = input.afterBounceLength / launchSpeed;
  const next = findFirstContact(contact, afterVelocity, radius, arena, obstacles, first.t, first.obstacleIndex);
  const legT = next ? Math.min(next.t - first.t, legSeconds) : legSeconds;

  return {
    contact,
    hit: first.obstacleIndex >= 0 ? 'enemy' : 'wall',
    bounceEnd: {
      x: contact.x + afterVelocity.x * legT,
      y: contact.y + afterVelocity.y * legT
    }
  };
}

/**
 * The sponge's enemy ricochet: mirror the velocity across `normal` when
 * heading into the enemy, otherwise just shoot out along the normal.
 */
export function reflectPotassiumRicochet(velocity: PotassiumPoint, normal: PotassiumPoint): PotassiumPoint {
  const dot = velocity.x * normal.x + velocity.y * normal.y;
  const ricochet = dot < 0
    ? { x: velocity.x - normal.x * (2 * dot), y: velocity.y - normal.y * (2 * dot) }
    : { x: normal.x, y: normal.y };
  if (ricochet.x * ricochet.x + ricochet.y * ricochet.y <= 0.001) {
    return { x: normal.x, y: normal.y };
  }
  return ricochet;
}

interface Contact {
  /** Absolute time in seconds since launch. */
  t: number;
  /** Wall contact: axis flips (x and/or y set to 1). Enemy contact: unit normal. */
  normal: PotassiumPoint;
  /** -1 for an arena wall. */
  obstacleIndex: number;
}

function findFirstContact(
  origin: PotassiumPoint,
  velocity: PotassiumPoint,
  radius: number,
  arena: PotassiumBouncePreviewInput['arena'],
  obstacles: readonly PotassiumBounceObstacle[],
  startT: number,
  skipIndex: number
): Contact | null {
  let best = wallContact(origin, velocity, radius, arena);
  let bestT = best ? best.t : MAX_PREVIEW_SECONDS;

  for (let i = 0; i < obstacles.length; i += 1) {
    if (i === skipIndex) continue;
    const obstacle = obstacles[i];
    const t = obstacle.orbit
      ? sampleOrbitContact(origin, velocity, radius, obstacle, obstacle.orbit, startT, bestT)
      : sweepLinearContact(origin, velocity, radius, obstacle, startT);
    if (t === null || t >= bestT) continue;
    const center = obstacleCenterAt(obstacle, startT + t);
    bestT = t;
    best = {
      t,
      normal: unitOr(origin.x + velocity.x * t - center.x, origin.y + velocity.y * t - center.y, velocity),
      obstacleIndex: i
    };
  }

  return best ? { ...best, t: startT + best.t } : null;
}

/** Obstacle moving in a straight line: exact sweep in the sponge's frame of reference. */
function sweepLinearContact(
  origin: PotassiumPoint,
  velocity: PotassiumPoint,
  radius: number,
  obstacle: PotassiumBounceObstacle,
  startT: number
): number | null {
  const dx = obstacle.vx * startT;
  const dy = obstacle.vy * startT;
  return sweepCircleIntoBox(
    origin.x, origin.y, velocity.x - obstacle.vx, velocity.y - obstacle.vy, radius,
    obstacle.left + dx, obstacle.top + dy, obstacle.right + dx, obstacle.bottom + dy
  );
}

/** Orbit sampling step: ~4px of sponge travel at top speed, well under a can's size. */
const ORBIT_SAMPLE_SECONDS = 1 / 200;
const ORBIT_REFINE_STEPS = 10;

/**
 * Orbiting obstacle: no closed form, so step along the flight until the
 * sponge overlaps the can's box, then bisect to the touch time.
 */
function sampleOrbitContact(
  origin: PotassiumPoint,
  velocity: PotassiumPoint,
  radius: number,
  obstacle: PotassiumBounceObstacle,
  orbit: PotassiumBounceOrbit,
  startT: number,
  limitT: number
): number | null {
  const touches = (t: number) => {
    const sprite = orbitCenterAt(orbit, startT + t);
    return circleTouchesBox(
      origin.x + velocity.x * t, origin.y + velocity.y * t, radius,
      sprite.x + (obstacle.left - obstacle.x), sprite.y + (obstacle.top - obstacle.y),
      sprite.x + (obstacle.right - obstacle.x), sprite.y + (obstacle.bottom - obstacle.y)
    );
  };
  if (touches(0)) return null;

  for (let t = ORBIT_SAMPLE_SECONDS; t < limitT + ORBIT_SAMPLE_SECONDS; t += ORBIT_SAMPLE_SECONDS) {
    if (!touches(t)) continue;
    let lo = t - ORBIT_SAMPLE_SECONDS;
    let hi = t;
    for (let step = 0; step < ORBIT_REFINE_STEPS; step += 1) {
      const mid = (lo + hi) / 2;
      if (touches(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  }
  return null;
}

function obstacleCenterAt(obstacle: PotassiumBounceObstacle, t: number): PotassiumPoint {
  if (obstacle.orbit) return orbitCenterAt(obstacle.orbit, t);
  return { x: obstacle.x + obstacle.vx * t, y: obstacle.y + obstacle.vy * t };
}

function orbitCenterAt(orbit: PotassiumBounceOrbit, t: number): PotassiumPoint {
  const angle = orbit.angle + orbit.angularSpeed * t;
  return {
    x: orbit.centerX + orbit.centerVx * t + Math.cos(angle) * orbit.radiusX,
    y: orbit.centerY + orbit.centerVy * t + Math.sin(angle) * orbit.radiusY
  };
}

function circleTouchesBox(
  px: number, py: number, r: number,
  left: number, top: number, right: number, bottom: number
): boolean {
  const nearestX = Math.max(left, Math.min(px, right));
  const nearestY = Math.max(top, Math.min(py, bottom));
  return (px - nearestX) ** 2 + (py - nearestY) ** 2 <= r * r;
}

function wallContact(
  origin: PotassiumPoint,
  velocity: PotassiumPoint,
  radius: number,
  arena: PotassiumBouncePreviewInput['arena']
): Contact | null {
  const tx = axisWallTime(origin.x, velocity.x, arena.left + radius, arena.right - radius);
  const ty = axisWallTime(origin.y, velocity.y, arena.top + radius, arena.bottom - radius);
  const t = Math.min(tx, ty);
  if (!Number.isFinite(t) || t > MAX_PREVIEW_SECONDS) return null;
  return {
    t,
    normal: { x: tx - t <= EPSILON ? 1 : 0, y: ty - t <= EPSILON ? 1 : 0 },
    obstacleIndex: -1
  };
}

function axisWallTime(position: number, speed: number, min: number, max: number): number {
  if (speed > EPSILON) return Math.max(0, (max - position) / speed);
  if (speed < -EPSILON) return Math.max(0, (min - position) / speed);
  return Infinity;
}

/** Arcade world bounds with bounce 1: flip whichever axis hit the wall. */
function reflectOffWall(velocity: PotassiumPoint, flip: PotassiumPoint): PotassiumPoint {
  return { x: flip.x ? -velocity.x : velocity.x, y: flip.y ? -velocity.y : velocity.y };
}

/**
 * First time a circle moving from (px, py) by (dx, dy) per second touches the box,
 * or null if it never does. Circles that already overlap are ignored.
 */
function sweepCircleIntoBox(
  px: number, py: number, dx: number, dy: number, r: number,
  left: number, top: number, right: number, bottom: number
): number | null {
  if (circleTouchesBox(px, py, r, left, top, right, bottom)) return null;

  // Ray against the box grown by r on every side.
  const xSpan = slabSpan(px, dx, left - r, right + r);
  const ySpan = slabSpan(py, dy, top - r, bottom + r);
  if (!xSpan || !ySpan) return null;
  const tEnter = Math.max(0, xSpan[0], ySpan[0]);
  if (tEnter > Math.min(MAX_PREVIEW_SECONDS, xSpan[1], ySpan[1])) return null;

  // Entering beside a face: the grown box is exact there.
  const cornerX = outsideEdge(px + dx * tEnter, left, right);
  const cornerY = outsideEdge(py + dy * tEnter, top, bottom);
  if (cornerX === null || cornerY === null) return tEnter;

  // Entering a corner square: the real outline is the rounded corner.
  return sweepPointIntoCircle(px - cornerX, py - cornerY, dx, dy, r);
}

/** Times a moving coordinate is inside [lo, hi], or null if never. */
function slabSpan(p: number, d: number, lo: number, hi: number): [number, number] | null {
  if (Math.abs(d) <= EPSILON) return p < lo || p > hi ? null : [-Infinity, Infinity];
  const t1 = (lo - p) / d;
  const t2 = (hi - p) / d;
  return t1 < t2 ? [t1, t2] : [t2, t1];
}

/** The box edge a coordinate lies beyond, or null when it is within the box span. */
function outsideEdge(value: number, min: number, max: number): number | null {
  if (value < min) return min;
  if (value > max) return max;
  return null;
}

/** First time a point at offset (fx, fy) from a circle center, moving by (dx, dy), reaches radius r. */
function sweepPointIntoCircle(fx: number, fy: number, dx: number, dy: number, r: number): number | null {
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= MAX_PREVIEW_SECONDS ? t : null;
}

function unitOr(x: number, y: number, fallback: PotassiumPoint): PotassiumPoint {
  let length = Math.hypot(x, y);
  if (length <= 0.001) {
    x = fallback.x;
    y = fallback.y;
    length = Math.hypot(x, y);
  }
  return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 1 };
}
