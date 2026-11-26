import { describe, expect, it } from 'vitest';
import {
  cellAt,
  findCells,
  findProps,
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

const start = (): Walker => ({ ...findCells(LAB_ROOM, 'P')[0], vx: 0, vz: 0 });
const NORTH = 0;
const EAST = -Math.PI / 2;

describe('the lab room', () => {
  it('has one wake-up spot, one pod, a vent and a locked door', () => {
    expect(findCells(LAB_ROOM, 'P')).toHaveLength(1);
    expect(findCells(LAB_ROOM, 'O')).toHaveLength(1);
    expect(findCells(LAB_ROOM, 'V')).toHaveLength(1);
    expect(findCells(LAB_ROOM, 'D')).toHaveLength(1);
  });

  it('treats walls, the vent, the door and anything off the map as solid', () => {
    const [vent] = findCells(LAB_ROOM, 'V');
    const [door] = findCells(LAB_ROOM, 'D');
    expect(isSolidAt(LAB_ROOM, vent.x, vent.z)).toBe(true);
    expect(isSolidAt(LAB_ROOM, door.x, door.z)).toBe(true);
    expect(isSolidAt(LAB_ROOM, -1, -1)).toBe(true);
    expect(cellAt(LAB_ROOM, 999, 999)).toBe('#');
    expect(isSolidAt(LAB_ROOM, start().x, start().z)).toBe(false);
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

  it('stops at the vent wall, a radius short of it', () => {
    const walker = walk(start(), { forward: 1, strafe: 0, yaw: EAST }, 8);
    const wallFace = 8 * REAL_WORLD_CELL;
    expect(walker.x).toBeLessThanOrEqual(wallFace - REAL_WORLD_PLAYER_RADIUS + 0.1);
    expect(walker.x).toBeGreaterThan(wallFace - REAL_WORLD_PLAYER_RADIUS - 0.2);
  });

  it('bumps into the pod instead of walking through it', () => {
    const [pod] = findProps(LAB_ROOM).filter((prop) => prop.radius > 1);
    const walker = walk(start(), { forward: 1, strafe: 0, yaw: NORTH }, 3);
    expect(Math.hypot(walker.x - pod.x, walker.z - pod.z)).toBeGreaterThanOrEqual(
      pod.radius + REAL_WORLD_PLAYER_RADIUS - 0.1
    );
  });

  it('slides along a wall when walking into it at an angle', () => {
    const northEast = -Math.PI / 4;
    const walker = walk(start(), { forward: 1, strafe: 0, yaw: northEast }, 3);
    expect(walker.x).toBeGreaterThan(start().x + 4);
    expect(walker.z).toBeLessThan(start().z);
  });

  it('never walks out of the room', () => {
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.7, 2.3]) {
      const walker = walk(start(), { forward: 1, strafe: 0.4, yaw }, 8);
      expect(isSolidAt(LAB_ROOM, walker.x, walker.z)).toBe(false);
    }
  });

  it('does not walk faster diagonally', () => {
    const straight = walk(start(), { forward: 1, strafe: 0, yaw: EAST }, 0.3);
    const diagonal = walk(start(), { forward: 1, strafe: 1, yaw: EAST }, 0.3);
    expect(Math.hypot(diagonal.vx, diagonal.vz)).toBeCloseTo(Math.hypot(straight.vx, straight.vz), 5);
  });
});
