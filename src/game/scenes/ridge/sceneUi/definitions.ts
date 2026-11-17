import type { SceneUiSurfaceDefinition } from '@/game/sceneUi/registry';
import { RidgeBridgeBuilderPanel } from './RidgeBridgeBuilderPanel';
import { RidgeCickaDuelPanel } from './RidgeCickaDuelPanel';
import { RidgeConcertGigPanel } from './RidgeConcertGigPanel';
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
    capturesScenePointer: true,
    expandsGameFrame: true
  },
  {
    id: 'ridgeCickaDuel',
    component: RidgeCickaDuelPanel,
    panelChrome: 'docked'
  },
  {
    id: 'ridgeConcertGig',
    component: RidgeConcertGigPanel,
    panelChrome: 'docked',
    // Taps on the highway strum its lanes, so the move/interact touch mat steps aside.
    capturesScenePointer: true,
    // Phones get the tall frame: the highway needs height to read ahead.
    expandsGameFrame: true
  }
];
