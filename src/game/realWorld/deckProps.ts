import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  CylinderGeometry,
  Group,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry
} from 'three';
import { glass, mesh, noInk, type PropKit } from './labProps';
import { NIGHT_LAB, seededRandom } from './toon';

/**
 * The ship deck's rooms (#145): the crew's break room, the laundry, the
 * security post and its armoury cage, the storeroom's service door. Every
 * builder turns its front to +z, length along x, standing on y = 0.
 */
const COAT = 0xe4e2ee;
const UNIFORM = 0x26305c;
const LOCKER = 0x6f7d9e;
const LOCKER_DARK = 0x3a4466;
const HAZARD = 0xd9a63a;
const SCREEN_GLOW = 0x9fe8c8;
const BLASTER = 0x4a5578;

/** The crew's table: benches either side, mugs, a tray, someone's wrapper. */
export function messTable(kit: PropKit) {
  const group = new Group();
  const top = kit.toon(NIGHT_LAB.ceiling);
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new BoxGeometry(3, 0.08, 0.75), top, 0, 0.76));
  for (const x of [-1.3, 1.3]) group.add(mesh(new BoxGeometry(0.08, 0.72, 0.5), steel, x, 0.36));
  // Benches, low and long: these people sit hunched.
  for (const z of [-0.5, 0.5]) {
    group.add(mesh(new BoxGeometry(2.8, 0.06, 0.24), top, 0, 0.45, z));
    for (const x of [-1.2, 1.2]) group.add(mesh(new BoxGeometry(0.06, 0.42, 0.18), steel, x, 0.21, z));
  }
  const random = seededRandom(19);
  for (let i = 0; i < 4; i++) {
    const mug = mesh(new CylinderGeometry(0.07, 0.06, 0.14, 8), kit.toon(i % 2 ? NIGHT_LAB.paper : NIGHT_LAB.crate));
    mug.position.set(-1.1 + i * 0.7 + random() * 0.2, 0.87, (random() - 0.5) * 0.4);
    group.add(mug);
  }
  group.add(mesh(new BoxGeometry(0.5, 0.03, 0.34), kit.toon(LOCKER_DARK), 0.2, 0.815, 0.05));
  const wrapper = mesh(new BoxGeometry(0.16, 0.02, 0.1), kit.toon(NIGHT_LAB.alert), 0.9, 0.81, 0.15);
  wrapper.rotation.y = 0.7;
  group.add(wrapper);
  return group;
}

/** A drinks machine: a lit front of jars in rows, fizzy and glowing. */
export function vendingMachine(kit: PropKit) {
  const group = new Group();
  const body = kit.toon(LOCKER_DARK);
  group.add(mesh(new BoxGeometry(1.3, 2.3, 0.9), body, 0, 1.15));
  const panel = new MeshBasicMaterial({ color: 0x3b4a7a });
  group.add(mesh(new PlaneGeometry(0.9, 1.5), panel, -0.1, 1.35, 0.455));
  const colours = [NIGHT_LAB.fluid, NIGHT_LAB.brain, HAZARD, NIGHT_LAB.glass];
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 4; i++) {
      const jar = mesh(new CapsuleGeometry(0.06, 0.12, 3, 6), new MeshBasicMaterial({ color: colours[(row + i) % 4] }));
      jar.position.set(-0.4 + i * 0.2, 0.8 + row * 0.36, 0.42);
      group.add(jar);
    }
  }
  group.add(noInk(mesh(new PlaneGeometry(0.9, 1.5), glass(NIGHT_LAB.glass, 0.18), -0.1, 1.35, 0.47)));
  // Buttons, a slot, the tray at the bottom.
  for (let i = 0; i < 4; i++)
    group.add(mesh(new BoxGeometry(0.1, 0.07, 0.04), kit.toon(NIGHT_LAB.steel), 0.5, 1.7 - i * 0.14, 0.46));
  group.add(mesh(new BoxGeometry(0.8, 0.22, 0.1), kit.toon(NIGHT_LAB.ink), -0.1, 0.35, 0.44));
  return group;
}

