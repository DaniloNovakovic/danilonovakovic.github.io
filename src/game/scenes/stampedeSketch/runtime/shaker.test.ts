import { describe, expect, it } from 'vitest';
import {
  createShakerShot,
  puddleSlowFactor,
  shakerPosition,
  STAMPEDE_PUDDLE_RADIUS,
  STAMPEDE_PUDDLE_SLOW,
  stepShakers
} from './shaker';

describe('protein shaker', () => {
  it('arcs over the field and lands on the spot it was aimed at', () => {
    const shot = createShakerShot({ x: 0, y: 0 }, { x: 200, y: 0 }, 0);
    const mid = shakerPosition(shot, (shot.landsAtMs - shot.thrownAtMs) / 2);
    expect(mid.x).toBeCloseTo(100);
    expect(mid.y).toBeLessThan(0);

    const flying = stepShakers([shot], [], shot.landsAtMs - 1);
    expect(flying.shots).toHaveLength(1);
    expect(flying.puddles).toHaveLength(0);

    const landed = stepShakers([shot], [], shot.landsAtMs);
    expect(landed.shots).toHaveLength(0);
    expect(landed.puddles[0]).toMatchObject({ x: 200, y: 0 });
  });

  it('slows the player only while standing in a fresh puddle', () => {
    const puddles = [{ x: 0, y: 0, untilMs: 1_000 }];
    expect(puddleSlowFactor(puddles, { x: STAMPEDE_PUDDLE_RADIUS - 1, y: 0 })).toBe(STAMPEDE_PUDDLE_SLOW);
    expect(puddleSlowFactor(puddles, { x: STAMPEDE_PUDDLE_RADIUS + 1, y: 0 })).toBe(1);
    expect(stepShakers([], puddles, 1_000).puddles).toHaveLength(0);
  });
});
