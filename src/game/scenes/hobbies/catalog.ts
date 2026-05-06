import { createElement, lazy } from 'react';
import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { FeatureCatalogEntry } from '@/game/registry/catalogTypes';
import type { MiniGameOverlayProps } from '@/game/runtime/types';
import { messages } from '@/shared/i18n';

const LazyDrawingCanvas = lazy(() => import('./overlays/art/DrawingCanvas'));
const LazyDancingMini = lazy(() => import('./overlays/dancing/DancingMini'));
const LazyMuayThaiMini = lazy(() => import('./overlays/fitness/MuayThaiMini'));
const LazyGuitarStrings = lazy(() => import('./overlays/music/GuitarStrings'));

function DrawingCanvas(props: MiniGameOverlayProps) {
  return createElement(LazyDrawingCanvas, props);
}

function DancingMini(props: MiniGameOverlayProps) {
  return createElement(LazyDancingMini, props);
}

function MuayThaiMini(props: MiniGameOverlayProps) {
  return createElement(LazyMuayThaiMini, props);
}

function GuitarStrings(props: MiniGameOverlayProps) {
  return createElement(LazyGuitarStrings, props);
}

export const HOBBIES_FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  {
    id: 'hobbies',
    name: messages.catalog.hobbies.hobbies.name,
    description: messages.catalog.hobbies.hobbies.description,
    runtime: {
      kind: 'phaserScene',
      sceneKey: PHASER_SCENE_KEYS.hobbies,
      loadScene: () => import('./runtime/HobbiesScene').then((m) => m.HobbiesScene)
    }
  },
  {
    id: 'art',
    name: messages.catalog.hobbies.art.name,
    description: messages.catalog.hobbies.art.description,
    overlayParentId: 'hobbies',
    runtime: {
      kind: 'reactOverlay',
      component: DrawingCanvas,
      loadComponent: () => import('./overlays/art/DrawingCanvas')
    }
  },
  {
    id: 'music',
    name: messages.catalog.hobbies.music.name,
    description: messages.catalog.hobbies.music.description,
    overlayParentId: 'hobbies',
    runtime: {
      kind: 'reactOverlay',
      component: GuitarStrings,
      loadComponent: () => import('./overlays/music/GuitarStrings')
    }
  },
  {
    id: 'fitness',
    name: messages.catalog.hobbies.fitness.name,
    description: messages.catalog.hobbies.fitness.description,
    overlayParentId: 'hobbies',
    runtime: {
      kind: 'reactOverlay',
      component: MuayThaiMini,
      loadComponent: () => import('./overlays/fitness/MuayThaiMini')
    }
  },
  {
    id: 'dancing',
    name: messages.catalog.hobbies.dancing.name,
    description: messages.catalog.hobbies.dancing.description,
    overlayParentId: 'hobbies',
    runtime: {
      kind: 'reactOverlay',
      component: DancingMini,
      loadComponent: () => import('./overlays/dancing/DancingMini')
    }
  }
];
