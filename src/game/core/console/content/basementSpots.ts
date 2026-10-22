export const BASEMENT_FLOOR_Y = 500;
export const BASEMENT_PLAYER_START = { x: 135, y: BASEMENT_FLOOR_Y - 50 } as const;
export const BASEMENT_STEP_PX = 35;
export const BASEMENT_WALK_BOUNDS = { minX: 60, maxX: 950 } as const;
/** Corkboard notes cycle; copy lives in i18n `scenes.basement.corkboardNotes`. */
export const BASEMENT_CORKBOARD_NOTE_COUNT = 5;

export type BasementSpotId = 'exit' | 'corkboard' | 'computer' | 'glasses' | 'workbench' | 'shelf';

export interface BasementSpot {
  id: BasementSpotId;
  label: string;
  x: number;
  y: number;
  distanceAnchorY: number;
  radius: number;
  promptX: number;
  promptY: number;
}

function spot(
  id: BasementSpotId,
  label: string,
  x: number,
  anchorAboveFloor: number,
  radius: number,
  promptAboveFloor: number
): BasementSpot {
  const y = BASEMENT_FLOOR_Y - anchorAboveFloor;
  return {
    id,
    label,
    x,
    y,
    distanceAnchorY: y,
    radius,
    promptX: x,
    promptY: BASEMENT_FLOOR_Y - promptAboveFloor
  };
}

export const BASEMENT_SPOTS: readonly BasementSpot[] = [
  spot('exit', 'Exit ladder', 95, 75, 70, 135),
  spot('corkboard', 'Corkboard', 238, 150, 58, 286),
  spot('computer', 'Basement computer', 400, 105, 82, 197),
  spot('glasses', 'Sketch glasses', 610, 95, 70, 165),
  spot('workbench', 'Workbench', 790, 70, 72, 262),
  spot('shelf', 'Parts shelf', 925, 120, 50, 292)
];

export function getBasementSpot(id: BasementSpotId): BasementSpot {
  const found = BASEMENT_SPOTS.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing basement spot: ${id}`);
  return found;
}
