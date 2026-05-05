import { createElement, lazy } from 'react';
import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { FeatureCatalogEntry } from '@/game/registry/catalogTypes';
import type { MiniGameOverlayProps } from '@/game/runtime/types';

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
    name: 'Hobbies',
    description: 'Step inside to see what I do when I am not coding.',
    runtime: {
      kind: 'phaserScene',
      sceneKey: PHASER_SCENE_KEYS.hobbies,
      loadScene: () => import('./runtime/HobbiesScene').then((m) => m.HobbiesScene)
    }
  },
  {
    id: 'art',
    name: 'Digital Art',
    description: 'Sketching and drawing is how I relax.',
    overlayParentId: 'hobbies',
    runtime: {
      kind: 'reactOverlay',
      component: DrawingCanvas,
      loadComponent: () => import('./overlays/art/DrawingCanvas')
    }
  },
  {
    id: 'music',
    name: 'Music Performance',
    description: 'Playing guitar and making music.',
    overlayParentId: 'hobbies',
    runtime: {
      kind: 'reactOverlay',
      component: GuitarStrings,
      loadComponent: () => import('./overlays/music/GuitarStrings')
    }
  },
  {
    id: 'fitness',
    name: 'Muay Thai & Fitness',
    description: 'Keeping active with Muay Thai and exercise.',
    overlayParentId: 'hobbies',
    runtime: {
      kind: 'reactOverlay',
      component: MuayThaiMini,
      loadComponent: () => import('./overlays/fitness/MuayThaiMini')
    }
  },
  {
    id: 'dancing',
    name: 'Dance & rhythm',
    description: 'Repeat the moves, feel the beat—coordination as a mini-game.',
    overlayParentId: 'hobbies',
    runtime: {
      kind: 'reactOverlay',
      component: DancingMini,
      loadComponent: () => import('./overlays/dancing/DancingMini')
    }
  }
];
