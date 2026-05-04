import type { HobbyReactOverlayId, MiniGameId } from '@game/registry/featureIds';

export type HobbiesRoomInteractableId = MiniGameId | 'exit';

export interface HobbyStationTypeObject {
  kind: 'hobbyStation';
  id: HobbyReactOverlayId;
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
      id: HobbyReactOverlayId;
      x: number;
      /** Anchor Y for proximity checks. */
      distanceAnchorY: number;
      prompt: { x: number; y: number };
    };

/** Proximity anchor Y for hobby stations and exit (player feet region). */
export const HOBBIES_PROXIMITY_ANCHOR_Y = 450;

/** Exit door center X (left side of room — keeps center clear for five hobby stations). */
export const HOBBIES_EXIT_X = 100;

/** Shared prompt Y for all room interactables. */
export const HOBBIES_INTERACT_PROMPT_Y = 350;

/**
 * Hobby stations: sprite X aligns with interaction X.
 * `spriteMode`: `floor` = sprite origin bottom at floorY + yOffset; `mid` = origin center.
 */
export const HOBBY_STATION_LAYOUT: readonly HobbyStationTypeObject[] = [
  { kind: 'hobbyStation', id: 'art', x: 280, spriteMode: 'floor', yOffsetFromFloor: 0 },
  { kind: 'hobbyStation', id: 'music', x: 440, spriteMode: 'floor', yOffsetFromFloor: 0 },
  { kind: 'hobbyStation', id: 'fitness', x: 600, spriteMode: 'floor', yOffsetFromFloor: 0 },
  { kind: 'hobbyStation', id: 'dancing', x: 760, spriteMode: 'floor', yOffsetFromFloor: 0 }
];

/**
 * Interaction hotspots inside the Hobbies Phaser room. Kept with the feature so layout stays aligned with registry hobby ids.
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
