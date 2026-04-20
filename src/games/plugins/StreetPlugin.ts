import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import { peekResumePosition } from '../../game/sceneResumeStore';
import type { ContextPluginDefinition } from '../../core/kernel/types';

interface StreetPluginOptions {
  onInteract: (area: string) => void;
}

export function createStreetPlugin(options: StreetPluginOptions): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.main,
    sceneKey: PHASER_SCENE_KEYS.main,
    getStartData: () => ({
      onInteract: options.onInteract,
      isPaused: false,
      resumePosition: peekResumePosition(PHASER_SCENE_KEYS.main)
    })
  };
}
