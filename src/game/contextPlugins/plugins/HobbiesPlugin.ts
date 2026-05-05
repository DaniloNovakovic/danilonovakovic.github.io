import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { ContextPluginDefinition } from '../../kernel/types';

interface HobbiesPluginOptions {
  onClose: () => void;
  onInteract: (area: string) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

export function createHobbiesPlugin(options: HobbiesPluginOptions): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.hobbies,
    sceneKey: PHASER_SCENE_KEYS.hobbies,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      onInteract: options.onInteract,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
