import { PHASER_SCENE_KEYS, type MiniGameId } from '@/game/registry/featureIds';
import { createBasementSceneContext } from '@/game/scenes/basement/sceneContext';
import { createHobbiesSceneContext } from '@/game/scenes/hobbies/sceneContext';
import { createOverworldSceneContext } from '@/game/scenes/overworld/sceneContext';
import { createPotassiumSlipSceneContext } from '@/game/scenes/potassiumSlip/sceneContext';
import type { ResumeSnapshot, SceneContextDefinition } from '../kernel/types';

export interface SceneContextAssemblyDeps {
  onInteract: (area: string) => void;
  onClose: () => void;
  getIsPaused: () => boolean;
  prepareSceneStart: (sceneKey: string) => void;
  getSceneStartResume: (sceneKey: string) => ResumeSnapshot | undefined;
  loadPhaserScene: (id: MiniGameId) => Promise<unknown> | undefined;
}

/**
 * Builds the complete set of scene contexts known by the game shell.
 *
 * A scene context is a small kernel lifecycle contract for `SceneManager`: it
 * names the context id, points to the Phaser scene key, optionally lazy-loads
 * the scene class, and composes the start data that scene needs. Keeping
 * assembly here lets `Game.tsx` boot Phaser once without knowing every scene's
 * constructor data, resume behavior, or close/interact callbacks.
 */
export function createSceneContexts(
  deps: SceneContextAssemblyDeps
): SceneContextDefinition[] {
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
    createOverworldSceneContext({
      onInteract: deps.onInteract,
      getIsPaused: deps.getIsPaused,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.main)
    }),
    createHobbiesSceneContext({
      onClose: deps.onClose,
      onInteract: deps.onInteract,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.hobbies),
      loadScene: loadScene(PHASER_SCENE_KEYS.hobbies)
    }),
    createBasementSceneContext({
      onClose: deps.onClose,
      onInteract: deps.onInteract,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.basement),
      loadScene: loadScene(PHASER_SCENE_KEYS.basement)
    }),
    createPotassiumSlipSceneContext({
      onClose: deps.onClose,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.potassium),
      loadScene: loadScene(PHASER_SCENE_KEYS.potassium)
    })
  ];
}
