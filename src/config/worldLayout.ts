import type { OverworldBuildingTypeObject } from './portfolioCompose';

/**
 * Overworld building X positions (street width `OVERWORLD_WIDTH` in `src/runtime/config.ts`).
 * Decoupled from UI copy and component bindings.
 */
export const OVERWORLD_BUILDING_PLACEMENTS: readonly OverworldBuildingTypeObject[] = [
  { kind: 'overworldBuilding', id: 'profile', x: 400 },
  { kind: 'overworldBuilding', id: 'experiences', x: 900 },
  { kind: 'overworldBuilding', id: 'projects', x: 1400 },
  { kind: 'overworldBuilding', id: 'abilities', x: 1900 },
  { kind: 'overworldBuilding', id: 'hobbies', x: 2400 },
  { kind: 'overworldBuilding', id: 'contact', x: 2900 }
];
