export const STAMPEDE_BEER_DISARM_MS = 3_400;
export const STAMPEDE_BEER_SPEED = 220;
export const STAMPEDE_BEER_HIT_RADIUS = 18;
export const STAMPEDE_BEER_LIFE_MS = 1_400;
export const STAMPEDE_BARTENDER_THROW_MS = 2_800;

export interface StampedeBeerPoint {
  x: number;
  y: number;
}

export interface StampedeBeerShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  expiresAtMs: number;
}

export function createBeerShot(
  from: StampedeBeerPoint,
  to: StampedeBeerPoint,
  nowMs: number
): StampedeBeerShot {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: from.x,
    y: from.y,
    vx: (dx / length) * STAMPEDE_BEER_SPEED,
    vy: (dy / length) * STAMPEDE_BEER_SPEED,
    expiresAtMs: nowMs + STAMPEDE_BEER_LIFE_MS
  };
}

export function stepBeerShots(
  shots: readonly StampedeBeerShot[],
  deltaMs: number,
  nowMs: number,
  player: StampedeBeerPoint & { radius: number }
): { shots: StampedeBeerShot[]; hit: boolean } {
  const dt = deltaMs / 1000;
  const next: StampedeBeerShot[] = [];
  let hit = false;
  shots.forEach((shot) => {
    if (nowMs >= shot.expiresAtMs) return;
    const x = shot.x + shot.vx * dt;
    const y = shot.y + shot.vy * dt;
    if (Math.hypot(x - player.x, y - player.y) <= player.radius + STAMPEDE_BEER_HIT_RADIUS) {
      hit = true;
      return;
    }
    next.push({ ...shot, x, y });
  });
  return { shots: next, hit };
}
