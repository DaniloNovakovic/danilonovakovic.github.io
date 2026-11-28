import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  type Material,
  type Object3D
} from 'three';
import {
  cellAt,
  furnitureOf,
  isInside,
  isSolidAt,
  NEIGHBOURS,
  REAL_WORLD_CELL as CELL,
  REAL_WORLD_WALL_HEIGHT as H,
  grateCentre,
  mouthOf,
  STEALTH,
  VENT_CELL,
  type Facing,
  type FurnitureKind,
  type RealWorldMap,
  type RealWorldRoom,
  type VentDuct,
  type WallFinish
} from '@/game/core/realWorld';
import { buildVent, type LabVent } from './buildVent';
import {
  armouryCage,
  coatRack,
  lockers,
  messTable,
  securityDesk,
  serviceDoor,
  vendingMachine,
  washer,
  type ServiceDoorView
} from './deckProps';
import {
  cableTray,
  crateStack,
  floorCable,
  instrumentCart,
  jarShelf,
  lifeSupport,
  lockedDoor,
  monitor,
  operatingTable,
  paperBin,
  researcherChair,
  shatteredPod,
  sleeperPod,
  supplyShelf,
  watchDesk,
  type PropKit
} from './labProps';
import { brainScanScreen, oldWorldScreen } from './labScreens';
import { dryerStack, foldingTable, hamper, linenLine, noticeBoard } from './laundryProps';
import { droneDock, drums, janitorCart, lampShelf, mopBucket } from './storeProps';
import { makeToon, NIGHT_LAB } from './toon';

