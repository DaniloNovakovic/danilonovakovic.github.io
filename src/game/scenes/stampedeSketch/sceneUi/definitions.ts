import type { SceneUiSurfaceDefinition } from '@/game/sceneUi/registry';
import { StampedeResultPanel } from './StampedeResultPanel';
import { StampedeStartPromptPanel } from './StampedeStartPromptPanel';
import { StampedeStatusStrip } from './StampedeStatusStrip';
import { StampedeUpgradeDraftPanel } from './StampedeUpgradeDraftPanel';

export const STAMPEDE_SCENE_UI_DEFINITIONS: readonly SceneUiSurfaceDefinition[] = [
  {
    id: 'stampedeStatus',
    component: StampedeStatusStrip
  },
  {
    id: 'stampedeStartPrompt',
    component: StampedeStartPromptPanel
  },
  {
    id: 'stampedeUpgradeDraft',
    component: StampedeUpgradeDraftPanel,
    panelChrome: 'overlay'
  },
  {
    id: 'stampedeResult',
    component: StampedeResultPanel
  }
];
