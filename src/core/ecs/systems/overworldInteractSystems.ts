/**
 * Pure overworld building interaction targeting (no Phaser types).
 * Mirrors the first-match scan used by OverworldScene.
 */

export interface OverworldBuildingSlot {
  /** Building / feature id (from sprite data `name`). */
  buildingId: string;
  x: number;
  y: number;
}

export interface OverworldInteractPickOptions {
  /** Max horizontal distance from player to building center (exclusive match). */
  maxDistX: number;
  /** Player must be below this Y to count as in range (exclusive). */
  minPlayerY: number;
  /** Added to building Y for interact prompt placement. */
  promptOffsetY: number;
}

export interface OverworldInteractPickResult {
  buildingId: string | null;
  promptX: number | null;
  promptY: number | null;
}

export interface OverworldSecretSlot {
  secretId: string;
  x: number;
  y: number;
  radius: number;
  promptOffsetY: number;
}

export interface OverworldSecretPickResult {
  secretId: string | null;
  promptX: number | null;
  promptY: number | null;
}

export function pickOverworldInteractTarget(
  playerX: number,
  playerY: number,
  buildings: readonly OverworldBuildingSlot[],
  opts: OverworldInteractPickOptions
): OverworldInteractPickResult {
  for (const b of buildings) {
    const dist = Math.abs(playerX - b.x);
    if (dist < opts.maxDistX && playerY > opts.minPlayerY) {
      return {
        buildingId: b.buildingId,
        promptX: b.x,
        promptY: b.y + opts.promptOffsetY
      };
    }
  }
  return { buildingId: null, promptX: null, promptY: null };
}

export function pickGlassesSecretTarget(
  playerX: number,
  playerY: number,
  hasGlassesEquipped: boolean,
  secrets: readonly OverworldSecretSlot[]
): OverworldSecretPickResult {
  if (!hasGlassesEquipped) return { secretId: null, promptX: null, promptY: null };

  for (const secret of secrets) {
    if (Math.hypot(playerX - secret.x, playerY - secret.y) <= secret.radius) {
      return {
        secretId: secret.secretId,
        promptX: secret.x,
        promptY: secret.y + secret.promptOffsetY
      };
    }
  }

  return { secretId: null, promptX: null, promptY: null };
}
