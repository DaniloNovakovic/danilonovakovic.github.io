import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { SceneContextDefinition } from '@/game/kernel/types';

interface HobbiesSceneContextOptions {
  onClose: () => void;
  onInteract: (area: string) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

/**
 * Kernel lifecycle contract for the Hobbies interior scene.
 *
 * The scene is lazy-loaded through the registry, then started with callbacks
 * for closing back to the parent context, opening hobby overlays, and restoring
 * the last captured player position.
 */
export function createHobbiesSceneContext(
  options: HobbiesSceneContextOptions
): SceneContextDefinition {
  return {
    id: PHASER_SCENE_KEYS.hobbies,
    sceneKey: PHASER_SCENE_KEYS.hobbies,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      onInteract: options.onInteract,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
