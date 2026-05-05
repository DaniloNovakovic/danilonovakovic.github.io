import { createElement, lazy } from 'react';
import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { FeatureCatalogEntry } from '@/game/registry/catalogTypes';
import type { MiniGameOverlayProps } from '@/game/runtime/types';

const LazyCodingMini = lazy(() => import('./overlays/developerConsole/CodingMini'));

function CodingMini(props: MiniGameOverlayProps) {
  return createElement(LazyCodingMini, props);
}

export const BASEMENT_FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  {
    id: 'basement',
    name: 'Basement',
    description: 'A hidden developer room where rough sketches become playable.',
    runtime: {
      kind: 'phaserScene',
      sceneKey: PHASER_SCENE_KEYS.basement,
      loadScene: () => import('./runtime/BasementScene').then((m) => m.BasementScene)
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
      loadComponent: () => import('./overlays/developerConsole/CodingMini')
    }
  }
];
