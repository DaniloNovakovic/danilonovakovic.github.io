import type { OverlayId } from '@/game/overlays/overlayIds';
import { HOBBIES_SCENE_ID, RIDGE_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';
import type { SecretDiscoveryId } from '@/game/bridge/store';
import type { OverworldSecretSlot } from '@/game/core/ecs/systems/overworldInteractSystems';
import {
  OVERWORLD_BANANA_PEEL,
  OVERWORLD_BASEMENT_HOLE as CORE_BASEMENT_HOLE,
  OVERWORLD_BUILDING_SPOTS,
  OVERWORLD_CIRCUIT_CRT,
  OVERWORLD_PLAYER_START as CORE_PLAYER_START,
  OVERWORLD_WIDTH as CORE_WIDTH
} from '@/game/core/console/content/overworldSpots';
import { GAME_DESIGN_HEIGHT } from '@/game/sharedSceneRuntime/designSize';

/** Overworld street width (logical px). Shared with headless Game Console. */
export const OVERWORLD_WIDTH = CORE_WIDTH;

/** Player spawn and route-local resume constraints. */
export const OVERWORLD_PLAYER_START = CORE_PLAYER_START;
export const OVERWORLD_PLAYER_SPAWN_MARGIN_X = 48;
export const OVERWORLD_PLAYER_RESUME_Y_CLAMP = { min: 300, max: 550 } as const;

/** Ground zone for collider (center y, width comes from `OVERWORLD_WIDTH`). */
export const OVERWORLD_GROUND_ZONE = {
  centerY: 575,
  height: 50
} as const;

export const OVERWORLD_INTERACT_PROMPT_OFFSET_Y = 40;

/**
 * Overworld building triggers.
 * The scene owns where the trigger sits and whether it opens a scene or overlay.
 * Coordinates come from Game Console spots (ADR-0006).
 */
export type OverworldTriggerAction =
  | { kind: 'openOverlay'; overlayId: OverlayId }
  | { kind: 'enterScene'; sceneId: SceneId };

export interface OverworldBuildingTrigger {
  kind: 'overworldBuilding';
  id: string;
  x: number;
  action: OverworldTriggerAction;
}

export const OVERWORLD_BUILDING_TRIGGERS: readonly OverworldBuildingTrigger[] =
  OVERWORLD_BUILDING_SPOTS.map((spot) => {
    if (spot.action.kind === 'enterScene') {
      return {
        kind: 'overworldBuilding' as const,
        id: spot.id === 'hobbies' ? HOBBIES_SCENE_ID : spot.id,
        x: spot.x,
        action: { kind: 'enterScene' as const, sceneId: HOBBIES_SCENE_ID }
      };
    }
    return {
      kind: 'overworldBuilding' as const,
      id: spot.id,
      x: spot.x,
      action: { kind: 'openOverlay' as const, overlayId: spot.action.overlayId }
    };
  });

export function getOverworldBuildingTrigger(id: string): OverworldBuildingTrigger | undefined {
  return OVERWORLD_BUILDING_TRIGGERS.find((trigger) => trigger.id === id);
}

/** Basement hatch trigger (scene-facing subset of the core spot). */
export const OVERWORLD_BASEMENT_HOLE = {
  x: CORE_BASEMENT_HOLE.x,
  y: CORE_BASEMENT_HOLE.y,
  promptY: CORE_BASEMENT_HOLE.promptY,
  interactDistanceX: CORE_BASEMENT_HOLE.interactDistanceX,
  minPlayerY: CORE_BASEMENT_HOLE.minPlayerY
} as const;

export const BANANA_PEEL_CLUE_ID = OVERWORLD_BANANA_PEEL.secretId satisfies SecretDiscoveryId;

export const OVERWORLD_GLASSES_SECRET_SLOTS: readonly OverworldSecretSlot[] = [
  {
    secretId: BANANA_PEEL_CLUE_ID,
    x: OVERWORLD_BANANA_PEEL.x,
    y: OVERWORLD_BANANA_PEEL.y,
    radius: OVERWORLD_BANANA_PEEL.radius,
    promptOffsetY: -56
  }
];

/**
 * Street CRT / sketch-console that accepts the Potassium Circuit and boots Ridge
 * as a nested "game inside the game."
 */
export const OVERWORLD_CIRCUIT_SLOT = {
  id: OVERWORLD_CIRCUIT_CRT.id,
  x: OVERWORLD_CIRCUIT_CRT.x,
  y: OVERWORLD_CIRCUIT_CRT.y,
  promptY: OVERWORLD_CIRCUIT_CRT.promptY,
  interactDistanceX: OVERWORLD_CIRCUIT_CRT.interactDistanceX,
  minPlayerY: OVERWORLD_CIRCUIT_CRT.minPlayerY,
  ridgeSceneId: RIDGE_SCENE_ID
} as const;

/** Ink particle spawn band (overworld ambience). */
export const OVERWORLD_PARTICLE_MAX_Y = GAME_DESIGN_HEIGHT;
