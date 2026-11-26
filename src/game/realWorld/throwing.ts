import { Group, Mesh, SphereGeometry, TorusGeometry, Vector3, type Camera, type Object3D } from 'three';
import {
  aimedThrowable,
  LAB_THROWABLES,
  stepThrowable,
  throwableRadius,
  throwThrowable,
  type RealWorldRoom,
  type Throwable,
  type ThrowableKind,
  type View
} from '@/game/core/realWorld';
import { lumpyGeometry } from './labProps';
import { NIGHT_LAB, type Toon } from './toon';

/** Where a held thing sits, in camera space: low and to the right, like a hand. */
const HOLD_OFFSET = new Vector3(0.3, -0.28, -0.7);
/** A soft drop when Danilo lets go without throwing. */
const DROP_VIEW_PITCH = -0.6;
const SQUASH_SECONDS = 0.18;

function throwableMesh(kind: ThrowableKind, toon: Toon): Object3D {
  const r = throwableRadius(kind);
  if (kind === 'ball') {
    const ball = new Group();
    ball.add(new Mesh(new SphereGeometry(r, 12, 9), toon(NIGHT_LAB.alert)));
    const band = new Mesh(new TorusGeometry(r * 0.98, r * 0.18, 5, 16), toon(0xffffff));
    band.rotation.x = Math.PI / 2;
    ball.add(band);
    return ball;
  }
  if (kind === 'paper') return new Mesh(lumpyGeometry(r, 0.3, 0, 3), toon(NIGHT_LAB.paper));
  const brain = new Mesh(lumpyGeometry(r, 0.12, 1, 5), toon(NIGHT_LAB.brain));
  brain.userData.shape = { x: 1.15, y: 0.85, z: 1.3 };
  return brain;
}

export type Prompt = 'pickUp' | 'throw' | null;

export interface Throwing {
  /** Step every loose thing and keep the held one in hand. */
  update(dt: number, view: View, camera: Camera): void;
  /** Click, E or the touch button: pick up what's aimed at, or throw what's held. */
  act(view: View): void;
  /** `E` while holding: put it down gently. */
  drop(view: View): void;
  readonly prompt: Prompt;
}

/** Loose things live under `parent`, so they're freed with it. */
export function createThrowing(parent: Object3D, room: RealWorldRoom, toon: Toon): Throwing {
  let things: Throwable[] = LAB_THROWABLES.map((thing) => ({ ...thing }));
  const meshes = new Map(things.map((thing) => [thing.id, throwableMesh(thing.kind, toon)]));
  const squash = new Map<string, number>();
  for (const mesh of meshes.values()) parent.add(mesh);
  let heldId: string | null = null;
  let aimedId: string | null = null;
  const handPosition = new Vector3();

  const release = (view: View, pitchOverride?: number) => {
    const held = things.find((thing) => thing.id === heldId);
    if (!held) return;
    const start = { x: handPosition.x, y: handPosition.y, z: handPosition.z };
    const thrown = throwThrowable(held, start, pitchOverride === undefined ? view : { ...view, pitch: pitchOverride });
    if (pitchOverride !== undefined) {
      thrown.vx *= 0.15;
      thrown.vy = 0;
      thrown.vz *= 0.15;
    }
    things = things.map((thing) => (thing.id === heldId ? thrown : thing));
    heldId = null;
  };

  return {
    get prompt(): Prompt {
      if (heldId) return 'throw';
      return aimedId ? 'pickUp' : null;
    },
    act(view) {
      if (heldId) release(view);
      else if (aimedId) heldId = aimedId;
    },
    drop(view) {
      if (heldId) release(view, DROP_VIEW_PITCH);
      else if (aimedId) heldId = aimedId;
    },
    update(dt, view, camera) {
      handPosition.copy(HOLD_OFFSET).applyMatrix4(camera.matrixWorld);
      things = things.map((thing) => {
        if (thing.id === heldId)
          return { ...thing, x: handPosition.x, y: handPosition.y, z: handPosition.z, vx: 0, vy: 0, vz: 0 };
        const next = stepThrowable(room, thing, dt);
        if (thing.vy < -2 && next.vy >= 0) squash.set(thing.id, SQUASH_SECONDS);
        return next;
      });
      aimedId = heldId ? null : (aimedThrowable(things, view)?.id ?? null);
      for (const thing of things) {
        const mesh = meshes.get(thing.id)!;
        mesh.position.set(thing.x, thing.y, thing.z);
        const left = Math.max(0, (squash.get(thing.id) ?? 0) - dt);
        squash.set(thing.id, left);
        const flat = (left / SQUASH_SECONDS) * 0.35;
        const shape = (mesh.userData.shape as { x: number; y: number; z: number } | undefined) ?? { x: 1, y: 1, z: 1 };
        mesh.scale.set(shape.x * (1 + flat), shape.y * (1 - flat), shape.z * (1 + flat));
        // Rolling: spin with horizontal speed.
        mesh.rotation.x += thing.vz * dt * 3;
        mesh.rotation.z -= thing.vx * dt * 3;
      }
    }
  };
}
