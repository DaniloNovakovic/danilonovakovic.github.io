import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import type { FeatureCatalogEntry } from '../catalogTypes';
import CodingMini from './overlays/developerConsole/CodingMini';

export const BASEMENT_FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  {
    id: 'basement',
    name: 'Basement',
    description: 'A hidden developer room where rough sketches become playable.',
    runtime: {
      kind: 'phaserScene',
      sceneKey: PHASER_SCENE_KEYS.basement,
      loadScene: () => import('../../runtime/BasementScene').then((m) => m.BasementScene)
    }
  },
  {
    id: 'games',
    name: 'Developer Console',
    description: 'A basement terminal for profile commands, skills, notes and experiments.',
    overlayParentId: 'basement',
    runtime: {
      kind: 'reactOverlay',
      component: CodingMini,
      loadComponent: async () => ({ default: CodingMini })
    }
  }
];
