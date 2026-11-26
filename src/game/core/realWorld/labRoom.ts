/**
 * The real world (Out of Bounds Act 4, ADR-0007): the lab where Danilo wakes
 * up, unplugged from the pod that ran the portfolio. Plain data so the rules
 * stay testable without WebGL.
 *
 * One character per cell, seen from above, north at the top:
 * `#` wall, `V` vent grate (in a wall), `D` locked door (in a wall),
 * `O` the pod, `C` a crate, `P` where Danilo stands after waking, `.` floor.
 */
export type RealWorldMap = readonly string[];

export const LAB_ROOM: RealWorldMap = ['#########', '#O.....C#', '#P......V', '#.......#', '#C.....C#', '####D####'];

/** World units per map cell. */
export const REAL_WORLD_CELL = 4;
export const REAL_WORLD_WALL_HEIGHT = 3.2;
export const REAL_WORLD_EYE_HEIGHT = 1.6;
/** How close Danilo can get to a wall. */
export const REAL_WORLD_PLAYER_RADIUS = 0.55;
/** Walking speed, world units per second. */
export const REAL_WORLD_WALK_SPEED = 4.5;

const SOLID_CELLS = new Set(['#', 'V', 'D']);

/** Things standing on the floor, as circles seen from above (radius in world units). */
const PROP_RADIUS: Readonly<Record<string, number>> = { O: 1.1, C: 1.0 };

export function cellAt(map: RealWorldMap, x: number, z: number): string {
  return map[Math.floor(z / REAL_WORLD_CELL)]?.[Math.floor(x / REAL_WORLD_CELL)] ?? '#';
}

/** Off the map counts as wall, so nothing walks out of the world. */
export function isSolidAt(map: RealWorldMap, x: number, z: number): boolean {
  return SOLID_CELLS.has(cellAt(map, x, z));
}

export interface CellCenter {
  x: number;
  z: number;
}

/** Every cell holding `char`, as world positions of the cell centres. */
export function findCells(map: RealWorldMap, char: string): CellCenter[] {
  const found: CellCenter[] = [];
  map.forEach((row, z) => {
    [...row].forEach((cell, x) => {
      if (cell === char) found.push({ x: (x + 0.5) * REAL_WORLD_CELL, z: (z + 0.5) * REAL_WORLD_CELL });
    });
  });
  return found;
}

export interface RoundProp extends CellCenter {
  radius: number;
}

/** The pod and the crates: round footprints that block walking. */
export function findProps(map: RealWorldMap): RoundProp[] {
  return Object.entries(PROP_RADIUS).flatMap(([char, radius]) =>
    findCells(map, char).map((center) => ({ ...center, radius }))
  );
}