/** A front-loading washer; behind the glass, a lab coat going round (it stops under reduced motion). */
export function washer(kit: PropKit) {
  const group = new Group();
  const white = kit.toon(0xc9cde0);
  group.add(mesh(new BoxGeometry(1, 1.05, 1), white, 0, 0.525));
  // The control strip sits proud of the front and below the top, so it never shares a face with the body.
  group.add(mesh(new BoxGeometry(0.9, 0.12, 0.06), kit.toon(LOCKER_DARK), 0, 0.95, 0.52));
  const door = new Group();
  door.position.set(0, 0.5, 0.5);
  door.add(mesh(new TorusGeometry(0.32, 0.05, 6, 18), kit.toon(NIGHT_LAB.steel)));
  const drum = new Group();
  drum.position.z = -0.04;
  drum.add(mesh(new CircleGeometry(0.3, 16), kit.toon(0x1d2340)));
  // A sleeve flopping round inside.
  const sleeve = mesh(new BoxGeometry(0.34, 0.12, 0.04), kit.toon(COAT), 0.08, 0.06, 0.02);
  sleeve.rotation.z = 0.5;
  drum.add(sleeve);
  door.add(drum, noInk(mesh(new CircleGeometry(0.3, 16), glass(NIGHT_LAB.glass, 0.25), 0, 0, 0.02)));
  group.add(door);
  if (!kit.reducedMotion) kit.animate((t) => (drum.rotation.z = t * 1.4));
  return group;
}

/** A coat-shaped hang: narrow shoulders, long and flared, open down the front. */
function hangingCoat(kit: PropKit, colour: number, x: number, turn: number) {
  const group = new Group();
  group.position.set(x, 1.85, 0);
  group.rotation.y = turn;
  group.add(mesh(new TorusGeometry(0.06, 0.012, 4, 8, Math.PI), kit.toon(NIGHT_LAB.steel), 0, 0.04));
  group.add(mesh(new BoxGeometry(0.4, 0.04, 0.05), kit.toon(NIGHT_LAB.steel), 0, -0.02));
  const body = mesh(new CylinderGeometry(0.17, 0.3, 1.15, 8, 1, true), kit.toon(colour), 0, -0.62);
  body.scale.z = 0.45;
  group.add(body);
  return group;
}

/**
 * A rail of spare clothes: lab coats the researchers' size, and one officer's
 * uniform jacket among them, a badge on the chest.
 */
export function coatRack(kit: PropKit, seed: number) {
  const group = new Group();
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new CylinderGeometry(0.025, 0.025, 2.6, 6), steel, 0, 1.9).rotateZ(Math.PI / 2));
  for (const x of [-1.25, 1.25]) {
    group.add(mesh(new BoxGeometry(0.05, 1.9, 0.05), steel, x, 0.95));
    group.add(mesh(new BoxGeometry(0.06, 0.05, 0.55), steel, x, 0.03));
  }
  const random = seededRandom(41 + seed * 13);
  for (let i = 0; i < 6; i++) {
    const uniform = seed === 0 && i === 4;
    const coat = hangingCoat(kit, uniform ? UNIFORM : COAT, -1.0 + i * 0.4, (random() - 0.5) * 0.4);
    if (uniform) coat.add(mesh(new BoxGeometry(0.07, 0.08, 0.02), kit.toon(HAZARD), 0.08, -0.25, 0.14));
    group.add(coat);
  }
  return group;
}

