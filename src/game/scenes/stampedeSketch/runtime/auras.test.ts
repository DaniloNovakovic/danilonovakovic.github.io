import { describe, expect, it } from 'vitest';
import { createOrbitHitState, getBreathAura, stepOrbitHits } from './auras';

describe('chick magnet stink circles', () => {
  it('adds more circles and swings them faster after the upgrade', () => {
    const first = getBreathAura(1);
    const meaner = getBreathAura(2);
    expect(meaner.count).toBeGreaterThan(first.count);
    expect(meaner.radiansPerSecond).toBeGreaterThan(first.radiansPerSecond);
  });

  it('spoils a chick standing in the circle and then waits', () => {
    const aura = getBreathAura(1);
    const first = stepOrbitHits({
      state: createOrbitHitState(),
      aura,
      elapsedMs: 1_000,
      deltaMs: 0,
      player: { x: 0, y: 0 },
      candidates: [{ id: 'mark', x: aura.radius, y: 0 }]
    });
    const second = stepOrbitHits({
      state: first.state,
      aura,
      elapsedMs: 1_000 + aura.hitGapMs - 1,
      deltaMs: 0,
      player: { x: 0, y: 0 },
      candidates: [{ id: 'mark', x: aura.radius, y: 0 }]
    });

    expect(first.hitIds).toEqual(['mark']);
    expect(first.points).toHaveLength(1);
    expect(second.hitIds).toEqual([]);
  });
});
