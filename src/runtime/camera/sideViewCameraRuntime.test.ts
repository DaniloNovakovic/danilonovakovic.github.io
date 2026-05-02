import { describe, expect, it } from 'vitest';
import { getHorizontalCoverCropPadding } from './sideViewCameraMath';

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
