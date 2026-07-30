import type { SceneId } from '@/game/scenes/sceneIds';

export type SceneUiSurfaceId =
  | 'stampedeStatus'
  | 'stampedeStartPrompt'
  | 'stampedeUpgradeDraft'
  | 'stampedeResult'
  | 'potassiumUpgradeChoices'
  | 'potassiumTerminal'
  | 'ridgeConversation';

export type SceneUiActionId =
  | 'start'
  | 'retry'
  | 'backToRidge'
  | 'stampedeUpgradeChoice'
  | 'potassiumDraftChoice'
  | 'potassiumTerminalAction'
  | 'ridgeConversationAdvance'
  | 'ridgeConversationChoose'
  | 'ridgeConversationLeave';

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
