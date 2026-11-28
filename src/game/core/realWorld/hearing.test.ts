import { describe, expect, it } from 'vitest';
import { clearLine, hears, wayTo } from './hearing';
import { isSolidAt } from './labRoom';
import { SHIP_DECK } from './shipDeck';

const { walls } = SHIP_DECK;
const can = (x: number, z: number) => ({ x, z, reach: 9 });

describe('hearing a noise', () => {
  it('carries down the open corridor, but hardly through walls', () => {
    expect(hears(walls, { x: 13.5, z: 31 }, can(13.5, 24), false)).toBe(true);
    // The laundry is right behind the corridor's west wall: only a noise close by gets through.
    expect(hears(walls, { x: 13.5, z: 22.5 }, can(7.5, 22.5), false)).toBe(false);
    expect(hears(walls, { x: 13.5, z: 22.5 }, can(10.5, 22.5), false)).toBe(true);
    // Out of reach is out of reach.
    expect(hears(walls, { x: 13.5, z: 5 }, can(13.5, 31), false)).toBe(false);
  });

  it('is heard by the officer at the desk from the bottom of the corridor', () => {
    expect(hears(walls, { x: 16, z: 39.6 }, can(13.5, 31), false)).toBe(true);
  });
});

describe('the way to a noise', () => {
  it('goes round the walls, through the doorways, never through a wall', () => {
    // From the corridor to the laundry: round by the break room or the security post, not through the wall between.
    const from = { x: 13.5, z: 22.5 };
    const way = wayTo(walls, from, { x: 6, z: 22 }, false)!;
    expect(way.at(-1)).toEqual({ x: 6, z: 22 });
    let at = from;
    for (const point of way) {
      expect(clearLine(walls, at, point, false), `${at.x},${at.z} → ${point.x},${point.z}`).toBe(true);
      expect(isSolidAt(walls, point.x, point.z)).toBe(false);
      at = point;
    }
    const zs = way.map((point) => point.z);
    expect(Math.min(...zs) < 9 || Math.max(...zs) > 33).toBe(true);
  });

  it('is a straight line when nothing is in the way', () => {
    expect(wayTo(walls, { x: 13.5, z: 31 }, { x: 13.5, z: 24 }, false)).toEqual([{ x: 13.5, z: 24 }]);
  });

  it('doesn’t go through the storeroom’s shut door', () => {
    expect(wayTo(walls, { x: 13.5, z: 22.5 }, { x: 21, z: 22.5 }, false)).toBeNull();
    expect(wayTo(walls, { x: 13.5, z: 22.5 }, { x: 21, z: 22.5 }, true)).not.toBeNull();
  });
});
