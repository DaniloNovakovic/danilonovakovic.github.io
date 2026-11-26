import { describe, expect, it } from 'vitest';
import { aimedFixture, PRY_SECONDS, stepPry, type Opened, type Pry } from './interactions';
import {
  findCells,
  isSolidAt,
  LAB_ROOM,
  REAL_WORLD_CELL,
  REAL_WORLD_EYE_HEIGHT,
  REAL_WORLD_WALK_SPEED,
  VENT_CELL
} from './labRoom';
import {
  crawlAmount,
  ductCells,
  eyeHeightFor,
  floorGrateCentre,
  grateCentre,
  isOpenDuct,
  isOverDrop,
  mouthOf
} from './vent';
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

const peek = floorGrateCentre(vent, 'g')!;
const drop = floorGrateCentre(vent, 'o')!;
/** The duct's centre line: east through the wall, north, east over both grates' row, south to the drop. */
const TO_PEEK = [
  [29.25, 16.5],
  [29.25, 12],
  [peek.x, peek.z]
] as const;
const TO_DROP = [...TO_PEEK, [drop.x, peek.z], [drop.x, drop.z]] as const;
const near = (walker: Walker, point: { x: number; z: number }) => Math.hypot(walker.x - point.x, walker.z - point.z);

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

  it('is a crawl space with two floor grates: one bolted to look through, then one that opens', () => {
    expect(vent.floor + vent.height).toBeLessThan(REAL_WORLD_EYE_HEIGHT);
    expect(ductCells(vent).filter((cell) => cell.char === 'g')).toHaveLength(1);
    expect(ductCells(vent).filter((cell) => cell.char === 'o')).toHaveLength(1);
    expect(eyeHeightFor(vent, 1)).toBeLessThan(vent.floor + vent.height - 0.2);
    expect(eyeHeightFor(vent, 0)).toBe(REAL_WORLD_EYE_HEIGHT);
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
});

describe('crawling through the lab vent', () => {
  it('stays shut until the grate is off', () => {
    const { walker } = crawlAlong(byTheVent(), TO_DROP, false);
    expect(walker.x).toBeLessThan(24 - 0.5);
    expect(crawlAmount(vent, false, walker.x, walker.z)).toBe(0);
  });

  it('once open, lets Danilo crawl over the bolted grate all the way to the drop, slower than walking', () => {
    const toPeek = crawlAlong(byTheVent(), TO_PEEK, true);
    expect(near(toPeek.walker, peek)).toBeLessThan(0.15);
    const { walker, seconds } = crawlAlong(byTheVent(), TO_DROP, true);
    expect(near(walker, drop)).toBeLessThan(0.15);
    expect(crawlAmount(vent, true, walker.x, walker.z)).toBe(1);
    const length = 29.25 - 23 + (16.5 - peek.z) + (drop.x - 29.25) + (drop.z - peek.z);
    // Mostly on hands and knees: much slower than walking the same way.
    expect(seconds).toBeGreaterThan((length / REAL_WORLD_WALK_SPEED) * 1.6);
    expect(seconds).toBeLessThan(length / REAL_WORLD_CRAWL_SPEED + 1);
  });

  it('keeps the crawler inside the duct: no way through its walls, nothing past the drop', () => {
    const bend = crawlAlong(byTheVent(), [TO_PEEK[0]], true).walker;
    const east = crawlAlong(bend, [[40, 16.5]], true).walker;
    expect(isOpenDuct(vent, east.x + 0.5, east.z)).toBe(true);
    const south = crawlAlong(bend, [[29.25, 25]], true).walker;
    expect(south.z).toBeLessThan(vent.origin.z + vent.plan.length * VENT_CELL);
    const end = crawlAlong(byTheVent(), TO_DROP, true).walker;
    for (const away of [
      [60, drop.z],
      [drop.x, 30]
    ] as const) {
      const pushed = crawlAlong(end, [away], true).walker;
      expect(near(pushed, drop)).toBeLessThan(VENT_CELL / 2);
    }
  });

  it('only drops through once the drop grate is off, and only over it', () => {
    expect(isOverDrop(vent, false, drop.x, drop.z)).toBe(false);
    expect(isOverDrop(vent, true, drop.x, drop.z)).toBe(true);
    expect(isOverDrop(vent, true, peek.x, peek.z)).toBe(false);
  });

  it('lets Danilo crawl back out and stand up in the lab', () => {
    const inside = crawlAlong(byTheVent(), [TO_PEEK[0]], true).walker;
    const back = crawlAlong(inside, [[21.5, 15]], true).walker;
    expect(back.x).toBeLessThan(22);
    expect(crawlAmount(vent, true, back.x, back.z)).toBe(0);
  });
});

describe('prying a grate off', () => {
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
  const shut: Opened = { grate: false, dropGrate: false };
  const lookAt = (eye: { x: number; y: number; z: number }, at: { x: number; y: number; z: number }) => {
    const dx = at.x - eye.x;
    const dy = at.y - eye.y;
    const dz = at.z - eye.z;
    return { ...eye, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
  };

  it('finds the grate from in front of it, until it is off', () => {
    const view = lookAt({ x: 22.6, y: REAL_WORLD_EYE_HEIGHT, z: 16.5 }, grate);
    expect(aimedFixture(LAB_ROOM, view, shut)).toBe('grate');
    expect(aimedFixture(LAB_ROOM, view, { ...shut, grate: true })).toBeNull();
  });

  it('does not reach the grate from across the room', () => {
    const view = lookAt({ x: 14, y: REAL_WORLD_EYE_HEIGHT, z: 16.5 }, grate);
    expect(aimedFixture(LAB_ROOM, view, shut)).toBeNull();
  });

  it('finds the locked door, and in the duct the bolted grate and then the drop grate', () => {
    const [door] = findCells(LAB_ROOM.walls, 'D');
    const doorFace = { x: door.x, y: 1.35, z: door.z - REAL_WORLD_CELL / 2 };
    expect(aimedFixture(LAB_ROOM, lookAt({ x: door.x, y: REAL_WORLD_EYE_HEIGHT, z: 16.5 }, doorFace), shut)).toBe(
      'door'
    );
    const open = { grate: true, dropGrate: false };
    const overPeek = { x: peek.x - 1, y: eyeHeightFor(vent, 1), z: peek.z };
    expect(aimedFixture(LAB_ROOM, lookAt(overPeek, peek), open)).toBe('peekGrate');
    const overDrop = { x: drop.x, y: eyeHeightFor(vent, 1), z: drop.z - 1 };
    expect(aimedFixture(LAB_ROOM, lookAt(overDrop, drop), open)).toBe('dropGrate');
    expect(aimedFixture(LAB_ROOM, lookAt(overDrop, drop), { grate: true, dropGrate: true })).toBeNull();
  });
});
