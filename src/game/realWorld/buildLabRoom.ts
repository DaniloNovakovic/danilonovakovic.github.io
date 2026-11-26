import {
  BoxGeometry,
  CanvasTexture,
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
  isSolidAt,
  NEIGHBOURS,
  REAL_WORLD_CELL as CELL,
  REAL_WORLD_WALL_HEIGHT as H,
  grateCentre,
  mouthOf,
  VENT_CELL,
  type Facing,
  type FurnitureKind,
  type RealWorldMap,
  type RealWorldRoom,
  type VentDuct
} from '@/game/core/realWorld';
import { buildVent, type LabVent } from './buildVent';
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
import { cleanerBot, drums, janitorCart, lampShelf, mopBucket } from './storeProps';
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

/** Place `object` on the face of wall cell (cx, cz) that looks into the room. */
function onWallFace(map: RealWorldMap, cx: number, cz: number, object: Object3D, inset: number) {
  for (const [dx, dz] of NEIGHBOURS) {
    if (isSolidAt(map, cx + dx * CELL, cz + dz * CELL)) continue;
    object.position.set(cx + dx * (CELL / 2 + inset), object.position.y, cz + dz * (CELL / 2 + inset));
    object.rotation.y = Math.atan2(dx, dz);
    return;
  }
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

function addWallCell(root: Group, map: RealWorldMap, cell: Cell, materials: CellMaterials, fixture: Object3D | null) {
  const wall = new Mesh(new BoxGeometry(CELL, H, CELL), materials.wall);
  wall.position.set(cell.cx, H / 2, cell.cz);
  root.add(wall);
  if (!fixture) return;
  onWallFace(map, cell.cx, cell.cz, fixture, 0.08);
  root.add(fixture);
}

/** Light strips over every other cell: the light the aliens will see you in, and the dark between. */
function addStrip(root: Group, { cx, cz }: Cell, strip: Material) {
  const light = new Mesh(new BoxGeometry(1.6, 0.08, 0.35), strip);
  light.position.set(cx, H - 0.05, cz);
  root.add(light);
}

/** Width of the locked door's frame; the skirting stops at it. */
const DOOR_WIDTH = 2.6;

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
    const trim = new Mesh(new BoxGeometry(dx ? 0.25 : length, 0.35, dz ? 0.25 : length), material);
    trim.position.set(
      cx + dx * (CELL / 2 - 0.12) + (dz ? offset : 0),
      0.17,
      cz + dz * (CELL / 2 - 0.12) + (dx ? offset : 0)
    );
    root.add(trim);
  }
}

function addFloorCell(root: Group, map: RealWorldMap, { cx, cz, ribbed }: Cell, materials: CellMaterials) {
  for (const side of NEIGHBOURS) {
    const [dx, dz] = side;
    if (!isSolidAt(map, cx + dx * CELL, cz + dz * CELL)) continue;
    const wall = cellAt(map, cx + dx * CELL, cz + dz * CELL);
    const gap = wall === 'D' ? DOOR_WIDTH : wall === 'V' ? VENT_CELL + 2 * VENT_HOLE_MARGIN : 0;
    addSkirting(root, cx, cz, side, materials.trim, gap);
    // No rib in front of a vent, door or monitor: they sit mid-face, where a rib would.
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
  cleanerBot: (kit, nth) => cleanerBot(kit, nth),
  janitorCart: (kit) => janitorCart(kit)
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

export interface LabRoom {
  root: Group;
  /** The vent behind the `V` grate, if the room has one. */
  vent: LabVent | null;
  /** Advance the room's small motions (bubbles, screens, the flicker) to `seconds`. */
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

/** The floor tiles, and the ceiling over the whole plan, with a hole where a hatch is. */
function floorAndCeiling(kit: PropKit, room: RealWorldRoom) {
  const map = room.walls;
  const width = map[0].length * CELL;
  const depth = map.length * CELL;
  const floor = new Mesh(new PlaneGeometry(width, depth), kit.toon(0xffffff, { map: floorTexture(map) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(width / 2, 0, depth / 2);
  const material = kit.toon(NIGHT_LAB.ceiling);
  if (!room.hatch) return [floor, ceilingPanel(material, 0, width, 0, depth)];
  const half = VENT_CELL / 2;
  const { x, z } = room.hatch;
  return [
    floor,
    ceilingPanel(material, 0, width, 0, z - half),
    ceilingPanel(material, 0, width, z + half, depth),
    ceilingPanel(material, 0, x - half, z - half, z + half),
    ceilingPanel(material, x + half, width, z - half, z + half)
  ];
}

/** Where the light strips go: the room's own list, or every other floor cell. */
function hasStrip(room: RealWorldRoom, xi: number, zi: number) {
  if (!room.strips) return (xi + zi) % 2 === 0;
  return room.strips.some((strip) => Math.floor(strip.x / CELL) === xi && Math.floor(strip.z / CELL) === zi);
}

export interface BuildOptions {
  /** The scene's shared lights; only one room in a scene should bring them. */
  lights: boolean;
}

/**
 * Build a room from its plan in `@/game/core/realWorld`: the lab, or another
 * ship room, placed in the world at its `offset`.
 */
export function buildLabRoom(
  room: RealWorldRoom,
  reducedMotion: boolean,
  options: BuildOptions = { lights: true }
): LabRoom {
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
  map.forEach((row, zi) => {
    [...row].forEach((char, xi) => {
      const cell = { char, cx: (xi + 0.5) * CELL, cz: (zi + 0.5) * CELL, ribbed: (xi + zi) % 3 === 0 };
      if (char === 'V' && room.vent) {
        addVentWallCell(root, cell, room.vent, materials.wall);
        return;
      }
      if (isSolidAt(map, cell.cx, cell.cz)) {
        addWallCell(root, map, cell, materials, wallFixture(kit, char, monitors));
        return;
      }
      addFloorCell(root, map, cell, materials);
      if (`${xi},${zi}` === flickerCell) addStrip(root, cell, flicker);
      else if (hasStrip(room, xi, zi)) addStrip(root, cell, materials.strip);
    });
  });
  addFurniture(root, room, kit);
  const vent = room.vent ? buildVent(kit, room.vent) : null;
  if (vent) root.add(vent.root);

  return {
    root,
    vent,
    update(seconds) {
      for (const update of updates) update(seconds);
      vent?.update(seconds);
    },
    dispose() {
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
  };
}
