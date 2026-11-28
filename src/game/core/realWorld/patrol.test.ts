import { describe, expect, it } from 'vitest';
import { angleBetween, startPatrol, stepPatrol, turnTowards, yawTowards, type Patrol, type Route } from './patrol';

const DT = 1 / 60;
const run = (route: Route, patrol: Patrol, seconds: number, each?: (patrol: Patrol) => void) => {
  for (let t = 0; t < seconds; t += DT) {
    patrol = stepPatrol(route, patrol, DT);
    each?.(patrol);
  }
  return patrol;
};

const LINE: Route = {
  mode: 'pingPong',
  speed: 2,
  turnSpeed: 4,
  posts: [
    { x: 0, z: 0, wait: 1, look: 0 },
    { x: 0, z: 10, wait: 1 }
  ]
};

describe('a patrol round', () => {
  it('faces the way it means to go: 0 north, π/2 west, π south', () => {
    expect(yawTowards(0, 0, 0, -1)).toBeCloseTo(0);
    expect(yawTowards(0, 0, -1, 0)).toBeCloseTo(Math.PI / 2);
    expect(Math.abs(yawTowards(0, 0, 0, 1))).toBeCloseTo(Math.PI);
    expect(angleBetween(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(turnTowards(0, 1, 0.25)).toBeCloseTo(0.25);
  });

  it('starts at the first post, looking where it says', () => {
    expect(startPatrol(LINE)).toMatchObject({ x: 0, z: 0, yaw: 0, target: 0 });
  });

  it('walks there and back for ever, standing at each end', () => {
    let farthest = 0;
    let back = Infinity;
    run(LINE, startPatrol(LINE), 20, (patrol) => {
      farthest = Math.max(farthest, patrol.z);
      if (farthest >= 10) back = Math.min(back, patrol.z);
    });
    expect(farthest).toBeCloseTo(10);
    expect(back).toBeLessThan(0.01);
  });

  it('never walks faster than its speed', () => {
    let last = startPatrol(LINE);
    run(LINE, last, 8, (patrol) => {
      expect(Math.hypot(patrol.x - last.x, patrol.z - last.z)).toBeLessThanOrEqual(LINE.speed * DT + 1e-9);
      last = patrol;
    });
  });

  it('turns on the spot at posts in the same place: a guard looking round', () => {
    const watch: Route = {
      mode: 'pingPong',
      speed: 1,
      turnSpeed: 2,
      posts: [
        { x: 0, z: 0, wait: 2, look: 0 },
        { x: 0, z: 0, wait: 2, look: Math.PI / 2 }
      ]
    };
    const yaws: number[] = [];
    const end = run(watch, startPatrol(watch), 10, (patrol) => yaws.push(patrol.yaw));
    expect(end.x).toBe(0);
    expect(Math.max(...yaws)).toBeCloseTo(Math.PI / 2);
    expect(Math.min(...yaws)).toBeCloseTo(0);
  });

  it('stops at the end of a once-only route', () => {
    const once: Route = { ...LINE, mode: 'once' };
    const end = run(once, startPatrol(once), 15);
    expect(end).toMatchObject({ z: 10, done: true, moving: false });
  });
});
