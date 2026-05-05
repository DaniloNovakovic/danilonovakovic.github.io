import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { SceneContextDefinition } from '@/game/kernel/types';

interface PotassiumSlipSceneContextOptions {
  onClose: () => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

/**
 * Kernel lifecycle contract for the Potassium Slip Phaser mini-game.
 *
 * Potassium is a full-board Phaser scene rather than a React overlay. This
 * context gives the kernel the lazy scene loader plus the close/resume data
 * that lets the game return through the same scene lifecycle path as interiors.
 */
export function createPotassiumSlipSceneContext(
  options: PotassiumSlipSceneContextOptions
): SceneContextDefinition {
  return {
    id: PHASER_SCENE_KEYS.potassium,
    sceneKey: PHASER_SCENE_KEYS.potassium,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
