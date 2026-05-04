import type { ComponentType } from 'react';
import type * as Phaser from 'phaser';
import {
  PHASER_SCENE_KEYS,
  type MiniGameId
} from './featureIds';
import type { MiniGameOverlayProps } from '../runtime/types';
import ProfileOverlay from '../components/ProfileOverlay';
import ExperienceOverlay from '../components/ExperienceOverlay';
import ProjectsOverlay from '../components/ProjectsOverlay';
import AbilitiesOverlay from '../components/AbilitiesOverlay';
import ContactOverlay from '../components/ContactOverlay';
import CodingMini from '../components/CodingMini';
import DrawingCanvas from '../components/DrawingCanvas';
import GuitarStrings from '../components/GuitarStrings';
import MuayThaiMini from '../components/MuayThaiMini';
import DancingMini from '../components/DancingMini';

export interface ReactOverlayRuntimeBinding {
  kind: 'reactOverlay';
  component: ComponentType<MiniGameOverlayProps>;
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
    component: ProfileOverlay,
    loadComponent: async () => ({ default: ProfileOverlay })
  },
  experiences: {
    kind: 'reactOverlay',
    component: ExperienceOverlay,
    loadComponent: async () => ({ default: ExperienceOverlay })
  },
  projects: {
    kind: 'reactOverlay',
    component: ProjectsOverlay,
    loadComponent: async () => ({ default: ProjectsOverlay })
  },
  abilities: {
    kind: 'reactOverlay',
    component: AbilitiesOverlay,
    loadComponent: async () => ({ default: AbilitiesOverlay })
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
    loadScene: () => import('../runtime/potassiumSlip/PotassiumSlipScene').then((m) => m.PotassiumSlipScene)
  },
  contact: {
    kind: 'reactOverlay',
    component: ContactOverlay,
    loadComponent: async () => ({ default: ContactOverlay })
  },
  games: {
    kind: 'reactOverlay',
    component: CodingMini,
    loadComponent: async () => ({ default: CodingMini })
  },
  art: {
    kind: 'reactOverlay',
    component: DrawingCanvas,
    loadComponent: async () => ({ default: DrawingCanvas })
  },
  music: {
    kind: 'reactOverlay',
    component: GuitarStrings,
    loadComponent: async () => ({ default: GuitarStrings })
  },
  fitness: {
    kind: 'reactOverlay',
    component: MuayThaiMini,
    loadComponent: async () => ({ default: MuayThaiMini })
  },
  dancing: {
    kind: 'reactOverlay',
    component: DancingMini,
    loadComponent: async () => ({ default: DancingMini })
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
