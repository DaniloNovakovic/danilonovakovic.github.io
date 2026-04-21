import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import type { ContextPluginDefinition } from '../../core/kernel/types';

interface HobbiesPluginOptions {
  onClose: () => void;
  onInteract: (area: string) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
}

export function createHobbiesPlugin(options: HobbiesPluginOptions): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.hobbies,
    sceneKey: PHASER_SCENE_KEYS.hobbies,
    getStartData: () => ({
      onClose: options.onClose,
      onInteract: options.onInteract,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
