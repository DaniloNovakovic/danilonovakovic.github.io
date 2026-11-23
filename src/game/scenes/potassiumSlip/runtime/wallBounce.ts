import { getPotassiumDuplicateCloneCount, type PotassiumSkillRank } from './waves';

export type PotassiumWallSide = 'left' | 'right' | 'up' | 'down';

export interface PotassiumWallSudsSplash {
  side: PotassiumWallSide;
  x: number;
  y: number;
}

/** Pull the splash inside the drawn arena border so it is not clipped. */
export const POTASSIUM_WALL_SUDS_INSET = 12;
export const POTASSIUM_WALL_SUDS_COOLDOWN_MS = 120;
/** Slower wall touches (recall drift, rolling to a stop) trigger neither suds nor mini sponges. */
export const POTASSIUM_WALL_HIT_MIN_SPEED = 140;

/** Per-hit facts shared by the suds splash and Mini Sponges checks. */
export interface PotassiumWallHit {
  isRecalling: boolean;
  speed: number;
  now: number;
}

function isLivelyWallHit(hit: PotassiumWallHit): boolean {
  return !hit.isRecalling && hit.speed >= POTASSIUM_WALL_HIT_MIN_SPEED;
}

export interface PotassiumWallSudsInput {
  blocked: { up: boolean; down: boolean; left: boolean; right: boolean };
  projectile: { x: number; y: number };
  arena: { left: number; right: number; top: number; bottom: number };
}

/**
 * Where the sponge's dishwasher splash goes for an Arcade world-bounds hit:
 * on the wall it touched, level with the sponge, nudged inside the border.
 */
export function resolvePotassiumWallSuds(input: PotassiumWallSudsInput): PotassiumWallSudsSplash {
  const { blocked, projectile, arena } = input;
  const inset = POTASSIUM_WALL_SUDS_INSET;
  if (blocked.left) return { side: 'left', x: arena.left + inset, y: projectile.y };
  if (blocked.right) return { side: 'right', x: arena.right - inset, y: projectile.y };
  if (blocked.up) return { side: 'up', x: projectile.x, y: arena.top + inset };
  return { side: 'down', x: projectile.x, y: arena.bottom - inset };
}

export const POTASSIUM_WALL_CLONE_COOLDOWN_MS = 450;
export const POTASSIUM_WALL_CLONE_MAX_ACTIVE = 9;
const POTASSIUM_WALL_CLONE_BASE_LIFETIME_MS = 3000;
const POTASSIUM_WALL_CLONE_LIFETIME_PER_RANK_MS = 300;
/** Half-angle of the fan the mini sponges spray into, around the wall's inward normal. */
const POTASSIUM_WALL_CLONE_FAN_RADIANS = Math.PI / 3.6;

/** Inward-facing angle (screen coordinates, +y is down) for each arena wall. */
const INWARD_ANGLE: Record<PotassiumWallSide, number> = {
  left: 0,
  right: Math.PI,
  up: Math.PI / 2,
  down: -Math.PI / 2
};

export interface PotassiumWallClones {
  /** Launch angles in radians, one per mini sponge, all pointing back into the arena. */
  angles: number[];
  lifetimeMs: number;
}

/**
 * Mini Sponges: a fast wall bounce shakes loose tiny sponges that fan back
 * into the arena (instead of spawning on enemy hits, where they just bounced
 * straight back off the same target). Throttled and capped so wall chatter
 * cannot flood the board.
 */
export function resolvePotassiumWallClones(
  input: PotassiumWallHit & {
    duplicateRank: PotassiumSkillRank;
    cloneTimeRank: number;
    side: PotassiumWallSide;
    lastClonesAt: number;
    activeClones: number;
  }
): PotassiumWallClones | null {
  if (input.duplicateRank <= 0 || !isLivelyWallHit(input)) return null;
  if (input.now - input.lastClonesAt < POTASSIUM_WALL_CLONE_COOLDOWN_MS) return null;
  const count = Math.min(
    getPotassiumDuplicateCloneCount(input.duplicateRank),
    POTASSIUM_WALL_CLONE_MAX_ACTIVE - input.activeClones
  );
  if (count <= 0) return null;
  const inward = INWARD_ANGLE[input.side];
  const angles = Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    return inward + t * POTASSIUM_WALL_CLONE_FAN_RADIANS;
  });
  return {
    angles,
    lifetimeMs: POTASSIUM_WALL_CLONE_BASE_LIFETIME_MS + input.cloneTimeRank * POTASSIUM_WALL_CLONE_LIFETIME_PER_RANK_MS
  };
}

/** Throttle splashes so recall chatter or corner double-hits do not spam suds. */
export function shouldShowPotassiumWallSuds(input: PotassiumWallHit & { lastSudsAt: number }): boolean {
  if (!isLivelyWallHit(input)) return false;
  return input.now - input.lastSudsAt >= POTASSIUM_WALL_SUDS_COOLDOWN_MS;
}
