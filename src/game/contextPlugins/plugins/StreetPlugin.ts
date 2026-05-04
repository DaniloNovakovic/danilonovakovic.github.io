import { PHASER_SCENE_KEYS } from '@game/registry/featureIds';
import type { ContextPluginDefinition } from '../../kernel/types';

interface StreetPluginOptions {
  onInteract: (area: string) => void;
  getIsPaused: () => boolean;
  getResumePosition: () => { x: number; y: number } | undefined;
}

export function createStreetPlugin(options: StreetPluginOptions): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.main,
    sceneKey: PHASER_SCENE_KEYS.main,
    getStartData: () => ({
      onInteract: options.onInteract,
      isPaused: options.getIsPaused(),
      resumePosition: options.getResumePosition()
    })
  };
}
