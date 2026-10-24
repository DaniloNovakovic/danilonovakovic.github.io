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

export interface StampedeBreathBeam {
  range: number;
  halfWidth: number;
  hitGapMs: number;
}

export function createOrbitHitState(): StampedeOrbitHitState {
  return { count: 0, angles: [], nextHitAtById: {} };
}

export function createBreathHitState(): Record<string, number> {
  return {};
}

export function getStinkAura(rank: 1 | 2): StampedeOrbitAura {
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

export function getBreathBeam(rank: 1 | 2): StampedeBreathBeam {
  if (rank >= 2) {
    return { range: 248, halfWidth: 22, hitGapMs: 420 };
  }
  return { range: 168, halfWidth: 16, hitGapMs: 640 };
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
    if (isStampedeWeaponImmune(candidate.kind ?? 'chick', 'badSmell', 1)) return;
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

export function stepBreathBeam(input: {
  state: Record<string, number>;
  beam: StampedeBreathBeam | null;
  elapsedMs: number;
  player: StampedeOrbitPoint;
  facing: StampedeOrbitPoint;
  candidates: readonly StampedeOrbitCandidate[];
}): { state: Record<string, number>; hitIds: string[] } {
  if (!input.beam) return { state: {}, hitIds: [] };
  const facingLength = Math.hypot(input.facing.x, input.facing.y) || 1;
  const facingX = input.facing.x / facingLength;
  const facingY = input.facing.y / facingLength;
  const nextHitAtById = { ...input.state };
  const hitIds: string[] = [];

  input.candidates.forEach((candidate) => {
    if (isStampedeWeaponImmune(candidate.kind ?? 'chick', 'badBreath', 1)) return;
    if (input.elapsedMs < (nextHitAtById[candidate.id] ?? 0)) return;
    const dx = candidate.x - input.player.x;
    const dy = candidate.y - input.player.y;
    const along = dx * facingX + dy * facingY;
    const lateral = Math.abs(dx * facingY - dy * facingX);
    if (along < 14 || along > input.beam!.range || lateral > input.beam!.halfWidth) return;
    hitIds.push(candidate.id);
    nextHitAtById[candidate.id] = input.elapsedMs + input.beam!.hitGapMs;
  });

  return { state: nextHitAtById, hitIds };
}

function evenAngles(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index / count) * Math.PI * 2);
}
