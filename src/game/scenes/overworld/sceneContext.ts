import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { SceneContextDefinition } from '@/game/kernel/types';

interface OverworldSceneContextOptions {
  onInteract: (area: string) => void;
  getIsPaused: () => boolean;
  getResumePosition: () => { x: number; y: number } | undefined;
}

/**
 * Kernel lifecycle contract for the overworld street scene.
 *
 * The overworld is registered during Phaser boot, so this context only supplies
 * scene start data: bridge interaction callback, current pause state, and any
 * prepared resume position.
 */
export function createOverworldSceneContext(
  options: OverworldSceneContextOptions
): SceneContextDefinition {
  return {
    id: PHASER_SCENE_KEYS.main,
    sceneKey: PHASER_SCENE_KEYS.main,
    getStartData: () => ({
      onInteract: options.onInteract,
      isPaused: options.getIsPaused(),
      resumePosition: options.getResumePosition()
    })
  };
}