function floorTexture(map: RealWorldMap) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const g = canvas.getContext('2d');
  if (g) {
    g.fillStyle = `#${new Color(NIGHT_LAB.floor).getHexString(SRGBColorSpace)}`;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = NIGHT_LAB.panel;
    g.lineWidth = 3;
    g.strokeRect(2, 2, 124, 124);
    g.beginPath();
    g.moveTo(64, 2);
    g.lineTo(64, 126);
    g.moveTo(2, 64);
    g.lineTo(126, 64);
    g.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(map[0].length, map.length);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** The way out of wall cell (cx, cz) into the room: its first open side. */
function openSide(map: RealWorldMap, cx: number, cz: number): readonly [number, number] | null {
  return NEIGHBOURS.find(([dx, dz]) => !isSolidAt(map, cx + dx * CELL, cz + dz * CELL)) ?? null;
}

/** Place `object` on the face of wall cell (cx, cz) that looks into the room. */
function onWallFace(map: RealWorldMap, cx: number, cz: number, object: Object3D, inset: number) {
  const side = openSide(map, cx, cz);
  if (!side) return;
  const [dx, dz] = side;
  object.position.set(cx + dx * (CELL / 2 + inset), object.position.y, cz + dz * (CELL / 2 + inset));
  object.rotation.y = Math.atan2(dx, dz);
}

interface Cell {
  char: string;
  cx: number;
  cz: number;
  /** Some floor cells get wall ribs, so the ink has shapes to find. */
  ribbed: boolean;
}

interface CellMaterials {
  wall: Material;
  trim: Material;
  strip: Material;
}

/** The monitors take turns: the old world, then a mind being read. The vent's grate comes with the vent. */
function wallFixture(kit: PropKit, char: string, monitors: { count: number }): Object3D | null {
  if (char === 'D') return lockedDoor(kit);
  if (char !== 'M') return null;
  monitors.count += 1;
  return monitor(kit, monitors.count === 1 ? oldWorldScreen(kit.reducedMotion) : brainScanScreen(kit.reducedMotion));
}

/** Room left around the duct where it runs through the wall, so the duct's own sides show as a lip. */
const VENT_HOLE_MARGIN = 0.06;

/**
 * A wall cell with the vent running through it: blocks above, below and
 * either side of a crawl-sized hole, all the way through the cell.
 */
function addVentWallCell(root: Group, cell: Cell, vent: VentDuct, material: Material) {
  const mouth = mouthOf(vent);
  const centre = grateCentre(vent);
  // The hole runs along the mouth's direction; `across` is the other floor axis.
  const acrossIsZ = mouth.dx !== 0;
  const holeMiddle = acrossIsZ ? centre.z - cell.cz : centre.x - cell.cx;
  const halfHole = VENT_CELL / 2 + VENT_HOLE_MARGIN;
  const bottom = vent.floor - VENT_HOLE_MARGIN;
  const top = vent.floor + vent.height + VENT_HOLE_MARGIN;
  // [across offset, across size, y middle, height]
  const near = -CELL / 2;
  const far = CELL / 2;
  const blocks: Array<[number, number, number, number]> = [
    [0, CELL, bottom / 2, bottom],
    [0, CELL, (H + top) / 2, H - top],
    [(near + holeMiddle - halfHole) / 2, holeMiddle - halfHole - near, (bottom + top) / 2, top - bottom],
    [(holeMiddle + halfHole + far) / 2, far - holeMiddle - halfHole, (bottom + top) / 2, top - bottom]
  ];
  for (const [offset, size, y, height] of blocks) {
    if (size <= 0 || height <= 0) continue;
    const block = new Mesh(new BoxGeometry(acrossIsZ ? CELL : size, height, acrossIsZ ? size : CELL), material);
    block.position.set(cell.cx + (acrossIsZ ? 0 : offset), y, cell.cz + (acrossIsZ ? offset : 0));
    root.add(block);
  }
}

/** The armoury cage's recess: how wide, tall and deep it is cut into its wall cell. */
const CAGE = { width: 2.4, height: 2.5, depth: 0.6 };

/**
 * A wall cell with the armoury cage set into it: the wall stands back by the
 * recess's depth, pillars either side and a lintel over it, the cage inside.
 */
function addCageWallCell(root: Group, map: RealWorldMap, cell: Cell, material: Material, kit: PropKit) {
  const side = openSide(map, cell.cx, cell.cz);
  if (!side) return;
  const frame = new Group();
  frame.position.set(cell.cx, 0, cell.cz);
  frame.rotation.y = Math.atan2(side[0], side[1]);
  const face = CELL / 2;
  const pillar = (CELL - CAGE.width) / 2;
  // [x, y, z, width, height, depth] in the frame, +z towards the room.
  const blocks: Array<[number, number, number, number, number, number]> = [
    [0, H / 2, -CAGE.depth / 2, CELL, H, CELL - CAGE.depth],
    [-(CAGE.width + pillar) / 2, H / 2, face - CAGE.depth / 2, pillar, H, CAGE.depth],
    [(CAGE.width + pillar) / 2, H / 2, face - CAGE.depth / 2, pillar, H, CAGE.depth],
    [0, (H + CAGE.height) / 2, face - CAGE.depth / 2, CAGE.width, H - CAGE.height, CAGE.depth]
  ];
  for (const [x, y, z, width, height, depth] of blocks) {
    const block = new Mesh(new BoxGeometry(width, height, depth), material);
    block.position.set(x, y, z);
    frame.add(block);
  }
  const cage = armouryCage(kit, CAGE.width, CAGE.height, CAGE.depth);
  cage.position.z = face;
  frame.add(cage);
  root.add(frame);
}

function addWallCell(root: Group, map: RealWorldMap, cell: Cell, materials: CellMaterials, fixture: Object3D | null) {
  const wall = new Mesh(new BoxGeometry(CELL, H, CELL), materials.wall);
  wall.position.set(cell.cx, H / 2, cell.cz);
  root.add(wall);
  if (!fixture) return;
  onWallFace(map, cell.cx, cell.cz, fixture, 0.08);
  root.add(fixture);
}

/** A light strip in the ceiling at (x, z): the light the aliens see you in, and the dark between. */
function addStrip(root: Group, x: number, z: number, strip: Material) {
  const light = new Mesh(new BoxGeometry(1.6, 0.08, 0.35), strip);
  light.position.set(x, H - 0.05, z);
  root.add(light);
}

/**
 * The pool of light a strip throws on the floor, shaped like the core's
 * `lightAt`: full under it, fading out to its reach. What you see is what
 * they see you by.
 */
function poolTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const g = canvas.getContext('2d');
  if (g) {
    const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    const core = STEALTH.poolCore / STEALTH.poolReach;
    gradient.addColorStop(0, 'rgba(255,211,110,1)');
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const light = 1 - t * t * (3 - 2 * t);
      gradient.addColorStop(core + (1 - core) * t, `rgba(255,211,110,${light.toFixed(3)})`);
    }
    g.fillStyle = gradient;
    g.fillRect(0, 0, 128, 128);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function addPools(root: Group, strips: ReadonlyArray<{ x: number; z: number }>) {
  const material = new MeshBasicMaterial({
    map: poolTexture(),
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    blending: AdditiveBlending
  });
  const geometry = new CircleGeometry(STEALTH.poolReach, 32);
  for (const { x, z } of strips) {
    const pool = new Mesh(geometry, material);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, 0.015, z);
    pool.userData.noInk = true;
    root.add(pool);
  }
}

