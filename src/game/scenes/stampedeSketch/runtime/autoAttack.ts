import { isStampedeWeaponImmune, type StampedeFlockKind } from './flock';

export const STAMPEDE_AUTO_ATTACK_COOLDOWN_MS = 2_600;
export const STAMPEDE_AUTO_ATTACK_RANGE = 170;
const STAMPEDE_AUTO_ATTACK_LENGTH = 120;
const STAMPEDE_AUTO_ATTACK_HALF_WIDTH = 22;
const STAMPEDE_AUTO_ATTACK_MAX_HITS = 2;

export interface StampedeAutoAttackProfile {
  cooldownMs: number;
  range: number;
  length: number;
  halfWidth: number;
  maxHits: number;
  rear?: boolean;
  groupDaze?: boolean;
  longPose?: boolean;
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
  kind?: StampedeFlockKind;
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
  kind: 'badSelfie';
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

  const hits = resolveSelfieHits(player, candidates, profile, elapsedMs, lastDirection);
  const direction = hits[0]
    ? normalizeDirection({
      x: hits[0].x - player.x,
      y: hits[0].y - player.y
    })
    : lastDirection;
  const target = hits[0]
    ? { x: hits[0].x, y: hits[0].y }
    : {
      x: player.x + direction.x * 36,
      y: player.y + direction.y * 36
    };
  const hitIds = hits.map((candidate) => candidate.id);
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
      kind: 'badSelfie',
      origin: player,
      direction,
      target,
      hitIds
    },
    remainingCandidates: candidates.filter((candidate) => !hitIdSet.has(candidate.id))
  };
}

function byDistance(player: StampedeAutoAttackPoint) {
  return (left: StampedeAutoAttackPoint, right: StampedeAutoAttackPoint) => (
    Math.hypot(left.x - player.x, left.y - player.y)
    - Math.hypot(right.x - player.x, right.y - player.y)
  );
}

function resolveSelfieHits(
  player: StampedeAutoAttackPoint,
  candidates: readonly StampedeAutoAttackCandidate[],
  profile: StampedeAutoAttackProfile,
  elapsedMs: number,
  direction: StampedeAutoAttackPoint
): StampedeAutoAttackCandidate[] {
  const inRange = candidates
    .filter((candidate) => !isStampedeWeaponImmune(candidate.kind ?? 'chick', 'badSelfie', 1))
    .filter((candidate) => {
      const distance = Math.hypot(candidate.x - player.x, candidate.y - player.y);
      return distance <= profile.range + candidate.radius;
    });
  const hits = inRange
    .sort((left, right) => selfieScore(left.id, elapsedMs) - selfieScore(right.id, elapsedMs))
    .slice(0, profile.maxHits);
  if (!profile.rear) return hits.sort(byDistance(player));
  const behind = inRange
    .filter((candidate) => !hits.includes(candidate))
    .filter((candidate) => {
      const dx = candidate.x - player.x;
      const dy = candidate.y - player.y;
      const distance = Math.hypot(dx, dy) || 1;
      return (dx / distance) * direction.x + (dy / distance) * direction.y < -0.35;
    })
    .sort(byDistance(player))[0];
  return [...hits, ...(behind ? [behind] : [])];
}

export function resolveGroupDazeIds(
  hitIds: readonly string[],
  candidates: readonly StampedeAutoAttackCandidate[],
  radius = 48
): string[] {
  const hits = candidates.filter((candidate) => hitIds.includes(candidate.id));
  return candidates
    .filter((candidate) => !hitIds.includes(candidate.id))
    .filter((candidate) => hits.some((hit) => (
      Math.hypot(candidate.x - hit.x, candidate.y - hit.y) <= radius
    )))
    .map((candidate) => candidate.id);
}

function selfieScore(id: string, elapsedMs: number): number {
  let hash = Math.imul(elapsedMs | 0, 0x9e3779b1);
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 0x45d9f3b);
  }
  return hash >>> 0;
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
