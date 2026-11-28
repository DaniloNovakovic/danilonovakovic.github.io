import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry
} from 'three';
import { lumpyGeometry, mesh, type PropKit } from './labProps';
import { NIGHT_LAB, seededRandom } from './toon';

/**
 * The laundry's working pieces (#145), and the notices the crew pin up round
 * the deck. Every builder turns its front to +z, length along x, standing on
 * y = 0.
 */
const APPLIANCE = 0xc9cde0;
const APPLIANCE_DARK = 0x3a4466;
/** Washed-out sheet colours: white, lilac, the pale green of hospital linen. */
const LINEN = [0xe4e2ee, 0xc9bde6, 0xb8e0d2];
const CANVAS_BAG = 0xb9a98a;
const CORK = 0xa8784e;

/** A dryer's round door, in a front at `y`. */
function dryerDoor(kit: PropKit, y: number) {
  const door = new Group();
  door.position.set(0, y, 0.48);
  door.add(mesh(new TorusGeometry(0.3, 0.045, 6, 18), kit.toon(NIGHT_LAB.steel)));
  door.add(mesh(new CircleGeometry(0.28, 16), kit.toon(0x1d2340), 0, 0, -0.01));
  return door;
}

/** Two dryers stacked, a sock caught in the top one's door. Tall enough to hide behind. */
export function dryerStack(kit: PropKit) {
  const group = new Group();
  const white = kit.toon(APPLIANCE);
  const dark = kit.toon(APPLIANCE_DARK);
  for (const y of [0, 1.08]) {
    group.add(mesh(new BoxGeometry(1, 1.05, 0.95), white, 0, y + 0.525));
    // The control strip sits proud of the front, below the top, so nothing shares a face.
    group.add(mesh(new BoxGeometry(0.9, 0.12, 0.06), dark, 0, y + 0.9, 0.49));
    group.add(dryerDoor(kit, y + 0.45));
  }
  const sock = mesh(new BoxGeometry(0.08, 0.22, 0.04), kit.toon(NIGHT_LAB.alert), 0.22, 1.38, 0.52);
  sock.rotation.z = -0.4;
  group.add(sock);
  return group;
}

/** A steel folding table under the light: stacks of folded towels, a basket. */
export function foldingTable(kit: PropKit) {
  const group = new Group();
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new BoxGeometry(2.2, 0.06, 0.9), kit.toon(NIGHT_LAB.ceiling), 0, 0.87));
  for (const x of [-1, 1])
    for (const z of [-0.38, 0.38]) group.add(mesh(new BoxGeometry(0.05, 0.84, 0.05), steel, x, 0.42, z));
  group.add(mesh(new BoxGeometry(2, 0.04, 0.7), steel, 0, 0.2));
  const random = seededRandom(7);
  for (let stack = 0; stack < 3; stack++) {
    const height = 2 + Math.floor(random() * 3);
    for (let i = 0; i < height; i++) {
      const towel = mesh(
        new BoxGeometry(0.42, 0.07, 0.32),
        kit.toon(LINEN[(stack + i) % LINEN.length]),
        -0.85 + stack * 0.5,
        0.935 + i * 0.07,
        -0.15
      );
      towel.rotation.y = (random() - 0.5) * 0.15;
      group.add(towel);
    }
  }
  // A basket of what's still to fold, on the shelf underneath.
  group.add(mesh(new BoxGeometry(0.6, 0.3, 0.45), kit.toon(CANVAS_BAG), 0.6, 0.37));
  group.add(mesh(lumpyGeometry(0.22, 0.3, 3, 3), kit.toon(LINEN[1]), 0.6, 0.55));
  return group;
}

/** A wheeled laundry cart, a canvas bag in a steel frame, heaped over the top. */
export function hamper(kit: PropKit) {
  const group = new Group();
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new BoxGeometry(0.86, 0.6, 0.66), kit.toon(CANVAS_BAG), 0, 0.48));
  group.add(mesh(new BoxGeometry(0.9, 0.04, 0.7), steel, 0, 0.8));
  for (const x of [-0.4, 0.4]) {
    for (const z of [-0.3, 0.3]) {
      group.add(mesh(new BoxGeometry(0.04, 0.6, 0.04), steel, x, 0.45, z));
      group.add(mesh(new SphereGeometry(0.06, 6, 4), kit.toon(NIGHT_LAB.ink), x, 0.07, z));
    }
  }
  const random = seededRandom(23);
  for (let i = 0; i < 4; i++) {
    group.add(
      mesh(
        lumpyGeometry(0.2, 0.35, i, 3),
        kit.toon(LINEN[i % LINEN.length]),
        -0.25 + i * 0.17,
        0.82 + random() * 0.08,
        (random() - 0.5) * 0.3
      )
    );
  }
  return group;
}

/** A sheet hanging off the line at `x`: a little wavy, bottom hem clear of the floor. */
function sheet(kit: PropKit, x: number, colour: number, seed: number) {
  const geometry = new PlaneGeometry(1.1, 1.7, 6, 1);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) position.setZ(i, Math.sin(position.getX(i) * 6 + seed) * 0.04);
  geometry.computeVertexNormals();
  return mesh(geometry, kit.toon(colour, { side: DoubleSide }), x, 1.4);
}

/**
 * A washing line out from the wall (at -x) to a post (at +x), sheets drying
 * on it, shoulder to shoulder: a screen nobody sees through. Sways a little in
 * the vents' draught, unless motion is reduced.
 */
