import { describe, expect, it } from 'vitest';
import { getBreathBeam, getStinkAura, stepBreathBeam, stepOrbitHits, createOrbitHitState } from './auras';

describe('chick magnet breath and stink', () => {
  it('pours bad breath only along the direction you face', () => {
    const beam = getBreathBeam(1);
    const cast = stepBreathBeam({
      state: {},
      beam,
      elapsedMs: 1_000,
      player: { x: 0, y: 0 },
      facing: { x: 1, y: 0 },
      candidates: [
        { id: 'ahead', x: 90, y: 4 },
        { id: 'behind', x: -40, y: 0 },
        { id: 'aside', x: 70, y: 40 }
      ]
    });
    const farther = stepBreathBeam({
      state: {},
      beam: getBreathBeam(2),
      elapsedMs: 1_000,
      player: { x: 0, y: 0 },
      facing: { x: 1, y: 0 },
      candidates: [{ id: 'far', x: 220, y: 0 }]
    });

    expect(cast.hitIds).toEqual(['ahead']);
    expect(getBreathBeam(2).range).toBeGreaterThan(beam.range);
    expect(farther.hitIds).toEqual(['far']);
  });

  it('swings more stink clouds after the upgrade and skips perfume', () => {
    const first = getStinkAura(1);
    const meaner = getStinkAura(2);
    expect(meaner.count).toBeGreaterThan(first.count);
    expect(meaner.radiansPerSecond).toBeGreaterThan(first.radiansPerSecond);

    const hit = stepOrbitHits({
      state: createOrbitHitState(),
      aura: first,
      elapsedMs: 1_000,
      deltaMs: 0,
      player: { x: 0, y: 0 },
      candidates: [
        { id: 'chick', x: first.radius, y: 0 },
        { id: 'perfume', x: first.radius, y: 0, kind: 'perfume' }
      ]
    });
    expect(hit.hitIds).toEqual(['chick']);
    expect(hit.points).toHaveLength(1);
  });
});
