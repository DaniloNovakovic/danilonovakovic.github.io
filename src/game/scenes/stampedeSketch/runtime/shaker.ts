/**
 * Brad's protein shaker: lobbed at a spot, it lands and leaves a sticky puddle
 * that slows the player. Beer silences weapons; the shaker slows feet.
 */

interface Point {
  x: number;
  y: number;
}

export interface StampedeShakerShot {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  thrownAtMs: number;
  landsAtMs: number;
}

export interface StampedePuddle {
  x: number;
  y: number;
  untilMs: number;
}

const FLIGHT_MS = 750;
const ARC_HEIGHT = 70;
export const STAMPEDE_PUDDLE_RADIUS = 48;
const PUDDLE_MS = 5_000;
export const STAMPEDE_PUDDLE_SLOW = 0.6;

export function createShakerShot(from: Point, to: Point, nowMs: number): StampedeShakerShot {
  return {
    fromX: from.x,
    fromY: from.y,
    toX: to.x,
    toY: to.y,
    thrownAtMs: nowMs,
    landsAtMs: nowMs + FLIGHT_MS
  };
}

/** Where the shaker is drawn mid-flight: a straight line with a hop on top. */
export function shakerPosition(shot: StampedeShakerShot, nowMs: number): Point {
  const t = Math.min(1, Math.max(0, (nowMs - shot.thrownAtMs) / (shot.landsAtMs - shot.thrownAtMs)));
  return {
    x: shot.fromX + (shot.toX - shot.fromX) * t,
    y: shot.fromY + (shot.toY - shot.fromY) * t - Math.sin(t * Math.PI) * ARC_HEIGHT
  };
}

export function stepShakers(
  shots: readonly StampedeShakerShot[],
  puddles: readonly StampedePuddle[],
  nowMs: number
): { shots: StampedeShakerShot[]; puddles: StampedePuddle[] } {
  const flying: StampedeShakerShot[] = [];
  const nextPuddles = puddles.filter((puddle) => nowMs < puddle.untilMs);
  shots.forEach((shot) => {
    if (nowMs < shot.landsAtMs) {
      flying.push(shot);
      return;
    }
    nextPuddles.push({ x: shot.toX, y: shot.toY, untilMs: nowMs + PUDDLE_MS });
  });
  return { shots: flying, puddles: nextPuddles };
}

export function puddleSlowFactor(puddles: readonly StampedePuddle[], player: Point): number {
  const stuck = puddles.some((puddle) => (
    Math.hypot(puddle.x - player.x, puddle.y - player.y) <= STAMPEDE_PUDDLE_RADIUS
  ));
  return stuck ? STAMPEDE_PUDDLE_SLOW : 1;
}
