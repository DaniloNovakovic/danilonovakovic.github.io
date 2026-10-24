import { PHASER_SCENE_KEYS, STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import type { SceneContextDefinition } from '@/game/sceneLifecycle/types';

interface StampedeSketchSceneContextOptions {
  onClose: () => void;
  loadScene: () => Promise<unknown>;
}

/**
 * Scene lifecycle contract for Chick Magnet (the stampede sketch scene).
 *
 * The street chick starts it. Closing returns to the overworld.
 */
export function createStampedeSketchSceneContext(
  options: StampedeSketchSceneContextOptions
): SceneContextDefinition {
  return {
    id: STAMPEDE_SKETCH_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.stampedeSketch,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      isPaused: false
    })
  };
}
