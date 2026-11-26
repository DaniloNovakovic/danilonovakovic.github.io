/**
 * The real world (Out of Bounds Act 4, ADR-0007): the lab where the aliens
 * research the human mind. Danilo wakes here, unplugged from the pod that ran
 * the portfolio; other people are still plugged in. Plain data so the rules
 * stay testable without WebGL.
 *
 * The lab is laid out like a working room, in zones (#145):
 * - north, **the ward**: pods in a row against the wall, cabled up into a
 *   ceiling tray that runs to the life-support rack in the corner;
 * - west, **the watch desk**: under the two monitors, where a researcher sits
 *   watching the sleepers; the sketchbook page lies on it, being studied;
 * - middle, **the procedure bay**: the operating table under its lamp, the
 *   instrument cart beside it, specimen shelves on the nearest wall;
 * - south, **the way out**: the locked door, delivery crates beside it, and
 *   the vent, half hidden behind crates in the corner.
 * The route from Danilo's pod to the door stays clear.
 *
 * The door stays locked. The only way out is the vent: pry the grate off and
 * crawl through a short, dark duct. Its first floor grate, bolted, looks down
 * into a ship corridor where a researcher walks past; the second pries open
 * and drops into the storeroom next door (`storeroom.ts`).
 */
export type RealWorldMap = readonly string[];

/**
 * Walls and what's set into them, one character per cell, seen from above,
 * north at the top: `#` wall, `V` vent grate, `D` locked door, `M` monitor,
 * `.` floor.
 */
const LAB_WALLS: RealWorldMap = [
  '#########',
  '#.......#',
  '#.......#',
  'M.......#',
  'M.......#',
  '#.......V',
  '###D#####'
];

/** World units per map cell. */
export const REAL_WORLD_CELL = 3;
export const REAL_WORLD_WALL_HEIGHT = 3.2;
export const REAL_WORLD_EYE_HEIGHT = 1.6;
/** How close Danilo can get to a wall. */
export const REAL_WORLD_PLAYER_RADIUS = 0.55;
/** Walking speed, world units per second. */
export const REAL_WORLD_WALK_SPEED = 4;

/** What stands on the lab floor. */
export type FurnitureKind =
  | 'myPod'
  | 'sleeperPod'
  | 'lifeSupport'
  | 'desk'
  | 'chair'
  | 'bin'
  | 'table'
  | 'cart'
  | 'jarShelf'
  | 'crates'
  | 'supplyShelf';

/** Which way a piece's front looks. */
export type Facing = 'north' | 'east' | 'south' | 'west';

export interface Furniture {
  kind: FurnitureKind;
  x: number;
  z: number;
  facing: Facing;
}

/**
 * Footprints seen from above: a circle, or a box `width` across its front and
 * `depth` front to back. `top` is how high its top is, where a thrown thing
 * can land.
 */
type Shape = { radius: number; top: number } | { width: number; depth: number; top: number };

const SHAPE: Readonly<Record<FurnitureKind, Shape>> = {
  myPod: { radius: 1.15, top: 0.4 },
  sleeperPod: { radius: 1.1, top: 2.9 },
  lifeSupport: { width: 2.2, depth: 1.1, top: 2.4 },
  desk: { width: 5, depth: 1.3, top: 0.95 },
  chair: { radius: 0.45, top: 0.6 },
  bin: { radius: 0.32, top: 0.6 },
  table: { width: 2.6, depth: 1.1, top: 1.05 },
  cart: { width: 0.8, depth: 0.5, top: 1.05 },
  jarShelf: { width: 2.3, depth: 0.75, top: 2.2 },
  crates: { width: 1.4, depth: 1.4, top: 1.3 },
  supplyShelf: { width: 2.4, depth: 0.7, top: 2.2 }
};

/** World units per vent-duct cell: just wide enough to crawl along. */
export const VENT_CELL = 1.5;

/**
 * A crawl-only duct behind a wall grate, on its own finer grid. `plan` is one
 * character per cell seen from above, north at the top: `m` the mouth (the
 * room floor in front of the grate, where Danilo ducks down), `.` duct, `g`
 * a grate in the duct floor bolted from below (a look, not a way), `o` a
 * floor grate that pries open to drop through, and a space for solid.
 */
export interface VentDuct {
  plan: RealWorldMap;
  /** World position of the plan's north-west corner. */
  origin: { x: number; z: number };
  /** Height of the duct floor, and from there to its ceiling. */
  floor: number;
  height: number;
}

export interface RealWorldRoom {
  walls: RealWorldMap;
  furniture: readonly Furniture[];
  /** Where Danilo stands after waking, and which way the view starts facing. */
  wake: { x: number; z: number; yaw: number };
  /** The duct behind the room's `V` grate, if it has one. */
  vent?: VentDuct;
  /**
   * Where the room's plan sits in the world (its north-west corner, at floor
   * level). The lab is the origin; other rooms keep their own plan and rules
   * in local coordinates and are placed with this.
   */
  offset?: { x: number; y: number; z: number };
  /** A `VENT_CELL`-wide opening in the ceiling, centred here: where a duct drops in. */
  hatch?: { x: number; z: number };
  /** Cells (their centres) with a light strip. Without it, every other floor cell has one. */
  strips?: ReadonlyArray<{ x: number; z: number }>;
}

