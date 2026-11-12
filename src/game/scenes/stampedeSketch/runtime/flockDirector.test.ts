import { describe, expect, it } from 'vitest';
import {
  pickStampedeSpawnPoint,
  STAMPEDE_FLOCK_POOL_SIZE,
  stampedeFlockTarget,
  stampedeOvertimeToughness,
  stampedeSpawnGapMs
} from './flockDirector';
import { STAMPEDE_WORLD } from './movement';

const DURATION = 120_000;

describe('flock director', () => {
  it('opens with a couple of birds and grows over the run', () => {
    const opening = stampedeFlockTarget({ elapsedMs: 0, durationMs: DURATION });
    const middle = stampedeFlockTarget({ elapsedMs: DURATION / 2, durationMs: DURATION });
    const late = stampedeFlockTarget({ elapsedMs: DURATION, durationMs: DURATION });

    expect(opening).toBe(2);
    expect(middle).toBeGreaterThan(opening);
    expect(late).toBeGreaterThan(middle);
  });

  it('adds birds for surges and last call without exceeding the pool', () => {
    const base = stampedeFlockTarget({ elapsedMs: 60_000, durationMs: DURATION });
    expect(stampedeFlockTarget({ elapsedMs: 60_000, durationMs: DURATION, surge: true })).toBeGreaterThan(base);
    expect(stampedeFlockTarget({
      elapsedMs: DURATION,
      durationMs: DURATION,
      surge: true,
      lastCall: true
    })).toBeLessThanOrEqual(STAMPEDE_FLOCK_POOL_SIZE);
  });

  it('spawns faster later and during surges', () => {
    expect(stampedeSpawnGapMs(DURATION, DURATION)).toBeLessThan(stampedeSpawnGapMs(0, DURATION));
    expect(stampedeSpawnGapMs(0, DURATION, true)).toBeLessThan(stampedeSpawnGapMs(0, DURATION));
  });

  it('keeps escalating in endless overtime up to the pool size', () => {
    const atClock = stampedeFlockTarget({ elapsedMs: DURATION, durationMs: DURATION });
    const overtime = stampedeFlockTarget({ elapsedMs: DURATION + 60_000, durationMs: DURATION });
    expect(overtime).toBeGreaterThan(atClock);
    expect(stampedeFlockTarget({ elapsedMs: DURATION * 20, durationMs: DURATION }))
      .toBe(STAMPEDE_FLOCK_POOL_SIZE);
    expect(stampedeSpawnGapMs(DURATION + 120_000, DURATION)).toBeLessThan(stampedeSpawnGapMs(DURATION, DURATION));
    expect(stampedeSpawnGapMs(DURATION * 20, DURATION)).toBeGreaterThan(100);
  });

  it('toughens newcomers only past the regular clock, with a ceiling', () => {
    expect(stampedeOvertimeToughness(DURATION, DURATION)).toEqual({ speedScale: 1, bonusHp: 0 });
    const threeMinutes = stampedeOvertimeToughness(DURATION + 180_000, DURATION);
    expect(threeMinutes.speedScale).toBeGreaterThan(1);
    expect(threeMinutes.bonusHp).toBe(2);
    expect(stampedeOvertimeToughness(DURATION * 30, DURATION)).toEqual({ speedScale: 1.6, bonusHp: 4 });
  });

  it('spawns just off camera but inside the field', () => {
    const view = { x: 300, y: 200, width: 1000, height: 600 };
    for (let roll = 0; roll < 1; roll += 0.1) {
      const point = pickStampedeSpawnPoint(view, STAMPEDE_WORLD, { x: 800, y: 500 }, () => roll);
      const onScreen = point.x > view.x && point.x < view.x + view.width
        && point.y > view.y && point.y < view.y + view.height;
      expect(onScreen).toBe(false);
      expect(point.x).toBeGreaterThanOrEqual(STAMPEDE_WORLD.safeLeft);
      expect(point.x).toBeLessThanOrEqual(STAMPEDE_WORLD.safeRight);
      expect(point.y).toBeGreaterThanOrEqual(STAMPEDE_WORLD.safeTop);
      expect(point.y).toBeLessThanOrEqual(STAMPEDE_WORLD.safeBottom);
    }
  });

  it('falls back to the far corner when the camera covers the whole field', () => {
    const view = { x: -200, y: -200, width: 2_200, height: 1_500 };
    const point = pickStampedeSpawnPoint(view, STAMPEDE_WORLD, { x: 100, y: 100 }, () => 0.5);
    expect(point).toEqual({ x: STAMPEDE_WORLD.safeRight, y: STAMPEDE_WORLD.safeBottom });
  });
});
