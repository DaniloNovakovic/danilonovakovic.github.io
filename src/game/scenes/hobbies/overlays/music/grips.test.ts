import { describe, expect, it } from 'vitest';
import { frettedFrequency, gripById, noteLabel, type GripId } from './grips';
import { GUITAR_STRINGS } from './useGuitarSynth';

function voiced(id: GripId): (string | 'x')[] {
  return gripById(id).frets.map((fret, index) =>
    fret === null ? 'x' : noteLabel(GUITAR_STRINGS[index]!.frequency, fret)
  );
}

describe('chord grips', () => {
  it('stops the strings at real campfire chord tones', () => {
    expect(voiced('em')).toEqual(['E4', 'B3', 'G3', 'E3', 'B2', 'E2']);
    expect(voiced('g')).toEqual(['G4', 'B3', 'G3', 'D3', 'B2', 'G2']);
    expect(voiced('d')).toEqual(['F#4', 'D4', 'A3', 'D3', 'x', 'x']);
    expect(voiced('c')).toEqual(['E4', 'C4', 'G3', 'E3', 'C3', 'x']);
    expect(voiced('am')).toEqual(['E4', 'C4', 'A3', 'E3', 'A2', 'x']);
    expect(voiced('open')).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
  });

  it('raises pitch by one semitone per fret', () => {
    expect(frettedFrequency(110, 0)).toBe(110);
    expect(frettedFrequency(110, 12)).toBeCloseTo(220);
    expect(frettedFrequency(82.41, 3)).toBeCloseTo(82.41 * 2 ** (3 / 12));
  });
});
