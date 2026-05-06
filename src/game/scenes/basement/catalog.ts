import { createElement, lazy } from 'react';
import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { FeatureCatalogEntry } from '@/game/registry/catalogTypes';
import type { MiniGameOverlayProps } from '@/game/runtime/types';
import { messages } from '@/shared/i18n';

const LazyCodingMini = lazy(() => import('./overlays/developerConsole/CodingMini'));

function CodingMini(props: MiniGameOverlayProps) {
  return createElement(LazyCodingMini, props);
}

export const BASEMENT_FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  {
    id: 'basement',
    name: messages.catalog.basement.basement.name,
    description: messages.catalog.basement.basement.description,
    runtime: {
      kind: 'phaserScene',
      sceneKey: PHASER_SCENE_KEYS.basement,
      loadScene: () => import('./runtime/BasementScene').then((m) => m.BasementScene)
    }
  },
  {
    id: 'games',
    name: messages.catalog.basement.games.name,
    description: messages.catalog.basement.games.description,
    overlayParentId: 'basement',
    runtime: {
      kind: 'reactOverlay',
      component: CodingMini,
      loadComponent: () => import('./overlays/developerConsole/CodingMini')
    }
  }
];
