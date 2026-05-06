export const RIDGE_WORLD_WIDTH = 1800;
export const RIDGE_FLOOR_Y = 520;
export const RIDGE_PLAYER_START = { x: 120, y: RIDGE_FLOOR_Y - 80 } as const;
export const RIDGE_PLAYER_RESUME_CLAMP = {
  minX: 48,
  maxX: RIDGE_WORLD_WIDTH - 48,
  minY: 120,
  maxY: RIDGE_FLOOR_Y - 20
} as const;

export type RidgeLandmarkKind =
  | 'cicka-perch'
  | 'stampede-blanket'
  | 'telegraph-bag'
  | 'ridge-guide'
  | 'domino-desk'
  | 'relay-spire';

export interface RidgeLandmark {
  id: string;
  kind: RidgeLandmarkKind;
  x: number;
  label: string;
}

export const RIDGE_LANDMARKS: readonly RidgeLandmark[] = [
  {
    id: 'cicka-first-perch',
    kind: 'cicka-perch',
    x: 220,
    label: 'Cicka perch'
  },
  {
    id: 'stampede-sketch-blanket',
    kind: 'stampede-blanket',
    x: 430,
    label: 'Stampede'
  },
  {
    id: 'telegraph-terrace-bag',
    kind: 'telegraph-bag',
    x: 650,
    label: 'Telegraph'
  },
  {
    id: 'ridge-guide',
    kind: 'ridge-guide',
    x: 790,
    label: 'Guide'
  },
  {
    id: 'relay-spire',
    kind: 'relay-spire',
    x: 890,
    label: 'Relay Spire'
  },
  {
    id: 'domino-desk-elevator',
    kind: 'domino-desk',
    x: 1240,
    label: 'Domino Desk'
  }
];
