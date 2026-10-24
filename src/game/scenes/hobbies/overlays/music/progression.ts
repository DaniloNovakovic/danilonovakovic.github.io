/**
 * Advances a latched chord song.
 * Repeating the chord you are on holds your place (a guitarist strums twice).
 * Hitting the first chord again restarts. Anything else drops the song.
 */
export function advanceProgression<T>(progress: number, step: T, target: readonly T[]): number {
  if (target.length === 0) return 0;
  const index = Math.min(Math.max(progress, 0), target.length);
  if (index < target.length && step === target[index]) return index + 1;
  if (index > 0 && step === target[index - 1]) return index;
  if (step === target[0]) return 1;
  return 0;
}
