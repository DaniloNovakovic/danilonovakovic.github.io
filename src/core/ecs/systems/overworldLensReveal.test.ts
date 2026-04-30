import { describe, expect, it } from 'vitest';
import { fillOverworldLensRevealFlags } from './overworldLensReveal';

describe('fillOverworldLensRevealFlags', () => {
  const slots = [
    { x: 100 },
    { x: 400 },
    { x: 900 }
  ];
  const radius = 150;
  const out = [false, false, false];

  it('writes false for all slots when no glasses', () => {
    fillOverworldLensRevealFlags(false, 400, slots, radius, out);
    expect(out).toEqual([false, false, false]);
  });

  it('reveals only buildings within horizontal radius', () => {
    fillOverworldLensRevealFlags(true, 400, slots, radius, out);
    expect(out[0]).toBe(false);
    expect(out[1]).toBe(true);
    expect(out[2]).toBe(false);
  });

  it('uses exclusive radius boundary', () => {
    const one = [false];
    fillOverworldLensRevealFlags(true, 250, [{ x: 100 }], 150, one);
    expect(one[0]).toBe(false);
    fillOverworldLensRevealFlags(true, 249, [{ x: 100 }], 150, one);
    expect(one[0]).toBe(true);
  });

  it('supports multiple buildings in range', () => {
    const two = [false, false];
    fillOverworldLensRevealFlags(true, 400, [{ x: 300 }, { x: 500 }], 150, two);
    expect(two[0]).toBe(true);
    expect(two[1]).toBe(true);
  });
});
