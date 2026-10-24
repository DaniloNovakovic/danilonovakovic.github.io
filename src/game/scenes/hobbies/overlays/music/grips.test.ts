import { describe, expect, it } from 'vitest';
import {
  chordName,
  frettedFrequency,
  fretsFor,
  lowestSoundingIndex,
  noteLabel,
  slideFrets,
  type ChordColor,
  type GripId,
  type Voicing
} from './grips';
import { GUITAR_STRINGS } from './useGuitarSynth';

function voiced(id: GripId, voicing: Voicing = 'low', color: ChordColor = 'scale'): (string | 'x')[] {
  return fretsFor(id, voicing, color).map((fret, index) =>
    fret === null ? 'x' : noteLabel(GUITAR_STRINGS[index]!.frequency, fret)
  );
}

describe('chord grips', () => {
  it('stops the open shapes on the G major scale', () => {
    expect(voiced('g')).toEqual(['G4', 'B3', 'G3', 'D3', 'B2', 'G2']);
    expect(voiced('a')).toEqual(['E4', 'C4', 'A3', 'E3', 'A2', 'x']);
    expect(voiced('b')).toEqual(['F#4', 'D4', 'B3', 'F#3', 'B2', 'x']);
    expect(voiced('c')).toEqual(['E4', 'C4', 'G3', 'E3', 'C3', 'x']);
    expect(voiced('d')).toEqual(['F#4', 'D4', 'A3', 'D3', 'x', 'x']);
    expect(voiced('e')).toEqual(['E4', 'B3', 'G3', 'E3', 'B2', 'E2']);
    expect(voiced('f')).toEqual(['F#4', 'C4', 'A3', 'F#3', 'x', 'F#2']);
    expect(voiced('open')).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
  });

  it('flips major and minor without leaving the root', () => {
    expect(voiced('a', 'low', 'alt')).toEqual(['E4', 'C#4', 'A3', 'E3', 'A2', 'x']);
    expect(voiced('e', 'low', 'alt')).toEqual(['E4', 'B3', 'G#3', 'E3', 'B2', 'E2']);
    expect(voiced('g', 'low', 'alt')).toEqual(['G4', 'D4', 'A#3', 'G3', 'x', 'x']);
    expect(chordName('f', 'scale')).toBe('F#°');
    expect(chordName('f', 'alt')).toBe('F#m');
    expect(chordName('g', 'scale', 1)).toBe('G#');
  });

  it('keeps the shifted shape on the same chord', () => {
    expect(voiced('g', 'high')).toEqual(['G4', 'D4', 'B3', 'G3', 'x', 'x']);
    expect(voiced('e', 'high')).toEqual(['G4', 'E4', 'B3', 'E3', 'x', 'x']);
  });

  it('slides a shape one fret and refuses to leave the neck', () => {
    expect(slideFrets([0, 0, 0, 2, 2, 0], 1)).toEqual([1, 1, 1, 3, 3, 1]);
    expect(slideFrets([0, 0, 0, 2, 2, 0], -1)).toBeNull();
    expect(slideFrets([12, 12, 12, null, null, null], 1)).toBeNull();
  });

  it('finds the lowest speaking string and skips a muted bass', () => {
    expect(lowestSoundingIndex(fretsFor('g', 'low'))).toBe(5);
    expect(lowestSoundingIndex(fretsFor('a', 'low'))).toBe(4);
    expect(lowestSoundingIndex(fretsFor('d', 'low'))).toBe(3);
    expect(lowestSoundingIndex([null, null, null, null, null, null])).toBeNull();
  });

  it('raises pitch by one semitone per fret', () => {
    expect(frettedFrequency(110, 0)).toBe(110);
    expect(frettedFrequency(110, 12)).toBeCloseTo(220);
    expect(frettedFrequency(82.41, 3)).toBeCloseTo(82.41 * 2 ** (3 / 12));
  });
});
