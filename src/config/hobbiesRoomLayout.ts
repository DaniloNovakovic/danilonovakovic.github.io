import type { MiniGameId } from './featureIds';

export type HobbiesRoomInteractableId = MiniGameId | 'exit';

/**
 * Interaction hotspots inside the Hobbies Phaser room. Kept in config so layout stays aligned with registry hobby ids.
 */
export const HOBBIES_ROOM_INTERACTABLES: ReadonlyArray<{
  id: HobbiesRoomInteractableId;
  x: number;
  /** Anchor Y for proximity checks (matches previous hardcoded `450`). */
  distanceAnchorY: number;
}> = [
  { id: 'exit', x: 500, distanceAnchorY: 450 },
  { id: 'games', x: 200, distanceAnchorY: 450 },
  { id: 'art', x: 400, distanceAnchorY: 450 },
  { id: 'music', x: 600, distanceAnchorY: 450 },
  { id: 'fitness', x: 800, distanceAnchorY: 450 }
];
