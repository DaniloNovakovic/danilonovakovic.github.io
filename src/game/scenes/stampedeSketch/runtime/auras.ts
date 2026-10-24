import { isStampedeWeaponImmune, type StampedeFlockKind } from './flock';

export interface StampedeOrbitAura {
  count: number;
  radius: number;
  hitRadius: number;
  radiansPerSecond: number;
  hitGapMs: number;
}

export interface StampedeOrbitPoint {
  x: number;
  y: number;
}

export interface StampedeOrbitCandidate extends StampedeOrbitPoint {
  id: string;
  kind?: StampedeFlockKind;
}

export interface StampedeOrbitHitState {
  count: number;
  angles: number[];
  nextHitAtById: Record<string, number>;
}

export function createOrbitHitState(): StampedeOrbitHitState {
  return { count: 0, angles: [], nextHitAtById: {} };
}

export function getBreathAura(rank: 1 | 2): StampedeOrbitAura {
  if (rank >= 2) {
    return {
      count: 3,
      radius: 64,
      hitRadius: 22,
      radiansPerSecond: 2.5,
      hitGapMs: 560
    };
  }
  return {
    count: 1,
    radius: 56,
    hitRadius: 20,
    radiansPerSecond: 1.35,
    hitGapMs: 780
  };
}

export function getSmellMoteAura(rank: 1 | 2): StampedeOrbitAura {
  if (rank >= 2) {
    return { count: 6, radius: 36, hitRadius: 0, radiansPerSecond: 1.7, hitGapMs: 0 };
  }
  return { count: 3, radius: 28, hitRadius: 0, radiansPerSecond: 0.75, hitGapMs: 0 };
}

export function stepOrbitHits(input: {
  state: StampedeOrbitHitState;
  aura: StampedeOrbitAura | null;
  elapsedMs: number;
  deltaMs: number;
  player: StampedeOrbitPoint;
  candidates: readonly StampedeOrbitCandidate[];
}): { state: StampedeOrbitHitState; hitIds: string[]; points: StampedeOrbitPoint[] } {
  if (!input.aura || input.aura.count <= 0) {
    return { state: createOrbitHitState(), hitIds: [], points: [] };
  }

  const aura = input.aura;
  const angles = (input.state.count === aura.count ? input.state.angles : evenAngles(aura.count))
    .map((angle) => angle + aura.radiansPerSecond * (input.deltaMs / 1000));
  const points = angles.map((angle) => ({
    x: input.player.x + Math.cos(angle) * aura.radius,
    y: input.player.y + Math.sin(angle) * aura.radius
  }));
  const nextHitAtById = { ...input.state.nextHitAtById };
  const hitIds: string[] = [];

  input.candidates.forEach((candidate) => {
    if (isStampedeWeaponImmune(candidate.kind ?? 'chick', 'badBreath', 1)) return;
    if (input.elapsedMs < (nextHitAtById[candidate.id] ?? 0)) return;
    const touched = points.some((point) => (
      Math.hypot(point.x - candidate.x, point.y - candidate.y) <= aura.hitRadius
    ));
    if (!touched) return;
    hitIds.push(candidate.id);
    nextHitAtById[candidate.id] = input.elapsedMs + aura.hitGapMs;
  });

  return {
    state: { count: aura.count, angles, nextHitAtById },
    hitIds,
    points
  };
}

export function sampleOrbitPoints(
  player: StampedeOrbitPoint,
  aura: StampedeOrbitAura,
  elapsedMs: number
): StampedeOrbitPoint[] {
  return evenAngles(aura.count).map((offset) => {
    const angle = offset + aura.radiansPerSecond * (elapsedMs / 1000);
    return {
      x: player.x + Math.cos(angle) * aura.radius,
      y: player.y + Math.sin(angle) * aura.radius
    };
  });
}

function evenAngles(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index / count) * Math.PI * 2);
}
