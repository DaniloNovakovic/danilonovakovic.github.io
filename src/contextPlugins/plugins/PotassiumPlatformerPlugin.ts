import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import type { ContextPluginDefinition } from '../../core/kernel/types';
import { forgetResumePosition } from '../../runtime/sceneResumeStore';

interface PotassiumPlatformerPluginOptions {
  onClose: () => void;
  getResumePosition: () => { x: number; y: number } | undefined;
}

export function createPotassiumPlatformerPlugin(
  options: PotassiumPlatformerPluginOptions
): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.potassium,
    sceneKey: PHASER_SCENE_KEYS.potassium,
    getStartData: () => {
      forgetResumePosition(PHASER_SCENE_KEYS.potassium);
      return {
        onClose: options.onClose,
        isPaused: false,
        resumePosition: options.getResumePosition()
      };
    }
  };
}
