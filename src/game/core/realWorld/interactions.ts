import { aimMiss, type Point3, type View } from './aim';
import { findCells, isSolidAt, NEIGHBOURS, REAL_WORLD_CELL, type RealWorldRoom } from './labRoom';
import { floorGrateCentre, grateCentre } from './vent';

/**
 * What else the crosshair can rest on, besides loose things: the lab's vent
 * grate, the bolted grate over the corridor, the grate that drops into the
 * storeroom, locked doors, the storeroom's service door (it opens for the
 * drones), and the armoury cage.
 */
export type Fixture = 'grate' | 'peekGrate' | 'dropGrate' | 'door' | 'serviceDoor' | 'cage';

/** The fixtures that pry off. */
export type Pryable = 'grate' | 'dropGrate';

/**
 * Which grates are already off (nothing left there to aim at), and whether
 * the service door is open (a doorway now, not a door).
 */
export type Opened = Readonly<Record<Pryable | 'serviceDoor', boolean>>;

interface Target {
  fixture: Fixture;
  centre: Point3;
  reach: number;
  /** How far the look ray may pass from the centre: about half the thing's size. */
  slack: number;
}

/** The middle of a wall cell's face that looks into the room, at height `y`. */
function wallFace(room: RealWorldRoom, cell: { x: number; z: number }, y: number): Point3 | null {
  for (const [dx, dz] of NEIGHBOURS) {
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
  const walled: ReadonlyArray<[string, Fixture, number]> = [
    ['D', 'door', 1.35],
    ['S', 'serviceDoor', 1.35],
    ['A', 'cage', 1.2]
  ];
  for (const [char, fixture, y] of walled) {
    for (const cell of findCells(room.walls, char)) {
      const centre = wallFace(room, cell, y);
      if (centre) targets.push({ fixture, centre, reach: 2.6, slack: 1.1 });
    }
  }
  if (room.vent) {
    targets.push({ fixture: 'grate', centre: grateCentre(room.vent), reach: 2.4, slack: 0.75 });
    const peek = floorGrateCentre(room.vent, 'g');
    if (peek) targets.push({ fixture: 'peekGrate', centre: peek, reach: 2.2, slack: 0.7 });
    const drop = floorGrateCentre(room.vent, 'o');
    if (drop) targets.push({ fixture: 'dropGrate', centre: drop, reach: 2.2, slack: 0.7 });
  }
  targetsByRoom.set(room, targets);
  return targets;
}

/** The grates that pry off, in the order they're met. */
export const PRYABLES = ['grate', 'dropGrate'] as const satisfies readonly Pryable[];

export const isPryable = (fixture: Fixture | null): fixture is Pryable =>
  fixture === 'grate' || fixture === 'dropGrate';

/** The fixture under the crosshair and within reach, if any; grates already off don't count. */
export function aimedFixture(room: RealWorldRoom, view: View, opened: Opened): Fixture | null {
  let best: Fixture | null = null;
  let bestMiss = Infinity;
  for (const target of targetsOf(room)) {
    if ((isPryable(target.fixture) || target.fixture === 'serviceDoor') && opened[target.fixture]) continue;
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

/** A grate: how far it has been worked loose (0..1), and whether it's off. */
export interface Pry {
  progress: number;
  open: boolean;
}

/**
 * One frame of prying (holding on the grate) or not. Once it's off, it stays
 * off. Anything else worked by holding (waking a drone) takes its own `seconds`.
 */
export function stepPry(pry: Pry, prying: boolean, dt: number, seconds = PRY_SECONDS): Pry {
  if (pry.open) return pry;
  const progress = prying ? Math.min(1, pry.progress + dt / seconds) : Math.max(0, pry.progress - dt * PRY_SPRING_BACK);
  return { progress, open: progress >= 1 };
}
