import { PHASER_SCENE_KEYS } from '@config/featureIds';
import type { ContextPluginDefinition } from '../../core/kernel/types';

interface PotassiumPlatformerPluginOptions {
  onClose: () => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

export function createPotassiumPlatformerPlugin(
  options: PotassiumPlatformerPluginOptions
): ContextPluginDefinition {
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
