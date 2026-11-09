import type { StampedeBounds } from './movement';

export type StampedeMapEventKind = 'mirror' | 'ex' | 'lastCall';

export const STAMPEDE_MIRROR_AT_MS = [22_000, 62_000, 104_000] as const;
export const STAMPEDE_EX_AT_MS = 86_000;
export const STAMPEDE_LAST_CALL_REMAINING_MS = 20_000;
export const STAMPEDE_MIRROR_RADIUS = 50;
export const STAMPEDE_MIRROR_CHARGE_MS = 2_400;
export const STAMPEDE_MIRROR_LIFE_MS = 26_000;
const MIRROR_DRAIN_RATE = 0.35;

export type StampedeGiftEffect = 'magnet' | 'ghosting' | 'heal';

export interface StampedeMirror {
  x: number;
  y: number;
  expiresAtMs: number;
  charge: number;
}

export type StampedeMirrorStep =
  | { status: 'waiting' | 'charging'; mirror: StampedeMirror }
  | { status: 'complete' | 'expired'; mirror: null };

/** Events whose start time falls inside (previousMs, elapsedMs]. */
export function dueStampedeMapEvents(
  previousMs: number,
  elapsedMs: number,
  durationMs: number
): StampedeMapEventKind[] {
  const crossed = (atMs: number) => previousMs < atMs && elapsedMs >= atMs;
  const due: StampedeMapEventKind[] = [];
  STAMPEDE_MIRROR_AT_MS.forEach((atMs) => {
    if (crossed(atMs)) due.push('mirror');
  });
  if (crossed(STAMPEDE_EX_AT_MS)) due.push('ex');
  if (crossed(durationMs - STAMPEDE_LAST_CALL_REMAINING_MS)) due.push('lastCall');
  return due;
}

export function isStampedeLastCall(elapsedMs: number, durationMs: number): boolean {
  return elapsedMs >= durationMs - STAMPEDE_LAST_CALL_REMAINING_MS;
}

/** A spot a short walk away: far enough to be a detour, close enough to be worth it. */
export function placeStampedeMirror(
  player: { x: number; y: number },
  bounds: StampedeBounds,
  elapsedMs: number,
  random: () => number = Math.random
): StampedeMirror {
  const inset = STAMPEDE_MIRROR_RADIUS + 30;
  let best = { x: player.x, y: player.y };
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const angle = random() * Math.PI * 2;
    const distance = 300 + random() * 160;
    const point = {
      x: clamp(player.x + Math.cos(angle) * distance, bounds.safeLeft + inset, bounds.safeRight - inset),
      y: clamp(player.y + Math.sin(angle) * distance, bounds.safeTop + inset, bounds.safeBottom - inset)
    };
    const score = -Math.abs(Math.hypot(point.x - player.x, point.y - player.y) - 360);
    if (score > bestScore) {
      best = point;
      bestScore = score;
    }
  }
  return { ...best, expiresAtMs: elapsedMs + STAMPEDE_MIRROR_LIFE_MS, charge: 0 };
}

/** Standing inside fills the pep talk; stepping out drains it slowly. */
export function stepStampedeMirror(
  mirror: StampedeMirror,
  player: { x: number; y: number },
  deltaMs: number,
  elapsedMs: number
): StampedeMirrorStep {
  if (elapsedMs >= mirror.expiresAtMs) return { status: 'expired', mirror: null };
  const inside = Math.hypot(player.x - mirror.x, player.y - mirror.y) <= STAMPEDE_MIRROR_RADIUS;
  const fill = deltaMs / STAMPEDE_MIRROR_CHARGE_MS;
  const charge = clamp(mirror.charge + (inside ? fill : -fill * MIRROR_DRAIN_RATE), 0, 1);
  if (charge >= 1) return { status: 'complete', mirror: null };
  return {
    status: inside ? 'charging' : 'waiting',
    mirror: charge === mirror.charge ? mirror : { ...mirror, charge }
  };
}

export function rollStampedeGift(
  hurt: boolean,
  random: () => number = Math.random
): StampedeGiftEffect {
  const roll = random();
  if (hurt && roll < 0.5) return 'heal';
  return roll < 0.75 ? 'magnet' : 'ghosting';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
