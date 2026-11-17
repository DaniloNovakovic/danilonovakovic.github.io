import type { SceneId } from '@/game/scenes/sceneIds';

export type SceneUiSurfaceId =
  | 'stampedeStatus'
  | 'stampedeStartPrompt'
  | 'stampedeUpgradeDraft'
  | 'stampedeResult'
  | 'potassiumUpgradeChoices'
  | 'potassiumTerminal'
  | 'ridgeConversation'
  | 'ridgeBridgeBuilder'
  | 'ridgeCickaDuel'
  | 'ridgeConcertGig';

export type SceneUiActionId =
  | 'start'
  | 'retry'
  | 'backToRidge'
  | 'stampedeUpgradeChoice'
  | 'stampedeKeepGoing'
  | 'castSpell'
  | 'potassiumDraftChoice'
  | 'potassiumTerminalAction'
  | 'ridgeConversationAdvance'
  | 'ridgeConversationChoose'
  | 'ridgeConversationLeave'
  | 'ridgeBridgeTool'
  | 'ridgeBridgeCommand'
  | 'ridgeDuelDodge'
  | 'ridgeGigStrum';

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
  /** Pending one-shot actions, oldest first; the owning scene consumes them. */
  actions: readonly SceneUiActionRequest[];
}