/** Three tall lockers, slatted vents, one door left open a crack. */
export function lockers(kit: PropKit) {
  const group = new Group();
  const body = kit.toon(LOCKER);
  const dark = kit.toon(LOCKER_DARK);
  group.add(mesh(new BoxGeometry(2.4, 2.3, 0.55), dark, 0, 1.15, -0.03));
  for (let i = 0; i < 3; i++) {
    const door = new Group();
    door.position.set(-1.2 + i * 0.8, 0, 0.26);
    door.add(mesh(new BoxGeometry(0.76, 2.2, 0.04), body, 0.39, 1.12));
    for (let v = 0; v < 4; v++) door.add(mesh(new BoxGeometry(0.4, 0.03, 0.02), dark, 0.39, 1.95 - v * 0.08, 0.025));
    door.add(mesh(new BoxGeometry(0.04, 0.16, 0.04), kit.toon(NIGHT_LAB.steel), 0.68, 1.1, 0.03));
    if (i === 2) door.rotation.y = -0.35;
    group.add(door);
  }
  return group;
}

const CAMERA_W = 192;
const CAMERA_H = 128;

/** Walls running away to a vanishing point, the strips across the ceiling. */
function drawCorridor(g: CanvasRenderingContext2D) {
  for (const [x0, x1] of [
    [10, 80],
    [182, 112]
  ]) {
    g.moveTo(x0, 120);
    g.lineTo(x1, 64);
    g.moveTo(x0, 8);
    g.lineTo(x1, 44);
  }
  for (const y of [20, 32, 40]) {
    g.moveTo(96 - (44 - y) * 1.2, y);
    g.lineTo(96 + (44 - y) * 1.2, y);
  }
}

/** Four pods in a row; the third smashed open, empty. */
function drawPods(g: CanvasRenderingContext2D) {
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 44;
    g.rect(x, 30, 30, 70);
    if (i !== 2) {
      g.moveTo(x + 22, 50);
      g.arc(x + 15, 50, 7, 0, Math.PI * 2);
      continue;
    }
    g.moveTo(x + 4, 40);
    g.lineTo(x + 14, 55);
    g.lineTo(x + 8, 70);
    g.lineTo(x + 24, 82);
  }
}

/** Scan lines, the camera's label, the red recording dot. */
function drawOverlay(g: CanvasRenderingContext2D, label: string) {
  g.fillStyle = 'rgba(0,0,0,.25)';
  for (let y = 0; y < CAMERA_H; y += 4) g.fillRect(0, y, CAMERA_W, 2);
  g.fillStyle = '#9fe8c8';
  g.font = 'bold 14px monospace';
  g.fillText(label, 8, 18);
  g.fillStyle = '#ff5b4a';
  g.beginPath();
  g.arc(CAMERA_W - 14, 13, 5, 0, Math.PI * 2);
  g.fill();
}

/**
 * A camera feed, drawn once: a grainy green view with its label. One shows
 * the corridor, one the lab's pods, Danilo's among them, empty.
 */
