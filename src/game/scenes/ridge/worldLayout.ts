import type { TrailCardOverlayParams } from '@/game/overlays/trailCard/types';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';

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
  | 'outskirts-artifact'
  | 'cicka-perch'
  | 'stampede-blanket'
  | 'telegraph-bag'
  | 'ridge-guide'
  | 'domino-desk'
  | 'relay-spire'
  | 'high-ledge-teaser'
  | 'relay-gate';

export interface RidgeLandmark {
  id: string;
  kind: RidgeLandmarkKind;
  x: number;
  label: string;
}

export type RidgeTrailCardTargetId =
  | typeof STAMPEDE_SKETCH_RIDGE_STAMP_ID
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

export interface RidgeShortcut {
  id: string;
  sourceStampId: typeof STAMPEDE_SKETCH_RIDGE_STAMP_ID;
  startX: number;
  endX: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

const RIDGE_STAMPEDE_SHORTCUT_START_X = 520;
const RIDGE_STAMPEDE_SHORTCUT_END_X = 282;
const RIDGE_STAMPEDE_SHORTCUT_FORGIVENESS_WIDTH = 42;

export const RIDGE_STAMPEDE_SHORTCUT = {
  id: 'stampede-paper-fold',
  sourceStampId: STAMPEDE_SKETCH_RIDGE_STAMP_ID,
  startX: RIDGE_STAMPEDE_SHORTCUT_START_X,
  endX: RIDGE_STAMPEDE_SHORTCUT_END_X,
  y: RIDGE_FLOOR_Y - 134,
  width: Math.abs(RIDGE_STAMPEDE_SHORTCUT_START_X - RIDGE_STAMPEDE_SHORTCUT_END_X)
    + RIDGE_STAMPEDE_SHORTCUT_FORGIVENESS_WIDTH,
  height: 18,
  label: 'Stampede paper fold'
} as const satisfies RidgeShortcut;

export function isRidgeStampedeShortcutAvailable(
  ridgeProgress: { stampIds: readonly string[] }
): boolean {
  return ridgeProgress.stampIds.includes(RIDGE_STAMPEDE_SHORTCUT.sourceStampId);
}

export const RIDGE_LANDMARKS: readonly RidgeLandmark[] = [
  {
    id: 'outskirts-artifact-slot',
    kind: 'outskirts-artifact',
    x: 120,
    label: 'Outskirts'
  },
  {
    id: 'cicka-first-perch',
    kind: 'cicka-perch',
    x: 280,
    label: 'Cicka Home'
  },
  {
    id: 'stampede-sketch-blanket',
    kind: 'stampede-blanket',
    x: 520,
    label: 'Stampede'
  },
  {
    id: 'telegraph-terrace-bag',
    kind: 'telegraph-bag',
    x: 735,
    label: 'Telegraph'
  },
  {
    id: 'ridge-guide',
    kind: 'ridge-guide',
    x: 900,
    label: 'Guide'
  },
  {
    id: 'relay-spire',
    kind: 'relay-spire',
    x: 980,
    label: 'Relay Spire'
  },
  {
    id: 'domino-desk-elevator',
    kind: 'domino-desk',
    x: 1240,
    label: 'Domino Desk'
  },
  {
    id: 'paper-high-ledge-teaser',
    kind: 'high-ledge-teaser',
    x: 1440,
    label: 'High Ledge'
  },
  {
    id: 'relay-gate',
    kind: 'relay-gate',
    x: 1640,
    label: 'Relay Gate'
  }
];

export const RIDGE_TRAIL_CARD_TARGETS: readonly RidgeTrailCardTarget[] = [
  {
    id: STAMPEDE_SKETCH_RIDGE_STAMP_ID,
    landmarkKind: 'stampede-blanket',
    x: 520,
    distanceAnchorY: RIDGE_FLOOR_Y - 56,
    prompt: {
      x: 520,
      y: RIDGE_FLOOR_Y - 118
    },
    card: {
      title: 'Stampede Sketch',
      mood: 'Kite overexcited ink ideas around a picnic blanket.',
      timeEstimate: '60-90 seconds',
      rewardPreview: 'Stamp + glide pip',
      enterSceneId: STAMPEDE_SKETCH_SCENE_ID
    }
  },
  {
    id: 'telegraph-terrace',
    landmarkKind: 'telegraph-bag',
    x: 735,
    distanceAnchorY: RIDGE_FLOOR_Y - 58,
    prompt: {
      x: 735,
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
