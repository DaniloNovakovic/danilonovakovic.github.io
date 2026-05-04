import { PHASER_SCENE_KEYS } from '@game/registry/featureIds';
import type { ContextPluginDefinition } from '../../kernel/types';

interface BasementPluginOptions {
  onClose: () => void;
  onInteract: (id: string) => void;
  getResumePosition: () => { x: number; y: number } | undefined;
  loadScene: () => Promise<unknown>;
}

export function createBasementPlugin(options: BasementPluginOptions): ContextPluginDefinition {
  return {
    id: PHASER_SCENE_KEYS.basement,
    sceneKey: PHASER_SCENE_KEYS.basement,
    loadScene: options.loadScene,
    getStartData: () => ({
      onClose: options.onClose,
      onInteract: options.onInteract,
      isPaused: false,
      resumePosition: options.getResumePosition()
    })
  };
}
