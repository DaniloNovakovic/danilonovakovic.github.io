import type { CircuitPartHobbyId } from './circuitParts';

export type HobbyStationId = 'art' | CircuitPartHobbyId;

export const HOBBIES_EXIT_SPOT_X = 100;

export const HOBBY_STATION_SPOTS: readonly { id: HobbyStationId; label: string; x: number }[] = [
  { id: 'art', label: 'Easel', x: 280 },
  { id: 'music', label: 'Guitar', x: 440 },
  { id: 'fitness', label: 'Heavy bag', x: 600 },
  { id: 'dancing', label: 'Dance floor', x: 760 }
];
