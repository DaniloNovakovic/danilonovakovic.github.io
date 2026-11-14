import {
  OVERWORLD_SCENE_ID,
  POTASSIUM_SCENE_ID,
  RIDGE_SCENE_ID,
  STAMPEDE_SKETCH_SCENE_ID,
  type SceneId
} from '@/game/scenes/sceneIds';

export type SceneHeaderBackLabelKey =
  | 'backToCity'
  | 'backToRidge'
  | 'backToStreet'
  | 'backToOverworld';

export type SceneHeaderChrome =
  | { left: 'default' }
  | {
      left: 'back';
      targetSceneId: SceneId;
      ariaLabelKey: SceneHeaderBackLabelKey;
    };

export function getSceneHeaderChrome(sceneId: SceneId): SceneHeaderChrome {
  if (sceneId === STAMPEDE_SKETCH_SCENE_ID) {
    return {
      left: 'back',
      targetSceneId: OVERWORLD_SCENE_ID,
      ariaLabelKey: 'backToStreet'
    };
  }

  if (sceneId === POTASSIUM_SCENE_ID) {
    return {
      left: 'back',
      targetSceneId: OVERWORLD_SCENE_ID,
      ariaLabelKey: 'backToCity'
    };
  }

  // Ridge has no keyboard exit (Esc belongs to its conversation box), so the
  // header Back button is the one deliberate way out.
  if (sceneId === RIDGE_SCENE_ID) {
    return {
      left: 'back',
      targetSceneId: OVERWORLD_SCENE_ID,
      ariaLabelKey: 'backToOverworld'
    };
  }

  return { left: 'default' };
}
