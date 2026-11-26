import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type Material,
  type Object3D
} from 'three';
import type { LabScreen } from './labScreens';
import { NIGHT_LAB, seededRandom, type Toon } from './toon';

/** What every prop builder gets: materials, and a place to register per-frame motion. */
export interface PropKit {
  toon: Toon;
  /** Called every unpaused frame with the time in seconds. */
  animate(update: (seconds: number) => void): void;
  reducedMotion: boolean;
}

export function mesh(geometry: ConstructorParameters<typeof Mesh>[0], material: Material, x = 0, y = 0, z = 0) {
  const result = new Mesh(geometry, material);
  result.position.set(x, y, z);
  return result;
}

/** See-through glass: no depth and no ink, so whatever is inside gets the outlines. */
function glass(color: number, opacity = 0.28) {
  return new MeshToonMaterial({ color, transparent: true, opacity, depthWrite: false, side: DoubleSide });
}

function noInk<T extends Object3D>(object: T): T {
  object.userData.noInk = true;
  return object;
}

/** A lumpy ball (a brain, a crumpled page). Offsets depend only on position, so shared corners stay joined. */
export function lumpyGeometry(radius: number, roughness: number, detail = 1, seed = 0) {
  const geometry = new IcosahedronGeometry(radius, detail);
  const position = geometry.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const wobble = Math.sin(v.x * 41 + seed) * Math.sin(v.y * 37 + seed * 2) * Math.sin(v.z * 29 + seed * 3);
    v.multiplyScalar(1 + wobble * roughness);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function cable(kit: PropKit, points: Array<[number, number, number]>, radius = 0.06) {
  const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
  return new Mesh(new TubeGeometry(curve, 24, radius, 5), kit.toon(NIGHT_LAB.cable));
}

function podFrame(kit: PropKit) {
  const group = new Group();
  group.add(mesh(new CylinderGeometry(0.95, 1.1, 0.4, 12), kit.toon(NIGHT_LAB.wall), 0, 0.2));
  group.add(mesh(new CylinderGeometry(1.0, 0.9, 0.3, 12), kit.toon(NIGHT_LAB.wall), 0, 2.85));
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
    group.add(
      mesh(
        new CylinderGeometry(0.05, 0.05, 2.4, 5),
        kit.toon(NIGHT_LAB.steel),
        Math.cos(angle) * 0.92,
        1.6,
        Math.sin(angle) * 0.92
      )
    );
  }
  return group;
}

/** Someone asleep in the fluid, a reading helmet on their head. */
function sleeper(kit: PropKit, seed: number) {
  const random = seededRandom(seed);
  const skin = kit.toon(NIGHT_LAB.skin);
  const person = new Group();
  person.add(mesh(new CapsuleGeometry(0.25, 0.75, 4, 8), skin, 0, 1.4));
  for (const side of [-1, 1]) {
    const arm = mesh(new CapsuleGeometry(0.075, 0.6, 3, 6), skin, side * 0.34, 1.38);
    arm.rotation.z = side * (0.12 + random() * 0.15);
    const leg = mesh(new CapsuleGeometry(0.1, 0.62, 3, 6), skin, side * 0.12, 0.78);
    person.add(arm, leg);
  }
  const head = new Group();
  head.position.set(0, 2.08, 0);
  head.rotation.set(0.25 + random() * 0.2, 0, (random() - 0.5) * 0.4);
  head.add(mesh(new SphereGeometry(0.21, 10, 8), skin));
  for (const side of [-1, 1])
    head.add(mesh(new BoxGeometry(0.08, 0.015, 0.01), kit.toon(NIGHT_LAB.ink), side * 0.08, 0, 0.205));
  head.add(mesh(new SphereGeometry(0.24, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), kit.toon(NIGHT_LAB.steel), 0, 0.03));
  const lamp = mesh(new SphereGeometry(0.05, 6, 4), new MeshBasicMaterial({ color: NIGHT_LAB.fluid }), 0, 0.28);
  head.add(lamp);
  person.add(head);
  // Wires from the helmet up into the pod's cap.
  person.add(
    cable(
      kit,
      [
        [0, 2.3, 0],
        [0.15, 2.55, 0.05],
        [0.3, 2.72, 0]
      ],
      0.03
    )
  );
  person.add(
    cable(
      kit,
      [
        [0, 2.3, 0],
        [-0.2, 2.5, -0.1],
        [-0.35, 2.72, -0.1]
      ],
      0.03
    )
  );
  const phase = random() * 6;
  if (!kit.reducedMotion) {
    kit.animate((t) => {
      person.position.y = Math.sin(t * 0.6 + phase) * 0.04;
      lamp.visible = Math.sin(t * 1.3 + phase) > -0.6;
    });
  }
  return person;
}

