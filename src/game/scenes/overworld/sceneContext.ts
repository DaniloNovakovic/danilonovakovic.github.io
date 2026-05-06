import { OVERWORLD_SCENE_ID, PHASER_SCENE_KEYS, type SceneId } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { SceneContextDefinition } from '@/game/sceneLifecycle/types';

interface OverworldSceneContextOptions {
  onEnterScene: (sceneId: SceneId) => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  getIsPaused: () => boolean;
  getResumePosition: () => { x: number; y: number } | undefined;
}

/**
 * Scene lifecycle contract for the overworld street scene.
 *
 * The overworld is registered during Phaser boot, so this context only supplies
 * scene start data: bridge interaction callback, current pause state, and any
 * prepared resume position.
 */
export function createOverworldSceneContext(
  options: OverworldSceneContextOptions
): SceneContextDefinition {
  return {
    id: OVERWORLD_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.overworld,
    getStartData: () => ({
      onEnterScene: options.onEnterScene,
      onOpenOverlay: options.onOpenOverlay,
      isPaused: options.getIsPaused(),
      resumePosition: options.getResumePosition()
    })
  };
}
