import { describe, expect, it } from 'vitest';
import {
  getPhaserScenePresentationMode,
  isFullBoardPhaserScene
} from './phaserScenePresentation';

describe('isFullBoardPhaserScene', () => {
  it('marks board-owned scenes as full-board scenes', () => {
    expect(isFullBoardPhaserScene('potassium')).toBe(true);
    expect(isFullBoardPhaserScene('stampedeSketch')).toBe(true);
  });

  it('keeps side-view scenes in the portrait shell', () => {
    expect(isFullBoardPhaserScene('hobbies')).toBe(false);
    expect(isFullBoardPhaserScene('basement')).toBe(false);
    expect(isFullBoardPhaserScene('ridge')).toBe(false);
    expect(isFullBoardPhaserScene(null)).toBe(false);
  });

  it('returns the presentation mode for Phaser scene ids', () => {
    expect(getPhaserScenePresentationMode('potassium')).toBe('vertical-board');
    expect(getPhaserScenePresentationMode('stampedeSketch')).toBe('vertical-board');
    expect(getPhaserScenePresentationMode('hobbies')).toBe('portrait-cover');
    expect(getPhaserScenePresentationMode('basement')).toBe('portrait-cover');
    expect(getPhaserScenePresentationMode('ridge')).toBe('portrait-cover');
    expect(getPhaserScenePresentationMode(null)).toBe('portrait-cover');
  });
});