export function linenLine(kit: PropKit, nth: number) {
  const group = new Group();
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new CylinderGeometry(0.012, 0.012, 3.6, 4), steel, 0, 2.27).rotateZ(Math.PI / 2));
  group.add(mesh(new BoxGeometry(0.06, 0.1, 0.06), steel, -1.78, 2.27));
  group.add(mesh(new BoxGeometry(0.06, 2.3, 0.06), steel, 1.75, 1.15));
  group.add(mesh(new BoxGeometry(0.4, 0.04, 0.3), steel, 1.75, 0.02));
  const sheets = new Group();
  for (let i = 0; i < 3; i++) sheets.add(sheet(kit, -1.15 + i * 1.12, LINEN[(i + nth) % LINEN.length], i + nth * 3));
  for (let i = 0; i < 4; i++)
    sheets.add(mesh(new BoxGeometry(0.03, 0.08, 0.05), kit.toon(NIGHT_LAB.crate), -1.7 + i * 1.12, 2.25));
  group.add(sheets);
  if (!kit.reducedMotion) kit.animate((t) => (sheets.rotation.x = Math.sin(t * 0.9 + nth) * 0.025));
  return group;
}

const BOARD_W = 256;
const BOARD_H = 160;

/** Lines of alien writing: little hooked glyphs, in rows. */
function glyphs(g: CanvasRenderingContext2D, x: number, y: number, width: number, rows: number, random: () => number) {
  g.strokeStyle = '#2a2f4a';
  g.lineWidth = 1.5;
  for (let row = 0; row < rows; row++) {
    let at = x;
    while (at < x + width - 6) {
      const w = 3 + random() * 5;
      g.beginPath();
      g.moveTo(at, y + row * 9 + 6);
      g.quadraticCurveTo(at + w / 2, y + row * 9 - random() * 4, at + w, y + row * 9 + 6 - random() * 6);
      g.stroke();
      at += w + 2 + (random() < 0.2 ? 5 : 0);
    }
  }
}

/** A sheet of paper pinned at (x, y), tilted a touch. */
function pinned(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tilt: number, fill: string) {
  g.save();
  g.translate(x + w / 2, y + h / 2);
  g.rotate(tilt);
  g.fillStyle = fill;
  g.fillRect(-w / 2, -h / 2, w, h);
  g.fillStyle = '#ff5b4a';
  g.beginPath();
  g.arc(0, -h / 2 + 4, 3, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** An ant-headed mascot, the kind every workplace has: big eyes, feelers, a thumbs-up. */
function mascot(g: CanvasRenderingContext2D, x: number, y: number) {
  g.fillStyle = '#ff9fbf';
  g.beginPath();
  g.ellipse(x, y, 14, 17, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0b0e1c';
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(x + side * 6, y - 3, 4, 6, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = '#0b0e1c';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - 5, y - 16);
  g.quadraticCurveTo(x - 12, y - 30, x - 18, y - 26);
  g.moveTo(x + 5, y - 16);
  g.quadraticCurveTo(x + 12, y - 30, x + 18, y - 26);
  g.stroke();
}

/**
 * What's pinned on each board: the laundry's rota and a "wash cold" poster;
 * the break room's menu and the mascot; security's shift list and a map of
 * the deck with one room circled.
 */
function drawBoard(g: CanvasRenderingContext2D, nth: number) {
  const random = seededRandom(101 + nth * 17);
  g.fillStyle = '#a8784e';
  g.fillRect(0, 0, BOARD_W, BOARD_H);
  g.strokeStyle = '#5a3a24';
  g.lineWidth = 8;
  g.strokeRect(4, 4, BOARD_W - 8, BOARD_H - 8);
  // A rota: a grid with ticks in it.
  pinned(g, 18, 18, 100, 120, -0.03, '#f4efe2');
  g.strokeStyle = '#2a2f4a';
  g.lineWidth = 1;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 4; col++) {
      g.strokeRect(26 + col * 22, 40 + row * 13, 22, 13);
      if (random() < 0.4) g.fillRect(31 + col * 22, 44 + row * 13, 10, 5);
    }
  }
  glyphs(g, 26, 24, 80, 1, random);
  // A poster: the mascot, and writing.
  pinned(g, 136, 22, 96, 70, 0.05, nth === 2 ? '#c9cde0' : '#7fe0c8');
  if (nth === 2) {
    // The deck from above, one room circled in red.
    g.strokeStyle = '#2a2f4a';
    g.lineWidth = 2;
    g.strokeRect(150, 34, 66, 48);
    g.beginPath();
    g.moveTo(183, 34);
    g.lineTo(183, 82);
    g.stroke();
    g.strokeStyle = '#ff5b4a';
    g.beginPath();
    g.arc(200, 48, 9, 0, Math.PI * 2);
    g.stroke();
  } else {
    mascot(g, 184, 62);
  }
  pinned(g, 140, 104, 80, 38, -0.06, '#ffd36e');
  glyphs(g, 148, 112, 64, 3, random);
}

/** A cork board on the wall, notices pinned on it: one of three, by `nth`. */
export function noticeBoard(kit: PropKit, nth: number) {
  const canvas = document.createElement('canvas');
  canvas.width = BOARD_W;
  canvas.height = BOARD_H;
  const g = canvas.getContext('2d');
  if (g) drawBoard(g, nth);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const group = new Group();
  group.add(mesh(new BoxGeometry(1.4, 0.88, 0.04), kit.toon(CORK), 0, 1.65, -0.03));
  group.add(mesh(new PlaneGeometry(1.4, 0.88), kit.toon(0xffffff, { map: texture }), 0, 1.65, 0.02));
  return group;
}
