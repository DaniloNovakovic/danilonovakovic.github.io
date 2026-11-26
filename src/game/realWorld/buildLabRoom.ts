import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DataTexture,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  PlaneGeometry,
  RedFormat,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  TorusGeometry,
  type Material,
  type MeshToonMaterialParameters,
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

/** Night lab (#144): deep navy, near-black ink, warm light strips, pink aliens. Our own colours. */
export const NIGHT_LAB = {
  background: 0x141a33,
  wall: 0x5468a8,
  floor: 0x2a3566,
  ceiling: 0x34407a,
  strip: 0xffd36e,
  crate: 0x57c4b8,
  pod: 0x9fb4ff,
  alert: 0xff5b4a,
  ink: 0x0b0e1c,
  panel: 'rgba(11,14,28,.6)'
} as const;

/** Flat fills with one soft shadow tone: the ink carries the form. */
function makeToon() {
  const gradient = new DataTexture(new Uint8Array([205, 255]), 2, 1, RedFormat);
  gradient.minFilter = gradient.magFilter = NearestFilter;
  gradient.needsUpdate = true;
  return (color: number, extra: MeshToonMaterialParameters = {}) =>
    new MeshToonMaterial({ color, gradientMap: gradient, ...extra });
}

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

/** A flat panel on the face of wall cell (x, z) that looks into the room. */
function onWallFace(map: RealWorldMap, cx: number, cz: number, object: Object3D, inset: number) {
  for (const [dx, dz] of NEIGHBOURS) {
    if (isSolidAt(map, cx + dx * CELL, cz + dz * CELL)) continue;
    object.position.set(cx + dx * (CELL / 2 + inset), object.position.y, cz + dz * (CELL / 2 + inset));
    object.rotation.y = Math.atan2(dx, dz);
    return;
  }
}

function pod(toon: ReturnType<typeof makeToon>, x: number, z: number) {
  const group = new Group();
  const base = new Mesh(new CylinderGeometry(0.9, 1.1, 0.4, 10), toon(NIGHT_LAB.wall));
  base.position.y = 0.2;
  const glass = new Mesh(
    new CylinderGeometry(0.85, 0.85, 2.2, 10, 1, true, 0, Math.PI * 1.4),
    toon(NIGHT_LAB.pod, { transparent: true, opacity: 0.45, side: DoubleSide })
  );
  glass.position.y = 1.5;
  // Opened: the glass slid round, the gap facing where Danilo stepped out.
  glass.rotation.y = Math.PI * 0.8;
  const cap = new Mesh(new CylinderGeometry(1.0, 0.9, 0.3, 10), toon(NIGHT_LAB.wall));
  cap.position.y = 2.75;
  // The plug that ran the portfolio, hanging loose.
  const cable = new Mesh(new TorusGeometry(0.5, 0.06, 6, 12, Math.PI), toon(NIGHT_LAB.ink));
  cable.position.set(0.6, 2.2, 0.6);
  cable.rotation.set(0, Math.PI / 4, Math.PI / 2);
  const plug = new Mesh(new SphereGeometry(0.12, 7, 5), new MeshBasicMaterial({ color: NIGHT_LAB.strip }));
  plug.position.set(0.95, 1.7, 0.95);
  group.add(base, glass, cap, cable, plug);
  group.position.set(x, 0, z);
  return group;
}

function vent(toon: ReturnType<typeof makeToon>) {
  const group = new Group();
  group.add(new Mesh(new BoxGeometry(1.8, 1.1, 0.12), toon(NIGHT_LAB.ceiling)));
  for (let i = -2; i <= 2; i++) {
    const slat = new Mesh(new BoxGeometry(1.5, 0.08, 0.1), toon(NIGHT_LAB.wall));
    slat.position.set(0, i * 0.18, 0.06);
    slat.rotation.x = -0.5;
    group.add(slat);
  }
  group.position.y = 0.75;
  return group;
}

function lockedDoor(toon: ReturnType<typeof makeToon>) {
  const group = new Group();
  const frame = new Mesh(new BoxGeometry(2.6, 2.7, 0.15), toon(NIGHT_LAB.ceiling));
  const halfLeft = new Mesh(new BoxGeometry(1.1, 2.4, 0.1), toon(NIGHT_LAB.wall));
  halfLeft.position.set(-0.56, -0.05, 0.08);
  const halfRight = halfLeft.clone();
  halfRight.position.x = 0.56;
  const light = new Mesh(new BoxGeometry(0.3, 0.12, 0.08), new MeshBasicMaterial({ color: NIGHT_LAB.alert }));
  light.position.set(0, 1.5, 0.1);
  group.add(frame, halfLeft, halfRight, light);
  group.position.y = 1.35;
  return group;
}

interface CellMaterials {
  toon: ReturnType<typeof makeToon>;
  wall: Material;
  trim: Material;
  strip: Material;
}

