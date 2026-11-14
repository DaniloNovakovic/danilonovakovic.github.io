/**
 * Blueprint Bridge puzzle facts. Pure data, no Phaser/React/DOM.
 *
 * Coordinates are world units (the same pixels the stick stage uses) measured
 * from the top of the left bank edge: +x runs east across the gap, +y runs
 * down toward the river. Build points snap to a grid of {@link cell} units.
 */

export type BridgeMaterial = 'road' | 'wood';

export interface BridgeMaterialSpec {
  /** Mass per grid cell of length. */
  density: number;
  /** XPBD compliance (inverse stiffness). */
  compliance: number;
  /** Axial force at which the member snaps. */
  strength: number;
  /** Ink spent per grid cell of length. */
  inkPerCell: number;
}

export interface GridPoint {
  /** Grid column, 0 at the left bank edge. */
  x: number;
  /** Grid row, 0 at deck level, negative above. */
  y: number;
}

export interface BridgePuzzle {
  /** World units per grid cell. */
  cell: number;
  /** Gap width in cells. */
  columns: number;
  /** Highest buildable row (negative = above the deck). */
  minRow: number;
  /** Lowest buildable row. */
  maxRow: number;
  /** Longest member, in cells. */
  maxBeamCells: number;
  /** Fixed joints bolted into the banks. */
  anchors: readonly GridPoint[];
  materials: Record<BridgeMaterial, BridgeMaterialSpec>;
  inkBudget: number;
  /** Water surface, world units below deck level. */
  waterDepth: number;
  car: {
    mass: number;
    wheelRadius: number;
    wheelBase: number;
    speed: number;
    /** Where the car starts, world units left of the gap edge. */
    startOffset: number;
    /** Seconds the bridge settles under its own weight before the car rolls. */
    settleSeconds: number;
  };
  gravity: number;
  /** Simulated seconds before an unfinished run counts as stuck. */
  timeoutSeconds: number;
}

/**
 * The first bridge. A 288-unit gap (8 cells of 36) matching the stick stage's
 * river, bank anchors at deck level and lower on the cliff faces, and enough
 * room overhead for a truss or arch.
 */
export const BLUEPRINT_BRIDGE_PUZZLE: BridgePuzzle = {
  cell: 36,
  columns: 8,
  minRow: -3,
  maxRow: 2,
  maxBeamCells: 2.3,
  anchors: [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 2 },
    { x: 8, y: 2 }
  ],
  materials: {
    road: { density: 0.25, compliance: 2e-5, strength: 9000, inkPerCell: 2 },
    wood: { density: 0.1, compliance: 2e-5, strength: 8000, inkPerCell: 1 }
  },
  inkBudget: 48,
  waterDepth: 84,
  car: {
    mass: 1.2,
    wheelRadius: 5,
    wheelBase: 17,
    speed: 72,
    startOffset: 70,
    settleSeconds: 0.7
  },
  gravity: 900,
  timeoutSeconds: 14
};

export function gridKey(point: GridPoint): string {
  return `${point.x},${point.y}`;
}

export function isAnchor(puzzle: BridgePuzzle, point: GridPoint): boolean {
  return puzzle.anchors.some((anchor) => anchor.x === point.x && anchor.y === point.y);
}

export function isInBuildArea(puzzle: BridgePuzzle, point: GridPoint): boolean {
  return (
    Number.isInteger(point.x) &&
    Number.isInteger(point.y) &&
    point.x >= 0 &&
    point.x <= puzzle.columns &&
    point.y >= puzzle.minRow &&
    point.y <= puzzle.maxRow
  );
}

export function cellDistance(a: GridPoint, b: GridPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
