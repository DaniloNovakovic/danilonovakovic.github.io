import { describe, expect, it } from 'vitest';
import {
  COMBO_LENGTH,
  INITIAL_COMBO,
  markerPosition,
  resolveStrike,
  strikeZone,
  sweepPeriodMs,
  type ComboState
} from './strikeCombo';

function landFullCombo(): { state: ComboState; completed: boolean[] } {
  let state = INITIAL_COMBO;
  const completed: boolean[] = [];
  for (let i = 0; i < COMBO_LENGTH; i++) {
    const result = resolveStrike(state, strikeZone(state.step).center);
    state = result.state;
    completed.push(result.completed);
  }
  return { state, completed };
}

describe('markerPosition', () => {
  it('sweeps 0 -> 1 -> 0 over one period', () => {
    expect(markerPosition(0, 1000)).toBe(0);
    expect(markerPosition(250, 1000)).toBeCloseTo(0.5);
    expect(markerPosition(500, 1000)).toBeCloseTo(1);
    expect(markerPosition(750, 1000)).toBeCloseTo(0.5);
    expect(markerPosition(1000, 1000)).toBe(0);
  });
});

describe('strike zones', () => {
  it('shrink and speed up as the combo grows, with a floor', () => {
    expect(strikeZone(3).halfWidth).toBeLessThan(strikeZone(0).halfWidth);
    expect(strikeZone(50).halfWidth).toBeGreaterThan(0);
    expect(sweepPeriodMs(5)).toBeLessThan(sweepPeriodMs(0));
    expect(sweepPeriodMs(100)).toBeGreaterThan(0);
  });

  it('eases the knee and roundhouse without letting the finisher get easier', () => {
    const roundhouse = COMBO_LENGTH - 1;
    const knee = roundhouse - 1;
    expect(strikeZone(knee).halfWidth).toBe(0.1);
    expect(sweepPeriodMs(knee)).toBe(1120);
    expect(strikeZone(roundhouse).halfWidth).toBe(0.096);
    expect(sweepPeriodMs(roundhouse)).toBe(1080);
    expect(strikeZone(roundhouse).halfWidth).toBeLessThan(strikeZone(knee).halfWidth);
    expect(sweepPeriodMs(roundhouse)).toBeLessThan(sweepPeriodMs(knee));
    expect(strikeZone(knee).halfWidth * sweepPeriodMs(knee)).toBeGreaterThan(100);
    expect(strikeZone(roundhouse).halfWidth * sweepPeriodMs(roundhouse)).toBeGreaterThan(100);
  });
});

describe('resolveStrike', () => {
  it('grades dead center as perfect and inside the zone as clean', () => {
    const zone = strikeZone(0);
    expect(resolveStrike(INITIAL_COMBO, zone.center).grade).toBe('perfect');
    expect(resolveStrike(INITIAL_COMBO, zone.center + zone.halfWidth * 0.9).grade).toBe('clean');
  });

  it('resets the combo on a miss but keeps the best', () => {
    const afterTwo = resolveStrike(resolveStrike(INITIAL_COMBO, 0.5).state, strikeZone(1).center).state;
    expect(afterTwo).toEqual({ step: 2, best: 2 });
    const miss = resolveStrike(afterTwo, 0.99);
    expect(miss.grade).toBe('miss');
    expect(miss.state).toEqual({ step: 0, best: 2 });
  });

  it('completes only on the sixth landed strike and starts a fresh combo', () => {
    const { state, completed } = landFullCombo();
    expect(completed).toEqual([false, false, false, false, false, true]);
    expect(state).toEqual({ step: 0, best: COMBO_LENGTH });
  });

  it('names the called strike in order', () => {
    expect(resolveStrike(INITIAL_COMBO, 0.5).strike).toBe('jab');
    expect(resolveStrike({ step: 5, best: 5 }, 0.5).strike).toBe('roundhouse');
  });
});
