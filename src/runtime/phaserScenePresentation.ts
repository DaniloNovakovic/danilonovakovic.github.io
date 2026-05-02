import { POTASSIUM_FEATURE_ID, type MiniGameId } from '../config/featureIds';

const FULL_BOARD_PHASER_SCENE_IDS = new Set<MiniGameId>([POTASSIUM_FEATURE_ID]);

export type PhaserScenePresentationMode = 'portrait-cover' | 'full-board' | 'vertical-board';

export function isFullBoardPhaserScene(id: string | null | undefined): id is MiniGameId {
  return id !== null && id !== undefined && FULL_BOARD_PHASER_SCENE_IDS.has(id as MiniGameId);
}

export function getPhaserScenePresentationMode(
  id: string | null | undefined
): PhaserScenePresentationMode {
  return isFullBoardPhaserScene(id) ? 'vertical-board' : 'portrait-cover';
}
