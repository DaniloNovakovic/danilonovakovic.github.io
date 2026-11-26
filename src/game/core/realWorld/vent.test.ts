import { describe, expect, it } from 'vitest';
import { aimedFixture, PRY_SECONDS, stepPry, type Pry } from './interactions';
import {
  findCells,
  isSolidAt,
  LAB_ROOM,
  REAL_WORLD_CELL,
  REAL_WORLD_EYE_HEIGHT,
  REAL_WORLD_WALK_SPEED,
  VENT_CELL
} from './labRoom';
import { crawlAmount, ductCells, eyeHeightFor, farGrateCentre, grateCentre, isOpenDuct, mouthOf } from './vent';
import { REAL_WORLD_CRAWL_SPEED, stepWalker, type Walker } from './walker';

const vent = LAB_ROOM.vent!;
const DT = 1 / 60;
/** In front of the vent, in the corner behind the crates. */
const byTheVent = (): Walker => ({ x: 23, z: 16.5, vx: 0, vz: 0 });

/** Head for each point in turn; returns where the walker ended up and how long it took. */
function crawlAlong(from: Walker, points: ReadonlyArray<readonly [number, number]>, ventOpen: boolean) {
  let walker = from;
  let seconds = 0;
  for (const [tx, tz] of points) {
    for (let t = 0; t < 20; t += DT) {
      const dx = tx - walker.x;
      const dz = tz - walker.z;
      if (Math.hypot(dx, dz) < 0.1) break;
      walker = stepWalker(LAB_ROOM, walker, { forward: 1, strafe: 0, yaw: Math.atan2(-dx, -dz) }, DT, ventOpen);
      seconds += DT;
    }
  }
  return { walker, seconds };
}

const far = farGrateCentre(vent)!;
const ROUTE = [
  [29.25, 16.5],
  [29.25, 12],
  [far.x, far.z]
] as const;

describe('the lab vent', () => {
  it('sits behind the V grate: the mouth on the lab floor, the duct through the wall and beyond the lab', () => {
    const [grateCell] = findCells(LAB_ROOM.walls, 'V');
    const grate = grateCentre(vent);
    expect(Math.abs(grate.x - grateCell.x)).toBeCloseTo(REAL_WORLD_CELL / 2);
    expect(grate.z).toBeCloseTo(grateCell.z);
    const mouth = mouthOf(vent);
    expect(isSolidAt(LAB_ROOM.walls, mouth.x, mouth.z)).toBe(false);
    for (const cell of ductCells(vent).filter((candidate) => candidate.char !== 'm')) {
      expect(isSolidAt(LAB_ROOM.walls, cell.x, cell.z)).toBe(true);
    }
  });

  it('is a crawl space: lower than standing eye height, and ends at one far grate', () => {
    expect(vent.floor + vent.height).toBeLessThan(REAL_WORLD_EYE_HEIGHT);
    expect(ductCells(vent).filter((cell) => cell.char === 'g')).toHaveLength(1);
    expect(eyeHeightFor(vent, 1)).toBeLessThan(vent.floor + vent.height - 0.2);
    expect(eyeHeightFor(vent, 0)).toBe(REAL_WORLD_EYE_HEIGHT);
  });
});

