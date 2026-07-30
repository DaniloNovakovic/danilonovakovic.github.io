/**
 * Overworld spot facts shared by headless console and Phaser worldLayout.
 * Keep coordinates aligned with the live street.
 */

export const OVERWORLD_WIDTH = 3000;
export const OVERWORLD_PLAYER_START = { x: 100, y: 400 } as const;
/** Headless street Y — coplanar with peel/CRT so radius checks match grounded play. */
export const OVERWORLD_GROUND_Y = 535;

export const OVERWORLD_STEP_PX = 40;

export type GameSceneId =
  | 'overworld'
  | 'basement'
  | 'hobbies'
  | 'potassium'
  | 'ridge'
  | 'stampedeSketch';

export type PortfolioOverlayId =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'abilities'
  | 'contact';

export type OverworldSpotAction =
  | { kind: 'openOverlay'; overlayId: PortfolioOverlayId }
  | { kind: 'enterScene'; sceneId: Extract<GameSceneId, 'hobbies'> };

export interface OverworldBuildingSpot {
  id: string;
  label: string;
  x: number;
  action: OverworldSpotAction;
}

export const OVERWORLD_BUILDING_SPOTS: readonly OverworldBuildingSpot[] = [
  { id: 'profile', label: 'Profile desk', x: 400, action: { kind: 'openOverlay', overlayId: 'profile' } },
  {
    id: 'experiences',
    label: 'Experiences gallery',
    x: 900,
    action: { kind: 'openOverlay', overlayId: 'experiences' }
  },
  {
    id: 'projects',
    label: 'Projects workshop',
    x: 1400,
    action: { kind: 'openOverlay', overlayId: 'projects' }
  },
  {
    id: 'abilities',
    label: 'Abilities shelf',
    x: 1900,
    action: { kind: 'openOverlay', overlayId: 'abilities' }
  },
  {
    id: 'hobbies',
    label: 'Hobbies room',
    x: 2400,
    action: { kind: 'enterScene', sceneId: 'hobbies' }
  },
  { id: 'contact', label: 'Contact booth', x: 2900, action: { kind: 'openOverlay', overlayId: 'contact' } }
];

export const OVERWORLD_BASEMENT_HOLE = {
  id: 'basement-hole',
  label: 'Basement hatch',
  x: 230,
  y: 535,
  promptY: 485,
  interactDistanceX: 70,
  minPlayerY: 400,
  sceneId: 'basement' as const
};

export const OVERWORLD_BANANA_PEEL = {
  id: 'banana-peel',
  secretId: 'banana-peel-clue' as const,
  label: 'Banana peel (glasses secret)',
  x: 650,
  y: 535,
  radius: 95
};

export const OVERWORLD_CIRCUIT_CRT = {
  id: 'circuit-crt',
  label: 'Street CRT',
  x: 1650,
  y: 520,
  promptY: 455,
  interactDistanceX: 78,
  minPlayerY: 400,
  sceneId: 'ridge' as const
};

export const OVERWORLD_INTERACT_DISTANCE_X = 80;
export const OVERWORLD_INTERACT_MIN_PLAYER_Y = 400;
