import {
  POTASSIUM_SCENE_ID,
  STAMPEDE_SKETCH_SCENE_ID,
  type SceneId
} from '@/game/scenes/sceneIds';
import type {
  NotebookFooterMode,
  NotebookSceneProfile,
  NotebookShellLayout
} from '@/shared/ui';

export interface NotebookRuntimeShellProfile {
  ownerSceneId: SceneId;
  profile: NotebookSceneProfile;
  layout: NotebookShellLayout;
  footerMode: NotebookFooterMode;
  controlMatLabel: string;
}

export function getNotebookRuntimeShellProfile(sceneId: SceneId): NotebookRuntimeShellProfile | null {
  if (sceneId === POTASSIUM_SCENE_ID) {
    return {
      ownerSceneId: POTASSIUM_SCENE_ID,
      profile: 'ruledBoardPage',
      layout: 'focus',
      footerMode: 'reserved',
      controlMatLabel: 'input mat wider than board'
    };
  }

  if (sceneId === STAMPEDE_SKETCH_SCENE_ID) {
    return {
      ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
      profile: 'survivalPage',
      layout: 'focus',
      footerMode: 'reserved',
      controlMatLabel: 'input mat wider than survival page'
    };
  }

  return null;
}
