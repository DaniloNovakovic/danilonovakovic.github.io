import { describe, expect, it } from 'vitest';
import { CAMPFIRE } from './grips';
import { advanceProgression } from './progression';

const song = CAMPFIRE;

describe('advanceProgression', () => {
  it('completes Em G D C', () => {
    let progress = 0;
    for (const chord of song) progress = advanceProgression(progress, chord, song);
    expect(progress).toBe(song.length);
  });

  it('lets the same chord be strummed again without losing the place', () => {
    let progress = advanceProgression(0, 'em', song);
    progress = advanceProgression(progress, 'em', song);
    progress = advanceProgression(progress, 'g', song);
    progress = advanceProgression(progress, 'g', song);
    expect(progress).toBe(2);
  });

  it('restarts on the first chord and drops other wrong chords', () => {
    let progress = advanceProgression(0, 'em', song);
    progress = advanceProgression(progress, 'g', song);
    expect(advanceProgression(progress, 'em', song)).toBe(1);
    expect(advanceProgression(progress, 'am', song)).toBe(0);
    expect(advanceProgression(0, 'open', song)).toBe(0);
  });
});
