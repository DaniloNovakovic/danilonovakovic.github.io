import type { ComponentType } from 'react';
import type * as Phaser from 'phaser';
import {
  PHASER_SCENE_KEYS,
  type MiniGameId
} from './featureIds';
import type { MiniGameOverlayProps } from '../runtime/types';
import ProfileOverlay from '../features/portfolio/profile/ProfileOverlay';
import ExperienceOverlay from '../features/portfolio/experience/ExperienceOverlay';
import ProjectsOverlay from '../features/portfolio/projects/ProjectsOverlay';
import AbilitiesOverlay from '../features/portfolio/abilities/AbilitiesOverlay';
import ContactOverlay from '../features/portfolio/contact/ContactOverlay';
import CodingMini from '../features/basement/overlays/developerConsole/CodingMini';
import DrawingCanvas from '../features/hobbies/overlays/art/DrawingCanvas';
import GuitarStrings from '../features/hobbies/overlays/music/GuitarStrings';
import MuayThaiMini from '../features/hobbies/overlays/fitness/MuayThaiMini';
import DancingMini from '../features/hobbies/overlays/dancing/DancingMini';

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
