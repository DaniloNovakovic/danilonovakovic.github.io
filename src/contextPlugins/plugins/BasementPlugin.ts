import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import type { ContextPluginDefinition } from '../../core/kernel/types';

interface BasementPluginOptions {
  onClose: () => void;
  getResumePosition: () => { x: number; y: number } | undefined;
}

export function createBasementPlugin(options: BasementPluginOptions): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.basement,
    sceneKey: PHASER_SCENE_KEYS.basement,
    getStartData: () => ({
      onClose: options.onClose,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