describe('crawling through the lab vent', () => {
  it('stays shut until the grate is off', () => {
    const { walker } = crawlAlong(byTheVent(), ROUTE, false);
    expect(walker.x).toBeLessThan(24 - 0.5);
    expect(crawlAmount(vent, false, walker.x, walker.z)).toBe(0);
  });

  it('once open, lets Danilo duck in and crawl all the way to the far grate, slower than walking', () => {
    const { walker, seconds } = crawlAlong(byTheVent(), ROUTE, true);
    expect(Math.hypot(walker.x - far.x, walker.z - far.z)).toBeLessThan(0.15);
    expect(crawlAmount(vent, true, walker.x, walker.z)).toBe(1);
    const length = 29.25 - 23 + (16.5 - 12) + (far.x - 29.25);
    // Mostly on hands and knees: much slower than walking the same way.
    expect(seconds).toBeGreaterThan((length / REAL_WORLD_WALK_SPEED) * 1.6);
    expect(seconds).toBeLessThan(length / REAL_WORLD_CRAWL_SPEED + 1);
  });

  it('crouches gradually across the mouth, not before it', () => {
    const mouth = mouthOf(vent);
    const outer = crawlAmount(vent, true, mouth.x - mouth.dx * (VENT_CELL / 2 - 0.05), mouth.z);
    const middle = crawlAmount(vent, true, mouth.x, mouth.z);
    const inner = crawlAmount(vent, true, mouth.x + mouth.dx * (VENT_CELL / 2 - 0.05), mouth.z);
    expect(outer).toBeLessThan(0.05);
    expect(middle).toBeCloseTo(0.5);
    expect(inner).toBeGreaterThan(0.95);
    expect(crawlAmount(vent, true, 20, 10)).toBe(0);
  });

  it('keeps the crawler inside the duct: no way through its walls, nothing past the far grate', () => {
    // From the bend, pushing on east and south.
    const bend = crawlAlong(byTheVent(), [ROUTE[0]], true).walker;
    const east = crawlAlong(bend, [[40, 16.5]], true).walker;
    expect(isOpenDuct(vent, east.x + 0.5, east.z)).toBe(true);
    const south = crawlAlong(bend, [[29.25, 25]], true).walker;
    expect(south.z).toBeLessThan(vent.origin.z + vent.plan.length * VENT_CELL);
    // Past the far grate.
    const end = crawlAlong(byTheVent(), ROUTE, true).walker;
    const beyond = crawlAlong(end, [[45, far.z]], true).walker;
    expect(beyond.x).toBeLessThan(far.x + VENT_CELL / 2);
  });

  it('lets Danilo crawl back out and stand up in the lab', () => {
    const inside = crawlAlong(byTheVent(), [ROUTE[0]], true).walker;
    const back = crawlAlong(inside, [[21.5, 15]], true).walker;
    expect(back.x).toBeLessThan(22);
    expect(crawlAmount(vent, true, back.x, back.z)).toBe(0);
  });
});

describe('prying the grate off', () => {
  const closed: Pry = { progress: 0, open: false };
  const hold = (from: Pry, prying: boolean, seconds: number) => {
    let pry = from;
    for (let t = 0; t < seconds; t += DT) pry = stepPry(pry, prying, DT);
    return pry;
  };

  it('takes holding on for about a second', () => {
    expect(hold(closed, true, PRY_SECONDS * 0.5).open).toBe(false);
    expect(hold(closed, true, PRY_SECONDS + 0.05).open).toBe(true);
  });

  it('springs back when let go too soon, and stays off once off', () => {
    const half = hold(closed, true, PRY_SECONDS * 0.5);
    expect(hold(half, false, 1).progress).toBe(0);
    const off = hold(closed, true, PRY_SECONDS + 0.05);
    expect(hold(off, false, 2)).toEqual(off);
  });
});

describe('what the crosshair rests on', () => {
  const grate = grateCentre(vent);
  const lookAt = (eye: { x: number; y: number; z: number }, at: { x: number; y: number; z: number }) => {
    const dx = at.x - eye.x;
    const dy = at.y - eye.y;
    const dz = at.z - eye.z;
    return { ...eye, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
  };

  it('finds the grate from in front of it, until it is off', () => {
    const view = lookAt({ x: 22.6, y: REAL_WORLD_EYE_HEIGHT, z: 16.5 }, grate);
    expect(aimedFixture(LAB_ROOM, view, false)).toBe('grate');
    expect(aimedFixture(LAB_ROOM, view, true)).toBeNull();
  });

  it('does not reach the grate from across the room', () => {
    const view = lookAt({ x: 14, y: REAL_WORLD_EYE_HEIGHT, z: 16.5 }, grate);
    expect(aimedFixture(LAB_ROOM, view, false)).toBeNull();
  });

  it('finds the locked door and, at the end of the duct, the far grate', () => {
    const [door] = findCells(LAB_ROOM.walls, 'D');
    const doorFace = { x: door.x, y: 1.35, z: door.z - REAL_WORLD_CELL / 2 };
    expect(aimedFixture(LAB_ROOM, lookAt({ x: door.x, y: REAL_WORLD_EYE_HEIGHT, z: 16.5 }, doorFace), false)).toBe(
      'door'
    );
    const crawler = { x: far.x - 1, y: eyeHeightFor(vent, 1), z: far.z };
    expect(aimedFixture(LAB_ROOM, lookAt(crawler, far), true)).toBe('farGrate');
  });
});