/** Width of a door's frame; the skirting stops at it. */
const DOOR_WIDTH = 2.6;
const SKIRTING_HEIGHT = 0.35;

/**
 * The skirting along the foot of a wall face, from cell (cx, cz) towards
 * (dx, dz). It stops either side of a `gap` (a door, the vent), so the
 * opening meets the floor.
 */
function addSkirting(
  root: Group,
  cx: number,
  cz: number,
  [dx, dz]: readonly [number, number],
  material: Material,
  gap: number
) {
  const length = gap ? (CELL - gap) / 2 : CELL;
  const offsets = gap ? [-(gap + length) / 2, (gap + length) / 2] : [0];
  for (const offset of offsets) {
    const trim = new Mesh(new BoxGeometry(dx ? 0.25 : length, SKIRTING_HEIGHT, dz ? 0.25 : length), material);
    trim.position.set(
      cx + dx * (CELL / 2 - 0.12) + (dz ? offset : 0),
      0.17,
      cz + dz * (CELL / 2 - 0.12) + (dx ? offset : 0)
    );
    root.add(trim);
  }
}

/** How much of a wall face is left open for what's set in it. */
function skirtingGap(wall: string) {
  if (wall === 'D' || wall === 'S') return DOOR_WIDTH;
  if (wall === 'A') return CAGE.width;
  if (wall === 'V') return VENT_CELL + 2 * VENT_HOLE_MARGIN;
  return 0;
}

/**
 * How each finish is painted, bottom to top of a wall face (above the
 * skirting): a lower band, a rail, the wall above. Muted, it's night.
 */
const FINISH: Readonly<
  Record<
    WallFinish,
    { lower: string; rail: string; upper: string; band: number; draw?: 'tiles' | 'boards' | 'chevrons' }
  >
> = {
  // The laundry: pale tiles to shoulder height, a teal wall above.
  tiles: { lower: '#7fa9b4', rail: '#3d5f73', upper: '#4b6f8c', band: 0.5, draw: 'tiles' },
  // The break room: warm boards to the dado rail, a dusky mauve above.
  panelling: { lower: '#7a5a5c', rail: '#4a3540', upper: '#5d5584', band: 0.36, draw: 'boards' },
  // Security: cold grey, a red band at eye height, hazard chevrons at the foot.
  security: { lower: '#4b557a', rail: '#b3443f', upper: '#47507a', band: 0.42, draw: 'chevrons' },
  // The storeroom: bare service paint, a yellow stripe.
  service: { lower: '#4a5b92', rail: '#c9a24a', upper: '#4a5b92', band: 0.45 }
};

/** A finish's pattern on its lower band, from `railY` down. */
const PATTERNS: Readonly<
  Record<'tiles' | 'boards' | 'chevrons', (g: CanvasRenderingContext2D, railY: number) => void>
