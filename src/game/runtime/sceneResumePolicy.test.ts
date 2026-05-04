import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PHASER_SCENE_KEYS } from '@config/featureIds';
import {
  getSceneStartResume,
  prepareSceneStart,
  recordSceneExitResume
} from './sceneResumePolicy';
import { forgetResumePosition, rememberResumePosition } from './sceneResumeStore';

const TEST_SCENE_KEY = 'unknown-test-scene';
const KNOWN_SCENE_KEYS = [
  PHASER_SCENE_KEYS.main,
  PHASER_SCENE_KEYS.hobbies,
  PHASER_SCENE_KEYS.basement,
  PHASER_SCENE_KEYS.potassium,
  TEST_SCENE_KEY
];

function forgetKnownResumePositions(): void {
  KNOWN_SCENE_KEYS.forEach((sceneKey) => forgetResumePosition(sceneKey));
}

beforeEach(forgetKnownResumePositions);
afterEach(forgetKnownResumePositions);

describe('sceneResumePolicy', () => {
  it.each([
    PHASER_SCENE_KEYS.main,
    PHASER_SCENE_KEYS.hobbies,
    PHASER_SCENE_KEYS.basement
  ])('records and restores last-exit resume for %s', (sceneKey) => {
    const position = { x: 12, y: 34 };

    expect(recordSceneExitResume(sceneKey, position)).toEqual(position);
    prepareSceneStart(sceneKey);

    expect(getSceneStartResume(sceneKey)).toEqual(position);
  });

  it('does not persist potassium captures', () => {
    const position = { x: 5, y: 8 };

    expect(recordSceneExitResume(PHASER_SCENE_KEYS.potassium, position)).toEqual(position);

    expect(getSceneStartResume(PHASER_SCENE_KEYS.potassium)).toBeUndefined();
  });

  it('clears any saved potassium position before start', () => {
    rememberResumePosition(PHASER_SCENE_KEYS.potassium, { x: 1, y: 2 });

    prepareSceneStart(PHASER_SCENE_KEYS.potassium);

    expect(getSceneStartResume(PHASER_SCENE_KEYS.potassium)).toBeUndefined();
  });

  it('defaults unknown scene keys to last-exit restore', () => {
    const position = { x: 21, y: 55 };

    expect(recordSceneExitResume(TEST_SCENE_KEY, position)).toEqual(position);
    prepareSceneStart(TEST_SCENE_KEY);

    expect(getSceneStartResume(TEST_SCENE_KEY)).toEqual(position);
  });

  it.each([null, undefined])('ignores %s captures without overwriting saved resume', (position) => {
    rememberResumePosition(PHASER_SCENE_KEYS.hobbies, { x: 7, y: 9 });

    expect(recordSceneExitResume(PHASER_SCENE_KEYS.hobbies, position)).toBeNull();

    expect(getSceneStartResume(PHASER_SCENE_KEYS.hobbies)).toEqual({ x: 7, y: 9 });
  });
});
