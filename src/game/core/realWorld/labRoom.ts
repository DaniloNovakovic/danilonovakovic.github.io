/**
 * The real world (Out of Bounds Act 4, ADR-0007): the lab where the aliens
 * research the human mind. Danilo wakes here, unplugged from the pod that ran
 * the portfolio; other people are still plugged in. Plain data so the rules
 * stay testable without WebGL.
 *
 * One character per cell, seen from above, north at the top. In walls:
 * `#` wall, `V` vent grate, `D` locked door, `M` monitor. On the floor:
 * `O` Danilo's pod (smashed open), `H` a pod with someone still inside,
 * `T` operating table, `J` shelf of specimen jars, `C` crates,
 * `P` where Danilo stands after waking, `.` floor.
 */
export type RealWorldMap = readonly string[];

export const LAB_ROOM: RealWorldMap = [
  '###########',
  '#H.H.O.H.H#',
  '#....P....#',
  'M....T....V',
  'M.........#',
  '#J.J...C.C#',
  '#####D#####'
];

/** World units per map cell. */
export const REAL_WORLD_CELL = 4;
export const REAL_WORLD_WALL_HEIGHT = 3.2;
export const REAL_WORLD_EYE_HEIGHT = 1.6;
/** How close Danilo can get to a wall. */
export const REAL_WORLD_PLAYER_RADIUS = 0.55;
/** Walking speed, world units per second. */
export const REAL_WORLD_WALK_SPEED = 4.5;

const SOLID_CELLS = new Set(['#', 'V', 'D', 'M']);

/**
 * Things standing on the floor, as circles seen from above (radius in world
 * units) with the height of their top, where a thrown thing can land.
 */
const PROP_SHAPE: Readonly<Record<string, { radius: number; top: number }>> = {
  O: { radius: 1.2, top: 0.4 },
  H: { radius: 1.1, top: 2.9 },
  T: { radius: 1.5, top: 1.05 },
  J: { radius: 1.1, top: 2.2 },
  C: { radius: 1.0, top: 1.3 }
};

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
  top: number;
}

/** Pods, the table, shelves and crates: round footprints that block walking. */
export function findProps(map: RealWorldMap): RoundProp[] {
  return Object.entries(PROP_SHAPE).flatMap(([char, shape]) =>
    findCells(map, char).map((center) => ({ ...center, ...shape }))
  );
}

const propsByMap = new WeakMap<RealWorldMap, RoundProp[]>();
/** `findProps`, worked out once per map. */
export function propsOf(map: RealWorldMap): RoundProp[] {
  let props = propsByMap.get(map);
  if (!props) {
    props = findProps(map);
    propsByMap.set(map, props);
  }
  return props;
}
