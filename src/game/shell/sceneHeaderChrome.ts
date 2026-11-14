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

  // Esc never leaves Ridge (it closes the conversation box), so the header
  // Back button is the deliberate way out. Potassium and Stampede likewise
  // ignore Esc so a stray press cannot end a run.
  if (sceneId === RIDGE_SCENE_ID) {
    return {
      left: 'back',
      targetSceneId: OVERWORLD_SCENE_ID,
      ariaLabelKey: 'backToOverworld'
    };
  }

  return { left: 'default' };
}
