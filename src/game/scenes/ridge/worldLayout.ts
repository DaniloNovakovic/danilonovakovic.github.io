import type { TrailCardOverlayParams } from '@/game/overlays/trailCard/types';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import type { RidgeBlockoutAnchorSelector } from './blockout';

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

export type RidgeTrailCardTargetId =
  | typeof STAMPEDE_SKETCH_RIDGE_STAMP_ID
  | 'telegraph-terrace'
  | 'domino-desk';

export interface RidgeTrailCardTarget {
  id: RidgeTrailCardTargetId;
  landmarkKind: Extract<RidgeLandmarkKind, 'stampede-blanket' | 'telegraph-bag' | 'domino-desk'>;
  anchor: RidgeBlockoutAnchorSelector;
  card: TrailCardOverlayParams;
}

export const RIDGE_TRAIL_CARD_TARGETS: readonly RidgeTrailCardTarget[] = [
  {
    id: STAMPEDE_SKETCH_RIDGE_STAMP_ID,
    landmarkKind: 'stampede-blanket',
    anchor: {
      roomId: 'stampede_blanket',
      symbol: '*',
      kind: 'minigame',
      attrId: 'stampede_sketch'
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
    anchor: {
      roomId: 'telegraph_terrace',
      symbol: '*',
      kind: 'minigame',
      attrId: 'telegraph_future'
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
    anchor: {
      roomId: 'domino_desk',
      symbol: 'A',
      attrId: 'domino_project_scrap'
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
