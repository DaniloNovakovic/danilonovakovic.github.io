import type { CircuitPartHobbyId } from './circuitParts';
import { HOBBIES_LEFT_WALL_X, OUT_OF_BOUNDS_WORLD_LEFT_X } from './outOfBoundsVoid';

export type HobbyStationId = 'art' | CircuitPartHobbyId;

export const HOBBIES_EXIT_SPOT_X = 100;

/** The drawn right wall of the Hobbies room (ink line in HobbiesRoom). */
export const HOBBIES_RIGHT_WALL_X = 950;
/** Half the side-view player's width; the body stops when its edge meets the wall. */
const HOBBIES_PLAYER_HALF_WIDTH = 24;
/** Furthest right the player's centre can go: flush against the right wall. */
export const HOBBIES_PLAYER_MAX_X = HOBBIES_RIGHT_WALL_X - HOBBIES_PLAYER_HALF_WIDTH;
/** Where the drawn left wall stops the player's centre, before the clip-through glitch. */
export const HOBBIES_PLAYER_LEFT_WALL_STOP_X = HOBBIES_LEFT_WALL_X + HOBBIES_PLAYER_HALF_WIDTH;
/**
 * Furthest left the player walks. Past the drawn left wall (once glitched through)
 * lies the Out of Bounds void, ending at the pedestal (see outOfBoundsVoid.ts).
 */
export const HOBBIES_PLAYER_MIN_X = OUT_OF_BOUNDS_WORLD_LEFT_X + HOBBIES_PLAYER_HALF_WIDTH;

export const HOBBY_STATION_SPOTS: readonly { id: HobbyStationId; label: string; x: number }[] = [
  { id: 'art', label: 'Easel', x: 280 },
  { id: 'music', label: 'Guitar', x: 440 },
  { id: 'fitness', label: 'Heavy bag', x: 600 },
  { id: 'dancing', label: 'Dance floor', x: 760 }
];
