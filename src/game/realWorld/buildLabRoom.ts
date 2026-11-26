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
  PointLight,
  RepeatWrapping,
  SRGBColorSpace,
  type Material,
  type Object3D
} from 'three';
import {
  cellAt,
  findCells,
  isSolidAt,
  REAL_WORLD_CELL as CELL,
  REAL_WORLD_WALL_HEIGHT as H,
  type RealWorldMap
} from '@/game/core/realWorld';
import {
  crateStack,
  floorCable,
  jarShelf,
  lockedDoor,
  monitor,
  operatingTable,
  shatteredPod,
  sketchPage,
  sleeperPod,
  ventGrate,
  type PropKit
} from './labProps';
import { brainScanScreen, oldWorldScreen } from './labScreens';
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

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
] as const;

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

/** The monitors take turns: the old world, then a mind being read. */
function wallFixture(kit: PropKit, char: string, monitors: { count: number }): Object3D | null {
  if (char === 'V') return ventGrate(kit);
  if (char === 'D') return lockedDoor(kit);
  if (char !== 'M') return null;
  monitors.count += 1;
  return monitor(kit, monitors.count === 1 ? oldWorldScreen(kit.reducedMotion) : brainScanScreen(kit.reducedMotion));
}

function addWallCell(root: Group, map: RealWorldMap, cell: Cell, materials: CellMaterials, fixture: Object3D | null) {
  const wall = new Mesh(new BoxGeometry(CELL, H, CELL), materials.wall);
  wall.position.set(cell.cx, H / 2, cell.cz);
  root.add(wall);
  if (!fixture) return;
  onWallFace(map, cell.cx, cell.cz, fixture, 0.08);
  root.add(fixture);
}

function addFloorCell(
  root: Group,
  map: RealWorldMap,
  { cx, cz, ribbed }: Cell,
  materials: CellMaterials,
  strip: Material
) {
  // A light strip in every cell: the light the aliens will see you in.
  const light = new Mesh(new BoxGeometry(1.6, 0.08, 0.35), strip);
  light.position.set(cx, H - 0.05, cz);
  root.add(light);
  for (const [dx, dz] of NEIGHBOURS) {
    if (!isSolidAt(map, cx + dx * CELL, cz + dz * CELL)) continue;
    const trim = new Mesh(new BoxGeometry(dx ? 0.25 : CELL, 0.35, dz ? 0.25 : CELL), materials.trim);
    trim.position.set(cx + dx * (CELL / 2 - 0.12), 0.17, cz + dz * (CELL / 2 - 0.12));
    root.add(trim);
    // No rib in front of a vent, door or monitor: they sit mid-face, where a rib would.
    if (!ribbed || cellAt(map, cx + dx * CELL, cz + dz * CELL) !== '#') continue;
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

function lights(root: Group, map: RealWorldMap) {
  root.add(new HemisphereLight(0xc8d4ff, 0x2a3566, 1.5));
  const sun = new DirectionalLight(0xffffff, 0.9);
  sun.position.set(0.5, 1, 0.3);
  root.add(sun);
  // The pods glow from inside.
  for (const { x, z } of findCells(map, 'H')) {
    const glow = new PointLight(NIGHT_LAB.fluid, 2.5, 5, 1);
    glow.position.set(x, 1.6, z + 1.2);
    root.add(glow);
  }
}

function addProps(root: Group, map: RealWorldMap, kit: PropKit) {
  const [screens] = findCells(map, 'M');
  findCells(map, 'H').forEach(({ x, z }, i) => {
    root.add(sleeperPod(kit, x, z, 11 + i * 5));
    if (screens) root.add(floorCable(kit, { x, z }, { x: CELL, z: screens.z + (i % 2) * 2 }, i - 1.5));
  });
  for (const { x, z } of findCells(map, 'O')) {
    root.add(shatteredPod(kit, x, z));
    root.add(sketchPage(kit, x - 1.6, z + 2.4));
  }
  for (const { x, z } of findCells(map, 'T')) root.add(operatingTable(kit, x, z));
  findCells(map, 'J').forEach(({ x, z }, i) => root.add(jarShelf(kit, x, z, i + 1)));
  for (const { x, z } of findCells(map, 'C'))
    root.add(crateStack(kit, x, z, cellAt(map, x + CELL, z) === '#' ? 0.4 : -0.3));
}

export interface LabRoom {
  root: Group;
  /** Advance the room's small motions (bubbles, screens, the flicker) to `seconds`. */
  update(seconds: number): void;
  dispose(): void;
}

/** Build the lab from a floor plan in `@/game/core/realWorld`. */
export function buildLabRoom(map: RealWorldMap, reducedMotion: boolean): LabRoom {
  const updates: Array<(seconds: number) => void> = [];
  const kit: PropKit = { toon: makeToon(), animate: (update) => updates.push(update), reducedMotion };
  const root = new Group();
  lights(root, map);

  const width = map[0].length * CELL;
  const depth = map.length * CELL;
  const floor = new Mesh(new PlaneGeometry(width, depth), kit.toon(0xffffff, { map: floorTexture(map) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(width / 2, 0, depth / 2);
  const ceiling = new Mesh(new PlaneGeometry(width, depth), kit.toon(NIGHT_LAB.ceiling));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(width / 2, H, depth / 2);
  root.add(floor, ceiling);

  const materials: CellMaterials = {
    wall: kit.toon(NIGHT_LAB.wall),
    trim: kit.toon(NIGHT_LAB.ceiling),
    strip: new MeshBasicMaterial({ color: NIGHT_LAB.strip })
  };
  const flicker = flickeringStrip(kit);
  const monitors = { count: 0 };
  map.forEach((row, zi) => {
    [...row].forEach((char, xi) => {
      const cell = { char, cx: (xi + 0.5) * CELL, cz: (zi + 0.5) * CELL, ribbed: (xi + zi) % 3 === 0 };
      if (isSolidAt(map, cell.cx, cell.cz)) addWallCell(root, map, cell, materials, wallFixture(kit, char, monitors));
      else addFloorCell(root, map, cell, materials, char === 'T' ? flicker : materials.strip);
    });
  });
  addProps(root, map, kit);

  return {
    root,
    update(seconds) {
      for (const update of updates) update(seconds);
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
