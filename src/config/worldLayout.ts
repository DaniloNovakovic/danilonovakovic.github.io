import type { MiniGameId } from './featureIds';

/**
 * Overworld building X positions (street width `OVERWORLD_WIDTH` in `src/runtime/config.ts`).
 * Decoupled from UI copy and component bindings.
 */
export const OVERWORLD_BUILDING_PLACEMENTS: ReadonlyArray<{ id: MiniGameId; x: number }> = [
  { id: 'profile', x: 400 },
  { id: 'experiences', x: 900 },
  { id: 'projects', x: 1400 },
  { id: 'abilities', x: 1900 },
  { id: 'hobbies', x: 2400 },
  { id: 'contact', x: 2900 }
];
