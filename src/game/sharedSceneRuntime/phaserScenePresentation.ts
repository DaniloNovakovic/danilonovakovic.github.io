import { POTASSIUM_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';

const FULL_BOARD_PHASER_SCENE_IDS = new Set<SceneId>([POTASSIUM_SCENE_ID]);

export type PhaserScenePresentationMode = 'portrait-cover' | 'full-board' | 'vertical-board';

export function isFullBoardPhaserScene(id: string | null | undefined): id is SceneId {
  return id !== null && id !== undefined && FULL_BOARD_PHASER_SCENE_IDS.has(id as SceneId);
}

export function getPhaserScenePresentationMode(
  id: string | null | undefined
): PhaserScenePresentationMode {
  return isFullBoardPhaserScene(id) ? 'vertical-board' : 'portrait-cover';
}
