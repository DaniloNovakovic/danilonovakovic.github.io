import { BASEMENT_CONSOLE_OVERLAY_ID } from '@/game/overlays/overlayIds';
import {
  BASEMENT_FLOOR_Y as CORE_FLOOR_Y,
  BASEMENT_PLAYER_START as CORE_PLAYER_START,
  getBasementSpot
} from '@/game/core/console/content/basementSpots';
import { getMessages } from '@/shared/i18n';

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

export const BASEMENT_FLOOR_Y = CORE_FLOOR_Y;
export const BASEMENT_PLAYER_START = CORE_PLAYER_START;
export const BASEMENT_GAMES_OVERLAY_ID = BASEMENT_CONSOLE_OVERLAY_ID;

function spotToInteractable(
  id: BasementRoomInteractableId,
  kind: BasementRoomInteractableTypeObject['kind']
): BasementRoomInteractableTypeObject {
  const spot = getBasementSpot(id);
  return {
    kind,
    id,
    x: spot.x,
    y: spot.y,
    distanceAnchorY: spot.distanceAnchorY,
    radius: spot.radius,
    prompt: { x: spot.promptX, y: spot.promptY }
  };
}

export const BASEMENT_EXIT = spotToInteractable('exit', 'exit');
export const BASEMENT_COMPUTER = spotToInteractable('computer', 'computer');
export const GLASSES_PICKUP = spotToInteractable('glasses', 'pickup');

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
  const messages = getMessages();
  switch (id) {
    case 'computer':
      return () =>
        deps.isGlassesOwned()
          ? { kind: 'openOverlay', id: BASEMENT_GAMES_OVERLAY_ID }
          : { kind: 'showThought', text: messages.scenes.basement.cannotSeeThought };
    case 'glasses':
      return { kind: 'collectGlasses' };
    case 'exit':
      return { kind: 'close' };
  }
}
