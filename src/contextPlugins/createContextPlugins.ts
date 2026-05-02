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
  getResumePosition: (sceneKey: string) => ResumeSnapshot | undefined;
  forgetResumePosition: (sceneKey: string) => void;
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

  return [
    createStreetPlugin({
      onInteract: deps.onInteract,
      getIsPaused: deps.getIsPaused,
      getResumePosition: () => deps.getResumePosition(PHASER_SCENE_KEYS.main)
    }),
    createHobbiesPlugin({
      onClose: deps.onClose,
      onInteract: deps.onInteract,
      getResumePosition: () => deps.getResumePosition(PHASER_SCENE_KEYS.hobbies),
      loadScene: loadScene(PHASER_SCENE_KEYS.hobbies)
    }),
    createBasementPlugin({
      onClose: deps.onClose,
      onInteract: deps.onInteract,
      getResumePosition: () => deps.getResumePosition(PHASER_SCENE_KEYS.basement),
      loadScene: loadScene(PHASER_SCENE_KEYS.basement)
    }),
    createPotassiumPlatformerPlugin({
      onClose: deps.onClose,
      forgetResumePosition: () => deps.forgetResumePosition(PHASER_SCENE_KEYS.potassium),
      getResumePosition: () => deps.getResumePosition(PHASER_SCENE_KEYS.potassium),
      loadScene: loadScene(PHASER_SCENE_KEYS.potassium)
    })
  ];
}
