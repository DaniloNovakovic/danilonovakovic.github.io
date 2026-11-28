import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  MeshBasicMaterial,
  SphereGeometry,
  TorusGeometry
} from 'three';
import { mesh, type PropKit } from './labProps';
import { NIGHT_LAB, seededRandom } from './toon';

/** The cleaners' colours: hazard yellow plastic, the drones' worn enamel, unlit tube glass. */
const JANITOR = 0xd9a63a;
const DRONE = 0x6f7d9e;
const DRONE_DARK = 0x3a4466;
const TUBE = 0xe9e4cf;
const DRUM = 0x7b5a96;

/** A plain steel rack: four shelves, uprights at the ends. */
function rack(kit: PropKit) {
  const group = new Group();
  const frame = kit.toon(NIGHT_LAB.steel);
  for (const side of [-1, 1]) group.add(mesh(new BoxGeometry(0.08, 2.3, 0.7), frame, side * 1.15, 1.15, 0));
  for (const y of [0.15, 0.85, 1.55, 2.2]) group.add(mesh(new BoxGeometry(2.3, 0.06, 0.7), frame, 0, y, 0));
  return group;
}

/** Spare light tubes in bundles, boxes of bulbs, a tray of loose ones: what keeps the strips lit. */
export function lampShelf(kit: PropKit) {
  const group = rack(kit);
  const glass = kit.toon(TUBE);
  const cap = kit.toon(NIGHT_LAB.steel);
  // Bottom: long tubes in bundles, lying along the shelf.
  for (const [z, y] of [
    [-0.18, 0.24],
    [0, 0.24],
    [0.18, 0.24],
    [-0.09, 0.39],
    [0.09, 0.39]
  ]) {
    const tube = mesh(new CylinderGeometry(0.07, 0.07, 2.1, 6), glass, 0, y, z);
    tube.rotation.z = Math.PI / 2;
    group.add(tube);
    for (const side of [-1, 1]) {
      const end = mesh(new CylinderGeometry(0.075, 0.075, 0.08, 6), cap, side * 1.05, y, z);
      end.rotation.z = Math.PI / 2;
      group.add(end);
    }
  }
  // Middle: boxes of bulbs, each with its bulb drawn on.
  const random = seededRandom(57);
  for (let x = -0.95; x < 0.9; x += 0.42) {
    const box = mesh(new BoxGeometry(0.36, 0.3, 0.42), kit.toon(NIGHT_LAB.paper), x + 0.18, 1.03, 0);
    box.rotation.y = (random() - 0.5) * 0.25;
    box.add(mesh(new SphereGeometry(0.07, 8, 6), kit.toon(JANITOR), 0, 0.02, 0.215));
    group.add(box);
  }
  // Top: a tray of loose round bulbs.
  group.add(mesh(new BoxGeometry(1.6, 0.08, 0.5), kit.toon(DRONE_DARK), -0.2, 1.62, 0));
  for (let i = 0; i < 10; i++) {
    const bulb = mesh(new SphereGeometry(0.1, 8, 6), glass, -0.9 + (i % 5) * 0.35, 1.74, i < 5 ? -0.11 : 0.11);
    bulb.add(mesh(new CylinderGeometry(0.045, 0.045, 0.07, 6), cap, 0, -0.1, 0));
    group.add(bulb);
  }
  return group;
}

function drum(kit: PropKit, x: number, z: number) {
  const group = new Group();
  group.position.set(x, 0, z);
  group.add(mesh(new CylinderGeometry(0.34, 0.34, 0.95, 12), kit.toon(DRUM), 0, 0.475));
  for (const y of [0.2, 0.75]) group.add(mesh(new TorusGeometry(0.345, 0.025, 4, 14), kit.toon(DRONE_DARK), 0, y));
  group.children.slice(-2).forEach((ring) => (ring.rotation.x = Math.PI / 2));
  // A hazard band: the fluid strips anything off the floor, including what's left of a person.
  group.add(mesh(new CylinderGeometry(0.348, 0.348, 0.16, 12), kit.toon(NIGHT_LAB.alert), 0, 0.5));
  group.add(mesh(new CylinderGeometry(0.31, 0.31, 0.03, 12), kit.toon(NIGHT_LAB.steel), 0, 0.965));
  return group;
}

