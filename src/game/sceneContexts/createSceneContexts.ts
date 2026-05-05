import { PHASER_SCENE_KEYS, type MiniGameId } from '@/game/registry/featureIds';
import type { ContextPluginDefinition, ResumeSnapshot } from '../kernel/types';
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

/**
 * Builds the complete set of scene context plugins known by the game shell.
 *
 * A context plugin is a small scene entry contract for `SceneManager`: it names
 * the context id, points to the Phaser scene key, optionally lazy-loads the
 * scene class, and composes the start data that scene needs. Keeping this here
 * lets `Game.tsx` boot Phaser once without knowing every scene's constructor
 * data, resume behavior, or close/interact callbacks.
 */
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
