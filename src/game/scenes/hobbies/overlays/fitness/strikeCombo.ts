/**
 * Pure rules for the Muay Thai timing game: a marker sweeps a 0..1 bar, each
 * called strike has its own sweet-spot zone, and the zone shrinks while the
 * sweep speeds up as the combo grows. The knee and roundhouse leave that ramp
 * so the last two strikes stay the tightest while remaining above the ~100ms
 * a thumb can still land.
 */

export const STRIKES = ['jab', 'cross', 'teep', 'elbow', 'knee', 'roundhouse'] as const;
export type StrikeId = (typeof STRIKES)[number];
export const COMBO_LENGTH = STRIKES.length;

export type StrikeGrade = 'perfect' | 'clean' | 'miss';

/** Zone center per combo step, so the called strike moves the target around. */
const ZONE_CENTERS: readonly number[] = [0.5, 0.64, 0.38, 0.56, 0.3, 0.5];
const ZONE_START_HALF_WIDTH = 0.15;
const ZONE_SHRINK_PER_STEP = 0.018;
const ZONE_MIN_HALF_WIDTH = 0.06;
const PERFECT_HALF_WIDTH = 0.025;
const SWEEP_START_MS = 1500;
const SWEEP_SPEEDUP_PER_STEP_MS = 120;
const SWEEP_MIN_MS = 800;
/**
 * Last two strikes, eased off the raw ramp (~80ms and ~75ms in the zone).
 * Knee is ~112ms; roundhouse stays a notch tighter at ~104ms.
 */
const KNEE_HALF_WIDTH = 0.1;
const KNEE_PERIOD_MS = 1120;
const ROUNDHOUSE_HALF_WIDTH = 0.096;
const ROUNDHOUSE_PERIOD_MS = 1080;

function lateComboWindow(step: number): { halfWidth: number; periodMs: number } | null {
  if (step === COMBO_LENGTH - 2) return { halfWidth: KNEE_HALF_WIDTH, periodMs: KNEE_PERIOD_MS };
  if (step === COMBO_LENGTH - 1) return { halfWidth: ROUNDHOUSE_HALF_WIDTH, periodMs: ROUNDHOUSE_PERIOD_MS };
  return null;
}

export interface StrikeZone {
  center: number;
  halfWidth: number;
  perfectHalfWidth: number;
}

export interface ComboState {
  /** Strikes landed in the current combo (0..COMBO_LENGTH-1). */
  step: number;
  best: number;
}

export interface StrikeResult {
  state: ComboState;
  grade: StrikeGrade;
  strike: StrikeId;
  /** True when this strike landed the final move of the combo. */
  completed: boolean;
}

export const INITIAL_COMBO: ComboState = { step: 0, best: 0 };

export function strikeZone(step: number): StrikeZone {
  const late = lateComboWindow(step);
  const rampedHalfWidth = Math.max(ZONE_MIN_HALF_WIDTH, ZONE_START_HALF_WIDTH - step * ZONE_SHRINK_PER_STEP);
  return {
    center: ZONE_CENTERS[step % ZONE_CENTERS.length] ?? 0.5,
    halfWidth: late?.halfWidth ?? rampedHalfWidth,
    perfectHalfWidth: PERFECT_HALF_WIDTH
  };
}

/** One full left-right-left sweep duration for the given combo step. */
export function sweepPeriodMs(step: number): number {
  const late = lateComboWindow(step);
  if (late) return late.periodMs;
  return Math.max(SWEEP_MIN_MS, SWEEP_START_MS - step * SWEEP_SPEEDUP_PER_STEP_MS);
}

/** Triangle wave in 0..1: 0 at elapsed 0, 1 at half period, back to 0. */
export function markerPosition(elapsedMs: number, periodMs: number): number {
  const phase = (((elapsedMs % periodMs) + periodMs) % periodMs) / periodMs;
  return phase < 0.5 ? phase * 2 : 2 - phase * 2;
}

function gradeStrike(position: number, zone: StrikeZone): StrikeGrade {
  const distance = Math.abs(position - zone.center);
  if (distance <= zone.perfectHalfWidth) return 'perfect';
  if (distance <= zone.halfWidth) return 'clean';
  return 'miss';
}

/** Resolves a strike at `position` against the current combo step. */
export function resolveStrike(state: ComboState, position: number): StrikeResult {
  const strike = STRIKES[state.step] ?? 'jab';
  const grade = gradeStrike(position, strikeZone(state.step));
  if (grade === 'miss') {
    return { state: { step: 0, best: state.best }, grade, strike, completed: false };
  }
  const landed = state.step + 1;
  const completed = landed >= COMBO_LENGTH;
  return {
    state: { step: completed ? 0 : landed, best: Math.max(state.best, landed) },
    grade,
    strike,
    completed
  };
}
