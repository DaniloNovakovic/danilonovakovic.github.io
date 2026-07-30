export const BASEMENT_FLOOR_Y = 500;
export const BASEMENT_PLAYER_START = { x: 135, y: BASEMENT_FLOOR_Y - 50 } as const;
export const BASEMENT_STEP_PX = 35;

export interface BasementSpot {
  id: 'exit' | 'computer' | 'glasses';
  label: string;
  x: number;
  radius: number;
}

export const BASEMENT_SPOTS: readonly BasementSpot[] = [
  { id: 'exit', label: 'Exit ladder', x: 95, radius: 70 },
  { id: 'computer', label: 'Basement computer', x: 400, radius: 82 },
  { id: 'glasses', label: 'Sketch glasses', x: 610, radius: 70 }
];
