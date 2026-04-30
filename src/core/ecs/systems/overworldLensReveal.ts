/**
 * Pure overworld Lens proximity reveal (no Phaser types).
 * When glasses off, no building shows pixel. When on, buildings within radiusX of player X reveal.
 */

export interface OverworldLensRevealSlot {
  x: number;
}

/**
 * Writes one boolean per slot into `out` (length must equal `slots.length`).
 * No allocations when `out` is reused.
 */
export function fillOverworldLensRevealFlags(
  hasGlasses: boolean,
  playerX: number,
  slots: readonly OverworldLensRevealSlot[],
  radiusX: number,
  out: boolean[]
): void {
  for (let i = 0; i < slots.length; i++) {
    out[i] = hasGlasses && Math.abs(slots[i].x - playerX) < radiusX;
  }
}
