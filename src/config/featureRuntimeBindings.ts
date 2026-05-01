import type { ComponentType } from 'react';
import type * as Phaser from 'phaser';
import {
  PHASER_SCENE_KEYS,
  type MiniGameId
} from './featureIds';
import type { MiniGameOverlayProps } from '../runtime/types';

export interface ReactOverlayRuntimeBinding {
  kind: 'reactOverlay';
  loadComponent: () => Promise<{ default: ComponentType<MiniGameOverlayProps> }>;
}

export interface PhaserSceneRuntimeBinding {
  kind: 'phaserScene';
  sceneKey: string;
  loadScene: () => Promise<typeof Phaser.Scene>;
}

export type FeatureRuntimeBinding = ReactOverlayRuntimeBinding | PhaserSceneRuntimeBinding;

export const FEATURE_RUNTIME_BINDINGS: Record<MiniGameId, FeatureRuntimeBinding> = {
  profile: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/ProfileOverlay')
  },
  experiences: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/ExperienceOverlay')
  },
  projects: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/ProjectsOverlay')
  },
  abilities: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/AbilitiesOverlay')
  },
  hobbies: {
    kind: 'phaserScene',
    sceneKey: PHASER_SCENE_KEYS.hobbies,
    loadScene: () => import('../runtime/HobbiesScene').then((m) => m.HobbiesScene)
  },
  basement: {
    kind: 'phaserScene',
    sceneKey: PHASER_SCENE_KEYS.basement,
    loadScene: () => import('../runtime/BasementScene').then((m) => m.BasementScene)
  },
  potassium: {
    kind: 'phaserScene',
    sceneKey: PHASER_SCENE_KEYS.potassium,
    loadScene: () => import('../runtime/PotassiumSlipScene').then((m) => m.PotassiumSlipScene)
  },
  contact: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/ContactOverlay')
  },
  games: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/CodingMini')
  },
  art: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/DrawingCanvas')
  },
  music: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/GuitarStrings')
  },
  fitness: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/MuayThaiMini')
  },
  dancing: {
    kind: 'reactOverlay',
    loadComponent: () => import('../components/DancingMini')
  }
};

export function getRuntimeBinding(id: MiniGameId): FeatureRuntimeBinding {
  return FEATURE_RUNTIME_BINDINGS[id];
}

export function getPhaserSceneBinding(id: MiniGameId): PhaserSceneRuntimeBinding | undefined {
  const binding = getRuntimeBinding(id);
  return binding.kind === 'phaserScene' ? binding : undefined;
}

export function getReactOverlayBinding(id: MiniGameId): ReactOverlayRuntimeBinding | undefined {
  const binding = getRuntimeBinding(id);
  return binding.kind === 'reactOverlay' ? binding : undefined;
}
