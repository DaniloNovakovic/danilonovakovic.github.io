import type { TrailCardOverlayParams } from '@/game/overlays/trailCard/types';

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

export type RidgeTrailCardTargetId =
  | 'stampede-sketch'
  | 'telegraph-terrace'
  | 'domino-desk';

export interface RidgeTrailCardTarget {
  id: RidgeTrailCardTargetId;
  landmarkKind: Extract<RidgeLandmarkKind, 'stampede-blanket' | 'telegraph-bag' | 'domino-desk'>;
  x: number;
  distanceAnchorY: number;
  prompt: {
    x: number;
    y: number;
  };
  card: TrailCardOverlayParams;
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

export const RIDGE_TRAIL_CARD_TARGETS: readonly RidgeTrailCardTarget[] = [
  {
    id: 'stampede-sketch',
    landmarkKind: 'stampede-blanket',
    x: 430,
    distanceAnchorY: RIDGE_FLOOR_Y - 56,
    prompt: {
      x: 430,
      y: RIDGE_FLOOR_Y - 118
    },
    card: {
      title: 'Stampede Sketch',
      mood: 'Move-only ink swarm around a picnic blanket.',
      timeEstimate: '60-90 seconds',
      rewardPreview: 'Stamp + glide pip',
      unavailableReason: 'Stampede is not wired yet.'
    }
  },
  {
    id: 'telegraph-terrace',
    landmarkKind: 'telegraph-bag',
    x: 650,
    distanceAnchorY: RIDGE_FLOOR_Y - 58,
    prompt: {
      x: 650,
      y: RIDGE_FLOOR_Y - 130
    },
    card: {
      title: 'Telegraph Terrace',
      mood: 'One-button timing practice with clean parry reads.',
      timeEstimate: 'Prototype TBD',
      rewardPreview: 'Manual page',
      unavailableReason: 'Telegraph Terrace is a later prototype.'
    }
  },
  {
    id: 'domino-desk',
    landmarkKind: 'domino-desk',
    x: 1240,
    distanceAnchorY: RIDGE_FLOOR_Y - 62,
    prompt: {
      x: 1240,
      y: RIDGE_FLOOR_Y - 132
    },
    card: {
      title: 'Domino Desk',
      mood: 'A careful little deterministic puzzle desk.',
      timeEstimate: 'Future slice',
      rewardPreview: 'Shortcut sticker',
      unavailableReason: 'Domino Desk is future scope.'
    }
  }
];
