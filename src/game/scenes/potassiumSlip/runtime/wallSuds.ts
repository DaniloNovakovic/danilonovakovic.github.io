export type PotassiumWallSide = 'left' | 'right' | 'up' | 'down';

export interface PotassiumWallSudsSplash {
  side: PotassiumWallSide;
  x: number;
  y: number;
}

/** Pull the splash inside the drawn arena border so it is not clipped. */
export const POTASSIUM_WALL_SUDS_INSET = 12;
export const POTASSIUM_WALL_SUDS_COOLDOWN_MS = 120;
export const POTASSIUM_WALL_SUDS_MIN_SPEED = 140;

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

/** Throttle splashes so recall chatter or corner double-hits do not spam suds. */
export function shouldShowPotassiumWallSuds(input: {
  isRecalling: boolean;
  speed: number;
  now: number;
  lastSudsAt: number;
}): boolean {
  if (input.isRecalling) return false;
  if (input.speed < POTASSIUM_WALL_SUDS_MIN_SPEED) return false;
  return input.now - input.lastSudsAt >= POTASSIUM_WALL_SUDS_COOLDOWN_MS;
}
