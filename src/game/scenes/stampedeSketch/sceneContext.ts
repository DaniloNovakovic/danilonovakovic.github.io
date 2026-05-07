import { PHASER_SCENE_KEYS, STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import type { SceneContextDefinition } from '@/game/sceneLifecycle/types';

interface StampedeSketchSceneContextOptions {
  onClose: () => void;
  loadScene: () => Promise<unknown>;
}

/**
 * Scene lifecycle contract for the movement-only Stampede Sketch prototype.
 *
 * Stampede is entered from Ridge Trail Cards, so closing returns to Ridge
 * instead of the legacy overworld route used by older interior scenes.
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