function bubbles(kit: PropKit, seed: number) {
  const group = noInk(new Group());
  const random = seededRandom(seed);
  const material = new MeshBasicMaterial({ color: NIGHT_LAB.glass, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 4; i++) {
    const bubble = noInk(
      mesh(
        new SphereGeometry(0.04 + random() * 0.03, 6, 4),
        material,
        (random() - 0.5) * 1.1,
        0,
        (random() - 0.5) * 1.1
      )
    );
    const phase = random();
    bubble.position.y = 0.5 + phase * 2.2;
    if (!kit.reducedMotion) kit.animate((t) => (bubble.position.y = 0.5 + ((t * 0.35 + phase) % 1) * 2.2));
    group.add(bubble);
  }
  return group;
}

/** A pod with someone still plugged in: what Danilo looked like a minute ago. */
export function sleeperPod(kit: PropKit, seed: number) {
  const group = podFrame(kit);
  group.add(sleeper(kit, seed));
  const fluid = noInk(mesh(new CylinderGeometry(0.88, 0.88, 2.4, 14, 1, true), glass(NIGHT_LAB.fluid, 0.3), 0, 1.6));
  group.add(fluid, bubbles(kit, seed + 1));
  // The pod glows from inside.
  const glow = new PointLight(NIGHT_LAB.fluid, 2.2, 4.5, 1);
  glow.position.set(0, 1.6, 1.2);
  group.add(glow);
  return group;
}

/** Danilo's pod: smashed open from the inside, glass everywhere, the plug hanging loose. */
export function shatteredPod(kit: PropKit) {
  const random = seededRandom(7);
  const group = podFrame(kit);
  const shardMaterial = kit.toon(NIGHT_LAB.glass, { transparent: true, opacity: 0.75 });
  // Jagged teeth left around the base and hanging from the cap.
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const height = 0.25 + random() * (Math.abs(Math.sin(angle)) > 0.6 ? 0.9 : 0.4);
    const tooth = mesh(
      new ConeGeometry(0.16, height, 3),
      shardMaterial,
      Math.cos(angle) * 0.86,
      0.4 + height / 2,
      Math.sin(angle) * 0.86
    );
    tooth.scale.set(1, 1, 0.25);
    tooth.rotation.set((random() - 0.5) * 0.3, -angle, (random() - 0.5) * 0.4);
    const hanging = mesh(
      new ConeGeometry(0.14, 0.2 + random() * 0.5, 3),
      shardMaterial,
      Math.cos(angle) * 0.86,
      2.55,
      Math.sin(angle) * 0.86
    );
    hanging.scale.set(1, -1, 0.25);
    hanging.rotation.y = -angle;
    group.add(tooth, hanging);
  }
  // Glass across the floor, mostly where Danilo burst out (south, +z).
  const glint = new MeshBasicMaterial({ color: 0xdfe8ff });
  for (let i = 0; i < 22; i++) {
    const angle = Math.PI / 2 + (random() - 0.5) * 2.6;
    const distance = 1.2 + random() * 2.4;
    const piece = mesh(
      new CircleGeometry(0.06 + random() * 0.12, 3),
      glint,
      Math.cos(angle) * distance,
      0.015,
      Math.sin(angle) * distance
    );
    piece.rotation.set(-Math.PI / 2, 0, random() * Math.PI);
    group.add(piece);
  }
  const puddle = mesh(new CircleGeometry(1.4, 14), kit.toon(0x3f8f86), 0.3, 0.01, 1.3);
  puddle.rotation.x = -Math.PI / 2;
  puddle.scale.set(1.4, 1, 1);
  group.add(puddle);
  // The plug that ran the portfolio, torn out.
  group.add(
    cable(
      kit,
      [
        [0.3, 2.72, 0.3],
        [0.7, 2.0, 0.8],
        [0.9, 1.1, 1.2],
        [1.2, 0.08, 1.9],
        [1.9, 0.06, 2.2]
      ],
      0.05
    )
  );
  group.add(mesh(new SphereGeometry(0.12, 7, 5), new MeshBasicMaterial({ color: NIGHT_LAB.strip }), 1.95, 0.1, 2.25));
  return group;
}

function sketchTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const g = canvas.getContext('2d');
  if (g) {
    g.fillStyle = '#f4efe2';
    g.fillRect(0, 0, 128, 160);
    g.strokeStyle = '#1a1a1a';
    g.lineWidth = 3;
    g.lineCap = 'round';
    // A stick figure swinging a hammer at the page: how Danilo got out.
    g.beginPath();
    g.arc(52, 48, 12, 0, Math.PI * 2);
    g.moveTo(52, 60);
    g.lineTo(52, 100);
    g.lineTo(38, 130);
    g.moveTo(52, 100);
    g.lineTo(66, 130);
    g.moveTo(52, 72);
    g.lineTo(80, 58);
    g.moveTo(80, 58);
    g.lineTo(92, 28);
    g.stroke();
    g.fillStyle = '#1a1a1a';
    g.fillRect(82, 18, 22, 12);
    g.lineWidth = 1.5;
    for (const [x2, y2] of [
      [120, 10],
      [126, 60],
      [100, 90]
    ] as const) {
      g.beginPath();
      g.moveTo(104, 26);
      g.lineTo(x2, y2);
      g.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A sketchbook page: proof the drawn world was real enough to leak out. */
function sketchPage(kit: PropKit, x: number, y: number, z: number, turn: number) {
  const page = mesh(new PlaneGeometry(0.5, 0.62), kit.toon(0xffffff, { map: sketchTexture() }), x, y, z);
  page.rotation.set(-Math.PI / 2, 0, turn);
  return page;
}

/** A slab with straps, a mind-reading crown and a surgical lamp: where the research happens. */
export function operatingTable(kit: PropKit) {
  const group = new Group();
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new CylinderGeometry(0.25, 0.45, 0.9, 8), steel, 0, 0.45));
  group.add(mesh(new BoxGeometry(2.5, 0.14, 1.05), kit.toon(0xaab3cc), 0, 0.98));
  for (const sx of [-0.8, 0.1, 0.75])
    group.add(mesh(new BoxGeometry(0.14, 0.04, 1.1), kit.toon(NIGHT_LAB.cable), sx, 1.06));
  // The crown: a steel cap with prongs, where a head would go.
  const crown = new Group();
  crown.position.set(1.0, 1.06, 0);
  crown.add(mesh(new SphereGeometry(0.26, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), steel));
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const prong = mesh(
      new ConeGeometry(0.035, 0.22, 4),
      kit.toon(NIGHT_LAB.alert),
      Math.cos(angle) * 0.18,
      0.22,
      Math.sin(angle) * 0.18
    );
    prong.rotation.set(Math.sin(angle) * 0.6, 0, -Math.cos(angle) * 0.6);
    crown.add(prong);
  }
  group.add(crown);
  // Overhead lamp, hanging from the ceiling.
  group.add(mesh(new CylinderGeometry(0.04, 0.04, 0.8, 5), steel, 0, 2.85));
  group.add(mesh(new CylinderGeometry(0.35, 0.6, 0.3, 10), steel, 0, 2.35));
  const glow = mesh(new CircleGeometry(0.5, 12), new MeshBasicMaterial({ color: 0xfff1c9 }), 0, 2.19);
  glow.rotation.x = Math.PI / 2;
  group.add(glow);
  const light = new PointLight(0xfff1c9, 3, 6, 1);
  light.position.set(0, 2.0, 0);
  group.add(light);
  // A drain under the slab. Someone hosed this floor.
  const drain = mesh(new CircleGeometry(0.32, 12), kit.toon(NIGHT_LAB.cable), 0, 0.012, 0);
  drain.rotation.x = -Math.PI / 2;
  group.add(drain);
  for (const dx of [-0.16, 0, 0.16]) group.add(mesh(new BoxGeometry(0.03, 0.01, 0.46), steel, dx, 0.02, 0));
  return group;
}

