import { describe, expect, it } from 'vitest';
import { isFullBoardPhaserScene } from './phaserScenePresentation';

describe('isFullBoardPhaserScene', () => {
  it('marks Potassium as a full-board scene', () => {
    expect(isFullBoardPhaserScene('potassium')).toBe(true);
  });

  it('keeps side-view scenes in the portrait shell', () => {
    expect(isFullBoardPhaserScene('hobbies')).toBe(false);
    expect(isFullBoardPhaserScene('basement')).toBe(false);
    expect(isFullBoardPhaserScene(null)).toBe(false);
  });
});
