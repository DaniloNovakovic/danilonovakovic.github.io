import { describe, expect, it } from 'vitest';
import { DOODLE_EXPORT_MAX_HEIGHT, DOODLE_EXPORT_MAX_WIDTH, fitWithin, hasInk } from './doodleExport';

describe('fitWithin', () => {
  it('downscales a wide hi-dpi canvas to the billboard box, keeping aspect ratio', () => {
    const size = fitWithin(1120, 500);
    expect(size.width).toBeLessThanOrEqual(DOODLE_EXPORT_MAX_WIDTH);
    expect(size.height).toBeLessThanOrEqual(DOODLE_EXPORT_MAX_HEIGHT);
    expect(size.width / size.height).toBeCloseTo(1120 / 500, 1);
  });

  it('never upscales and handles empty canvases', () => {
    expect(fitWithin(100, 50)).toEqual({ width: 100, height: 50 });
    expect(fitWithin(0, 50)).toEqual({ width: 0, height: 0 });
  });
});

describe('hasInk', () => {
  it('detects any non-transparent pixel', () => {
    const blank = new Uint8ClampedArray(4 * 16);
    expect(hasInk(blank)).toBe(false);
    blank[4 * 7 + 3] = 12;
    expect(hasInk(blank)).toBe(true);
  });

  it('ignores colour channels on transparent pixels', () => {
    expect(hasInk([255, 255, 255, 0, 26, 26, 26, 0])).toBe(false);
  });
});
