import type { ComponentType } from 'react';
import type { SceneId } from '@/game/scenes/sceneIds';
import type { SceneUiActionId, SceneUiSurfaceId } from './types';
import { STAMPEDE_SCENE_UI_DEFINITIONS } from '@/game/scenes/stampedeSketch/sceneUi/definitions';
import { POTASSIUM_SCENE_UI_DEFINITIONS } from '@/game/scenes/potassiumSlip/sceneUi/definitions';

export interface SceneUiSurfaceProps {
  ownerSceneId: SceneId;
  params?: unknown;
  dispatchAction: (action: SceneUiActionId, params?: unknown) => void;
}

export type SceneUiSurfaceComponent = ComponentType<SceneUiSurfaceProps>;

export interface SceneUiSurfaceDefinition {
  id: SceneUiSurfaceId;
  component: SceneUiSurfaceComponent;
  panelChrome?: 'default' | 'overlay';
}

export const SCENE_UI_DEFINITIONS: readonly SceneUiSurfaceDefinition[] = [
  ...STAMPEDE_SCENE_UI_DEFINITIONS,
  ...POTASSIUM_SCENE_UI_DEFINITIONS
];

const SCENE_UI_BY_ID: ReadonlyMap<SceneUiSurfaceId, SceneUiSurfaceDefinition> = new Map(
  SCENE_UI_DEFINITIONS.map((surface) => [surface.id, surface])
);

export function getSceneUiSurfaceDefinition(
  id: SceneUiSurfaceId
): SceneUiSurfaceDefinition {
  const surface = SCENE_UI_BY_ID.get(id);
  if (!surface) {
    throw new Error(`Unknown scene UI surface "${id}"`);
  }
  return surface;
}
