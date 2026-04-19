import type { HobbyReactOverlayId, MiniGameId } from './featureIds';

export type HobbiesRoomInteractableId = MiniGameId | 'exit';

/** Proximity anchor Y for hobby stations and exit (player feet region). */
export const HOBBIES_PROXIMITY_ANCHOR_Y = 450;

/** Exit door center X (left side of room — keeps center clear for five hobby stations). */
export const HOBBIES_EXIT_X = 100;

/**
 * Hobby stations: sprite X aligns with interaction X.
 * `spriteMode`: `floor` = sprite origin bottom at floorY + yOffset; `mid` = origin center.
 */
export const HOBBY_STATION_LAYOUT: ReadonlyArray<{
  id: HobbyReactOverlayId;
  x: number;
  spriteMode: 'floor' | 'mid';
  /** Extra offset from floorY (negative draws upward). */
  yOffsetFromFloor: number;
}> = [
  { id: 'games', x: 200, spriteMode: 'floor', yOffsetFromFloor: 0 },
  { id: 'art', x: 340, spriteMode: 'floor', yOffsetFromFloor: 0 },
  { id: 'music', x: 480, spriteMode: 'floor', yOffsetFromFloor: 0 },
  { id: 'fitness', x: 620, spriteMode: 'mid', yOffsetFromFloor: -60 },
  { id: 'dancing', x: 760, spriteMode: 'floor', yOffsetFromFloor: 0 }
];

/**
 * Interaction hotspots inside the Hobbies Phaser room. Kept in config so layout stays aligned with registry hobby ids.
 */
export const HOBBIES_ROOM_INTERACTABLES: ReadonlyArray<{
  id: HobbiesRoomInteractableId;
  x: number;
  /** Anchor Y for proximity checks. */
  distanceAnchorY: number;
}> = [
  { id: 'exit', x: HOBBIES_EXIT_X, distanceAnchorY: HOBBIES_PROXIMITY_ANCHOR_Y },
  ...HOBBY_STATION_LAYOUT.map((s) => ({
    id: s.id,
    x: s.x,
    distanceAnchorY: HOBBIES_PROXIMITY_ANCHOR_Y
  }))
];
