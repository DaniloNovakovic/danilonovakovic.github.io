import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  type Material,
  type Object3D
} from 'three';
import type { PropKit } from './labProps';
import { NIGHT_LAB } from './toon';

/**
 * The aliens (Danilo, 2026-11-26): upright insect people, part ant, part
 * machine. Scary, not too scary, never gory. A long chitin head jutting
 * forward on a thin neck, glowing compound eyes, hooked mandibles, twitching
 * elbowed antennae, a hunch, claws for hands, reverse-jointed legs, the
 * gaster pushing out behind, and bolted-on steel. They wear what their job
 * needs: researchers a lab coat, officers a uniform and a cap.
 */
const CHITIN = 0x3b2440;
const CHITIN_DARK = 0x24162a;
const EYE = 0xe0306a;
const COAT = 0xe4e2ee;
const UNIFORM = 0x26305c;
const UNIFORM_TRIM = 0x161c3a;
const BADGE = 0xd9a63a;

function part(geometry: ConstructorParameters<typeof Mesh>[0], material: Material, x = 0, y = 0, z = 0) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
}

/** A two-segment limb hanging from a joint; returns the pivot and the lower joint to bend. */
function limb(upperMaterial: Material, lowerMaterial: Material, upper: number, lower: number, radius: number) {
  const hip = new Group();
  hip.add(part(new CylinderGeometry(radius, radius * 0.8, upper, 6), upperMaterial, 0, -upper / 2));
  const knee = new Group();
  knee.position.y = -upper;
  knee.add(part(new SphereGeometry(radius * 0.85, 6, 4), lowerMaterial));
  knee.add(part(new CylinderGeometry(radius * 0.7, radius * 0.35, lower, 5), lowerMaterial, 0, -lower / 2));
  hip.add(knee);
  return { hip, knee };
}

/** Three hooked claws, pointing down from a wrist. */
function claws(material: Material, size: number) {
  const hand = new Group();
  for (const spread of [-0.45, 0, 0.45]) {
    const claw = part(new ConeGeometry(size * 0.18, size, 4), material, Math.sin(spread) * size * 0.4, -size / 2);
    claw.rotation.set(Math.PI + 0.35, 0, spread);
    hand.add(claw);
  }
  return hand;
}

function head(kit: PropKit) {
  const chitin = kit.toon(CHITIN);
  const dark = kit.toon(CHITIN_DARK);
  const eye = new MeshBasicMaterial({ color: EYE });
  const group = new Group();
  // Long and heart-shaped from the front, like an ant's: a wide crown narrowing to the jaws.
  const skull = part(new SphereGeometry(0.24, 12, 9), chitin, 0, 0.02, 0.02);
  skull.scale.set(1.05, 0.95, 1.25);
  group.add(skull);
  const jaw = part(new SphereGeometry(0.15, 10, 7), chitin, 0, -0.1, 0.2);
  jaw.scale.set(1, 0.7, 1.2);
  group.add(jaw);
  for (const side of [-1, 1]) {
    // Compound eyes set forward on the sides of the face, glowing.
    const compound = part(new SphereGeometry(0.085, 10, 7), eye, side * 0.17, 0.06, 0.17);
    compound.scale.set(0.75, 1.15, 1);
    group.add(compound);
    // Mandibles: long hooks reaching forward and in, the tips nearly crossing.
    const mandible = new Group();
    mandible.position.set(side * 0.1, -0.15, 0.3);
    mandible.rotation.y = side * 0.5;
    const base = part(new CylinderGeometry(0.035, 0.03, 0.18, 5), dark, 0, 0, 0.09);
    base.rotation.x = Math.PI / 2;
    const hook = part(new ConeGeometry(0.03, 0.16, 5), dark, side * -0.05, 0, 0.22);
    hook.rotation.set(Math.PI / 2, 0, 0);
    hook.rotation.y = side * -0.9;
    mandible.add(base, hook);
    group.add(mandible);
    // Antennae: a long stalk, then an elbow, like an ant's.
    const antenna = new Group();
    antenna.position.set(side * 0.09, 0.16, 0.2);
    antenna.rotation.set(-0.35, 0, side * -0.4);
    antenna.add(part(new CylinderGeometry(0.016, 0.016, 0.38, 4), dark, 0, 0.19));
    const tip = new Group();
    tip.position.y = 0.38;
    tip.rotation.x = 1.2;
    tip.add(part(new CylinderGeometry(0.012, 0.022, 0.34, 4), dark, 0, 0.17));
    antenna.add(tip);
    antenna.userData.side = side;
    antenna.userData.tip = tip;
    antenna.name = 'antenna';
    group.add(antenna);
  }
  // The machine part: a steel plate bolted over the back of the skull, a red lens in it, a cable out.
  const plate = part(new BoxGeometry(0.2, 0.18, 0.2), kit.toon(NIGHT_LAB.steel), -0.15, 0.08, -0.1);
  plate.rotation.set(0.1, -0.5, 0.2);
  group.add(plate);
  group.add(
    part(
      new CylinderGeometry(0.035, 0.035, 0.06, 8),
      new MeshBasicMaterial({ color: NIGHT_LAB.alert }),
      -0.25,
      0.1,
      -0.02
    ).rotateZ(Math.PI / 2)
  );
  return group;
}

