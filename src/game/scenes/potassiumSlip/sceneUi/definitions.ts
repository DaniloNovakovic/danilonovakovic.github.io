import type { SceneUiSurfaceDefinition } from '@/game/sceneUi/registry';
import { PotassiumTerminalPanel } from './PotassiumTerminalPanel';
import { PotassiumUpgradeChoicesPanel } from './PotassiumUpgradeChoicesPanel';

export const POTASSIUM_SCENE_UI_DEFINITIONS: readonly SceneUiSurfaceDefinition[] = [
  {
    id: 'potassiumUpgradeChoices',
    component: PotassiumUpgradeChoicesPanel,
    panelChrome: 'overlay'
  },
  {
    id: 'potassiumTerminal',
    component: PotassiumTerminalPanel,
    panelChrome: 'overlay'
  }
];
