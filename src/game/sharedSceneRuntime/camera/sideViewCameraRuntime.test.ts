import { describe, expect, it } from 'vitest';
import { getCoverVisibleRegion, getHorizontalCoverCropPadding } from './sideViewCameraMath';

const designSize = { width: 1000, height: 600 };

describe('getHorizontalCoverCropPadding', () => {
  it('returns portrait cover crop padding for a capped phone game frame', () => {
    expect(
      getHorizontalCoverCropPadding({
        viewport: { width: 390, height: 520 },
        designSize,
        zoom: 1
      })
    ).toBeCloseTo(275, 0);
  });

  it('does not pad an uncropped desktop game frame', () => {
    expect(
      getHorizontalCoverCropPadding({
        viewport: { width: 1000, height: 600 },
        designSize,
        zoom: 1
      })
    ).toBe(0);
  });

  it('does not pad a landscape phone frame that matches the design ratio closely', () => {
    expect(
      getHorizontalCoverCropPadding({
        viewport: { width: 667, height: 375 },
        designSize,
        zoom: 1
      })
    ).toBe(0);
  });

  it('returns safe defaults for invalid dimensions', () => {
    expect(
      getHorizontalCoverCropPadding({
        viewport: { width: 0, height: 844 },
        designSize,
        zoom: 1
      })
    ).toBe(0);
    expect(
      getHorizontalCoverCropPadding({
        viewport: { width: 390, height: 844 },
        designSize,
        zoom: 0
      })
    ).toBe(0);
  });
});

describe('getCoverVisibleRegion', () => {
  it('shows only a middle slice of the canvas on a portrait phone frame', () => {
    const region = getCoverVisibleRegion({ viewport: { width: 390, height: 520 }, designSize });
    expect(region.height).toBeCloseTo(600, 5);
    expect(region.width).toBeCloseTo(450, 0);
    expect(region.canvasPerCss).toBeCloseTo(600 / 520, 5);
  });

  it('crops top and bottom on a frame wider than the design ratio', () => {
    const region = getCoverVisibleRegion({ viewport: { width: 1200, height: 600 }, designSize });
    expect(region.width).toBeCloseTo(1000, 5);
    expect(region.height).toBeCloseTo(500, 5);
  });

  it('falls back to the full design size for invalid dimensions', () => {
    expect(getCoverVisibleRegion({ viewport: { width: 0, height: 0 }, designSize })).toEqual({
      width: 1000,
      height: 600,
      canvasPerCss: 1
    });
  });
});
