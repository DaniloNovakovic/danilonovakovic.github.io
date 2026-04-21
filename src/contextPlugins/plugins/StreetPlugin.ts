import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import type { ContextPluginDefinition } from '../../core/kernel/types';

interface StreetPluginOptions {
  onInteract: (area: string) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
}

export function createStreetPlugin(options: StreetPluginOptions): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.main,
    sceneKey: PHASER_SCENE_KEYS.main,
    getStartData: () => ({
      onInteract: options.onInteract,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
