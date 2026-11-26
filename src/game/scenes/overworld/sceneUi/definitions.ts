import type { SceneUiSurfaceDefinition } from '@/game/sceneUi/registry';
import { StreetFightPanel } from './StreetFightPanel';

export const OVERWORLD_SCENE_UI_DEFINITIONS: readonly SceneUiSurfaceDefinition[] = [
  {
    id: 'streetFight',
    component: StreetFightPanel,
    // Only the hammer button takes input; taps elsewhere still walk and the mat stays.
    panelChrome: 'docked'
  }
];