/** Two drums of cleaning fluid, one with a hand pump in it. */
export function drums(kit: PropKit) {
  const group = new Group();
  const pumped = drum(kit, -0.36, 0);
  const steel = kit.toon(NIGHT_LAB.steel);
  pumped.add(mesh(new CylinderGeometry(0.04, 0.04, 0.45, 6), steel, 0.1, 1.18, 0));
  const handle = mesh(new BoxGeometry(0.3, 0.05, 0.05), steel, 0.1, 1.42, 0);
  const spout = mesh(new CylinderGeometry(0.025, 0.025, 0.25, 5), steel, 0.24, 1.3, 0);
  spout.rotation.z = Math.PI / 2.4;
  pumped.add(handle, spout);
  group.add(pumped, drum(kit, 0.4, 0.05));
  return group;
}

/** The janitor corner: a wheeled bucket and wringer, its mop in it, a broom leaning on the wall, a spray bottle. */
export function mopBucket(kit: PropKit) {
  const group = new Group();
  const yellow = kit.toon(JANITOR);
  const dark = kit.toon(NIGHT_LAB.cable);
  group.add(mesh(new CylinderGeometry(0.32, 0.26, 0.48, 12), yellow, 0, 0.32));
  group.add(mesh(new CylinderGeometry(0.29, 0.29, 0.02, 12), kit.toon(0x4f6f6a), 0, 0.52));
  for (const [x, z] of [
    [0.22, 0.22],
    [-0.22, 0.22],
    [0.22, -0.22],
    [-0.22, -0.22]
  ]) {
    group.add(mesh(new SphereGeometry(0.05, 6, 4), dark, x, 0.05, z));
  }
  // The wringer on one side.
  group.add(mesh(new BoxGeometry(0.3, 0.2, 0.26), kit.toon(DRONE_DARK), 0, 0.64, -0.12));
  const lever = mesh(new BoxGeometry(0.04, 0.55, 0.04), dark, 0.16, 0.85, -0.12);
  lever.rotation.z = -0.3;
  group.add(lever);
  // The mop, standing in it, leaning back against the wall.
  const mop = new Group();
  mop.position.set(-0.05, 0.5, 0.05);
  mop.rotation.set(-0.08, 0, 0.12);
  mop.add(mesh(new CylinderGeometry(0.025, 0.025, 1.5, 5), kit.toon(NIGHT_LAB.steel), 0, 0.75));
  for (let i = 0; i < 7; i++) {
    const strand = mesh(new ConeGeometry(0.035, 0.28, 4), kit.toon(NIGHT_LAB.paper), 0, -0.05, 0);
    strand.rotation.set(Math.PI + Math.sin(i) * 0.4, (i / 7) * Math.PI * 2, Math.cos(i) * 0.4);
    mop.add(strand);
  }
  // A broom against the wall behind, a spray bottle on the floor.
  const broom = new Group();
  broom.position.set(-0.45, 0, -0.42);
  broom.rotation.x = 0.18;
  broom.add(mesh(new CylinderGeometry(0.025, 0.025, 1.6, 5), kit.toon(NIGHT_LAB.steel), 0, 0.95));
  broom.add(mesh(new BoxGeometry(0.4, 0.14, 0.1), yellow, 0, 0.1));
  const bottle = mesh(new CapsuleGeometry(0.07, 0.18, 3, 8), kit.toon(NIGHT_LAB.fluid), 0.42, 0.17, 0.3);
  bottle.add(mesh(new BoxGeometry(0.06, 0.08, 0.1), dark, 0, 0.17, 0.03));
  group.add(mop, broom, bottle, pegboard(kit));
  return group;
}

