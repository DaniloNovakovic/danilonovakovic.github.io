import type { SceneUiSurfaceDefinition } from '@/game/sceneUi/registry';
import { PointOfNoReturnPanel } from './PointOfNoReturnPanel';

export const HOBBIES_SCENE_UI_DEFINITIONS: readonly SceneUiSurfaceDefinition[] = [
  {
    id: 'pointOfNoReturn',
    component: PointOfNoReturnPanel,
    panelChrome: 'overlay'
  }
];
