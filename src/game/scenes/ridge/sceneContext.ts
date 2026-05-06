import { PHASER_SCENE_KEYS, RIDGE_SCENE_ID } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { SceneContextDefinition } from '@/game/sceneLifecycle/types';

interface RidgeSceneContextOptions {
  onClose: () => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

/**
 * Scene lifecycle contract for the placeholder Sketchbook Ridge scene.
 *
 * Ridge starts as a separate loadable scene so it can be tested directly before
 * replacing or absorbing the current overworld route.
 */
export function createRidgeSceneContext(
  options: RidgeSceneContextOptions
): SceneContextDefinition {
  return {
    id: RIDGE_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.ridge,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      onOpenOverlay: options.onOpenOverlay,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
