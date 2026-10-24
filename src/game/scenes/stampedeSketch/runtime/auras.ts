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
  wide: boolean;
  crosswind: boolean;
}

export interface StampedeBreathMods {
  wide?: boolean;
  crosswind?: boolean;
}

export interface StampedeStinkMods {
  far?: boolean;
  fast?: boolean;
  twin?: boolean;
  fat?: boolean;
}

export interface StampedeBreathPatch extends StampedeOrbitPoint {
  untilMs: number;
}

export function createOrbitHitState(): StampedeOrbitHitState {
  return { count: 0, angles: [], nextHitAtById: {} };
}

export function createBreathHitState(): Record<string, number> {
  return {};
}

export function getStinkAura(mods: StampedeStinkMods = {}): StampedeOrbitAura {
  return {
    count: mods.twin ? 2 : 1,
    radius: mods.far ? 102 : 56,
    hitRadius: mods.fat ? 36 : 20,
    radiansPerSecond: mods.fast ? 2.8 : 1.25,
    hitGapMs: mods.fast ? 480 : 780
  };
}

export function getBreathBeam(mods: StampedeBreathMods = {}): StampedeBreathBeam {
  return {
    range: 188,
    halfWidth: mods.wide ? 48 : 28,
    hitGapMs: 640,
    wide: Boolean(mods.wide),
    crosswind: Boolean(mods.crosswind)
  };
}

export function sampleBreathBubbles(
  player: StampedeOrbitPoint,
  facing: StampedeOrbitPoint,
  beam: StampedeBreathBeam
): StampedeOrbitPoint[] {
  const facingLength = Math.hypot(facing.x, facing.y) || 1;
  const facingX = facing.x / facingLength;
  const facingY = facing.y / facingLength;
  const sideX = -facingY;
  const sideY = facingX;
  const count = beam.wide ? 8 : 6;
  return Array.from({ length: count }, (_, index) => {
    const along = 26 + ((index + 0.5) / count) * (beam.range - 26);
    const wave = beam.crosswind ? Math.sin(along / 32) * 18 : 0;
    const spread = beam.wide ? (index % 2 === 0 ? 1 : -1) * beam.halfWidth * 0.42 : 0;
    const lateral = spread + wave;
    return {
      x: player.x + facingX * along + sideX * lateral,
      y: player.y + facingY * along + sideY * lateral
    };
  });
}

export function pushBreathLinger(
  patches: readonly StampedeBreathPatch[],
  fresh: readonly StampedeOrbitPoint[],
  elapsedMs: number,
  lifeMs = 1_100
): StampedeBreathPatch[] {
  const kept = patches.filter((patch) => patch.untilMs > elapsedMs);
  const next = [
    ...kept,
    ...fresh.map((point) => ({ ...point, untilMs: elapsedMs + lifeMs }))
  ];
  return next.slice(-18);
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
  linger?: readonly StampedeOrbitPoint[];
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
    const lateral = dx * facingY - dy * facingX;
    const wave = input.beam!.crosswind ? Math.sin(along / 32) * 18 : 0;
    const lingering = (input.linger ?? []).some((patch) => (
      Math.hypot(candidate.x - patch.x, candidate.y - patch.y) <= 18
    ));
    const inBeam = along >= 14
      && along <= input.beam!.range
      && Math.abs(lateral - wave) <= input.beam!.halfWidth;
    if (!inBeam && !lingering) return;
    hitIds.push(candidate.id);
    nextHitAtById[candidate.id] = input.elapsedMs + input.beam!.hitGapMs;
  });

  return { state: nextHitAtById, hitIds };
}

function evenAngles(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index / count) * Math.PI * 2);
}