/** A steel cart of instruments, parked by the table. */
export function instrumentCart(kit: PropKit) {
  const group = new Group();
  const steel = kit.toon(NIGHT_LAB.steel);
  for (const y of [0.35, 1.0]) group.add(mesh(new BoxGeometry(0.8, 0.04, 0.5), steel, 0, y));
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ]) {
    group.add(mesh(new CylinderGeometry(0.02, 0.02, 0.95, 4), steel, sx * 0.37, 0.53, sz * 0.22));
    group.add(mesh(new SphereGeometry(0.05, 6, 4), kit.toon(NIGHT_LAB.cable), sx * 0.37, 0.05, sz * 0.22));
  }
  const probe = mesh(new ConeGeometry(0.04, 0.3, 5), kit.toon(NIGHT_LAB.alert), -0.2, 1.05, 0);
  probe.rotation.z = Math.PI / 2;
  const needle = mesh(new CylinderGeometry(0.015, 0.015, 0.35, 4), steel, 0.05, 1.04, 0.08);
  needle.rotation.z = Math.PI / 2;
  const saw = mesh(new CylinderGeometry(0.12, 0.12, 0.02, 12), steel, 0.25, 1.03, -0.08);
  group.add(probe, needle, saw);
  // A bowl on the lower shelf, the colour of what was in it.
  group.add(mesh(new CylinderGeometry(0.16, 0.1, 0.1, 10), steel, 0.1, 0.42, 0));
  group.add(mesh(new CylinderGeometry(0.13, 0.13, 0.02, 10), kit.toon(NIGHT_LAB.brain), 0.1, 0.46, 0));
  return group;
}

function jar(kit: PropKit, seed: number) {
  const random = seededRandom(seed);
  const group = new Group();
  group.add(noInk(mesh(new CylinderGeometry(0.2, 0.2, 0.46, 12, 1, true), glass(NIGHT_LAB.fluid, 0.35), 0, 0.23)));
  group.add(mesh(new CylinderGeometry(0.21, 0.21, 0.06, 12), kit.toon(NIGHT_LAB.steel), 0, 0.48));
  group.add(mesh(new CylinderGeometry(0.21, 0.21, 0.04, 12), kit.toon(NIGHT_LAB.steel), 0, 0.02));
  let specimen: Object3D;
  if (random() < 0.25) {
    // An eye, watching.
    specimen = new Group();
    specimen.add(mesh(new SphereGeometry(0.11, 10, 8), kit.toon(0xffffff)));
    specimen.add(mesh(new SphereGeometry(0.05, 8, 6), kit.toon(NIGHT_LAB.crate), 0, 0, 0.08));
    specimen.add(mesh(new SphereGeometry(0.025, 6, 4), kit.toon(NIGHT_LAB.ink), 0, 0, 0.12));
  } else {
    specimen = mesh(lumpyGeometry(0.13, 0.12, 1, seed), kit.toon(NIGHT_LAB.brain));
    specimen.scale.set(1.15, 0.85, 1.3);
  }
  specimen.position.y = 0.24;
  specimen.rotation.y = random() * Math.PI * 2;
  group.add(specimen);
  const phase = random() * 6;
  if (!kit.reducedMotion) {
    kit.animate((t) => {
      specimen.position.y = 0.24 + Math.sin(t * 0.8 + phase) * 0.02;
      specimen.rotation.y += 0.002;
    });
  }
  return group;
}

/** Shelves of specimens against the wall: brains, mostly. One jar keeps an eye on you. */
export function jarShelf(kit: PropKit, seed: number) {
  const group = new Group();
  const frame = kit.toon(NIGHT_LAB.steel);
  for (const side of [-1, 1]) group.add(mesh(new BoxGeometry(0.08, 2.3, 0.7), frame, side * 1.05, 1.15, 0));
  const levels = [0.55, 1.3, 2.05];
  for (const y of levels) group.add(mesh(new BoxGeometry(2.2, 0.06, 0.7), frame, 0, y, 0));
  levels.forEach((y, row) => {
    for (let i = 0; i < 3; i++) {
      const specimen = jar(kit, seed * 10 + row * 3 + i);
      specimen.position.set(-0.65 + i * 0.65, y + 0.03, 0);
      group.add(specimen);
    }
  });
  return group;
}

