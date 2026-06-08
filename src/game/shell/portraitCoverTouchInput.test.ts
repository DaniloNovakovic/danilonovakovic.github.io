import { describe, expect, it } from 'vitest';
import {
  resolvePortraitCoverHorizontalAxis,
  shouldPortraitCoverDragActivate,
  shouldPortraitCoverPointerTravelActivate
} from './portraitCoverTouchInput';

describe('portraitCoverTouchInput', () => {
  it('returns zero inside the movement deadzone', () => {
    expect(resolvePortraitCoverHorizontalAxis(4)).toBe(0);
    expect(resolvePortraitCoverHorizontalAxis(-4)).toBe(0);
  });

  it('maps horizontal drag delta to a clamped axis', () => {
    expect(resolvePortraitCoverHorizontalAxis(22)).toBeCloseTo(0.5);
    expect(resolvePortraitCoverHorizontalAxis(-44)).toBe(-1);
    expect(resolvePortraitCoverHorizontalAxis(80)).toBe(1);
  });

  it('activates drag only after horizontal threshold', () => {
    expect(shouldPortraitCoverDragActivate(10)).toBe(false);
    expect(shouldPortraitCoverDragActivate(16)).toBe(true);
    expect(shouldPortraitCoverDragActivate(-20)).toBe(true);
  });

  it('activates pointer travel when either axis crosses threshold', () => {
    expect(shouldPortraitCoverPointerTravelActivate(10, 10)).toBe(false);
    expect(shouldPortraitCoverPointerTravelActivate(16, 0)).toBe(true);
    expect(shouldPortraitCoverPointerTravelActivate(0, 16)).toBe(true);
  });
});
