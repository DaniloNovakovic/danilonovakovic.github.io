import type { SceneId } from '@/game/scenes/sceneIds';

export const SCENE_UI_SURFACE_IDS = [
  'stampedeStatus',
  'stampedeStartPrompt',
  'stampedeUpgradeDraft',
  'stampedeResult',
  'potassiumUpgradeChoices',
  'potassiumTerminal'
] as const;

export type SceneUiSurfaceId = (typeof SCENE_UI_SURFACE_IDS)[number];

export type SceneUiActionId =
  | 'start'
  | 'retry'
  | 'backToRidge'
  | 'stampedeUpgradeChoice'
  | 'potassiumDraftChoice'
  | 'potassiumTerminalAction';

export interface SceneUiSurfaceRequest {
  ownerSceneId: SceneId;
  id: SceneUiSurfaceId;
  params?: unknown;
}

export interface SceneUiActionRequest {
  ownerSceneId: SceneId;
  action: SceneUiActionId;
  params?: unknown;
  sequence: number;
}

export interface SceneUiState {
  status: SceneUiSurfaceRequest | null;
  panel: SceneUiSurfaceRequest | null;
  lastAction: SceneUiActionRequest | null;
}