/**
 * The lab's vent: in through the east wall, a bend north in the dark, east
 * over a bolted grate above the lit corridor (something walks past below),
 * on over the corridor wall, then a bend south to the grate that opens into
 * the storeroom.
 */
export const LAB_VENT: VentDuct = {
  plan: [
    '    ....g.....', //
    '    .        .',
    '    .        o',
    'm....         '
  ],
  origin: { x: 22.5, z: 11.25 },
  floor: 0.2,
  height: 1.1
};

export const LAB_ROOM: RealWorldRoom = {
  walls: LAB_WALLS,
  furniture: [
    // The ward: four pods against the north wall. Danilo's is the smashed one.
    { kind: 'sleeperPod', x: 5.5, z: 5, facing: 'south' },
    { kind: 'sleeperPod', x: 9.5, z: 5, facing: 'south' },
    { kind: 'myPod', x: 13.5, z: 5, facing: 'south' },
    { kind: 'sleeperPod', x: 17.5, z: 5, facing: 'south' },
    { kind: 'lifeSupport', x: 22.4, z: 3.6, facing: 'south' },
    // The watch desk, under the monitors, the researcher's chair turned to them.
    { kind: 'desk', x: 3.65, z: 12, facing: 'east' },
    { kind: 'chair', x: 5.4, z: 11.4, facing: 'west' },
    { kind: 'bin', x: 3.8, z: 15.4, facing: 'east' },
    // The procedure bay.
    { kind: 'table', x: 15, z: 12.4, facing: 'south' },
    { kind: 'cart', x: 15.4, z: 14, facing: 'north' },
    { kind: 'jarShelf', x: 23.6, z: 9, facing: 'west' },
    { kind: 'jarShelf', x: 23.6, z: 11.5, facing: 'west' },
    // The way out: deliveries by the door, and a stack screening the vent.
    { kind: 'crates', x: 6.8, z: 17.2, facing: 'south' },
    { kind: 'crates', x: 20.6, z: 17.2, facing: 'west' }
  ],
  // Facing the procedure bay and the watch desk; the pods (and the others) behind.
  wake: { x: 13.5, z: 7.7, yaw: Math.PI - 0.4 },
  vent: LAB_VENT
};

export function cellAt(map: RealWorldMap, x: number, z: number): string {
  return map[Math.floor(z / REAL_WORLD_CELL)]?.[Math.floor(x / REAL_WORLD_CELL)] ?? '#';
}

const SOLID_CELLS = new Set(['#', 'V', 'D', 'M']);

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

/** A footprint in the world: a circle, or a box spanning `halfX` and `halfZ` either side of its middle. */
export type Footprint = CellCenter & { top: number } & ({ radius: number } | { halfX: number; halfZ: number });

export function footprintOf({ kind, x, z, facing }: Furniture): Footprint {
  const shape = SHAPE[kind];
  if ('radius' in shape) return { x, z, radius: shape.radius, top: shape.top };
  const sideways = facing === 'east' || facing === 'west';
  const halfX = (sideways ? shape.depth : shape.width) / 2;
  const halfZ = (sideways ? shape.width : shape.depth) / 2;
  return { x, z, halfX, halfZ, top: shape.top };
}

/** The point of `footprint` nearest to (x, z); (x, z) itself when inside. */
export function nearestPoint(footprint: Footprint, x: number, z: number): CellCenter {
  if ('radius' in footprint) {
    const distance = Math.hypot(x - footprint.x, z - footprint.z);
    if (distance <= footprint.radius) return { x, z };
    const scale = footprint.radius / distance;
    return { x: footprint.x + (x - footprint.x) * scale, z: footprint.z + (z - footprint.z) * scale };
  }
  return {
    x: Math.max(footprint.x - footprint.halfX, Math.min(footprint.x + footprint.halfX, x)),
    z: Math.max(footprint.z - footprint.halfZ, Math.min(footprint.z + footprint.halfZ, z))
  };
}

/** How far (x, z) is from the edge of `footprint`; 0 inside it. */
export function distanceTo(footprint: Footprint, x: number, z: number): number {
  const nearest = nearestPoint(footprint, x, z);
  return Math.hypot(x - nearest.x, z - nearest.z);
}

const footprintsByRoom = new WeakMap<RealWorldRoom, Footprint[]>();
/** Every piece of furniture's footprint, worked out once per room. */
export function footprintsOf(room: RealWorldRoom): Footprint[] {
  let footprints = footprintsByRoom.get(room);
  if (!footprints) {
    footprints = room.furniture.map(footprintOf);
    footprintsByRoom.set(room, footprints);
  }
  return footprints;
}

/** The first piece of `kind` in the room. */
export function furnitureOf(room: RealWorldRoom, kind: FurnitureKind): Furniture | undefined {
  return room.furniture.find((piece) => piece.kind === kind);
}
