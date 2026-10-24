import { describe, expect, it } from 'vitest';
import { createBeerShot, stepBeerShots } from './beer';

describe('chick magnet beer', () => {
  it('soaks the player when the mug arrives', () => {
    const shot = createBeerShot({ x: 0, y: 0 }, { x: 100, y: 0 }, 0);
    const stepped = stepBeerShots([shot], 200, 200, { x: 40, y: 0, radius: 10 });
    expect(stepped.hit).toBe(true);
    expect(stepped.shots).toEqual([]);
  });

  it('keeps a mug that has not arrived yet', () => {
    const shot = createBeerShot({ x: 0, y: 0 }, { x: 400, y: 0 }, 0);
    const stepped = stepBeerShots([shot], 50, 50, { x: 300, y: 0, radius: 10 });
    expect(stepped.hit).toBe(false);
    expect(stepped.shots).toHaveLength(1);
    expect(stepped.shots[0]?.x).toBeGreaterThan(0);
  });
});