function cameraFeed(view: 'corridor' | 'lab') {
  const canvas = document.createElement('canvas');
  canvas.width = CAMERA_W;
  canvas.height = CAMERA_H;
  const g = canvas.getContext('2d');
  if (g) {
    g.fillStyle = '#16302a';
    g.fillRect(0, 0, CAMERA_W, CAMERA_H);
    g.strokeStyle = '#9fe8c8';
    g.lineWidth = 2;
    g.beginPath();
    if (view === 'corridor') drawCorridor(g);
    else drawPods(g);
    g.stroke();
    drawOverlay(g, view === 'corridor' ? 'CAM 2' : 'CAM 1');
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The officer's desk: camera screens facing whoever stands in front, a keyboard, a mug, a log. */
export function securityDesk(kit: PropKit) {
  const group = new Group();
  const body = kit.toon(NIGHT_LAB.ceiling);
  group.add(mesh(new BoxGeometry(2.6, 0.08, 1), body, 0, 0.92));
  group.add(mesh(new BoxGeometry(2.5, 0.85, 0.9), kit.toon(LOCKER_DARK), 0, 0.44, -0.04));
  (['lab', 'corridor', 'corridor'] as const).forEach((view, i) => {
    const screen = new Group();
    screen.position.set(-0.85 + i * 0.85, 1.3, -0.25);
    screen.rotation.y = (1 - i) * 0.25;
    screen.add(mesh(new BoxGeometry(0.75, 0.52, 0.08), kit.toon(NIGHT_LAB.cable)));
    screen.add(mesh(new PlaneGeometry(0.66, 0.44), new MeshBasicMaterial({ map: cameraFeed(view) }), 0, 0, 0.045));
    screen.add(mesh(new BoxGeometry(0.08, 0.3, 0.08), kit.toon(NIGHT_LAB.steel), 0, -0.36, -0.02));
    group.add(screen);
  });
  group.add(mesh(new BoxGeometry(0.8, 0.03, 0.25), kit.toon(NIGHT_LAB.steel), 0, 0.975, 0.22));
  group.add(mesh(new CylinderGeometry(0.07, 0.06, 0.14, 8), kit.toon(NIGHT_LAB.paper), 0.9, 1.03, 0.25));
  group.add(mesh(new BoxGeometry(0.3, 0.02, 0.4), kit.toon(NIGHT_LAB.paper), -0.9, 0.97, 0.2));
  // A screen's glow on the desk top: the only light the officer reads by.
  group.add(
    noInk(
      mesh(
        new PlaneGeometry(2, 0.6),
        new MeshBasicMaterial({ color: SCREEN_GLOW, transparent: true, opacity: 0.08 }),
        0,
        0.965,
        0
      ).rotateX(-Math.PI / 2)
    )
  );
  return group;
}

/** A drone pictogram on a hazard plate: what the door answers to. */
function droneSign() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const g = canvas.getContext('2d');
  if (g) {
    g.fillStyle = '#d9a63a';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#0b0e1c';
    g.beginPath();
    g.ellipse(32, 38, 20, 12, 0, Math.PI, 0);
    g.fill();
    g.fillRect(10, 38, 44, 5);
    for (const x of [14, 24, 40, 50]) g.fillRect(x - 2, 43, 4, 8);
    g.fillStyle = '#d9a63a';
    g.beginPath();
    g.arc(32, 32, 3, 0, Math.PI * 2);
    g.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export interface ServiceDoorView {
  root: Group;
  open(): void;
  update(seconds: number): void;
}

const DOOR_SLIDE_SECONDS = 0.9;

/**
 * The storeroom's service door, in the doorway's own frame (+z out of the
 * storeroom): two halves that slide apart into the wall for the drones, a
 * hazard plate with a drone on it, a lamp that goes from red to green.
 */
export function serviceDoor(kit: PropKit, width: number): ServiceDoorView {
  const root = new Group();
  const frame = kit.toon(NIGHT_LAB.ceiling);
  const half = width / 2;
  for (const side of [-1, 1]) root.add(mesh(new BoxGeometry(0.25, 2.8, 0.3), frame, side * (half - 0.125), 1.4));
  root.add(mesh(new BoxGeometry(width, 0.4, 0.3), frame, 0, 3));
  const panels = [-1, 1].map((side) => {
    const panel = new Group();
    panel.position.x = (side * (half - 0.25)) / 2;
    panel.add(mesh(new BoxGeometry(half - 0.25, 2.75, 0.1), kit.toon(NIGHT_LAB.wall), 0, 1.375));
    // Hazard stripes along the meeting edge.
    for (let i = 0; i < 5; i++) {
      const stripe = mesh(
        new BoxGeometry(0.1, 0.35, 0.02),
        kit.toon(HAZARD),
        -side * ((half - 0.25) / 2 - 0.08),
        0.4 + i * 0.5,
        0.06
      );
      stripe.rotation.z = 0.5 * side;
      panel.add(stripe);
    }
    root.add(panel);
    return { panel, side, shut: panel.position.x };
  });
  const sign = mesh(new PlaneGeometry(0.4, 0.4), new MeshBasicMaterial({ map: droneSign() }), 0.55, 1.7, 0.07);
  panels[1].panel.add(sign);
  sign.position.x -= panels[1].shut;
  const lamp = new MeshBasicMaterial({ color: NIGHT_LAB.alert });
  root.add(mesh(new BoxGeometry(0.3, 0.1, 0.06), lamp, 0, 2.95, 0.17));
  let openedAt = -1;
  let now = 0;
  const slide = (t: number) => {
    for (const { panel, side, shut } of panels) panel.position.x = shut + side * (half - 0.25) * t;
  };
  return {
    root,
    open() {
      if (openedAt >= 0) return;
      openedAt = now;
      lamp.color.setHex(NIGHT_LAB.fluid);
      if (kit.reducedMotion) slide(1);
    },
    update(seconds) {
      now = seconds;
      if (openedAt < 0 || kit.reducedMotion) return;
      const t = Math.min(1, (seconds - openedAt) / DOOR_SLIDE_SECONDS);
      slide(t * t * (3 - 2 * t));
    }
  };
}

/** A chunky alien stun blaster: a bulb of an emitter ringed with coils, a fat grip. */
function blaster(kit: PropKit) {
  const group = new Group();
  const body = kit.toon(BLASTER);
  const coil = new MeshBasicMaterial({ color: NIGHT_LAB.fluid });
  group.add(mesh(new BoxGeometry(0.75, 0.2, 0.18), body, 0, 0));
  group.add(mesh(new BoxGeometry(0.16, 0.3, 0.14), body, -0.18, -0.2).rotateZ(0.25));
  const emitter = mesh(new SphereGeometry(0.14, 10, 8), kit.toon(NIGHT_LAB.steel), 0.42, 0.02);
  emitter.scale.x = 1.3;
  group.add(emitter);
  for (const x of [0.12, 0.24, 0.36])
    group.add(mesh(new TorusGeometry(0.11, 0.025, 5, 12), coil, x, 0).rotateY(Math.PI / 2));
  group.add(mesh(new CylinderGeometry(0.03, 0.03, 0.3, 6), kit.toon(NIGHT_LAB.ink), 0.62, 0.02).rotateZ(Math.PI / 2));
  if (!kit.reducedMotion) kit.animate((t) => coil.color.setHex(Math.sin(t * 2.2) > 0 ? NIGHT_LAB.fluid : 0x3f8f7f));
  return group;
}

/**
 * The armoury cage, set into the wall (+z out into the room, built into a
 * recess `depth` deep): the blaster on its pegs behind bars, a keypad lock
 * glowing red. Close enough to see, not to touch.
 */
export function armouryCage(kit: PropKit, width: number, height: number, depth: number) {
  const group = new Group();
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new BoxGeometry(width, height, 0.06), kit.toon(LOCKER_DARK), 0, height / 2, -depth + 0.03));
  const gun = blaster(kit);
  gun.position.set(0, 1.35, -depth + 0.25);
  gun.rotation.set(0, 0, 0.08);
  for (const x of [-0.25, 0.25])
    group.add(mesh(new CylinderGeometry(0.025, 0.025, 0.2, 5), steel, x, 1.22, -depth + 0.13).rotateX(Math.PI / 2));
  group.add(gun);
  // Bars across the front, a frame round them.
  const bars = Math.round(width / 0.22);
  for (let i = 1; i < bars; i++) {
    group.add(
      mesh(new CylinderGeometry(0.022, 0.022, height, 5), steel, -width / 2 + (i * width) / bars, height / 2, -0.04)
    );
  }
  for (const y of [0.04, height - 0.04, height / 2])
    group.add(mesh(new BoxGeometry(width, 0.07, 0.07), steel, 0, y, -0.04));
  const lock = new Group();
  lock.position.set(width / 2 - 0.3, 1.2, 0.02);
  lock.add(mesh(new BoxGeometry(0.22, 0.32, 0.06), kit.toon(NIGHT_LAB.cable)));
  lock.add(mesh(new BoxGeometry(0.1, 0.05, 0.02), new MeshBasicMaterial({ color: NIGHT_LAB.alert }), 0, 0.1, 0.035));
  group.add(lock);
  return group;
}
