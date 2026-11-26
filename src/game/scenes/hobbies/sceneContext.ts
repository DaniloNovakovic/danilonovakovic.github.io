import { HOBBIES_SCENE_ID, PHASER_SCENE_KEYS, type SceneId } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { SceneContextDefinition } from '@/game/sceneLifecycle/types';

interface HobbiesSceneContextOptions {
  onClose: () => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  /** Out of Bounds escape: the torn opening leads into the Basement. */
  onEnterScene: (sceneId: SceneId) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

/**
 * Scene lifecycle contract for the Hobbies interior scene.
 *
 * The scene is lazy-loaded through the scene registry, then started with
 * callbacks for closing back to the overworld, opening hobby overlays,
 * entering the Basement through the Out of Bounds opening, and restoring the
 * last captured player position.
 */
export function createHobbiesSceneContext(options: HobbiesSceneContextOptions): SceneContextDefinition {
  return {
    id: HOBBIES_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.hobbies,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      onOpenOverlay: options.onOpenOverlay,
      onEnterScene: options.onEnterScene,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
