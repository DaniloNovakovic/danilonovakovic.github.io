import { describe, expect, it } from 'vitest';
import { cagedVoicings, fretsForPosition, nearestVoicing, nextVoicing } from './caged';
import { HOME_KEYS, fretsInKey, gripById, type ChordQuality, type GripId } from './grips';

const OPEN_PITCH = [4, 11, 7, 2, 9, 4];
const IDS: GripId[] = ['g', 'a', 'b', 'c', 'd', 'e', 'f'];

function pitchClasses(frets: readonly (number | null)[]): number[] {
  return frets.flatMap((fret, index) => (fret === null ? [] : [(OPEN_PITCH[index]! + fret) % 12]));
}

function tones(quality: ChordQuality): { required: number[]; allowed: number[] } {
  if (quality === 'minor') return { required: [0, 3, 7], allowed: [0, 3, 7] };
  if (quality === 'dim') return { required: [0, 3, 6], allowed: [0, 3, 6, 9] };
  return { required: [0, 4, 7], allowed: [0, 4, 7] };
}

describe('CAGED positions', () => {
  it('keeps every scale chord playable in more than one place', () => {
    for (const key of HOME_KEYS) {
      for (const id of IDS) {
        for (const color of ['scale', 'alt'] as const) {
          const shapes = cagedVoicings(id, color, key.capo);
          expect(shapes.length).toBeGreaterThan(1);
          const grip = gripById(id);
          const quality = color === 'alt' ? grip.altQuality : grip.scaleQuality;
          const root = (grip.root + key.capo) % 12;
          const { required, allowed } = tones(quality);
          for (const shape of shapes) {
            const sounding = pitchClasses(shape.frets).map((pitch) => (pitch - root + 12) % 12);
            for (const interval of required) expect(sounding).toContain(interval);
            for (const interval of sounding) expect(allowed).toContain(interval);
          }
        }
      }
    }
  });

  it('walks up from the open grip and pulls the next chord along', () => {
    const openG = fretsInKey('g', 'low', 'scale', 0);
    const next = nextVoicing(cagedVoicings('g', 'scale', 0), openG);
    expect(next?.form).toBe('E');
    expect(next?.frets).toEqual([3, 3, 4, 5, 5, 3]);

    const am = nearestVoicing(cagedVoicings('a', 'scale', 0), next?.center ?? 0);
    const openAm = fretsInKey('a', 'low', 'scale', 0);
    const openCenter = openAm.filter((fret): fret is number => fret !== null).reduce((sum, fret) => sum + fret, 0) / 5;
    expect(Math.abs((am?.center ?? 0) - (next?.center ?? 0))).toBeLessThan(Math.abs(openCenter - (next?.center ?? 0)));
    expect(fretsForPosition('a', 'low', 'scale', 0, 0, next?.center ?? null)).toEqual(am?.frets);
    expect(fretsForPosition('g', 'low', 'scale', 0, 0, null)).toEqual(openG);
  });
});
