import type { OverlayId } from '@/game/overlays/overlayIds';
import { HOBBIES_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';
import type { SecretDiscoveryId } from '@/game/bridge/store';
import type { OverworldSecretSlot } from '@/game/core/ecs/systems/overworldInteractSystems';
import { GAME_DESIGN_HEIGHT } from '@/game/sharedSceneRuntime/designSize';

/** Overworld street width (logical px). */
export const OVERWORLD_WIDTH = 3000;

/** Player spawn and route-local resume constraints. */
export const OVERWORLD_PLAYER_START = { x: 100, y: 400 } as const;
export const OVERWORLD_PLAYER_SPAWN_MARGIN_X = 48;
export const OVERWORLD_PLAYER_RESUME_Y_CLAMP = { min: 300, max: 550 } as const;

/** Ground zone for collider (center y, width comes from `OVERWORLD_WIDTH`). */
export const OVERWORLD_GROUND_ZONE = {
  centerY: 575,
  height: 50
} as const;

/** Building interaction: max horizontal distance to sprite center, min player Y. */
export const OVERWORLD_INTERACT_DISTANCE_X = 80;
export const OVERWORLD_INTERACT_MIN_PLAYER_Y = 400;
export const OVERWORLD_INTERACT_PROMPT_OFFSET_Y = 40;

/**
 * Overworld building triggers.
 * The scene owns where the trigger sits and whether it opens a scene or overlay.
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

export const OVERWORLD_BUILDING_TRIGGERS: readonly OverworldBuildingTrigger[] = [
  {
    kind: 'overworldBuilding',
    id: 'profile',
    x: 400,
    action: { kind: 'openOverlay', overlayId: 'profile' }
  },
  {
    kind: 'overworldBuilding',
    id: 'experiences',
    x: 900,
    action: { kind: 'openOverlay', overlayId: 'experiences' }
  },
  {
    kind: 'overworldBuilding',
    id: 'projects',
    x: 1400,
    action: { kind: 'openOverlay', overlayId: 'projects' }
  },
  {
    kind: 'overworldBuilding',
    id: 'abilities',
    x: 1900,
    action: { kind: 'openOverlay', overlayId: 'abilities' }
  },
  {
    kind: 'overworldBuilding',
    id: HOBBIES_SCENE_ID,
    x: 2400,
    action: { kind: 'enterScene', sceneId: HOBBIES_SCENE_ID }
  },
  {
    kind: 'overworldBuilding',
    id: 'contact',
    x: 2900,
    action: { kind: 'openOverlay', overlayId: 'contact' }
  }
];

export function getOverworldBuildingTrigger(id: string): OverworldBuildingTrigger | undefined {
  return OVERWORLD_BUILDING_TRIGGERS.find((trigger) => trigger.id === id);
}

export const OVERWORLD_BASEMENT_HOLE = {
  x: 230,
  y: 535,
  promptY: 485,
  interactDistanceX: 70,
  minPlayerY: 400
} as const;

export const BANANA_PEEL_CLUE_ID = 'banana-peel-clue' satisfies SecretDiscoveryId;

export const OVERWORLD_GLASSES_SECRET_SLOTS: readonly OverworldSecretSlot[] = [
  {
    secretId: BANANA_PEEL_CLUE_ID,
    x: 650,
    y: 535,
    radius: 95,
    promptOffsetY: -56
  }
];

/** Ink particle spawn band (overworld ambience). */
export const OVERWORLD_PARTICLE_MAX_Y = GAME_DESIGN_HEIGHT;
