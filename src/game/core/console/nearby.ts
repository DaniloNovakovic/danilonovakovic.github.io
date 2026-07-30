import type { NearbyThing } from './types';

export function pickNearby(
  nearby: readonly NearbyThing[],
  target: string | undefined
): NearbyThing | null {
  if (!target) return nearby[0] ?? null;
  const needle = target.toLowerCase();
  return (
    nearby.find((n) => n.id.toLowerCase() === needle || n.label.toLowerCase().includes(needle)) ??
    null
  );
}

export function nearbyMissMessage(
  nearby: readonly NearbyThing[],
  target: string | undefined,
  emptyMessage: string
): string | null {
  if (nearby.length === 0) return emptyMessage;
  if (pickNearby(nearby, target)) return null;
  return `No match for "${target}". Nearby: ${nearby.map((n) => n.id).join(', ')}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
