import type { ComponentType } from 'react';
import type { SceneId } from '@/game/scenes/sceneIds';
import type { SceneUiActionId, SceneUiSurfaceId } from './types';
import { STAMPEDE_SCENE_UI_DEFINITIONS } from '@/game/scenes/stampedeSketch/sceneUi/definitions';
import { POTASSIUM_SCENE_UI_DEFINITIONS } from '@/game/scenes/potassiumSlip/sceneUi/definitions';
import { RIDGE_SCENE_UI_DEFINITIONS } from '@/game/scenes/ridge/sceneUi/definitions';

export interface SceneUiSurfaceProps {
  ownerSceneId: SceneId;
  params?: unknown;
  dispatchAction: (action: SceneUiActionId, params?: unknown) => void;
}

export type SceneUiSurfaceComponent = ComponentType<SceneUiSurfaceProps>;

export interface SceneUiSurfaceDefinition {
  id: SceneUiSurfaceId;
  component: SceneUiSurfaceComponent;
  /**
   * - `default`: centered over the game frame with a padded backdrop.
   * - `overlay`: a centered floating card (terminals, result sheets).
   * - `docked`: fills the game frame with no chrome of its own, so a scene can
   *   stage the surface itself (e.g. a conversation box along the bottom edge).
   */
  panelChrome?: 'default' | 'overlay' | 'docked';
  /**
   * The owning scene reads pointer input on the canvas while this surface is
   * up (e.g. drawing), so shell touch mats must stand aside.
   */
  capturesScenePointer?: boolean;
  /**
   * On phones the game frame drops its portrait card shape and fills the
   * screen while this surface is up (e.g. a drawing table that needs room).
   */
  expandsGameFrame?: boolean;
}

const SCENE_UI_DEFINITIONS: readonly SceneUiSurfaceDefinition[] = [
  ...STAMPEDE_SCENE_UI_DEFINITIONS,
  ...POTASSIUM_SCENE_UI_DEFINITIONS,
  ...RIDGE_SCENE_UI_DEFINITIONS
];

const SCENE_UI_BY_ID: ReadonlyMap<SceneUiSurfaceId, SceneUiSurfaceDefinition> = new Map(
  SCENE_UI_DEFINITIONS.map((surface) => [surface.id, surface])
);

export function sceneUiSurfaceCapturesPointer(id: SceneUiSurfaceId | undefined): boolean {
  return id ? SCENE_UI_BY_ID.get(id)?.capturesScenePointer === true : false;
}

export function sceneUiSurfaceExpandsGameFrame(id: SceneUiSurfaceId | undefined): boolean {
  return id ? SCENE_UI_BY_ID.get(id)?.expandsGameFrame === true : false;
}

export function getSceneUiSurfaceDefinition(id: SceneUiSurfaceId): SceneUiSurfaceDefinition {
  const surface = SCENE_UI_BY_ID.get(id);
  if (!surface) {
    throw new Error(`Unknown scene UI surface "${id}"`);
  }
  return surface;
}
