import { PHASER_SCENE_KEYS, RIDGE_SCENE_ID } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { SceneContextDefinition } from '@/game/sceneLifecycle/types';
import type { RidgeDevControls } from './runtime/ridgeDevControls';

interface RidgeSceneContextOptions {
  onClose: () => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
  getDevControls?: () => RidgeDevControls | undefined;
}

/**
 * Scene lifecycle contract for the Bridge Tracer Ridge scene.
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
      resumePosition: options.getResumePosition(),
      ridgeDevControls: import.meta.env.DEV ? options.getDevControls?.() : undefined
    })
  };
}