/** On the wall above the bucket: a board of hooks, a coiled hose, scrapers and brushes on long handles. */
function pegboard(kit: PropKit) {
  const group = new Group();
  // Flat against the wall behind (the bucket's back), at chest height.
  group.position.set(0.3, 1.5, -0.66);
  const dark = kit.toon(NIGHT_LAB.cable);
  group.add(mesh(new BoxGeometry(1.5, 0.9, 0.04), kit.toon(DRONE_DARK)));
  const hose = mesh(new TorusGeometry(0.2, 0.04, 5, 14), kit.toon(JANITOR), -0.45, 0.05, 0.08);
  group.add(hose, mesh(new BoxGeometry(0.04, 0.04, 0.1), dark, -0.45, 0.25, 0.05));
  const steel = kit.toon(NIGHT_LAB.steel);
  [0, 0.28, 0.56].forEach((x, i) => {
    group.add(mesh(new BoxGeometry(0.04, 0.04, 0.1), dark, x, 0.32, 0.05));
    const handle = mesh(new CylinderGeometry(0.02, 0.02, 0.6, 5), steel, x, 0.02, 0.07);
    const head =
      i === 1
        ? mesh(new BoxGeometry(0.22, 0.04, 0.04), steel, x, -0.3, 0.07)
        : mesh(new BoxGeometry(0.16, 0.1, 0.06), kit.toon(i ? JANITOR : NIGHT_LAB.paper), x, -0.3, 0.08);
    group.add(handle, head);
  });
  return group;
}

/** A cleaner's trolley: a bin bag on a hoop, a tray of bottles, cloths on the handle. */
export function janitorCart(kit: PropKit) {
  const group = new Group();
  const frame = kit.toon(NIGHT_LAB.steel);
  const dark = kit.toon(NIGHT_LAB.cable);
  for (const y of [0.15, 0.6, 1.0]) group.add(mesh(new BoxGeometry(1.2, 0.05, 0.6), kit.toon(JANITOR), 0.1, y, 0));
  for (const [x, z] of [
    [-0.48, 0.27],
    [0.68, 0.27],
    [-0.48, -0.27],
    [0.68, -0.27]
  ]) {
    group.add(mesh(new BoxGeometry(0.04, 1.0, 0.04), frame, x, 0.55, z));
    group.add(mesh(new SphereGeometry(0.06, 6, 4), dark, x, 0.06, z));
  }
  // The bag hangs off one end, bulging.
  const bag = mesh(new SphereGeometry(0.32, 10, 8), kit.toon(0x2b2f45), -0.75, 0.55, 0);
  bag.scale.set(0.9, 1.4, 0.9);
  group.add(bag, mesh(new TorusGeometry(0.28, 0.025, 4, 12), frame, -0.75, 1.0, 0));
  group.children[group.children.length - 1].rotation.x = Math.PI / 2;
  // Bottles of every fluid on board, a bucket underneath.
  const random = seededRandom(83);
  for (let i = 0; i < 5; i++) {
    const colour = [NIGHT_LAB.fluid, NIGHT_LAB.alert, NIGHT_LAB.glass, JANITOR][Math.floor(random() * 4)];
    const bottle = mesh(
      new CapsuleGeometry(0.06, 0.16, 3, 8),
      kit.toon(colour),
      -0.3 + i * 0.2,
      1.17,
      (random() - 0.5) * 0.3
    );
    bottle.add(mesh(new BoxGeometry(0.05, 0.07, 0.08), dark, 0, 0.15, 0.02));
    group.add(bottle);
  }
  group.add(mesh(new CylinderGeometry(0.22, 0.18, 0.35, 10), kit.toon(NIGHT_LAB.crate), 0.3, 0.35, 0));
  const cloth = mesh(new BoxGeometry(0.06, 0.35, 0.3), kit.toon(NIGHT_LAB.paper), 0.72, 0.85, 0);
  cloth.rotation.z = 0.15;
  group.add(cloth);
  return group;
}

