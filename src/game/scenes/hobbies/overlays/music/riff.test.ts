import { describe, expect, it } from 'vitest';
import { appendPick, MARGIN_RIFF, riffProgress, type StringNumber } from './riff';

function playAll(notes: readonly StringNumber[]): StringNumber[] {
  return notes.reduce<StringNumber[]>((history, note) => appendPick(history, note), []);
}

describe('riff matching', () => {
  it('tracks progress through the riff and completes on the last note', () => {
    expect(riffProgress(playAll(MARGIN_RIFF.slice(0, 3)))).toBe(3);
    expect(riffProgress(playAll(MARGIN_RIFF))).toBe(MARGIN_RIFF.length);
  });

  it('completes even after noodling first', () => {
    expect(riffProgress(playAll([1, 1, 5, 6, ...MARGIN_RIFF]))).toBe(MARGIN_RIFF.length);
  });

  it('drops progress on a wrong note but keeps a partial restart', () => {
    expect(riffProgress(playAll([6, 4, 3, 5]))).toBe(0);
    expect(riffProgress(playAll([6, 4, 3, 6]))).toBe(1);
  });

  it('keeps only the last riff-length picks', () => {
    expect(playAll([1, 2, 3, 4, 5, 6, 1, 2, 3, 4])).toHaveLength(MARGIN_RIFF.length);
  });
});
