import { describe, expect, it } from 'vitest';
import {
  HOME_KEYS,
  chordName,
  frettedFrequency,
  fretsFor,
  fretsInKey,
  gripForLetter,
  homeCapo,
  lowestSoundingIndex,
  noteLabel,
  rootLetter,
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

  it('moves the open G shape up when the home key is A', () => {
    expect(fretsInKey('g', 'low', 'scale', 2)).toEqual([5, 2, 2, 2, 4, 5]);
    expect(chordName('g', 'scale', 2)).toBe('A');
    expect(chordName('d', 'scale', 2)).toBe('E');
    expect(chordName('c', 'scale', 2)).toBe('D');
  });

  it('spells every letter once, and keeps D on the D key', () => {
    expect(gripForLetter('d', 0)).toBe('d');
    expect(gripForLetter('d', homeCapo('C'))).toBe('a');
    expect(chordName('a', 'scale', homeCapo('C'))).toBe('Dm');
    expect(chordName('c', 'scale', homeCapo('F'))).toBe('Bb');
    expect(gripForLetter('b', homeCapo('F'))).toBe('c');
    expect(chordName('f', 'scale', homeCapo('E'))).toBe('D#°');
    expect(gripForLetter('d', homeCapo('E'))).toBe('f');

    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    for (const key of HOME_KEYS) {
      const spelled = letters.map((letter) => rootLetter(gripForLetter(letter, key.capo)!, key.capo));
      expect(spelled.sort()).toEqual([...letters].sort());
    }
  });

  it('keeps every key on the neck, including the barre keys', () => {
    const openPitch = [4, 11, 7, 2, 9, 4];
    const roots = { g: 7, a: 9, b: 11, c: 0, d: 2, e: 4, f: 6 } as const;
    const ids = Object.keys(roots) as (keyof typeof roots)[];
    for (const key of HOME_KEYS) {
      for (const id of ids) {
        for (const color of ['scale', 'alt'] as const) {
          for (const voicing of ['low', 'high'] as const) {
            const frets = fretsInKey(id, voicing, color, key.capo);
            expect(frets.every((fret) => fret === null || (fret >= 0 && fret <= 12))).toBe(true);
            const sounding = frets.flatMap((fret, index) => (fret === null ? [] : [(openPitch[index]! + fret) % 12]));
            expect(sounding).toContain((roots[id] + key.capo) % 12);
          }
        }
      }
    }
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
