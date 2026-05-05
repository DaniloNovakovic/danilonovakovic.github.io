import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { SceneContextDefinition } from '@/game/kernel/types';

interface BasementSceneContextOptions {
  onClose: () => void;
  onInteract: (id: string) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

/**
 * Kernel lifecycle contract for the Basement interior scene.
 *
 * Basement follows the same interior contract as Hobbies: lazy-load the Phaser
 * scene, provide close/interact callbacks, and include a prepared resume
 * position in the scene start data.
 */
export function createBasementSceneContext(
  options: BasementSceneContextOptions
): SceneContextDefinition {
  return {
    id: PHASER_SCENE_KEYS.basement,
    sceneKey: PHASER_SCENE_KEYS.basement,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      onInteract: options.onInteract,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
