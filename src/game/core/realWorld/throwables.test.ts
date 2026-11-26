import { describe, expect, it } from 'vitest';
import { footprintOf, furnitureOf, isSolidAt, LAB_ROOM, REAL_WORLD_WALL_HEIGHT } from './labRoom';
import {
  aimedThrowable,
  LAB_THROWABLES,
  stepThrowable,
  throwableRadius,
  throwThrowable,
  type Throwable
} from './throwables';

function fly(thing: Throwable, seconds: number): Throwable[] {
  const path = [thing];
  for (let t = 0; t < seconds; t += 1 / 60) path.push(stepThrowable(LAB_ROOM, path.at(-1)!, 1 / 60));
  return path;
}

const ball = () => ({ ...LAB_THROWABLES.find((thing) => thing.kind === 'ball')! });
const EAST = -Math.PI / 2;
const eye = { x: LAB_ROOM.wake.x, y: 1.6, z: LAB_ROOM.wake.z };
const walls = LAB_ROOM.walls;

describe('loose things in the lab', () => {
  it('all start at rest on something, inside the room', () => {
    for (const thing of LAB_THROWABLES) {
      const settled = fly(thing, 0.5).at(-1)!;
      expect(settled.y).toBeCloseTo(thing.y, 1);
      expect(isSolidAt(walls, thing.x, thing.z)).toBe(false);
    }
  });

  it('a dropped ball bounces, then settles on the floor', () => {
    const path = fly({ ...ball(), y: 2.5 }, 6);
    const lowest = Math.min(...path.map((p) => p.y));
    expect(lowest).toBeCloseTo(throwableRadius('ball'), 2);
    const bounced = path.some((p, i) => i > 0 && p.vy > 0 && path[i - 1].vy <= 0);
    expect(bounced).toBe(true);
    expect(path.at(-1)).toMatchObject({ vx: 0, vy: 0, vz: 0, y: throwableRadius('ball') });
  });

  it('a thrown ball comes back off the wall and never leaves the room', () => {
    const thrown = throwThrowable(ball(), eye, { ...eye, yaw: EAST, pitch: 0.1 });
    expect(thrown.vx).toBeGreaterThan(5);
    const path = fly(thrown, 6);
    expect(path.some((p) => p.vx < 0)).toBe(true);
    for (const p of path) {
      expect(isSolidAt(walls, p.x, p.z)).toBe(false);
      expect(p.y).toBeLessThanOrEqual(REAL_WORLD_WALL_HEIGHT);
    }
  });

  it('paper barely bounces', () => {
    const paper = { ...LAB_THROWABLES.find((thing) => thing.kind === 'paper')!, x: 10, z: 10, y: 2.5 };
    const path = fly(paper, 3);
    const landed = path.findIndex((p, i) => i > 0 && path[i - 1].vy < 0 && p.vy >= 0);
    expect(landed).toBeGreaterThan(0);
    const rebound = Math.max(...path.slice(landed).map((p) => p.y));
    expect(rebound).toBeLessThan(0.6);
  });

  it('lands on the operating table, not through it', () => {
    const table = footprintOf(furnitureOf(LAB_ROOM, 'table')!);
    const settled = fly({ ...ball(), x: table.x + 1, z: table.z, y: 2.5 }, 6).at(-1)!;
    expect(settled.y).toBeGreaterThan(1);
  });

  it('bounces off the side of the watch desk, a box', () => {
    const desk = footprintOf(furnitureOf(LAB_ROOM, 'desk')!);
    const low = { ...ball(), x: desk.x + 3, y: 0.3, z: desk.z + 1.5, vx: -8, vy: 0, vz: 0 };
    const path = fly(low, 1);
    expect(path.some((p) => p.vx > 0)).toBe(true);
    expect(Math.min(...path.map((p) => p.x))).toBeGreaterThan(desk.x);
  });
});

describe('aiming', () => {
  it('picks the thing under the crosshair and within reach', () => {
    const near = { ...ball(), x: eye.x + 1.5, y: 1.4, z: eye.z };
    expect(aimedThrowable([near], { ...eye, yaw: EAST, pitch: 0 })?.id).toBe('ball');
    expect(aimedThrowable([near], { ...eye, yaw: -EAST, pitch: 0 })).toBeNull();
    const far = { ...near, x: eye.x + 6 };
    expect(aimedThrowable([far], { ...eye, yaw: EAST, pitch: 0 })).toBeNull();
  });
});

describe('aiming at the floor', () => {
  it('grabs a ball by your feet when looking down at it, roughly', () => {
    const atFeet = { ...ball(), x: eye.x + 1.2, y: 0.2, z: eye.z };
    // Straight at it would be about -0.86 rad; a bit off still counts.
    expect(aimedThrowable([atFeet], { ...eye, yaw: EAST, pitch: -0.7 })?.id).toBe('ball');
    expect(aimedThrowable([atFeet], { ...eye, yaw: EAST, pitch: 0 })).toBeNull();
  });
});
