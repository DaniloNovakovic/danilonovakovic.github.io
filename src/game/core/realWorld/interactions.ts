import { aimMiss, type Point3, type View } from './aim';
import { findCells, isSolidAt, REAL_WORLD_CELL, type RealWorldRoom } from './labRoom';
import { farGrateCentre, grateCentre } from './vent';

/** What else the crosshair can rest on, besides loose things. */
export type Fixture = 'grate' | 'farGrate' | 'door';

interface Target {
  fixture: Fixture;
  centre: Point3;
  reach: number;
  /** How far the look ray may pass from the centre: about half the thing's size. */
  slack: number;
}

/** The middle of a wall cell's face that looks into the room, at height `y`. */
function wallFace(room: RealWorldRoom, cell: { x: number; z: number }, y: number): Point3 | null {
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ] as const) {
    if (isSolidAt(room.walls, cell.x + dx * REAL_WORLD_CELL, cell.z + dz * REAL_WORLD_CELL)) continue;
    return { x: cell.x + (dx * REAL_WORLD_CELL) / 2, y, z: cell.z + (dz * REAL_WORLD_CELL) / 2 };
  }
  return null;
}

const targetsByRoom = new WeakMap<RealWorldRoom, Target[]>();
function targetsOf(room: RealWorldRoom): Target[] {
  let targets = targetsByRoom.get(room);
  if (targets) return targets;
  targets = [];
  for (const door of findCells(room.walls, 'D')) {
    const centre = wallFace(room, door, 1.35);
    if (centre) targets.push({ fixture: 'door', centre, reach: 2.6, slack: 1.1 });
  }
  if (room.vent) {
    targets.push({ fixture: 'grate', centre: grateCentre(room.vent), reach: 2.4, slack: 0.75 });
    const far = farGrateCentre(room.vent);
    if (far) targets.push({ fixture: 'farGrate', centre: far, reach: 2.2, slack: 0.7 });
  }
  targetsByRoom.set(room, targets);
  return targets;
}

/**
 * The fixture under the crosshair and within reach, if any. Once the vent is
 * open its grate is gone, so there is nothing left there to aim at.
 */
export function aimedFixture(room: RealWorldRoom, view: View, ventOpen: boolean): Fixture | null {
  let best: Fixture | null = null;
  let bestMiss = Infinity;
  for (const target of targetsOf(room)) {
    if (target.fixture === 'grate' && ventOpen) continue;
    const aim = aimMiss(view, target.centre, target.reach);
    if (aim && aim.miss < target.slack && aim.miss < bestMiss) {
      best = target.fixture;
      bestMiss = aim.miss;
    }
  }
  return best;
}

/** How long holding on the grate takes to work it loose. */
export const PRY_SECONDS = 1.1;
/** Letting go: the grate springs back, faster than it gave. */
const PRY_SPRING_BACK = 2;

/** The lab grate: how far it has been worked loose (0..1), and whether it's off. */
export interface Pry {
  progress: number;
  open: boolean;
}

/** One frame of prying (holding on the grate) or not. Once it's off, it stays off. */
export function stepPry(pry: Pry, prying: boolean, dt: number): Pry {
  if (pry.open) return pry;
  const progress = prying
    ? Math.min(1, pry.progress + dt / PRY_SECONDS)
    : Math.max(0, pry.progress - dt * PRY_SPRING_BACK);
  return { progress, open: progress >= 1 };
}
