import { describe, expect, it } from 'vitest';
import {
  POTASSIUM_SCENE_ID,
  RIDGE_SCENE_ID,
  STAMPEDE_SKETCH_SCENE_ID
} from '@/game/scenes/sceneIds';
import { getNotebookRuntimeShellProfile } from './notebookShellProfile';

describe('notebook runtime shell profile', () => {
  it('maps Potassium to the ruled-board notebook profile', () => {
    expect(getNotebookRuntimeShellProfile(POTASSIUM_SCENE_ID)).toMatchObject({
      ownerSceneId: POTASSIUM_SCENE_ID,
      profile: 'ruledBoardPage',
      layout: 'focus'
    });
  });

  it('maps Stampede to the survival notebook profile', () => {
    expect(getNotebookRuntimeShellProfile(STAMPEDE_SKETCH_SCENE_ID)).toMatchObject({
      ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
      profile: 'survivalPage',
      layout: 'focus'
    });
  });

  it('leaves non-migrated scenes on the default shell', () => {
    expect(getNotebookRuntimeShellProfile(RIDGE_SCENE_ID)).toBeNull();
  });
});