interface Cell {
  char: string;
  cx: number;
  cz: number;
  /** Some floor cells get wall ribs, so the ink has shapes to find. */
  ribbed: boolean;
}

function addWallCell(root: Group, map: RealWorldMap, { char, cx, cz }: Cell, materials: CellMaterials) {
  const wall = new Mesh(new BoxGeometry(CELL, H, CELL), materials.wall);
  wall.position.set(cx, H / 2, cz);
  root.add(wall);
  const fixture = char === 'V' ? vent(materials.toon) : char === 'D' ? lockedDoor(materials.toon) : null;
  if (!fixture) return;
  onWallFace(map, cx, cz, fixture, char === 'V' ? 0.06 : 0.08);
  root.add(fixture);
}

function addFloorCell(root: Group, map: RealWorldMap, { cx, cz, ribbed }: Cell, materials: CellMaterials) {
  // A light strip in every cell: the light the aliens will see you in.
  const strip = new Mesh(new BoxGeometry(1.6, 0.08, 0.35), materials.strip);
  strip.position.set(cx, H - 0.05, cz);
  root.add(strip);
  for (const [dx, dz] of NEIGHBOURS) {
    if (!isSolidAt(map, cx + dx * CELL, cz + dz * CELL)) continue;
    const trim = new Mesh(new BoxGeometry(dx ? 0.25 : CELL, 0.35, dz ? 0.25 : CELL), materials.trim);
    trim.position.set(cx + dx * (CELL / 2 - 0.12), 0.17, cz + dz * (CELL / 2 - 0.12));
    root.add(trim);
    // No rib in front of the vent or the door: they sit mid-face, where a rib would.
    if (!ribbed || cellAt(map, cx + dx * CELL, cz + dz * CELL) !== '#') continue;
    const rib = new Mesh(new BoxGeometry(dx ? 0.3 : 0.4, H, dz ? 0.3 : 0.4), materials.wall);
    rib.position.set(cx + dx * (CELL / 2 - 0.15), H / 2, cz + dz * (CELL / 2 - 0.15));
    root.add(rib);
  }
}

export interface LabRoom {
  root: Group;
  dispose(): void;
}

/** Build the meshes for a floor plan from `@/game/core/realWorld`. */
export function buildLabRoom(map: RealWorldMap): LabRoom {
  const toon = makeToon();
  const root = new Group();
  root.add(new HemisphereLight(0xffffff, 0xffffff, 2.2));
  const sun = new DirectionalLight(0xffffff, 1.4);
  sun.position.set(0.5, 1, 0.3);
  root.add(sun);

  const width = map[0].length * CELL;
  const depth = map.length * CELL;
  const floor = new Mesh(new PlaneGeometry(width, depth), toon(0xffffff, { map: floorTexture(map) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(width / 2, 0, depth / 2);
  const ceiling = new Mesh(new PlaneGeometry(width, depth), toon(NIGHT_LAB.ceiling));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(width / 2, H, depth / 2);
  root.add(floor, ceiling);

  const materials: CellMaterials = {
    toon,
    wall: toon(NIGHT_LAB.wall),
    trim: toon(NIGHT_LAB.ceiling),
    strip: new MeshBasicMaterial({ color: NIGHT_LAB.strip })
  };
  map.forEach((row, zi) => {
    [...row].forEach((char, xi) => {
      const cell = { char, cx: (xi + 0.5) * CELL, cz: (zi + 0.5) * CELL, ribbed: (xi + zi) % 3 === 0 };
      if (isSolidAt(map, cell.cx, cell.cz)) addWallCell(root, map, cell, materials);
      else addFloorCell(root, map, cell, materials);
    });
  });

  for (const { x, z } of findCells(map, 'O')) root.add(pod(toon, x, z));
  for (const { x, z } of findCells(map, 'C')) {
    const turn = cellAt(map, x + CELL, z) === '#' ? 0.4 : -0.3;
    const crate = new Mesh(new BoxGeometry(1.3, 1.3, 1.3), toon(NIGHT_LAB.crate));
    crate.position.set(x, 0.65, z);
    crate.rotation.y = turn;
    const top = new Mesh(new BoxGeometry(0.9, 0.9, 0.9), toon(NIGHT_LAB.crate));
    top.position.set(x - 0.1, 1.75, z + 0.1);
    top.rotation.y = -turn;
    root.add(crate, top);
  }

  return {
    root,
    dispose() {
      const materials = new Set<Material>();
      root.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        for (const material of [object.material].flat() as Material[]) materials.add(material);
      });
      for (const material of materials) {
        if (material instanceof MeshToonMaterial) {
          material.map?.dispose();
          material.gradientMap?.dispose();
        }
        material.dispose();
      }
    }
  };
}
