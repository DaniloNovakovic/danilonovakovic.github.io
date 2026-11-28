import { isSolidAt, NEIGHBOURS, REAL_WORLD_CELL as CELL, type CellCenter, type RealWorldMap } from './labRoom';
import type { Noise } from './throwables';

/**
 * Hearing things (#145): a can clattering down the corridor carries through
 * open doorways but not through walls, and an alien who hears it walks over
 * to look. The way there goes cell by cell round the walls, like anyone
 * would walk it.
 */

/** Through a wall, a sound carries this much of its reach (the walls are thin, the ship is quiet). */
const THROUGH_WALLS = 0.35;

const cellOf = (x: number, z: number) => [Math.floor(x / CELL), Math.floor(z / CELL)] as const;
const centreOf = (cx: number, cz: number): CellCenter => ({ x: (cx + 0.5) * CELL, z: (cz + 0.5) * CELL });

/** Nothing `blocked` at any point between the two, stepping `step` at a time (the ends don't count). */
export function clearAlong(
  from: CellCenter,
  to: CellCenter,
  step: number,
  blocked: (x: number, z: number) => boolean
): boolean {
  const steps = Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / step);
  for (let i = 1; i < steps; i++) {
    if (blocked(from.x + ((to.x - from.x) * i) / steps, from.z + ((to.z - from.z) * i) / steps)) return false;
  }
  return true;
}

/** No wall in a straight line between the two (furniture doesn't count: you walk round it). */
export const clearLine = (map: RealWorldMap, from: CellCenter, to: CellCenter, doorsOpen: boolean) =>
  clearAlong(from, to, 0.25, (x, z) => isSolidAt(map, x, z, doorsOpen));

type Cell = readonly [number, number];
const keyOf = (cx: number, cz: number) => `${cx},${cz}`;

/** Walk back from `goal` to the start along `cameFrom`, as cell centres from the start. */
function pathBack(cameFrom: Map<string, Cell | null>, goal: Cell): CellCenter[] {
  const cells: CellCenter[] = [];
  for (let at: Cell | null = goal; at; at = cameFrom.get(keyOf(...at)) ?? null) cells.unshift(centreOf(...at));
  return cells;
}

/** Cells from `from`'s to `to`'s, by the fewest steps through open floor; null if there's no way. */
function cellsBetween(map: RealWorldMap, from: CellCenter, to: CellCenter, doorsOpen: boolean) {
  const start = cellOf(from.x, from.z);
  const goal = cellOf(to.x, to.z);
  const cameFrom = new Map<string, Cell | null>([[keyOf(...start), null]]);
  const queue = [start];
  while (queue.length) {
    const [cx, cz] = queue.shift()!;
    if (cx === goal[0] && cz === goal[1]) break;
    for (const [dx, dz] of NEIGHBOURS) {
      const next = [cx + dx, cz + dz] as const;
      const { x, z } = centreOf(...next);
      if (cameFrom.has(keyOf(...next)) || isSolidAt(map, x, z, doorsOpen)) continue;
      cameFrom.set(keyOf(...next), [cx, cz]);
      queue.push(next);
    }
  }
  return cameFrom.has(keyOf(...goal)) ? pathBack(cameFrom, goal) : null;
}

/**
 * The way from `from` to `to` round the walls: the points to walk to in turn,
 * ending at `to`, with every corner that can be cut cut. Null if there's no way.
 */
export function wayTo(map: RealWorldMap, from: CellCenter, to: CellCenter, doorsOpen: boolean): CellCenter[] | null {
  const cells = cellsBetween(map, from, to, doorsOpen);
  if (!cells) return null;
  const points = [...cells.slice(1, -1), to];
  const way: CellCenter[] = [];
  let at = from;
  let i = 0;
  while (i < points.length) {
    // The furthest point still in a straight line from here.
    let next = i;
    while (next + 1 < points.length && clearLine(map, at, points[next + 1], doorsOpen)) next += 1;
    way.push(points[next]);
    at = points[next];
    i = next + 1;
  }
  return way;
}

/** Whether someone at `ear` hears `noise`: in its reach in the open, less of it through walls. */
export function hears(map: RealWorldMap, ear: CellCenter, noise: Noise, doorsOpen: boolean): boolean {
  const distance = Math.hypot(noise.x - ear.x, noise.z - ear.z);
  if (distance > noise.reach) return false;
  return clearLine(map, ear, noise, doorsOpen) || distance <= noise.reach * THROUGH_WALLS;
}
