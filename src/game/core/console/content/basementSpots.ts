export const BASEMENT_FLOOR_Y = 500;
export const BASEMENT_PLAYER_START = { x: 135, y: BASEMENT_FLOOR_Y - 50 } as const;
export const BASEMENT_STEP_PX = 35;

export interface BasementSpot {
  id: 'exit' | 'computer' | 'glasses';
  label: string;
  x: number;
  y: number;
  distanceAnchorY: number;
  radius: number;
  promptX: number;
  promptY: number;
}

export const BASEMENT_SPOTS: readonly BasementSpot[] = [
  {
    id: 'exit',
    label: 'Exit ladder',
    x: 95,
    y: BASEMENT_FLOOR_Y - 75,
    distanceAnchorY: BASEMENT_FLOOR_Y - 75,
    radius: 70,
    promptX: 95,
    promptY: BASEMENT_FLOOR_Y - 135
  },
  {
    id: 'computer',
    label: 'Basement computer',
    x: 400,
    y: BASEMENT_FLOOR_Y - 105,
    distanceAnchorY: BASEMENT_FLOOR_Y - 105,
    radius: 82,
    promptX: 400,
    promptY: BASEMENT_FLOOR_Y - 197
  },
  {
    id: 'glasses',
    label: 'Sketch glasses',
    x: 610,
    y: BASEMENT_FLOOR_Y - 95,
    distanceAnchorY: BASEMENT_FLOOR_Y - 95,
    radius: 70,
    promptX: 610,
    promptY: BASEMENT_FLOOR_Y - 165
  }
];

export function getBasementSpot(id: BasementSpot['id']): BasementSpot {
  const spot = BASEMENT_SPOTS.find((entry) => entry.id === id);
  if (!spot) throw new Error(`Missing basement spot: ${id}`);
  return spot;
}
