import { describe, expect, it } from 'vitest';
import {
  getPhaserScenePresentationMode,
  isFullBoardPhaserScene
} from './phaserScenePresentation';

describe('isFullBoardPhaserScene', () => {
  it('marks Potassium as a full-board scene', () => {
    expect(isFullBoardPhaserScene('potassium')).toBe(true);
  });

  it('keeps side-view scenes in the portrait shell', () => {
    expect(isFullBoardPhaserScene('hobbies')).toBe(false);
    expect(isFullBoardPhaserScene('basement')).toBe(false);
    expect(isFullBoardPhaserScene(null)).toBe(false);
  });

  it('returns the presentation mode for Phaser scene ids', () => {
    expect(getPhaserScenePresentationMode('potassium')).toBe('vertical-board');
    expect(getPhaserScenePresentationMode('hobbies')).toBe('portrait-cover');
    expect(getPhaserScenePresentationMode('basement')).toBe('portrait-cover');
    expect(getPhaserScenePresentationMode(null)).toBe('portrait-cover');
  });
});
