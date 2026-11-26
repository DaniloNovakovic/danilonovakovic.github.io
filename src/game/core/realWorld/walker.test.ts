import { describe, expect, it } from 'vitest';
import {
  cellAt,
  distanceTo,
  findCells,
  footprintOf,
  footprintsOf,
  furnitureOf,
  isSolidAt,
  LAB_ROOM,
  REAL_WORLD_CELL,
  REAL_WORLD_PLAYER_RADIUS
} from './labRoom';
import { stepWalker, type Walker, type WalkInput } from './walker';

function walk(from: Walker, input: WalkInput, seconds: number): Walker {
  let walker = from;
  for (let t = 0; t < seconds; t += 1 / 60) walker = stepWalker(LAB_ROOM, walker, input, 1 / 60);
  return walker;
}

const start = (): Walker => ({ x: LAB_ROOM.wake.x, z: LAB_ROOM.wake.z, vx: 0, vz: 0 });
const NORTH = 0;
const WEST = Math.PI / 2;
const EAST = -Math.PI / 2;
const SOUTH_EAST = (-3 * Math.PI) / 4;
const walls = LAB_ROOM.walls;

describe('the lab room', () => {
  it("has Danilo's pod, people still plugged in, a vent and a locked door", () => {
    const kinds = LAB_ROOM.furniture.map((piece) => piece.kind);
    expect(kinds.filter((kind) => kind === 'myPod')).toHaveLength(1);
    expect(kinds.filter((kind) => kind === 'sleeperPod').length).toBeGreaterThanOrEqual(2);
    expect(findCells(walls, 'V')).toHaveLength(1);
    expect(findCells(walls, 'D')).toHaveLength(1);
  });

  it('treats walls, the vent, the door and anything off the map as solid', () => {
    const [vent] = findCells(walls, 'V');
    const [door] = findCells(walls, 'D');
    expect(isSolidAt(walls, vent.x, vent.z)).toBe(true);
    expect(isSolidAt(walls, door.x, door.z)).toBe(true);
    expect(isSolidAt(walls, -1, -1)).toBe(true);
    expect(cellAt(walls, 999, 999)).toBe('#');
  });

  it('keeps every piece of furniture on the floor, clear of the walls', () => {
    for (const footprint of footprintsOf(LAB_ROOM)) {
      const reach =
        'radius' in footprint
          ? { x: footprint.radius, z: footprint.radius }
          : {
              x: footprint.halfX,
              z: footprint.halfZ
            };
      for (const [sx, sz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
      ])
        expect(isSolidAt(walls, footprint.x + sx * (reach.x - 0.01), footprint.z + sz * (reach.z - 0.01))).toBe(false);
    }
  });

  it('wakes Danilo standing free, with a clear way to the door and the vent', () => {
    const blocked = (x: number, z: number) =>
      footprintsOf(LAB_ROOM).some((footprint) => distanceTo(footprint, x, z) < REAL_WORLD_PLAYER_RADIUS);
    expect(blocked(LAB_ROOM.wake.x, LAB_ROOM.wake.z)).toBe(false);
    const [door] = findCells(walls, 'D');
    const [vent] = findCells(walls, 'V');
    expect(blocked(door.x, door.z - REAL_WORLD_CELL / 2 - 0.6)).toBe(false);
    expect(blocked(vent.x - REAL_WORLD_CELL / 2 - 0.6, vent.z)).toBe(false);
  });
});

describe('stepWalker', () => {
  it('stands still with no input', () => {
    const walker = walk(start(), { forward: 0, strafe: 0, yaw: NORTH }, 1);
    expect(walker).toMatchObject({ x: start().x, z: start().z });
  });

  it('walks where it faces, easing up to speed', () => {
    const first = stepWalker(LAB_ROOM, start(), { forward: 1, strafe: 0, yaw: EAST }, 1 / 60);
    expect(first.vx).toBeGreaterThan(0);
    expect(first.vx).toBeLessThan(1);
    const walker = walk(start(), { forward: 1, strafe: 0, yaw: EAST }, 0.5);
    expect(walker.x).toBeGreaterThan(start().x + 1);
    expect(walker.z).toBeCloseTo(start().z, 5);
  });

  it('stops at the west wall, a radius short of it', () => {
    const walker = walk(start(), { forward: 1, strafe: 0, yaw: WEST }, 8);
    expect(walker.x).toBeGreaterThanOrEqual(REAL_WORLD_CELL + REAL_WORLD_PLAYER_RADIUS - 0.1);
    expect(walker.x).toBeLessThan(REAL_WORLD_CELL + REAL_WORLD_PLAYER_RADIUS + 0.2);
  });

  it('bumps into the pod instead of walking through it', () => {
    const pod = footprintOf(furnitureOf(LAB_ROOM, 'myPod')!);
    const walker = walk(start(), { forward: 1, strafe: 0, yaw: NORTH }, 3);
    expect(distanceTo(pod, walker.x, walker.z)).toBeGreaterThanOrEqual(REAL_WORLD_PLAYER_RADIUS - 0.1);
    expect(walker.z).toBeLessThan(start().z);
  });

  it('stops at the edge of the operating table, a box, not a circle', () => {
    const table = footprintOf(furnitureOf(LAB_ROOM, 'table')!);
    if (!('halfZ' in table)) throw new Error('the table should be a box');
    const walker = walk({ x: table.x, z: table.z - 3, vx: 0, vz: 0 }, { forward: -1, strafe: 0, yaw: NORTH }, 3);
    expect(walker.z).toBeCloseTo(table.z - table.halfZ - REAL_WORLD_PLAYER_RADIUS, 1);
  });

  it('slides along a wall when walking into it at an angle', () => {
    const walker = walk({ x: 12, z: 15, vx: 0, vz: 0 }, { forward: 1, strafe: 0, yaw: SOUTH_EAST }, 3);
    expect(walker.x).toBeGreaterThan(16);
    expect(walker.z).toBeCloseTo(walls.length * REAL_WORLD_CELL - REAL_WORLD_CELL - REAL_WORLD_PLAYER_RADIUS, 1);
  });

  it('never walks out of the room', () => {
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.7, 2.3]) {
      const walker = walk(start(), { forward: 1, strafe: 0.4, yaw }, 8);
      expect(isSolidAt(walls, walker.x, walker.z)).toBe(false);
    }
  });

  it('does not walk faster diagonally', () => {
    const straight = walk(start(), { forward: 1, strafe: 0, yaw: EAST }, 0.3);
    const diagonal = walk(start(), { forward: 1, strafe: 1, yaw: EAST }, 0.3);
    expect(Math.hypot(diagonal.vx, diagonal.vz)).toBeCloseTo(Math.hypot(straight.vx, straight.vz), 5);
  });
});