> = {
  tiles(g, railY) {
    for (let y = railY; y < 128; y += 10) g.strokeRect(0, y, 128, 10);
    for (let x = 0; x <= 128; x += 16) line(g, x, railY, x, 128);
  },
  boards(g, railY) {
    for (let x = 8; x < 128; x += 16) line(g, x, railY, x, 128);
  },
  chevrons(g) {
    g.fillStyle = '#c9a24a';
    for (let x = -16; x < 128; x += 16) {
      g.beginPath();
      g.moveTo(x, 128);
      g.lineTo(x + 8, 118);
      g.lineTo(x + 16, 118);
      g.lineTo(x + 8, 128);
      g.fill();
    }
  }
};

function line(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
}

/** One wall face's worth (a cell wide, skirting to ceiling) of `finish`, as a texture. */
function finishTexture(finish: WallFinish) {
  const { lower, rail, upper, band, draw } = FINISH[finish];
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  if (g) {
    const railY = Math.round(128 * (1 - band));
    g.fillStyle = upper;
    g.fillRect(0, 0, 128, railY);
    g.fillStyle = lower;
    g.fillRect(0, railY, 128, 128 - railY);
    g.strokeStyle = 'rgba(11,14,28,.35)';
    g.lineWidth = 1.5;
    if (draw) PATTERNS[draw](g, railY);
    g.fillStyle = rail;
    g.fillRect(0, railY - 3, 128, 6);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Each finish's material, made the first time a room needs it. */
function finishMaterials(kit: PropKit) {
  const made = new Map<WallFinish, Material>();
  return (finish: WallFinish) => {
    let material = made.get(finish);
    if (!material) {
      material = kit.toon(0xffffff, { map: finishTexture(finish) });
      made.set(finish, material);
    }
    return material;
  };
}

/** How far in front of the wall a finish sits: clear of it, behind the skirting and ribs. */
const FINISH_INSET = 0.02;

/** A finish on the wall face from cell (cx, cz) towards (dx, dz), skirting to ceiling. */
function addFinish(root: Group, cx: number, cz: number, [dx, dz]: readonly [number, number], material: Material) {
  const height = H - SKIRTING_HEIGHT;
  const face = new Mesh(new PlaneGeometry(CELL, height), material);
  face.position.set(
    cx + dx * (CELL / 2 - FINISH_INSET),
    SKIRTING_HEIGHT + height / 2,
    cz + dz * (CELL / 2 - FINISH_INSET)
  );
  // A plane faces +z; turn it to face back into the room.
  face.rotation.y = Math.atan2(-dx, -dz);
  root.add(face);
}

function addFloorCell(
  root: Group,
  map: RealWorldMap,
  { cx, cz, ribbed }: Cell,
  materials: CellMaterials,
  finish: Material | null = null
) {
  for (const side of NEIGHBOURS) {
    const [dx, dz] = side;
    if (!isSolidAt(map, cx + dx * CELL, cz + dz * CELL)) continue;
    const wall = cellAt(map, cx + dx * CELL, cz + dz * CELL);
    addSkirting(root, cx, cz, side, materials.trim, skirtingGap(wall));
    if (finish && wall === '#') addFinish(root, cx, cz, side, finish);
    // No rib in front of a vent, door, cage or monitor: they sit mid-face, where a rib would.
    if (!ribbed || wall !== '#') continue;
    const rib = new Mesh(new BoxGeometry(dx ? 0.3 : 0.4, H, dz ? 0.3 : 0.4), materials.wall);
    rib.position.set(cx + dx * (CELL / 2 - 0.15), H / 2, cz + dz * (CELL / 2 - 0.15));
    root.add(rib);
  }
}

/** One strip light over the table that sags and recovers now and then. Slow, never a strobe. */
function flickeringStrip(kit: PropKit) {
  const material = new MeshBasicMaterial({ color: NIGHT_LAB.strip });
  if (kit.reducedMotion) return material;
  const lit = new Color(NIGHT_LAB.strip);
  const dim = new Color(0x6b5a32);
  let level = 1;
  let last = 0;
  kit.animate((t) => {
    const dt = Math.min(0.1, t - last);
    last = t;
    const target = Math.sin(t * 1.9) * Math.sin(t * 0.43) > 0.8 ? 0.15 : 1;
    level += (target - level) * Math.min(1, dt * 5);
    material.color.copy(dim).lerp(lit, level);
  });
  return material;
}

function lights(root: Group) {
  root.add(new HemisphereLight(0xc8d4ff, 0x2a3566, 1.5));
  const sun = new DirectionalLight(0xffffff, 0.9);
  sun.position.set(0.5, 1, 0.3);
  root.add(sun);
}

/** Builders turn their front to +z; this turns it the way the piece faces. */
const FACING_TURN: Readonly<Record<Facing, number>> = {
  south: 0,
  east: Math.PI / 2,
  north: Math.PI,
  west: -Math.PI / 2
};

const BUILD: Readonly<Record<FurnitureKind, (kit: PropKit, nth: number) => Object3D>> = {
  myPod: (kit) => shatteredPod(kit),
  sleeperPod: (kit, nth) => sleeperPod(kit, 11 + nth * 5),
  lifeSupport: (kit) => lifeSupport(kit),
  desk: (kit) => watchDesk(kit),
  chair: (kit) => researcherChair(kit),
  bin: (kit) => paperBin(kit),
  table: (kit) => operatingTable(kit),
  cart: (kit) => instrumentCart(kit),
  jarShelf: (kit, nth) => jarShelf(kit, nth + 1),
  crates: (kit, nth) => crateStack(kit, nth % 2 ? -0.3 : 0.3),
  supplyShelf: (kit, nth) => supplyShelf(kit, nth),
  lampShelf: (kit) => lampShelf(kit),
  drums: (kit) => drums(kit),
  mopBucket: (kit) => mopBucket(kit),
  // The dock only: the drone on it is an actor, so it can wake and roll away.
  cleanerBot: (kit) => droneDock(kit),
  janitorCart: (kit) => janitorCart(kit),
  messTable: (kit) => messTable(kit),
  vending: (kit) => vendingMachine(kit),
  washer: (kit) => washer(kit),
  coatRack: (kit, nth) => coatRack(kit, nth),
  lockers: (kit) => lockers(kit),
  securityDesk: (kit) => securityDesk(kit),
  dryerStack: (kit) => dryerStack(kit),
  foldingTable: (kit) => foldingTable(kit),
  hamper: (kit) => hamper(kit),
  linenLine: (kit, nth) => linenLine(kit, nth),
  noticeBoard: (kit, nth) => noticeBoard(kit, nth)
};

function addFurniture(root: Group, room: RealWorldRoom, kit: PropKit) {
  const counts = new Map<FurnitureKind, number>();
  for (const piece of room.furniture) {
    const nth = counts.get(piece.kind) ?? 0;
    counts.set(piece.kind, nth + 1);
    const object = BUILD[piece.kind](kit, nth);
    object.position.set(piece.x, 0, piece.z);
    object.rotation.y = FACING_TURN[piece.facing];
    root.add(object);
  }
  // Cables you could follow: each sleeper up into the tray, along to life
  // support; the crown on the table along the floor to the watch desk.
  const pods = room.furniture.filter((piece) => piece.kind === 'sleeperPod');
  const support = furnitureOf(room, 'lifeSupport');
  if (pods.length && support) {
    const trayZ = (pods[0].z + support.z) / 2 - 0.2;
    root.add(
      cableTray(
        kit,
        pods[0].x - 1,
        support.x - 0.8,
        trayZ,
        pods.map((pod) => pod.x),
        pods[0].z
      )
    );
  }
  const table = furnitureOf(room, 'table');
  const desk = furnitureOf(room, 'desk');
  if (table && desk) {
    const deskFront = desk.x + 0.7;
    root.add(
      floorCable(kit, [
        [table.x + 0.1, table.z],
        [table.x - 1.2, table.z + 0.5],
        [(table.x + deskFront) / 2, table.z + 1.1],
        [deskFront + 0.6, desk.z + 1.1],
        [deskFront, desk.z + 1.0]
      ])
    );
  }
}

export interface BuiltRoom {
  root: Group;
  /** The vent behind the `V` grate, if the room has one. */
  vent: LabVent | null;
  /** The service door (`S`), if the room has one. */
  serviceDoor: ServiceDoorView | null;
  /** For adding moving things to the room: they share its materials and its clock. */
  kit: PropKit;
  /** Advance the room's small motions (bubbles, screens, the flicker, the door) to `seconds`. */
  update(seconds: number): void;
  dispose(): void;
}

/** A ceiling panel over [x0, x1] × [z0, z1], facing down. */
function ceilingPanel(material: Material, x0: number, x1: number, z0: number, z1: number) {
  const panel = new Mesh(new PlaneGeometry(x1 - x0, z1 - z0), material);
  panel.rotation.x = Math.PI / 2;
  panel.position.set((x0 + x1) / 2, H, (z0 + z1) / 2);
  return panel;
}

type Hole = { x: number; z: number };

/** The ceiling over one cell, cut round a `VENT_CELL`-wide hole in it if there is one. */
function ceilingOver(material: Material, x0: number, z0: number, holes: readonly Hole[]): Mesh[] {
  const x1 = x0 + CELL;
  const z1 = z0 + CELL;
  const hole = holes.find(({ x, z }) => x > x0 && x < x1 && z > z0 && z < z1);
  if (!hole) return [ceilingPanel(material, x0, x1, z0, z1)];
  const half = VENT_CELL / 2;
  const [hx0, hx1, hz0, hz1] = [hole.x - half, hole.x + half, hole.z - half, hole.z + half];
  const pieces: Array<[number, number, number, number]> = [
    [x0, x1, z0, hz0],
    [x0, x1, hz1, z1],
    [x0, hx0, hz0, hz1],
    [hx1, x1, hz0, hz1]
  ];
  return pieces
    .filter(([ax, bx, az, bz]) => bx - ax > 0.01 && bz - az > 0.01)
    .map(([ax, bx, az, bz]) => ceilingPanel(material, ax, bx, az, bz));
}

/** The floor tiles, and the ceiling over every open cell, with holes for hatches and skylights. */
function floorAndCeiling(kit: PropKit, room: RealWorldRoom) {
  const map = room.walls;
  const width = map[0].length * CELL;
  const depth = map.length * CELL;
  const floor = new Mesh(new PlaneGeometry(width, depth), kit.toon(0xffffff, { map: floorTexture(map) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(width / 2, 0, depth / 2);
  const material = kit.toon(NIGHT_LAB.ceiling);
  const holes = [...(room.hatch ? [room.hatch] : []), ...(room.skylights ?? [])];
  const ceiling: Mesh[] = [];
  map.forEach((row, zi) => {
    [...row].forEach((char, xi) => {
      if (char === '.' || char === 'S') ceiling.push(...ceilingOver(material, xi * CELL, zi * CELL, holes));
    });
  });
  return [floor, ...ceiling];
}

export interface BuildOptions {
  /** The scene's shared lights; only one room in a scene should bring them. */
  lights: boolean;
}

/**
 * The service door in its `S` cell: a doorway through the wall, the door
 * itself on the face of the room it belongs to (the cell's first open side).
 */
function addServiceDoor(root: Group, map: RealWorldMap, cell: Cell, kit: PropKit): ServiceDoorView {
  const view = serviceDoor(kit, CELL);
  const [dx, dz] = openSide(map, cell.cx, cell.cz) ?? [1, 0];
  view.root.position.set(cell.cx + dx * (CELL / 2 - 0.2), 0, cell.cz + dz * (CELL / 2 - 0.2));
  view.root.rotation.y = Math.atan2(dx, dz);
  root.add(view.root);
  return view;
}

function dispose(root: Group) {
  const disposed = new Set<Material>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    for (const material of [object.material].flat() as Material[]) disposed.add(material);
  });
  for (const material of disposed) {
    for (const value of Object.values(material)) {
      if (value && typeof value === 'object' && 'isTexture' in value) (value as { dispose(): void }).dispose();
    }
    material.dispose();
  }
}

/**
 * Build a room from its plan in `@/game/core/realWorld`: the lab, or the ship
 * deck, placed in the world at its `offset`. A room with its own strips gets
 * them where it says, with pools of light under them; otherwise every other
 * floor cell has one.
 */
export function buildRoom(
  room: RealWorldRoom,
  reducedMotion: boolean,
  options: BuildOptions = { lights: true }
): BuiltRoom {
  const updates: Array<(seconds: number) => void> = [];
  const kit: PropKit = { toon: makeToon(), animate: (update) => updates.push(update), reducedMotion };
  const root = new Group();
  if (room.offset) root.position.set(room.offset.x, room.offset.y, room.offset.z);
  const map = room.walls;
  if (options.lights) lights(root);
  root.add(...floorAndCeiling(kit, room));

  const materials: CellMaterials = {
    wall: kit.toon(NIGHT_LAB.wall),
    trim: kit.toon(NIGHT_LAB.ceiling),
    strip: new MeshBasicMaterial({ color: NIGHT_LAB.strip })
  };
  const flicker = flickeringStrip(kit);
  const table = furnitureOf(room, 'table');
  const flickerCell = table ? `${Math.floor(table.x / CELL)},${Math.floor(table.z / CELL)}` : '';
  const monitors = { count: 0 };
  const doors: ServiceDoorView[] = [];
  const duct = room.vent;
  /** Cells with something built into them; the rest are plain wall or floor. */
  const special: Partial<Record<string, (cell: Cell) => void>> = {
    // Solid ship between rooms: nothing to draw.
    ' ': () => {},
    V: (cell) =>
      duct ? addVentWallCell(root, cell, duct, materials.wall) : addWallCell(root, map, cell, materials, null),
    A: (cell) => addCageWallCell(root, map, cell, materials.wall, kit),
    S: (cell) => {
      addFloorCell(root, map, cell, materials);
      doors.push(addServiceDoor(root, map, cell, kit));
    }
  };
  const finishMaterial = finishMaterials(kit);
  /** How the walls round a floor cell are done up, if its room says. */
  const finishOf = (cell: Cell) => {
    const found = room.finishes?.find(({ area }) => isInside(area, cell.cx, cell.cz));
    return found ? finishMaterial(found.finish) : null;
  };
  /** Without its own strips, a room gets one over every other floor cell (the lab's over the table flickers). */
  const gridStrip = (cell: Cell, xi: number, zi: number) => {
    const flickers = `${xi},${zi}` === flickerCell;
    if (room.strips || (!flickers && (xi + zi) % 2)) return;
    addStrip(root, cell.cx, cell.cz, flickers ? flicker : materials.strip);
  };
  map.forEach((row, zi) => {
    [...row].forEach((char, xi) => {
      const cell = { char, cx: (xi + 0.5) * CELL, cz: (zi + 0.5) * CELL, ribbed: (xi + zi) % 3 === 0 };
      const build = special[char];
      if (build) return build(cell);
      if (isSolidAt(map, cell.cx, cell.cz))
        return addWallCell(root, map, cell, materials, wallFixture(kit, char, monitors));
      addFloorCell(root, map, cell, materials, finishOf(cell));
      gridStrip(cell, xi, zi);
    });
  });
  if (room.strips) {
    for (const strip of room.strips) addStrip(root, strip.x, strip.z, materials.strip);
    addPools(root, room.strips);
  }
  addFurniture(root, room, kit);
  const vent = room.vent ? buildVent(kit, room.vent) : null;
  if (vent) root.add(vent.root);
  const serviceDoorView = doors[0] ?? null;

  return {
    root,
    vent,
    serviceDoor: serviceDoorView,
    kit,
    update(seconds) {
      for (const update of updates) update(seconds);
      vent?.update(seconds);
      serviceDoorView?.update(seconds);
    },
    dispose: () => dispose(root)
  };
}
