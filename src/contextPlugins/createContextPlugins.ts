import { PHASER_SCENE_KEYS, type MiniGameId } from '../config/featureIds';
import type { ContextPluginDefinition, ResumeSnapshot } from '../core/kernel/types';
import { createBasementPlugin } from './plugins/BasementPlugin';
import { createHobbiesPlugin } from './plugins/HobbiesPlugin';
import { createPotassiumPlatformerPlugin } from './plugins/PotassiumPlatformerPlugin';
import { createStreetPlugin } from './plugins/StreetPlugin';

export interface ContextPluginAssemblyDeps {
  onInteract: (area: string) => void;
  onClose: () => void;
  getIsPaused: () => boolean;
  prepareSceneStart: (sceneKey: string) => void;
  getSceneStartResume: (sceneKey: string) => ResumeSnapshot | undefined;
  loadPhaserScene: (id: MiniGameId) => Promise<unknown> | undefined;
}

export function createContextPlugins(
  deps: ContextPluginAssemblyDeps
): ContextPluginDefinition[] {
  const loadScene = (id: MiniGameId) => () => {
    const scene = deps.loadPhaserScene(id);
    if (!scene) {
      return Promise.reject(new Error(`Missing Phaser scene binding for ${id}`));
    }
    return scene;
  };
  const getPreparedResume = (sceneKey: string) => () => {
    deps.prepareSceneStart(sceneKey);
    return deps.getSceneStartResume(sceneKey);
  };

  return [
    createStreetPlugin({
      onInteract: deps.onInteract,
      getIsPaused: deps.getIsPaused,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.main)
    }),
    createHobbiesPlugin({
      onClose: deps.onClose,
      onInteract: deps.onInteract,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.hobbies),
      loadScene: loadScene(PHASER_SCENE_KEYS.hobbies)
    }),
    createBasementPlugin({
      onClose: deps.onClose,
      onInteract: deps.onInteract,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.basement),
      loadScene: loadScene(PHASER_SCENE_KEYS.basement)
    }),
    createPotassiumPlatformerPlugin({
      onClose: deps.onClose,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.potassium),
      loadScene: loadScene(PHASER_SCENE_KEYS.potassium)
    })
  ];
}