/** A storeroom rack: boxes, canisters, folded spare coats. `seed` varies what's on it. */
export function supplyShelf(kit: PropKit, seed: number) {
  const group = new Group();
  const frame = kit.toon(NIGHT_LAB.steel);
  for (const side of [-1, 1]) group.add(mesh(new BoxGeometry(0.08, 2.3, 0.7), frame, side * 1.15, 1.15, 0));
  const levels = [0.15, 0.85, 1.55, 2.2];
  for (const y of levels) group.add(mesh(new BoxGeometry(2.3, 0.06, 0.7), frame, 0, y, 0));
  const random = seededRandom(31 + seed * 7);
  levels.slice(0, 3).forEach((y) => {
    let x = -1;
    while (x < 0.85) {
      const roll = random();
      const size = 0.3 + random() * 0.25;
      if (roll < 0.45) {
        const box = mesh(
          new BoxGeometry(size, size * 0.8, 0.5),
          kit.toon(roll < 0.2 ? NIGHT_LAB.crate : NIGHT_LAB.paper)
        );
        box.position.set(x + size / 2, y + 0.03 + size * 0.4, 0);
        box.rotation.y = (random() - 0.5) * 0.3;
        group.add(box);
      } else if (roll < 0.8) {
        // Canisters of the pods' glowing fluid.
        const can = mesh(new CylinderGeometry(size * 0.35, size * 0.35, size * 1.1, 8), kit.toon(NIGHT_LAB.fluid));
        can.position.set(x + size / 2, y + 0.03 + size * 0.55, 0);
        group.add(
          can,
          mesh(new CylinderGeometry(size * 0.36, size * 0.36, 0.05, 8), frame, x + size / 2, y + size * 1.1 + 0.05, 0)
        );
      } else {
        // Spare lab coats, folded: the researchers' size, not a person's.
        const coat = mesh(new BoxGeometry(size * 1.3, 0.12, 0.45), kit.toon(0xe4e2ee));
        coat.position.set(x + size * 0.65, y + 0.09, 0);
        group.add(coat);
      }
      x += size * 1.3 + 0.08;
    }
  });
  return group;
}

export function crateStack(kit: PropKit, turn: number) {
  const group = new Group();
  const crate = mesh(new BoxGeometry(1.3, 1.3, 1.3), kit.toon(NIGHT_LAB.crate), 0, 0.65);
  crate.rotation.y = turn;
  const top = mesh(new BoxGeometry(0.9, 0.9, 0.9), kit.toon(NIGHT_LAB.crate), -0.1, 1.75, 0.1);
  top.rotation.y = -turn;
  group.add(crate, top);
  return group;
}

export function ventGrate(kit: PropKit) {
  const group = new Group();
  group.add(mesh(new BoxGeometry(1.8, 1.1, 0.12), kit.toon(NIGHT_LAB.ceiling)));
  for (let i = -2; i <= 2; i++) {
    const slat = mesh(new BoxGeometry(1.5, 0.08, 0.1), kit.toon(NIGHT_LAB.wall), 0, i * 0.18, 0.06);
    slat.rotation.x = -0.5;
    group.add(slat);
  }
  group.position.y = 0.75;
  return group;
}

export function lockedDoor(kit: PropKit) {
  const group = new Group();
  group.add(mesh(new BoxGeometry(2.6, 2.7, 0.15), kit.toon(NIGHT_LAB.ceiling)));
  for (const side of [-1, 1])
    group.add(mesh(new BoxGeometry(1.1, 2.5, 0.1), kit.toon(NIGHT_LAB.wall), side * 0.56, -0.1, 0.08));
  const lampMaterial = new MeshBasicMaterial({ color: NIGHT_LAB.alert });
  group.add(mesh(new BoxGeometry(0.3, 0.12, 0.08), lampMaterial, 0, 1.5, 0.1));
  const light = new PointLight(NIGHT_LAB.alert, 3, 6, 1);
  light.position.set(0, 1.2, 0.8);
  group.add(light);
  if (!kit.reducedMotion) {
    // A slow red breath, never a flash.
    kit.animate((t) => (light.intensity = 2 + Math.sin(t * 1.6) * 1.2));
  }
  group.position.y = 1.35;
  return group;
}

