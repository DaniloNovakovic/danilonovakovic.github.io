import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import type { ContextPluginDefinition } from '../../core/kernel/types';

interface PotassiumPlatformerPluginOptions {
  onClose: () => void;
  forgetResumePosition: () => void;
  getResumePosition: () => { x: number; y: number } | undefined;
}

export function createPotassiumPlatformerPlugin(
  options: PotassiumPlatformerPluginOptions
): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.potassium,
    sceneKey: PHASER_SCENE_KEYS.potassium,
    getStartData: () => {
      options.forgetResumePosition();
      return {
        onClose: options.onClose,
        isPaused: false,
        resumePosition: options.getResumePosition()
      };
    }
  };
}
