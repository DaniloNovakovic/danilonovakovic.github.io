import { HOBBIES_SCENE_ID, PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { SceneContextDefinition } from '@/game/sceneLifecycle/types';

interface HobbiesSceneContextOptions {
  onClose: () => void;
  onOpenOverlay: (overlayId: OverlayId) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

/**
 * Scene lifecycle contract for the Hobbies interior scene.
 *
 * The scene is lazy-loaded through the scene registry, then started with
 * callbacks for closing back to the overworld, opening hobby overlays, and
 * restoring the last captured player position.
 */
export function createHobbiesSceneContext(
  options: HobbiesSceneContextOptions
): SceneContextDefinition {
  return {
    id: HOBBIES_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.hobbies,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      onOpenOverlay: options.onOpenOverlay,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
