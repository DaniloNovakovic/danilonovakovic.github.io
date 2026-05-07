import { BASEMENT_SCENE_ID, PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { SceneContextDefinition } from '@/game/sceneLifecycle/types';

interface BasementSceneContextOptions {
  onClose: () => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

/**
 * Scene lifecycle contract for the Basement interior scene.
 *
 * Basement follows the same interior contract as Hobbies: lazy-load the Phaser
 * scene, provide close/interact callbacks, and include a prepared resume
 * position in the scene start data.
 */
export function createBasementSceneContext(
  options: BasementSceneContextOptions
): SceneContextDefinition {
  return {
    id: BASEMENT_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.basement,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      onOpenOverlay: options.onOpenOverlay,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
