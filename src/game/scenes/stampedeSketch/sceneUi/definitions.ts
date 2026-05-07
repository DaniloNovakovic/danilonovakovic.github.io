import type { SceneUiSurfaceDefinition } from '@/game/sceneUi/registry';
import { StampedeResultPanel } from './StampedeResultPanel';
import { StampedeStartPromptPanel } from './StampedeStartPromptPanel';
import { StampedeStatusStrip } from './StampedeStatusStrip';

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
    id: 'stampedeResult',
    component: StampedeResultPanel
  }
];
