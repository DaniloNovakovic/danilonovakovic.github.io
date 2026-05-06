import { PHASER_SCENE_KEYS, POTASSIUM_SCENE_ID } from '@/game/scenes/sceneIds';
import type { SceneContextDefinition } from '@/game/sceneLifecycle/types';

interface PotassiumSlipSceneContextOptions {
  onClose: () => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

/**
 * Scene lifecycle contract for the Potassium Slip Phaser scene.
 *
 * Potassium is a full-board Phaser scene rather than a React overlay. This
 * context gives scene lifecycle the lazy scene loader plus the close/resume data
 * that lets the game return through the same scene lifecycle path as interiors.
 */
export function createPotassiumSlipSceneContext(
  options: PotassiumSlipSceneContextOptions
): SceneContextDefinition {
  return {
    id: POTASSIUM_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.potassium,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
