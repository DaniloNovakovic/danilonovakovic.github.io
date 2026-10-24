import { describe, expect, it } from 'vitest';
import {
  getBreathBeam,
  getStinkAura,
  sampleBreathBubbles,
  stepBreathBeam,
  stepOrbitHits,
  createOrbitHitState
} from './auras';

describe('chick magnet breath and stink', () => {
  it('pours green bubbles only along the direction you face', () => {
    const beam = getBreathBeam();
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
    const wide = stepBreathBeam({
      state: {},
      beam: getBreathBeam({ wide: true }),
      elapsedMs: 1_000,
      player: { x: 0, y: 0 },
      facing: { x: 1, y: 0 },
      candidates: [{ id: 'aside', x: 70, y: 40 }]
    });
    const lingering = stepBreathBeam({
      state: {},
      beam,
      elapsedMs: 1_000,
      player: { x: 0, y: 0 },
      facing: { x: 1, y: 0 },
      candidates: [{ id: 'leftover', x: -30, y: 20 }],
      linger: [{ x: -30, y: 20 }]
    });

    expect(cast.hitIds).toEqual(['ahead']);
    expect(wide.hitIds).toEqual(['aside']);
    expect(lingering.hitIds).toEqual(['leftover']);
    expect(sampleBreathBubbles({ x: 0, y: 0 }, { x: 1, y: 0 }, beam).length).toBeGreaterThan(3);
    expect(getBreathBeam({ wide: true }).halfWidth).toBeGreaterThan(beam.halfWidth);
  });

  it('twists the stink cloud without giving perfume a pass', () => {
    const first = getStinkAura();
    const twin = getStinkAura({ twin: true, far: true, fast: true, fat: true });
    expect(twin.count).toBe(2);
    expect(twin.radius).toBeGreaterThan(first.radius);
    expect(twin.radiansPerSecond).toBeGreaterThan(first.radiansPerSecond);
    expect(twin.hitRadius).toBeGreaterThan(first.hitRadius);

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
