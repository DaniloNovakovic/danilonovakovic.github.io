import type { SceneUiSurfaceDefinition } from '@/game/sceneUi/registry';
import { RidgeConversationPanel } from './RidgeConversationPanel';

export const RIDGE_SCENE_UI_DEFINITIONS: readonly SceneUiSurfaceDefinition[] = [
  {
    id: 'ridgeConversation',
    component: RidgeConversationPanel,
    panelChrome: 'overlay'
  }
];