/** A wall monitor; the picture comes from `labScreens`. */
export function monitor(kit: PropKit, screen: LabScreen) {
  const group = new Group();
  group.add(mesh(new BoxGeometry(2.7, 1.7, 0.2), kit.toon(NIGHT_LAB.cable)));
  group.add(mesh(new PlaneGeometry(2.45, 1.5), new MeshBasicMaterial({ map: screen.texture }), 0, 0, 0.11));
  group.add(
    cable(
      kit,
      [
        [-1.0, -0.85, 0.05],
        [-1.05, -1.0, 0.25],
        [-1.0, -1.1, 0.5]
      ],
      0.05
    )
  );
  kit.animate((t) => screen.tick(t));
  group.position.y = 2.05;
  return group;
}

/**
 * The researcher's desk, under the monitors: a keypad, a cold drink, and the
 * sketchbook page from Danilo's world under a lamp, being studied. Front to
 * +z, length along x; the old-world monitor is above +x.
 */
export function watchDesk(kit: PropKit) {
  const group = new Group();
  const body = kit.toon(NIGHT_LAB.ceiling);
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new BoxGeometry(5, 0.08, 1.3), kit.toon(NIGHT_LAB.wall), 0, 0.91));
  for (const sx of [-2.1, 2.1]) group.add(mesh(new BoxGeometry(0.7, 0.87, 1.2), body, sx, 0.435));
  group.add(mesh(new BoxGeometry(3.5, 0.6, 0.06), body, 0, 0.55, -0.55));
  // The keypad: too many keys, in a layout nobody human would pick.
  const keys = new MeshBasicMaterial({ color: NIGHT_LAB.fluid });
  group.add(mesh(new BoxGeometry(1.1, 0.05, 0.42), kit.toon(NIGHT_LAB.cable), -1.2, 0.975, 0.15));
  for (let i = 0; i < 14; i++)
    group.add(
      mesh(new BoxGeometry(0.09, 0.02, 0.07), keys, -1.65 + (i % 7) * 0.15, 1.01, 0.05 + Math.floor(i / 7) * 0.17)
    );
  // The page, flattened under a weight, a lamp bent over it.
  group.add(sketchPage(kit, 1.4, 0.96, 0.15, 0.25));
  group.add(mesh(new CylinderGeometry(0.09, 0.09, 0.07, 8), steel, 1.65, 0.99, 0.35));
  group.add(mesh(new CylinderGeometry(0.12, 0.14, 0.05, 8), steel, 2.0, 0.975, -0.35));
  group.add(
    cable(
      kit,
      [
        [2.0, 1.0, -0.35],
        [1.95, 1.55, -0.3],
        [1.65, 1.65, -0.05],
        [1.45, 1.5, 0.1]
      ],
      0.03
    )
  );
  group.add(mesh(new ConeGeometry(0.14, 0.18, 8, 1, true), steel, 1.45, 1.44, 0.12));
  const lamp = new PointLight(0xfff1c9, 1.6, 2.5, 1);
  lamp.position.set(1.42, 1.3, 0.14);
  group.add(lamp);
  // Their drink: a tall cup, a bent straw.
  group.add(mesh(new CylinderGeometry(0.07, 0.06, 0.26, 8), kit.toon(NIGHT_LAB.glass), 0.3, 1.08, -0.3));
  const straw = mesh(new CylinderGeometry(0.012, 0.012, 0.3, 4), kit.toon(NIGHT_LAB.alert), 0.33, 1.27, -0.3);
  straw.rotation.z = -0.35;
  group.add(straw);
  // Pages already gone through.
  for (let i = 0; i < 4; i++) {
    const page = mesh(
      new BoxGeometry(0.45, 0.012, 0.58),
      kit.toon(NIGHT_LAB.paper),
      0.4 + i * 0.03,
      0.96 + i * 0.012,
      0.25
    );
    page.rotation.y = 0.3 - i * 0.2;
    group.add(page);
  }
  return group;
}

/** The researcher's chair: tall, narrow, made for a longer back than ours. Front to +z. */
export function researcherChair(kit: PropKit) {
  const group = new Group();
  const body = kit.toon(NIGHT_LAB.cable);
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new CylinderGeometry(0.38, 0.34, 0.08, 10), body, 0, 0.58));
  group.add(mesh(new CylinderGeometry(0.05, 0.05, 0.55, 6), steel, 0, 0.29));
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const foot = mesh(new BoxGeometry(0.06, 0.05, 0.42), steel, Math.sin(angle) * 0.2, 0.03, Math.cos(angle) * 0.2);
    foot.rotation.y = angle;
    group.add(foot);
  }
  const back = mesh(new BoxGeometry(0.42, 1.5, 0.08), body, 0, 1.35, -0.32);
  back.rotation.x = -0.12;
  group.add(back);
  return group;
}