export interface Alien {
  root: Object3D;
  /** Walk cycle phase in radians (0 = standing still), how alert the antennae are (0..1), and the time. */
  pose(stride: number, twitch: number, seconds: number): void;
}

interface InsectBody {
  root: Group;
  /** Bobs with the stride; everything above the legs. */
  body: Group;
  /** The hunched upper body: dress it here. */
  torso: Group;
  face: Group;
  legs: Array<{ hip: Group; knee: Group }>;
}

/** The insect under the clothes: legs, gaster, neck, the small folded arms, the head. */
function insectBody(kit: PropKit): InsectBody {
  const root = new Group();
  const body = new Group();
  root.add(body);
  const chitin = kit.toon(CHITIN);
  const dark = kit.toon(CHITIN_DARK);
  // Reverse-jointed legs, knees bending back.
  const legs = [-1, 1].map((side) => {
    const leg = limb(chitin, dark, 0.55, 0.62, 0.06);
    leg.hip.position.set(side * 0.14, 1.12, 0);
    leg.knee.add(claws(dark, 0.14).translateY(-0.62));
    root.add(leg.hip);
    return leg;
  });
  // The upper body leans forward over the legs.
  const torso = new Group();
  torso.position.y = 1.1;
  torso.rotation.x = 0.2;
  body.add(torso);
  // The gaster, the ant's back end, pushing out behind.
  const gaster = part(new CapsuleGeometry(0.2, 0.3, 4, 8), dark, 0, -0.1, -0.35);
  gaster.rotation.x = -1.0;
  torso.add(gaster);
  // A thin, segmented neck: the insect waist, where a person's would be thick.
  for (let i = 0; i < 3; i++)
    torso.add(part(new SphereGeometry(0.06 - i * 0.008, 6, 5), chitin, 0, 0.9 + i * 0.08, 0.04 + i * 0.05));
  // A cable from the steel plate down into the collar: wired up, like the sleepers.
  torso.add(part(new CylinderGeometry(0.02, 0.02, 0.4, 5), kit.toon(NIGHT_LAB.cable), -0.12, 0.98, -0.08).rotateX(0.4));
  // The small second pair, folded at the chest like a mantis.
  for (const side of [-1, 1]) {
    const arm = limb(chitin, chitin, 0.2, 0.2, 0.028);
    arm.hip.position.set(side * 0.11, 0.55, 0.2);
    arm.hip.rotation.set(-1.1, 0, side * 0.35);
    arm.knee.rotation.x = 2.5;
    torso.add(arm.hip);
  }
  const face = head(kit);
  face.position.set(0, 1.18, 0.2);
  face.rotation.x = 0.3;
  torso.add(face);
  return { root, body, torso, face, legs };
}

/** Walking, the head's slow look around and sudden jerks, the antennae. */
function poser({ body, face, legs }: InsectBody): Alien['pose'] {
  const antennae = face.children.filter((child) => child.name === 'antenna');
  return (stride, twitch, seconds) => {
    const swing = Math.sin(stride) * 0.45;
    legs.forEach((leg, i) => {
      const s = i === 0 ? swing : -swing;
      // Digitigrade: the thigh swings forward, the shin always bends back.
      leg.hip.rotation.x = -0.35 + s;
      leg.knee.rotation.x = 0.7 + Math.max(0, s) * 0.5;
    });
    body.position.y = Math.abs(Math.cos(stride)) * 0.03;
    face.rotation.y = Math.sin(seconds * 0.7) * 0.2;
    // A small jerk of the head now and then: insect, not human.
    face.rotation.z = Math.sin(seconds * 0.9) > 0.97 ? 0.15 : 0;
    for (const antenna of antennae) {
      const side = antenna.userData.side as number;
      const tip = antenna.userData.tip as Object3D;
      antenna.rotation.x = -0.35 + Math.sin(seconds * 9 + side) * 0.14 * twitch + Math.sin(seconds * 1.3) * 0.08;
      tip.rotation.x = 1.2 + Math.sin(seconds * 13 + side * 2) * 0.3 * twitch;
    }
  };
}

