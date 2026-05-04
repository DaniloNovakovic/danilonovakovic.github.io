import { PHASER_SCENE_KEYS } from '@game/registry/featureIds';
import type { FeatureCatalogEntry } from '@game/registry/catalogTypes';
import DrawingCanvas from './overlays/art/DrawingCanvas';
import DancingMini from './overlays/dancing/DancingMini';
import MuayThaiMini from './overlays/fitness/MuayThaiMini';
import GuitarStrings from './overlays/music/GuitarStrings';

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
      loadComponent: async () => ({ default: DrawingCanvas })
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
      loadComponent: async () => ({ default: GuitarStrings })
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
      loadComponent: async () => ({ default: MuayThaiMini })
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
      loadComponent: async () => ({ default: DancingMini })
    }
  }
];
