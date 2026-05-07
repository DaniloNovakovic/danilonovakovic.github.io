import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_BUILD_MS,
  STAMPEDE_CONTACT_COOLDOWN_MS,
  STAMPEDE_CONTACT_RADIUS_PADDING,
  STAMPEDE_OPENING_CALM_MS,
  STAMPEDE_RECOVER_MS,
  STAMPEDE_SURGE_MS,
  canApplyStampedeContact,
  resolveStampedePressure
} from './pressure';

describe('stampede pressure', () => {
  it('moves through repeating cadence bands over the run', () => {
    const base = {
      durationMs: 75_000,
      player: { x: 0, y: 0 },
      candidates: []
    };

    expect(resolveStampedePressure({ ...base, elapsedMs: 0 }).band).toBe('calm');
    expect(resolveStampedePressure({ ...base, elapsedMs: STAMPEDE_OPENING_CALM_MS }).band).toBe('build');
    expect(resolveStampedePressure({
      ...base,
      elapsedMs: STAMPEDE_OPENING_CALM_MS + STAMPEDE_BUILD_MS
    }).band).toBe('surge');
    expect(resolveStampedePressure({
      ...base,
      elapsedMs: STAMPEDE_OPENING_CALM_MS + STAMPEDE_BUILD_MS + STAMPEDE_SURGE_MS
    }).band).toBe('recover');
    expect(resolveStampedePressure({
      ...base,
      elapsedMs:
        STAMPEDE_OPENING_CALM_MS +
        STAMPEDE_BUILD_MS +
        STAMPEDE_SURGE_MS +
        STAMPEDE_RECOVER_MS
    }).band).toBe('build');
    expect(
      resolveStampedePressure({
        ...base,
        elapsedMs: STAMPEDE_OPENING_CALM_MS + STAMPEDE_BUILD_MS,
        lastContactAtMs: STAMPEDE_OPENING_CALM_MS + STAMPEDE_BUILD_MS - 500
      }).band
    ).toBe('recover');
  });

  it('keeps cadence fastest during surge and slowest while calm', () => {
    const base = {
      durationMs: 75_000,
      player: { x: 0, y: 0 },
      candidates: []
    };
    const calm = resolveStampedePressure({ ...base, elapsedMs: 0 });
    const surge = resolveStampedePressure({ ...base, elapsedMs: 70_000 });

    expect(surge.cadenceMs).toBeLessThan(calm.cadenceMs);
  });

  it('clamps pressure between zero and one', () => {
    const early = resolveStampedePressure({
      elapsedMs: -1_000,
      durationMs: 75_000,
      player: { x: 0, y: 0 },
      candidates: []
    });
    const late = resolveStampedePressure({
      elapsedMs: 100_000,
      durationMs: 75_000,
      player: { x: 0, y: 0 },
      candidates: [{ x: 0, y: 0, radius: 40 }]
    });

    expect(early.pressure).toBeGreaterThanOrEqual(0);
    expect(early.pressure).toBeLessThanOrEqual(1);
    expect(late.pressure).toBeGreaterThanOrEqual(0);
    expect(late.pressure).toBeLessThanOrEqual(1);
  });

  it('reports the nearest contact distance from candidates', () => {
    const far = { x: 80, y: 0, radius: 8 };
    const near = { x: 30, y: 0, radius: 8 };

    const pressure = resolveStampedePressure({
      elapsedMs: 0,
      durationMs: 75_000,
      player: { x: 0, y: 0, radius: 10 },
      candidates: [far, near],
      contactRadiusPadding: 0
    });

    expect(pressure.nearestContactCandidate).toBe(near);
    expect(pressure.nearestContactDistance).toBe(12);
  });

  it('treats exact contact radius as contact', () => {
    const pressure = resolveStampedePressure({
      elapsedMs: 1_000,
      durationMs: 75_000,
      player: { x: 0, y: 0, radius: 10 },
      candidates: [{ x: 26, y: 0, radius: 10 }]
    });

    expect(pressure.nearestContactDistance).toBe(0);
    expect(pressure.withinContactRadius).toBe(true);
    expect(pressure.canContact).toBe(true);
  });

  it('gates contacts until the cooldown boundary', () => {
    expect(
      canApplyStampedeContact(
        STAMPEDE_CONTACT_COOLDOWN_MS - 1,
        0,
        STAMPEDE_CONTACT_COOLDOWN_MS
      )
    ).toBe(false);
    expect(
      canApplyStampedeContact(
        STAMPEDE_CONTACT_COOLDOWN_MS,
        0,
        STAMPEDE_CONTACT_COOLDOWN_MS
      )
    ).toBe(true);
  });

  it('uses the exact cooldown boundary in pressure snapshots', () => {
    const candidate = {
      x: 20 + STAMPEDE_CONTACT_RADIUS_PADDING,
      y: 0,
      radius: 10
    };
    const base = {
      durationMs: 75_000,
      player: { x: 0, y: 0, radius: 10 },
      candidates: [candidate],
      lastContactAtMs: 0
    };

    expect(
      resolveStampedePressure({
        ...base,
        elapsedMs: STAMPEDE_CONTACT_COOLDOWN_MS - 1
      }).canContact
    ).toBe(false);
    expect(
      resolveStampedePressure({
        ...base,
        elapsedMs: STAMPEDE_CONTACT_COOLDOWN_MS
      }).canContact
    ).toBe(true);
  });
});
