import type { StampedeBounds } from './movement';

export const STAMPEDE_FLOCK_POOL_SIZE = 30;
const OPENING_FLOCK = 2;
const LATE_FLOCK_GROWTH = 16;
const SURGE_BONUS = 3;
const LAST_CALL_BONUS = 6;
const SPAWN_MARGIN = 46;
const OVERTIME_GROWTH_MS = 15_000;
const MIN_SPAWN_GAP_MS = 180;
const MAX_OVERTIME_SPEED_BONUS = 0.6;
const MAX_OVERTIME_BONUS_HP = 4;

export interface StampedeFlockTargetInput {
  elapsedMs: number;
  durationMs: number;
  surge?: boolean;
  lastCall?: boolean;
}

export interface StampedeViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * How many birds should be on the field. Starts with a couple and grows,
 * so the run opens quiet and ends crowded.
 */
export function stampedeFlockTarget({
  elapsedMs,
  durationMs,
  surge = false,
  lastCall = false
}: StampedeFlockTargetInput): number {
  const progress = durationMs <= 0 ? 1 : clamp(elapsedMs / durationMs, 0, 1);
  const grown = OPENING_FLOCK + Math.floor(LATE_FLOCK_GROWTH * progress ** 0.75);
  const overtime = Math.floor(overtimeMs(elapsedMs, durationMs) / OVERTIME_GROWTH_MS);
  const bonus = (surge ? SURGE_BONUS : 0) + (lastCall ? LAST_CALL_BONUS : 0);
  return Math.min(STAMPEDE_FLOCK_POOL_SIZE, grown + overtime + bonus);
}

export function stampedeSpawnGapMs(elapsedMs: number, durationMs: number, surge = false): number {
  const progress = durationMs <= 0 ? 1 : clamp(elapsedMs / durationMs, 0, 1);
  const overtimeMinutes = overtimeMs(elapsedMs, durationMs) / 60_000;
  const gap = Math.max(MIN_SPAWN_GAP_MS, (1_100 - 700 * progress) * 0.75 ** overtimeMinutes);
  return surge ? gap * 0.5 : gap;
}

export interface StampedeOvertimeToughness {
  speedScale: number;
  bonusHp: number;
}

/**
 * Endless runs keep escalating once the regular clock is past: newcomers walk
 * faster and take more hits the longer you last.
 */
export function stampedeOvertimeToughness(elapsedMs: number, durationMs: number): StampedeOvertimeToughness {
  const minutes = overtimeMs(elapsedMs, durationMs) / 60_000;
  return {
    speedScale: 1 + Math.min(MAX_OVERTIME_SPEED_BONUS, minutes * 0.12),
    bonusHp: Math.min(MAX_OVERTIME_BONUS_HP, Math.floor(minutes / 1.5))
  };
}

function overtimeMs(elapsedMs: number, durationMs: number): number {
  return Math.max(0, elapsedMs - durationMs);
}

/**
 * A point just past the edge of the camera, inside the field, so new birds walk
 * in from off-screen. Falls back to the far field corner when the camera covers
 * every usable edge.
 */
export function pickStampedeSpawnPoint(
  view: StampedeViewRect,
  bounds: StampedeBounds,
  player: { x: number; y: number },
  random: () => number = Math.random
): { x: number; y: number } {
  const left = view.x - SPAWN_MARGIN;
  const right = view.x + view.width + SPAWN_MARGIN;
  const top = view.y - SPAWN_MARGIN;
  const bottom = view.y + view.height + SPAWN_MARGIN;
  const edges = [
    { from: { x: left, y: top }, to: { x: right, y: top } },
    { from: { x: left, y: bottom }, to: { x: right, y: bottom } },
    { from: { x: left, y: top }, to: { x: left, y: bottom } },
    { from: { x: right, y: top }, to: { x: right, y: bottom } }
  ]
    .map((edge) => clipEdge(edge.from, edge.to, bounds))
    .filter((edge): edge is { from: Point; to: Point; length: number } => edge !== null);

  const total = edges.reduce((sum, edge) => sum + edge.length, 0);
  if (total <= 0) return farCorner(bounds, player);

  let roll = random() * total;
  for (const edge of edges) {
    if (roll <= edge.length) {
      const t = edge.length === 0 ? 0 : roll / edge.length;
      return {
        x: edge.from.x + (edge.to.x - edge.from.x) * t,
        y: edge.from.y + (edge.to.y - edge.from.y) * t
      };
    }
    roll -= edge.length;
  }
  return farCorner(bounds, player);
}

interface Point {
  x: number;
  y: number;
}

function clipEdge(
  from: Point,
  to: Point,
  bounds: StampedeBounds
): { from: Point; to: Point; length: number } | null {
  const horizontal = from.y === to.y;
  if (horizontal) {
    if (from.y < bounds.safeTop || from.y > bounds.safeBottom) return null;
    const x0 = clamp(Math.min(from.x, to.x), bounds.safeLeft, bounds.safeRight);
    const x1 = clamp(Math.max(from.x, to.x), bounds.safeLeft, bounds.safeRight);
    if (x1 - x0 < 1) return null;
    return { from: { x: x0, y: from.y }, to: { x: x1, y: from.y }, length: x1 - x0 };
  }
  if (from.x < bounds.safeLeft || from.x > bounds.safeRight) return null;
  const y0 = clamp(Math.min(from.y, to.y), bounds.safeTop, bounds.safeBottom);
  const y1 = clamp(Math.max(from.y, to.y), bounds.safeTop, bounds.safeBottom);
  if (y1 - y0 < 1) return null;
  return { from: { x: from.x, y: y0 }, to: { x: from.x, y: y1 }, length: y1 - y0 };
}

function farCorner(bounds: StampedeBounds, player: Point): Point {
  return {
    x: player.x < (bounds.safeLeft + bounds.safeRight) / 2 ? bounds.safeRight : bounds.safeLeft,
    y: player.y < (bounds.safeTop + bounds.safeBottom) / 2 ? bounds.safeBottom : bounds.safeTop
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
