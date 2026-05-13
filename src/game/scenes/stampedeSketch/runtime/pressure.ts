export const STAMPEDE_CONTACT_COOLDOWN_MS = 1_150;
export const STAMPEDE_CONTACT_RADIUS_PADDING = 6;
export const STAMPEDE_OPENING_CALM_MS = 10_000;
export const STAMPEDE_BUILD_MS = 12_000;
export const STAMPEDE_SURGE_MS = 3_500;
export const STAMPEDE_RECOVER_MS = 6_000;

export type StampedePressureBand = 'calm' | 'build' | 'surge' | 'recover';

export interface StampedePressurePoint {
  x: number;
  y: number;
  radius?: number;
}

export interface StampedeContactCandidate {
  x: number;
  y: number;
  radius: number;
}

export interface StampedePressureInput {
  elapsedMs: number;
  durationMs: number;
  player: StampedePressurePoint;
  candidates: readonly StampedeContactCandidate[];
  lastContactAtMs?: number | null;
  contactCooldownMs?: number;
  contactRadiusPadding?: number;
}

export interface StampedePressureSnapshot {
  band: StampedePressureBand;
  cadenceMs: number;
  pressure: number;
  nearestContactDistance: number | null;
  nearestContactCandidate: StampedeContactCandidate | null;
  withinContactRadius: boolean;
  canContact: boolean;
}

export function resolveStampedePressure({
  elapsedMs,
  durationMs,
  player,
  candidates,
  lastContactAtMs = null,
  contactCooldownMs = STAMPEDE_CONTACT_COOLDOWN_MS,
  contactRadiusPadding = STAMPEDE_CONTACT_RADIUS_PADDING
}: StampedePressureInput): StampedePressureSnapshot {
  const clampedElapsedMs = Math.max(0, elapsedMs);
  const progress = durationMs <= 0 ? 1 : clamp(clampedElapsedMs / durationMs, 0, 1);
  const nearest = resolveNearestContactDistance(
    player,
    candidates,
    contactRadiusPadding
  );
  const withinContactRadius =
    nearest.nearestContactDistance !== null && nearest.nearestContactDistance <= 0;
  const canContact =
    withinContactRadius &&
    canApplyStampedeContact(clampedElapsedMs, lastContactAtMs, contactCooldownMs);
  const band = resolvePressureBand(clampedElapsedMs, lastContactAtMs, contactCooldownMs);
  const proximityPressure =
    nearest.nearestContactDistance === null
      ? 0
      : 1 - clamp(nearest.nearestContactDistance / 160, 0, 1);

  return {
    band,
    cadenceMs: resolvePressureCadenceMs(band),
    pressure: clamp(
      resolveBandPressureFloor(band) + progress * 0.2 + proximityPressure * 0.32,
      0,
      1
    ),
    nearestContactDistance: nearest.nearestContactDistance,
    nearestContactCandidate: nearest.nearestContactCandidate,
    withinContactRadius,
    canContact
  };
}

export function canApplyStampedeContact(
  nowMs: number,
  lastContactAtMs: number | null | undefined,
  contactCooldownMs: number = STAMPEDE_CONTACT_COOLDOWN_MS
): boolean {
  return (
    lastContactAtMs === null ||
    lastContactAtMs === undefined ||
    nowMs - lastContactAtMs >= contactCooldownMs
  );
}

function resolveNearestContactDistance(
  player: StampedePressurePoint,
  candidates: readonly StampedeContactCandidate[],
  contactRadiusPadding: number
): Pick<
  StampedePressureSnapshot,
  'nearestContactDistance' | 'nearestContactCandidate'
> {
  let nearestContactDistance: number | null = null;
  let nearestContactCandidate: StampedeContactCandidate | null = null;

  candidates.forEach((candidate) => {
    const distance =
      Math.hypot(player.x - candidate.x, player.y - candidate.y) -
      (player.radius ?? 0) -
      candidate.radius -
      contactRadiusPadding;

    if (
      nearestContactDistance === null ||
      distance < nearestContactDistance
    ) {
      nearestContactDistance = distance;
      nearestContactCandidate = candidate;
    }
  });

  return {
    nearestContactDistance,
    nearestContactCandidate
  };
}

function resolvePressureBand(
  elapsedMs: number,
  lastContactAtMs: number | null,
  contactCooldownMs: number
): StampedePressureBand {
  if (!canApplyStampedeContact(elapsedMs, lastContactAtMs, contactCooldownMs)) {
    return 'recover';
  }
  if (elapsedMs < STAMPEDE_OPENING_CALM_MS) return 'calm';

  const cycleMs = STAMPEDE_BUILD_MS + STAMPEDE_SURGE_MS + STAMPEDE_RECOVER_MS;
  const cycleElapsedMs = (elapsedMs - STAMPEDE_OPENING_CALM_MS) % cycleMs;

  if (cycleElapsedMs < STAMPEDE_BUILD_MS) return 'build';
  if (cycleElapsedMs < STAMPEDE_BUILD_MS + STAMPEDE_SURGE_MS) return 'surge';
  return 'recover';
}

function resolveBandPressureFloor(band: StampedePressureBand): number {
  switch (band) {
    case 'build':
      return 0.38;
    case 'surge':
      return 0.72;
    case 'recover':
      return 0.24;
    case 'calm':
    default:
      return 0.12;
  }
}

function resolvePressureCadenceMs(band: StampedePressureBand): number {
  switch (band) {
    case 'build':
      return 1_100;
    case 'surge':
      return 700;
    case 'recover':
      return 1_350;
    case 'calm':
    default:
      return 1_600;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