/** A bin of crumpled pages: the sketches they have finished with. */
export function paperBin(kit: PropKit) {
  const group = new Group();
  group.add(
    mesh(new CylinderGeometry(0.3, 0.24, 0.6, 10, 1, true), kit.toon(NIGHT_LAB.steel, { side: DoubleSide }), 0, 0.3)
  );
  const bottom = mesh(new CircleGeometry(0.24, 10), kit.toon(NIGHT_LAB.cable), 0, 0.02);
  bottom.rotation.x = -Math.PI / 2;
  group.add(bottom);
  for (let i = 0; i < 4; i++)
    group.add(
      mesh(
        lumpyGeometry(0.13, 0.3, 0, i + 2),
        kit.toon(NIGHT_LAB.paper),
        Math.sin(i * 2.1) * 0.12,
        0.5 + (i % 2) * 0.08,
        Math.cos(i * 2.1) * 0.12
      )
    );
  return group;
}

/** What keeps the sleepers asleep: a cabinet of slow lights, fed from the ceiling tray. Front to +z. */
export function lifeSupport(kit: PropKit) {
  const group = new Group();
  group.add(mesh(new BoxGeometry(2.2, 2.4, 1.1), kit.toon(NIGHT_LAB.ceiling), 0, 1.2));
  group.add(mesh(new BoxGeometry(1.9, 1.2, 0.04), kit.toon(NIGHT_LAB.cable), 0, 1.45, 0.56));
  const random = seededRandom(31);
  const lit = new MeshBasicMaterial({ color: NIGHT_LAB.fluid });
  const dark = kit.toon(NIGHT_LAB.alert);
  const lamps: Mesh[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      // One dark red lamp among the lit ones: Danilo's.
      const lamp = mesh(
        new BoxGeometry(0.4, 0.14, 0.03),
        row === 1 && col === 2 ? dark : lit,
        -0.55 + col * 0.55,
        1.88 - row * 0.28,
        0.59
      );
      if (lamp.material === lit) lamps.push(lamp);
      group.add(lamp);
    }
  }
  // A gauge, its needle at nothing.
  group.add(mesh(new CircleGeometry(0.18, 12), kit.toon(NIGHT_LAB.paper), 0.6, 0.6, 0.56));
  group.add(mesh(new BoxGeometry(0.02, 0.15, 0.01), kit.toon(NIGHT_LAB.ink), 0.6, 0.66, 0.57));
  if (!kit.reducedMotion) {
    const phases = lamps.map(() => random() * 6);
    kit.animate((t) => lamps.forEach((lamp, i) => (lamp.visible = Math.sin(t * 0.7 + phases[i]) > -0.8)));
  }
  return group;
}

/**
 * A cable tray along the ceiling at `z`, from `fromX` to `toX`, with a bundle
 * dropping to the cap of each pod at `drops`. In world space.
 */
export function cableTray(kit: PropKit, fromX: number, toX: number, z: number, drops: readonly number[], podZ: number) {
  const group = new Group();
  const y = 3.05;
  const steel = kit.toon(NIGHT_LAB.steel);
  group.add(mesh(new BoxGeometry(toX - fromX, 0.08, 0.5), steel, (fromX + toX) / 2, y, z));
  for (let x = fromX + 1; x < toX; x += 2) group.add(mesh(new BoxGeometry(0.04, 0.15, 0.04), steel, x, y + 0.1, z));
  drops.forEach((x, i) => {
    group.add(
      cable(kit, [
        [x - 0.3, y - 0.02, z],
        [x - 0.15 + (i % 2) * 0.1, y - 0.2, (z + podZ) / 2],
        [x, 3.0, podZ - 0.3]
      ])
    );
  });
  return group;
}

/** A cable along the floor through `points` ([x, z] pairs, world space), rising at both ends. */
export function floorCable(kit: PropKit, points: ReadonlyArray<readonly [number, number]>, rise = 0.5) {
  const path: Array<[number, number, number]> = points.map(([x, z]) => [x, 0.06, z]);
  path[0][1] = rise;
  path[path.length - 1][1] = rise;
  return cable(kit, path);
}
