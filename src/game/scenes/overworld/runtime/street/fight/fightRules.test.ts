import { describe, expect, it } from 'vitest';
import { HAMMER_REACH, inHammerReach, lobVelocityX } from './fightRules';

describe('inHammerReach', () => {
  const danilo = { x: 500, y: 520 };

  it('hits in front of Danilo, the way he faces', () => {
    expect(inHammerReach(danilo, false, { x: 600, y: 520 })).toBe(true);
    expect(inHammerReach(danilo, true, { x: 400, y: 520 })).toBe(true);
  });

  it('misses what is well behind him or out of reach', () => {
    expect(inHammerReach(danilo, false, { x: 400, y: 520 })).toBe(false);
    expect(inHammerReach(danilo, false, { x: 500 + HAMMER_REACH.front + 1, y: 520 })).toBe(false);
    expect(inHammerReach(danilo, false, { x: 500 - HAMMER_REACH.back, y: 520 })).toBe(true);
  });

  it('reaches the low pigeon lane only off the ground', () => {
    const lowLane = { x: 560, y: 548 - 150 };
    expect(inHammerReach(danilo, false, lowLane)).toBe(false);
    expect(inHammerReach({ x: 500, y: 455 }, false, lowLane)).toBe(true);
    expect(inHammerReach({ x: 500, y: 455 }, false, { x: 560, y: 548 - 230 })).toBe(false);
  });
});

describe('lobVelocityX', () => {
  /** Steps the drop like the scene does and returns its x when it reaches the target height. */
  function landingX(from: { x: number; y: number }, to: { x: number; y: number }): number {
    const gravity = 700;
    let vy = 60;
    const vx = lobVelocityX(from, to, gravity, vy);
    let { x, y } = from;
    const dt = 1 / 240;
    while (y < to.y) {
      vy += gravity * dt;
      x += vx * dt;
      y += vy * dt;
    }
    return x;
  }

  it('lands on Danilo if he stands still', () => {
    expect(landingX({ x: 380, y: 398 }, { x: 500, y: 500 })).toBeCloseTo(500, -1);
    expect(landingX({ x: 640, y: 318 }, { x: 500, y: 500 })).toBeCloseTo(500, -1);
  });

  it('drops straight down when already overhead', () => {
    expect(lobVelocityX({ x: 500, y: 300 }, { x: 500, y: 500 }, 700, 60)).toBe(0);
  });
});
