import type * as Phaser from 'phaser';
import { getMessages } from '@/shared/i18n';
import {
  BASEMENT_SCENE_ID,
  HOBBIES_SCENE_ID,
  OVERWORLD_SCENE_ID,
  PHASER_SCENE_KEYS,
  POTASSIUM_SCENE_ID,
  RIDGE_SCENE_ID,
  STAMPEDE_SKETCH_SCENE_ID,
  type SceneId
} from './sceneIds';

export interface SceneDefinition {
  id: SceneId;
  sceneKey: string;
  title: string;
  description: string;
  includeInDevSwitcher: boolean;
  loadScene?: () => Promise<typeof Phaser.Scene>;
}

const messages = getMessages();

export const SCENE_DEFINITIONS: readonly SceneDefinition[] = [
  {
    id: OVERWORLD_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.overworld,
    title: messages.gameShell.city,
    description: messages.navigation.hints,
    includeInDevSwitcher: true
  },
  {
    id: HOBBIES_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.hobbies,
    title: messages.catalog.hobbies.hobbies.name,
    description: messages.catalog.hobbies.hobbies.description,
    includeInDevSwitcher: true,
    loadScene: () => import('./hobbies/runtime/HobbiesScene').then((m) => m.HobbiesScene)
  },
  {
    id: BASEMENT_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.basement,
    title: messages.catalog.basement.basement.name,
    description: messages.catalog.basement.basement.description,
    includeInDevSwitcher: true,
    loadScene: () => import('./basement/runtime/BasementScene').then((m) => m.BasementScene)
  },
  {
    id: POTASSIUM_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.potassium,
    title: messages.catalog.potassiumSlip.potassium.name,
    description: messages.catalog.potassiumSlip.potassium.description,
    includeInDevSwitcher: true,
    loadScene: () => import('./potassiumSlip/runtime/PotassiumSlipScene').then((m) => m.PotassiumSlipScene)
  },
  {
    id: RIDGE_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.ridge,
    title: messages.catalog.ridge.ridge.name,
    description: messages.catalog.ridge.ridge.description,
    includeInDevSwitcher: true,
    loadScene: () => import('./ridge/runtime/RidgeScene').then((m) => m.RidgeScene)
  },
  {
    id: STAMPEDE_SKETCH_SCENE_ID,
    sceneKey: PHASER_SCENE_KEYS.stampedeSketch,
    title: messages.catalog.stampedeSketch.stampedeSketch.name,
    description: messages.catalog.stampedeSketch.stampedeSketch.description,
    includeInDevSwitcher: true,
    loadScene: () => import('./stampedeSketch/runtime/StampedeSketchScene').then((m) => m.StampedeSketchScene)
  }
];

const SCENE_BY_ID: ReadonlyMap<SceneId, SceneDefinition> = new Map(
  SCENE_DEFINITIONS.map((scene) => [scene.id, scene])
);

export function getSceneDefinition(id: SceneId): SceneDefinition {
  const scene = SCENE_BY_ID.get(id);
  if (!scene) {
    throw new Error(`Unknown scene id "${id}"`);
  }
  return scene;
}

export function getLoadableScene(id: SceneId): SceneDefinition | undefined {
  return getSceneDefinition(id).loadScene ? getSceneDefinition(id) : undefined;
}

export function getDevSwitcherScenes(): readonly SceneDefinition[] {
  return SCENE_DEFINITIONS.filter((scene) => scene.includeInDevSwitcher);
}
