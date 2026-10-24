import { describe, expect, it } from 'vitest';
import { chordLabel, colorFrets } from './extensions';
import { fretsFor } from './grips';

describe('chord colors', () => {
  it('turns G into a dominant 7 and leaves the bass where it is', () => {
    expect(chordLabel('G', 'major', [7])).toBe('G7');
    expect(chordLabel('Em', 'minor', [7])).toBe('Em7');
    expect(chordLabel('F#°', 'dim', [7])).toBe('F#°7');
    const colored = colorFrets(fretsFor('g', 'low'), 7, 'major', [7]);
    expect(colored[5]).toBe(3);
    expect(colored[0]).toBe(1);
  });

  it('adds the 9th without renaming a plain chord', () => {
    expect(chordLabel('G', 'major', [])).toBe('G');
    expect(chordLabel('G', 'major', [2])).toBe('Gadd9');
    expect(chordLabel('G', 'major', [7, 2])).toBe('G9');
    expect(colorFrets(fretsFor('e', 'low'), 4, 'minor', [7])[3]).toBe(0);
  });
});
