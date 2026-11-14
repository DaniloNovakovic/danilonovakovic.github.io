import type { SceneUiSurfaceDefinition } from '@/game/sceneUi/registry';
import { RidgeBridgeBuilderPanel } from './RidgeBridgeBuilderPanel';
import { RidgeConversationPanel } from './RidgeConversationPanel';

export const RIDGE_SCENE_UI_DEFINITIONS: readonly SceneUiSurfaceDefinition[] = [
  {
    id: 'ridgeConversation',
    component: RidgeConversationPanel,
    panelChrome: 'docked'
  },
  {
    id: 'ridgeBridgeBuilder',
    component: RidgeBridgeBuilderPanel,
    panelChrome: 'docked',
    capturesScenePointer: true
  }
];
