import { describe, expect, it } from 'vitest';
import { OVERWORLD_SCENE_ID, RIDGE_SCENE_ID } from '@/game/scenes/sceneIds';
import { getSceneHeaderChrome } from './sceneHeaderChrome';

describe('getSceneHeaderChrome', () => {
  it('gives Ridge a header Back button to the overworld, since Esc no longer exits it', () => {
    expect(getSceneHeaderChrome(RIDGE_SCENE_ID)).toEqual({
      left: 'back',
      targetSceneId: OVERWORLD_SCENE_ID,
      ariaLabelKey: 'backToOverworld'
    });
  });

  it('keeps the default header in the overworld', () => {
    expect(getSceneHeaderChrome(OVERWORLD_SCENE_ID)).toEqual({ left: 'default' });
  });
});
