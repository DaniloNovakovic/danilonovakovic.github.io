import type { BasementReactOverlayId } from '@game/registry/featureIds';

export type BasementRoomInteractableId = 'exit' | 'computer' | 'glasses';

export type BasementInteractionEffect =
  | { kind: 'close' }
  | { kind: 'openOverlay'; id: typeof BASEMENT_GAMES_OVERLAY_ID }
  | { kind: 'collectGlasses' }
  | { kind: 'showThought'; text: string };

export interface BasementRoomInteractableTypeObject {
  kind: 'exit' | 'computer' | 'pickup';
  id: BasementRoomInteractableId;
  x: number;
  y: number;
  distanceAnchorY: number;
  radius: number;
  prompt: {
    x: number;
    y: number;
  };
}

export interface BasementInteractionTargetDefinition extends BasementRoomInteractableTypeObject {
  enabled?: () => boolean;
  effect: BasementInteractionEffect | (() => BasementInteractionEffect);
}

export interface BasementInteractionTargetDeps {
  isGlassesOwned: () => boolean;
}

export const BASEMENT_FLOOR_Y = 500;
export const BASEMENT_PLAYER_START = { x: 135, y: BASEMENT_FLOOR_Y - 50 } as const;
export const BASEMENT_GAMES_OVERLAY_ID = 'games' satisfies BasementReactOverlayId;

export const BASEMENT_EXIT = {
  kind: 'exit',
  id: 'exit',
  x: 95,
  y: BASEMENT_FLOOR_Y - 75,
  distanceAnchorY: BASEMENT_FLOOR_Y - 75,
  radius: 70,
  prompt: { x: 95, y: BASEMENT_FLOOR_Y - 135 }
} as const satisfies BasementRoomInteractableTypeObject;

export const BASEMENT_COMPUTER = {
  kind: 'computer',
  id: 'computer',
  x: 400,
  y: BASEMENT_FLOOR_Y - 105,
  distanceAnchorY: BASEMENT_FLOOR_Y - 105,
  radius: 82,
  prompt: { x: 400, y: BASEMENT_FLOOR_Y - 197 }
} as const satisfies BasementRoomInteractableTypeObject;

export const GLASSES_PICKUP = {
  kind: 'pickup',
  id: 'glasses',
  x: 610,
  y: BASEMENT_FLOOR_Y - 95,
  distanceAnchorY: BASEMENT_FLOOR_Y - 95,
  radius: 70,
  prompt: { x: 610, y: BASEMENT_FLOOR_Y - 165 }
} as const satisfies BasementRoomInteractableTypeObject;

export const BASEMENT_ROOM_INTERACTABLES = [
  BASEMENT_COMPUTER,
  GLASSES_PICKUP,
  BASEMENT_EXIT
] as const satisfies readonly BasementRoomInteractableTypeObject[];

export function createBasementInteractionTargets(
  deps: BasementInteractionTargetDeps
): BasementInteractionTargetDefinition[] {
  return BASEMENT_ROOM_INTERACTABLES.map((target) => ({
    ...target,
    enabled: target.id === 'glasses' ? () => !deps.isGlassesOwned() : undefined,
    effect: createBasementInteractionEffect(target.id, deps)
  }));
}

function createBasementInteractionEffect(
  id: BasementRoomInteractableId,
  deps: BasementInteractionTargetDeps
): BasementInteractionEffect | (() => BasementInteractionEffect) {
  switch (id) {
    case 'computer':
      return () =>
        deps.isGlassesOwned()
          ? { kind: 'openOverlay', id: BASEMENT_GAMES_OVERLAY_ID }
          : { kind: 'showThought', text: "ughh... I can't see" };
    case 'glasses':
      return { kind: 'collectGlasses' };
    case 'exit':
      return { kind: 'close' };
  }
}
