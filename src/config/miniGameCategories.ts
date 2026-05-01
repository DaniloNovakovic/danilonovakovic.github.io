import { MINI_GAME_IDS, type MiniGameId } from './featureIds';
import { getRuntimeBinding } from './featureRuntimeBindings';

export const PHASER_SCENE_MINIGAME_IDS: readonly MiniGameId[] = MINI_GAME_IDS.filter(
  (id) => getRuntimeBinding(id).kind === 'phaserScene'
);

export function isPhaserSceneMiniGameId(id: MiniGameId): boolean {
  return (PHASER_SCENE_MINIGAME_IDS as readonly string[]).includes(id);
}

/** Returns true for mini-game ids whose activation should pause the Phaser engine. */
export function isOverlayPauseTriggerId(id: MiniGameId): boolean {
  return (MINI_GAME_IDS as readonly string[]).includes(id) && !isPhaserSceneMiniGameId(id);
}
