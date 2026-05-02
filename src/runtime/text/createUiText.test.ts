import { describe, expect, it } from 'vitest';
import {
  getCappedUiTextResolution,
  MAX_UI_TEXT_RESOLUTION,
  snapUiTextCoordinate
} from './createUiText';

describe('createUiText helpers', () => {
  it('caps HiDPI text resolution to avoid excessive texture memory', () => {
    expect(getCappedUiTextResolution(1)).toBe(1);
    expect(getCappedUiTextResolution(1.5)).toBe(1.5);
    expect(getCappedUiTextResolution(3)).toBe(MAX_UI_TEXT_RESOLUTION);
  });

  it('falls back to normal resolution for invalid device pixel ratios', () => {
    expect(getCappedUiTextResolution(0)).toBe(1);
    expect(getCappedUiTextResolution(Number.NaN)).toBe(1);
  });

  it('snaps text coordinates to whole logical pixels', () => {
    expect(snapUiTextCoordinate(12.49)).toBe(12);
    expect(snapUiTextCoordinate(12.5)).toBe(13);
  });
});
