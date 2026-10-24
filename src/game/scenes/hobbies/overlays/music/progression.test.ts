import { describe, expect, it } from 'vitest';
import { CAMPFIRE } from './grips';
import { advanceProgression } from './progression';

const song = CAMPFIRE;

describe('advanceProgression', () => {
  it('completes G D Em C G', () => {
    let progress = 0;
    for (const chord of song) progress = advanceProgression(progress, chord, song);
    expect(progress).toBe(song.length);
  });

  it('lets the same chord be strummed again without losing the place', () => {
    let progress = advanceProgression(0, 'g', song);
    progress = advanceProgression(progress, 'g', song);
    progress = advanceProgression(progress, 'd', song);
    progress = advanceProgression(progress, 'd', song);
    expect(progress).toBe(2);
  });

  it('restarts on the first chord and drops other wrong chords', () => {
    let progress = advanceProgression(0, 'g', song);
    progress = advanceProgression(progress, 'd', song);
    expect(advanceProgression(progress, 'g', song)).toBe(1);
    expect(advanceProgression(progress, 'a', song)).toBe(0);
    expect(advanceProgression(0, 'open', song)).toBe(0);
  });
});
