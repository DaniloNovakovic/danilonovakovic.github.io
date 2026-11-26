import { describe, expect, it } from 'vitest';
import { drawScreenCrack, inClearCenter } from './screenCracks';

const VIEWPORT = { width: 1280, height: 800 };

function points(paths: readonly string[]): [number, number][] {
  return paths.flatMap((d) => [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(([, x, y]) => [Number(x), Number(y)]));
}

describe('drawScreenCrack', () => {
  it('draws the same crack every time for the same seed and viewport', () => {
    const crack = { x: 0.4, y: 0.6, seed: 1234 };
    expect(drawScreenCrack(crack, VIEWPORT)).toEqual(drawScreenCrack(crack, VIEWPORT));
  });

  it('breaks out of the corner nearest the hit', () => {
    const [startX, startY] = points(drawScreenCrack({ x: 0.8, y: 0.2, seed: 7 }, VIEWPORT).runs)[0]!;
    expect(startX).toBeGreaterThan(VIEWPORT.width * 0.85);
    expect(startY).toBeLessThan(VIEWPORT.height * 0.15);
  });

  it('runs a long way, but never into the clear middle where the game is', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const crack = { x: (seed % 4) / 4 + 0.1, y: (seed % 3) / 3 + 0.1, seed };
      const { runs, impact } = drawScreenCrack(crack, VIEWPORT);
      const all = points([...runs, ...impact]);
      expect(all.some((p) => inClearCenter(p, VIEWPORT))).toBe(false);
      const [ox, oy] = points(runs)[0]!;
      expect(Math.max(...all.map(([x, y]) => Math.hypot(x - ox, y - oy)))).toBeGreaterThan(200);
    }
  });

  it('gives different seeds different shapes', () => {
    const a = drawScreenCrack({ x: 0.5, y: 0.5, seed: 1 }, VIEWPORT);
    const b = drawScreenCrack({ x: 0.5, y: 0.5, seed: 2 }, VIEWPORT);
    expect(a.runs).not.toEqual(b.runs);
  });
});
