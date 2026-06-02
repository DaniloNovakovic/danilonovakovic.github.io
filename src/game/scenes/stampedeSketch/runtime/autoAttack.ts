export const STAMPEDE_AUTO_ATTACK_COOLDOWN_MS = 2_600;
const STAMPEDE_AUTO_ATTACK_RANGE = 170;
export const STAMPEDE_AUTO_ATTACK_LENGTH = 120;
export const STAMPEDE_AUTO_ATTACK_HALF_WIDTH = 22;
const STAMPEDE_AUTO_ATTACK_MAX_HITS = 2;

export interface StampedeAutoAttackProfile {
  cooldownMs: number;
  range: number;
  length: number;
  halfWidth: number;
  maxHits: number;
}

export const DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE: StampedeAutoAttackProfile = {
  cooldownMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
  range: STAMPEDE_AUTO_ATTACK_RANGE,
  length: STAMPEDE_AUTO_ATTACK_LENGTH,
  halfWidth: STAMPEDE_AUTO_ATTACK_HALF_WIDTH,
  maxHits: STAMPEDE_AUTO_ATTACK_MAX_HITS
};

export interface StampedeAutoAttackPoint {
  x: number;
  y: number;
}

export interface StampedeAutoAttackCandidate extends StampedeAutoAttackPoint {
  id: string;
  radius: number;
}

export interface StampedeAutoAttackState {
  nextFireAtMs: number;
  lastDirection: StampedeAutoAttackPoint;
}

export interface StampedeAutoAttackInput {
  state: StampedeAutoAttackState;
  elapsedMs: number;
  player: StampedeAutoAttackPoint;
  velocity: StampedeAutoAttackPoint;
  candidates: readonly StampedeAutoAttackCandidate[];
  profile?: StampedeAutoAttackProfile;
}

export interface StampedeAutoAttackEvent {
  kind: 'pencilSwipe';
  origin: StampedeAutoAttackPoint;
  direction: StampedeAutoAttackPoint;
  target: StampedeAutoAttackPoint;
  hitIds: readonly string[];
}

export interface StampedeAutoAttackFrame {
  state: StampedeAutoAttackState;
  attack: StampedeAutoAttackEvent | null;
  remainingCandidates: readonly StampedeAutoAttackCandidate[];
}

export function createStampedeAutoAttackState(
  options: Partial<StampedeAutoAttackState> = {}
): StampedeAutoAttackState {
  return {
    nextFireAtMs: options.nextFireAtMs ?? STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
    lastDirection: normalizeDirection(options.lastDirection ?? { x: 1, y: 0 })
  };
}

export function resolveStampedeAutoAttackFrame({
  state,
  elapsedMs,
  player,
  velocity,
  candidates,
  profile = DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE
}: StampedeAutoAttackInput): StampedeAutoAttackFrame {
  const lastDirection = resolveLastDirection(state.lastDirection, velocity);

  if (elapsedMs < state.nextFireAtMs) {
    return {
      state: {
        ...state,
        lastDirection
      },
      attack: null,
      remainingCandidates: candidates
    };
  }

  const targetCandidate = resolveNearestCandidate(player, candidates, profile);
  const direction = targetCandidate
    ? normalizeDirection({
      x: targetCandidate.x - player.x,
      y: targetCandidate.y - player.y
    })
    : lastDirection;
  const target = {
    x: player.x + direction.x * profile.length,
    y: player.y + direction.y * profile.length
  };
  const hitIds = resolveSwipeHitIds({
    player,
    direction,
    targetCandidateId: targetCandidate?.id ?? null,
    candidates,
    profile
  });
  const hitIdSet = new Set(hitIds);

  return {
    state: {
      nextFireAtMs: Math.max(
        state.nextFireAtMs + profile.cooldownMs,
        elapsedMs + profile.cooldownMs
      ),
      lastDirection
    },
    attack: {
      kind: 'pencilSwipe',
      origin: player,
      direction,
      target,
      hitIds
    },
    remainingCandidates: candidates.filter((candidate) => !hitIdSet.has(candidate.id))
  };
}

function resolveNearestCandidate(
  player: StampedeAutoAttackPoint,
  candidates: readonly StampedeAutoAttackCandidate[],
  profile: StampedeAutoAttackProfile = DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE
): StampedeAutoAttackCandidate | null {
  let nearest: StampedeAutoAttackCandidate | null = null;
  let nearestDistance = Infinity;

  candidates.forEach((candidate) => {
    const distance = Math.hypot(candidate.x - player.x, candidate.y - player.y);
    if (distance > profile.range + candidate.radius) return;
    if (distance >= nearestDistance) return;

    nearest = candidate;
    nearestDistance = distance;
  });

  return nearest;
}

function resolveSwipeHitIds({
  player,
  direction,
  targetCandidateId,
  candidates,
  profile
}: {
  player: StampedeAutoAttackPoint;
  direction: StampedeAutoAttackPoint;
  targetCandidateId: string | null;
  candidates: readonly StampedeAutoAttackCandidate[];
  profile: StampedeAutoAttackProfile;
}): readonly string[] {
  return candidates
    .filter((candidate) => (
      candidate.id === targetCandidateId ||
      isCandidateInSwipe({ player, direction, candidate, profile })
    ))
    .sort((left, right) => (
      Math.hypot(left.x - player.x, left.y - player.y) -
      Math.hypot(right.x - player.x, right.y - player.y)
    ))
    .slice(0, profile.maxHits)
    .map((candidate) => candidate.id);
}

function isCandidateInSwipe({
  player,
  direction,
  candidate,
  profile
}: {
  player: StampedeAutoAttackPoint;
  direction: StampedeAutoAttackPoint;
  candidate: StampedeAutoAttackCandidate;
  profile: StampedeAutoAttackProfile;
}): boolean {
  const dx = candidate.x - player.x;
  const dy = candidate.y - player.y;
  const projection = dx * direction.x + dy * direction.y;
  if (projection < 0 || projection > profile.length + candidate.radius) {
    return false;
  }

  const perpendicular = Math.abs(dx * direction.y - dy * direction.x);
  return perpendicular <= profile.halfWidth + candidate.radius;
}

function resolveLastDirection(
  currentDirection: StampedeAutoAttackPoint,
  velocity: StampedeAutoAttackPoint
): StampedeAutoAttackPoint {
  if (Math.hypot(velocity.x, velocity.y) === 0) {
    return normalizeDirection(currentDirection);
  }

  return normalizeDirection(velocity);
}

function normalizeDirection(point: StampedeAutoAttackPoint): StampedeAutoAttackPoint {
  const length = Math.hypot(point.x, point.y);
  if (length === 0) return { x: 1, y: 0 };

  return {
    x: point.x / length,
    y: point.y / length
  };
}
