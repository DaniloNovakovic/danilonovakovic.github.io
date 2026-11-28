import type { Point3 } from './aim';
import type { Opened } from './interactions';
import { LAB_ROOM, type RealWorldRoom } from './labRoom';
import { SHIP_DECK } from './shipDeck';
import { crawlAmount, eyeHeightFor, isOverDrop } from './vent';
import { stepWalker, type Walker, type WalkInput } from './walker';

/** Which room a room's vent drops into. */
const DROPS_INTO: ReadonlyMap<RealWorldRoom, RealWorldRoom> = new Map([[LAB_ROOM, SHIP_DECK]]);

/** Dropping through a hatch: a short fall, no control. */
export const FALL_SECONDS = 0.5;

/**
 * Where Danilo is in the real world: which room (its walker is in that
 * room's own coordinates), how far down on hands and knees, and a fall in
 * progress after dropping through a hatch (from what eye height, how far).
 */
export interface Explorer {
  room: RealWorldRoom;
  walker: Walker;
  crawl: number;
  fall: { fromY: number; t: number } | null;
}

export function startExplorer(room: RealWorldRoom): Explorer {
  return { room, walker: { x: room.wake.x, z: room.wake.z, vx: 0, vz: 0 }, crawl: 0, fall: null };
}

const offsetOf = (room: RealWorldRoom) => room.offset ?? { x: 0, y: 0, z: 0 };

/** Danilo's eye in the world. */
export function eyeOf(explorer: Explorer): Point3 {
  const { room, walker, crawl, fall } = explorer;
  const offset = offsetOf(room);
  const standing = offset.y + eyeHeightFor(room.vent, crawl);
  const y = fall ? fall.fromY + (standing - fall.fromY) * fall.t * fall.t : standing;
  return { x: offset.x + walker.x, y, z: offset.z + walker.z };
}

/**
 * One frame: walk or crawl (with the vent grate off, the duct is open; with
 * the service door open, it's a doorway), and over the opened drop grate, fall through into the room below, landing
 * under its hatch. A fall plays out before control comes back.
 */
export function stepExplorer(explorer: Explorer, input: WalkInput, dt: number, opened: Opened): Explorer {
  if (explorer.fall) {
    const t = Math.min(1, explorer.fall.t + dt / FALL_SECONDS);
    return { ...explorer, fall: t >= 1 ? null : { ...explorer.fall, t } };
  }
  const { room } = explorer;
  const walker = stepWalker(room, explorer.walker, input, dt, { vent: opened.grate, doors: opened.serviceDoor });
  const moved = { ...explorer, walker, crawl: crawlAmount(room.vent, opened.grate, walker.x, walker.z) };
  const below = DROPS_INTO.get(room);
  if (below && isOverDrop(room.vent, opened.dropGrate, walker.x, walker.z)) {
    return { ...startExplorer(below), fall: { fromY: eyeOf(moved).y, t: 0 } };
  }
  return moved;
}

/** A view in world coordinates, moved into `room`'s own. */
export function toRoom<T extends Point3>(room: RealWorldRoom, point: T): T {
  const offset = offsetOf(room);
  return { ...point, x: point.x - offset.x, y: point.y - offset.y, z: point.z - offset.z };
}