/** A cleaning drone's dock: a plate on the floor, a charging post at the wall behind. */
export function droneDock(kit: PropKit) {
  const group = new Group();
  group.scale.setScalar(DRONE_SCALE);
  group.add(mesh(new BoxGeometry(1.05, 0.04, 1.05), kit.toon(NIGHT_LAB.cable), 0, 0.02, -0.05));
  group.add(mesh(new BoxGeometry(0.5, 0.55, 0.12), kit.toon(DRONE_DARK), 0, 0.3, -0.52));
  return group;
}

const DRONE_SCALE = 1.25;
const DRONE_AWAKE = 0x7fe0c8;

export interface DroneBody {
  root: Group;
  /** Awake: the standby light goes steady and the lens lights up. */
  wake(): void;
  /** Rolling: the legs paddle. */
  pose(seconds: number, moving: boolean): void;
}

/**
 * A cleaning drone: a low shell on six folded legs, a brush skirt, a dark
 * lens, and a dim standby light breathing slowly while it sleeps on its dock.
 * Woken, it lights up and rolls off on its round.
 */
export function droneBody(kit: PropKit, seed: number): DroneBody {
  const root = new Group();
  root.scale.setScalar(DRONE_SCALE);
  const shell = kit.toon(DRONE);
  const dark = kit.toon(DRONE_DARK);
  const body = new Group();
  body.position.y = 0.06;
  // Settled a little off-true on its legs, each one differently.
  const slump = { x: (seed % 2 ? 1 : -1) * 0.04, y: (seed - 0.5) * 0.3, z: 0.03 };
  body.rotation.set(slump.x, slump.y, slump.z);
  const dome = mesh(new SphereGeometry(0.45, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), shell, 0, 0.14);
  dome.scale.y = 0.6;
  body.add(dome, mesh(new CylinderGeometry(0.47, 0.42, 0.14, 14), dark, 0, 0.07));
  // A seam down the back, like wing cases.
  body.add(mesh(new BoxGeometry(0.03, 0.03, 0.8), dark, 0, 0.42, -0.02));
  const legs: Group[] = [];
  for (const side of [-1, 1]) {
    for (const along of [-0.25, 0, 0.25]) {
      const leg = new Group();
      leg.position.set(side * 0.42, 0.05, along);
      const piece = mesh(new BoxGeometry(0.22, 0.04, 0.05), dark, side * 0.08, 0);
      piece.rotation.z = side * -0.5;
      leg.add(piece);
      leg.userData.side = side;
      legs.push(leg);
      body.add(leg);
    }
  }
  // The lens in front, dead dark; the standby light above it.
  const lens = kit.toon(NIGHT_LAB.ink, {});
  body.add(mesh(new SphereGeometry(0.1, 10, 8), lens, 0, 0.2, 0.38));
  const standby = new MeshBasicMaterial({ color: NIGHT_LAB.alert });
  body.add(mesh(new SphereGeometry(0.025, 6, 4), standby, 0, 0.33, 0.33));
  let awake = false;
  if (!kit.reducedMotion) {
    kit.animate((t) => {
      if (!awake) standby.color.setHex(Math.sin(t * 0.8 + seed * 2) > 0.6 ? NIGHT_LAB.alert : DRONE_DARK);
    });
  }
  root.add(body);
  return {
    root,
    wake() {
      awake = true;
      standby.color.setHex(DRONE_AWAKE);
      lens.color.setHex(DRONE_AWAKE);
      body.rotation.set(0, 0, 0);
    },
    pose(seconds, moving) {
      if (kit.reducedMotion || !moving) return;
      legs.forEach((leg, i) => (leg.rotation.y = Math.sin(seconds * 9 + i * 1.3) * 0.35 * leg.userData.side));
      body.position.y = 0.06 + Math.abs(Math.sin(seconds * 9)) * 0.012;
    }
  };
}
