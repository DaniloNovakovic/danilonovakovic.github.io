import { MINI_GAME_IDS, type MiniGameId } from './featureIds';

/**
 * Keep this list in sync with Phaser scene plugins.
 * It intentionally lives in config to avoid runtime import cycles.
 */
export const PHASER_SCENE_MINIGAME_IDS: readonly MiniGameId[] = ['hobbies'] as const;

export function isPhaserSceneMiniGameId(id: MiniGameId): boolean {
  return (PHASER_SCENE_MINIGAME_IDS as readonly string[]).includes(id);
}

export function isReactOverlayMiniGameId(id: MiniGameId): boolean {
  return (MINI_GAME_IDS as readonly string[]).includes(id) && !isPhaserSceneMiniGameId(id);
}
