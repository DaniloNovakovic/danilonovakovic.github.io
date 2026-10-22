import type { HobbiesOverlayId, OverlayId } from '@/game/overlays/overlayIds';
import { HOBBIES_EXIT_SPOT_X, HOBBY_STATION_SPOTS } from '@/game/core/console/content/hobbiesSpots';

export type HobbiesRoomInteractableId = OverlayId | 'exit';

export interface HobbyStationTypeObject {
  kind: 'hobbyStation';
  id: HobbiesOverlayId;
  x: number;
  spriteMode: 'floor' | 'mid';
  /** Extra offset from floorY (negative draws upward). */
  yOffsetFromFloor: number;
}

export type HobbiesRoomInteractableTypeObject =
  | {
      kind: 'exit';
      id: 'exit';
      x: number;
      /** Anchor Y for proximity checks. */
      distanceAnchorY: number;
      prompt: { x: number; y: number };
    }
  | {
      kind: 'hobbyStation';
      id: HobbiesOverlayId;
      x: number;
      /** Anchor Y for proximity checks. */
      distanceAnchorY: number;
      prompt: { x: number; y: number };
    };

/** Proximity anchor Y for hobby stations and exit (player feet region). */
const HOBBIES_PROXIMITY_ANCHOR_Y = 450;

/** Exit door center X (left side of room — keeps center clear for five hobby stations). */
export const HOBBIES_EXIT_X = HOBBIES_EXIT_SPOT_X;

/** Shared prompt Y for all room interactables. */
const HOBBIES_INTERACT_PROMPT_Y = 318;

/**
 * Hobby stations: sprite X aligns with interaction X.
 * `spriteMode`: `floor` = sprite origin bottom at floorY + yOffset; `mid` = origin center.
 */
export const HOBBY_STATION_LAYOUT: readonly HobbyStationTypeObject[] = HOBBY_STATION_SPOTS.map(
  (spot) => ({ kind: 'hobbyStation', id: spot.id, x: spot.x, spriteMode: 'floor', yOffsetFromFloor: 0 })
);

/**
 * Interaction hotspots inside the Hobbies Phaser room. The scene owns these
 * triggers and opens the matching scene-local overlay ids.
 */
export const HOBBIES_ROOM_INTERACTABLES: readonly HobbiesRoomInteractableTypeObject[] = [
  {
    kind: 'exit',
    id: 'exit',
    x: HOBBIES_EXIT_X,
    distanceAnchorY: HOBBIES_PROXIMITY_ANCHOR_Y,
    prompt: { x: HOBBIES_EXIT_X, y: HOBBIES_INTERACT_PROMPT_Y }
  },
  ...HOBBY_STATION_LAYOUT.map((s) => ({
    kind: 'hobbyStation' as const,
    id: s.id,
    x: s.x,
    distanceAnchorY: HOBBIES_PROXIMITY_ANCHOR_Y,
    prompt: { x: s.x, y: HOBBIES_INTERACT_PROMPT_Y }
  }))
];
