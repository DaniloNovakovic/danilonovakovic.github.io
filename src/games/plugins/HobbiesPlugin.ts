import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import { peekResumePosition } from '../../game/sceneResumeStore';
import type { ContextPluginDefinition } from '../../core/kernel/types';

interface HobbiesPluginOptions {
  onClose: () => void;
  onInteract: (area: string) => void;
}

export function createHobbiesPlugin(options: HobbiesPluginOptions): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.hobbies,
    sceneKey: PHASER_SCENE_KEYS.hobbies,
    getStartData: () => ({
      onClose: options.onClose,
      onInteract: options.onInteract,
      isPaused: false,
      resumePosition: peekResumePosition(PHASER_SCENE_KEYS.hobbies)
    })
  };
}
