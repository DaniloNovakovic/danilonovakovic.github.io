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

function expectShapeTones(frets: readonly (number | null)[], root: number, required: number[], allowed: number[]) {
  const sounding = pitchClasses(frets).map((pitch) => (pitch - root + 12) % 12);
  for (const interval of required) expect(sounding).toContain(interval);
  for (const interval of sounding) expect(allowed).toContain(interval);
}

function expectPlayable(id: GripId, color: 'scale' | 'alt', capo: number) {
  const shapes = cagedVoicings(id, color, capo);
  expect(shapes.length).toBeGreaterThan(1);
  const grip = gripById(id);
  const quality = color === 'alt' ? grip.altQuality : grip.scaleQuality;
  const root = (grip.root + capo) % 12;
  const { required, allowed } = tones(quality);
  for (const shape of shapes) expectShapeTones(shape.frets, root, required, allowed);
}

function fretCenter(frets: readonly (number | null)[]): number {
  const sounding = frets.filter((fret): fret is number => fret !== null);
  return sounding.reduce((sum, fret) => sum + fret, 0) / sounding.length;
}

describe('CAGED positions', () => {
  it('keeps every scale chord playable in more than one place', () => {
    for (const key of HOME_KEYS) {
      for (const id of IDS) {
        expectPlayable(id, 'scale', key.capo);
        expectPlayable(id, 'alt', key.capo);
      }
    }
  });

  it('walks up from the open grip and pulls the next chord along', () => {
    const openG = fretsInKey('g', 'low', 'scale', 0);
    const next = nextVoicing(cagedVoicings('g', 'scale', 0), openG);
    const anchor = next ? next.center : 0;
    const am = nearestVoicing(cagedVoicings('a', 'scale', 0), anchor);
    const openCenter = fretCenter(fretsInKey('a', 'low', 'scale', 0));
    const amCenter = am ? am.center : 0;
    expect(next && next.form).toBe('E');
    expect(next && next.frets).toEqual([3, 3, 4, 5, 5, 3]);
    expect(Math.abs(amCenter - anchor)).toBeLessThan(Math.abs(openCenter - anchor));
    expect(fretsForPosition('a', 'low', 'scale', 0, 0, next ? next.center : null)).toEqual(am && am.frets);
    expect(fretsForPosition('g', 'low', 'scale', 0, 0, null)).toEqual(openG);
  });
});