/** A researcher: lab coat, clipboard in the big claws. About 2.1 tall, hunched. */
export function insectResearcher(kit: PropKit): Alien {
  const insect = insectBody(kit);
  const { torso } = insect;
  const coat = kit.toon(COAT);
  // The coat: narrow shoulders, flared and open at the hem, a collar up to the neck.
  torso.add(part(new CylinderGeometry(0.22, 0.4, 0.95, 10, 1, true), coat, 0, 0.2));
  torso.add(part(new CylinderGeometry(0.16, 0.22, 0.2, 10), coat, 0, 0.75));
  // Big arms: sleeves to the elbow, then bare chitin forearms and claws, holding a clipboard.
  for (const side of [-1, 1]) {
    const arm = limb(coat, kit.toon(CHITIN), 0.4, 0.42, 0.065);
    arm.hip.position.set(side * 0.25, 0.72, 0);
    // Negative x swings a limb forward: the upper arm hangs a little forward, the forearm reaches out.
    arm.hip.rotation.set(-0.2, 0, side * 0.12);
    arm.knee.rotation.x = -1.35;
    arm.knee.add(claws(kit.toon(CHITIN_DARK), 0.12).translateY(-0.42));
    torso.add(arm.hip);
  }
  const board = part(new BoxGeometry(0.32, 0.02, 0.42), kit.toon(NIGHT_LAB.paper), 0, 0.3, 0.42);
  board.rotation.x = 0.6;
  torso.add(board);
  return { root: insect.root, pose: poser(insect) };
}

/**
 * An officer: a dark uniform buttoned to the collar, shoulder boards and a
 * badge, a peaked cap pushed back between the antennae, a stun blaster in a
 * holster, one claw resting on it. Bulkier and more upright than a researcher.
 */
export function insectOfficer(kit: PropKit): Alien {
  const insect = insectBody(kit);
  const { torso, face } = insect;
  torso.rotation.x = 0.1;
  const uniform = kit.toon(UNIFORM);
  const trim = kit.toon(UNIFORM_TRIM);
  const badge = kit.toon(BADGE);
  torso.add(part(new CylinderGeometry(0.26, 0.34, 0.8, 10), uniform, 0, 0.3));
  torso.add(part(new CylinderGeometry(0.17, 0.26, 0.2, 10), uniform, 0, 0.78));
  // The belt, the holster on the right, the blaster's grip sticking out of it.
  torso.add(part(new CylinderGeometry(0.35, 0.35, 0.08, 10), trim, 0, -0.06));
  const holster = part(new BoxGeometry(0.1, 0.24, 0.16), trim, 0.36, -0.1, 0.02);
  holster.add(part(new BoxGeometry(0.08, 0.12, 0.1), kit.toon(NIGHT_LAB.steel), 0, 0.16, -0.02));
  holster.add(part(new SphereGeometry(0.03, 6, 4), new MeshBasicMaterial({ color: NIGHT_LAB.fluid }), 0, 0.2, 0.06));
  torso.add(holster);
  // Badge, buttons, shoulder boards.
  torso.add(part(new BoxGeometry(0.09, 0.1, 0.02), badge, -0.12, 0.55, 0.27));
  for (let i = 0; i < 3; i++) torso.add(part(new SphereGeometry(0.018, 5, 4), badge, 0, 0.62 - i * 0.18, 0.29));
  for (const side of [-1, 1]) torso.add(part(new BoxGeometry(0.16, 0.04, 0.12), badge, side * 0.24, 0.8, 0));
  // Arms: sleeves to the elbow; the right claw rests on the holster, the left hangs.
  for (const side of [-1, 1]) {
    const arm = limb(uniform, kit.toon(CHITIN), 0.4, 0.42, 0.07);
    arm.hip.position.set(side * 0.3, 0.72, 0);
    arm.hip.rotation.set(side > 0 ? 0.05 : -0.15, 0, side * 0.18);
    arm.knee.rotation.x = side > 0 ? -0.45 : -0.6;
    arm.knee.add(claws(kit.toon(CHITIN_DARK), 0.12).translateY(-0.42));
    torso.add(arm.hip);
  }
  // The cap: a crown, a peak, a badge; perched behind the antennae.
  const cap = new Group();
  cap.position.set(0, 0.2, -0.04);
  cap.rotation.x = -0.25;
  cap.add(part(new CylinderGeometry(0.2, 0.17, 0.12, 12), uniform));
  cap.add(part(new CylinderGeometry(0.21, 0.21, 0.03, 12), trim, 0, -0.06));
  const peak = part(new BoxGeometry(0.26, 0.02, 0.14), trim, 0, -0.06, 0.2);
  peak.rotation.x = 0.25;
  cap.add(peak, part(new BoxGeometry(0.07, 0.06, 0.02), badge, 0, 0.0, 0.2));
  face.add(cap);
  return { root: insect.root, pose: poser(insect) };
}
