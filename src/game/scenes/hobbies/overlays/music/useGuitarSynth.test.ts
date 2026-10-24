import { describe, expect, it } from 'vitest';
import { resolvePluckFret } from './useGuitarSynth';

describe('resolvePluckFret', () => {
  it('keeps a muted string muted instead of turning it into the open note', () => {
    expect(resolvePluckFret(null)).toBeNull();
    expect(resolvePluckFret(0)).toBe(0);
    expect(resolvePluckFret(undefined)).toBe(0);
  });
});
