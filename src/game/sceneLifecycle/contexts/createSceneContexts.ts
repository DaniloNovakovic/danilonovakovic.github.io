import {
  BASEMENT_SCENE_ID,
  HOBBIES_SCENE_ID,
  PHASER_SCENE_KEYS,
  POTASSIUM_SCENE_ID,
  RIDGE_SCENE_ID,
  type SceneId
} from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import { createBasementSceneContext } from '@/game/scenes/basement/sceneContext';
import { createHobbiesSceneContext } from '@/game/scenes/hobbies/sceneContext';
import { createOverworldSceneContext } from '@/game/scenes/overworld/sceneContext';
import { createPotassiumSlipSceneContext } from '@/game/scenes/potassiumSlip/sceneContext';
import { createRidgeSceneContext } from '@/game/scenes/ridge/sceneContext';
import type { ResumeSnapshot, SceneContextDefinition } from '../types';

export interface SceneContextAssemblyDeps {
  onEnterScene: (sceneId: SceneId) => void;
  onOpenOverlay: (overlayId: OverlayId) => void;
  onReturnToOverworld: () => void;
  getIsPaused: () => boolean;
  prepareSceneStart: (sceneKey: string) => void;
  getSceneStartResume: (sceneKey: string) => ResumeSnapshot | undefined;
  loadPhaserScene: (id: SceneId) => Promise<unknown> | undefined;
}

/**
 * Builds the complete set of scene contexts known by the game shell.
 *
 * A scene context is a small scene lifecycle contract for `SceneManager`: it
 * names the context id, points to the Phaser scene key, optionally lazy-loads
 * the scene class, and composes the start data that scene needs. Keeping
 * assembly here lets `Game.tsx` boot Phaser once without knowing every scene's
 * constructor data, resume behavior, or close/interact callbacks.
 */
export function createSceneContexts(
  deps: SceneContextAssemblyDeps
): SceneContextDefinition[] {
  const loadScene = (id: SceneId) => () => {
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
      onEnterScene: deps.onEnterScene,
      onOpenOverlay: deps.onOpenOverlay,
      getIsPaused: deps.getIsPaused,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.overworld)
    }),
    createHobbiesSceneContext({
      onClose: deps.onReturnToOverworld,
      onOpenOverlay: deps.onOpenOverlay,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.hobbies),
      loadScene: loadScene(HOBBIES_SCENE_ID)
    }),
    createBasementSceneContext({
      onClose: deps.onReturnToOverworld,
      onOpenOverlay: deps.onOpenOverlay,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.basement),
      loadScene: loadScene(BASEMENT_SCENE_ID)
    }),
    createPotassiumSlipSceneContext({
      onClose: deps.onReturnToOverworld,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.potassium),
      loadScene: loadScene(POTASSIUM_SCENE_ID)
    }),
    createRidgeSceneContext({
      onClose: deps.onReturnToOverworld,
      onOpenOverlay: deps.onOpenOverlay,
      getResumePosition: getPreparedResume(PHASER_SCENE_KEYS.ridge),
      loadScene: loadScene(RIDGE_SCENE_ID)
    })
  ];
}
