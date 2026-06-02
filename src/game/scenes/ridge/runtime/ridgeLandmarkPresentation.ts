import {
  type RidgeAnchorFact,
  type RidgeBlockoutAnchorSelector,
  type RidgeBlockoutFacts
} from '../blockout';
import { requireRidgeBlockoutFactAnchor } from './ridgePresentationFacts';

export const RIDGE_LANDMARK_ANCHOR_SELECTORS = {
  cicka: {
    roomId: 'cicka_home',
    symbol: 'C',
    kind: 'npc',
    attrId: 'cicka'
  },
  outskirtsArtifact: {
    roomId: 'outskirts',
    symbol: 'A',
    attrId: 'city_edge_memory'
  },
  stampede: {
    roomId: 'stampede_blanket',
    symbol: '*',
    kind: 'minigame',
    attrId: 'stampede_sketch'
  },
  telegraph: {
    roomId: 'telegraph_terrace',
    symbol: '*',
    kind: 'minigame',
    attrId: 'telegraph_future'
  },
  guide: {
    roomId: 'guide_overlook',
    symbol: 'N',
    kind: 'npc',
    attrId: 'ridge_guide'
  },
  relay: {
    roomId: 'relay_gate',
    symbol: '?',
    kind: 'gate',
    attrId: 'relay_proof_slots'
  },
  domino: {
    roomId: 'domino_desk',
    symbol: 'A',
    attrId: 'domino_project_scrap'
  },
  highLedge: {
    roomId: 'high_ledge',
    symbol: '?',
    kind: 'gate',
    attrId: 'movement_reward_tease'
  }
} as const satisfies Record<string, RidgeBlockoutAnchorSelector>;

export type RidgeLandmarkAnchorId = keyof typeof RIDGE_LANDMARK_ANCHOR_SELECTORS;

export type RidgeLandmarkAnchors = Record<RidgeLandmarkAnchorId, RidgeAnchorFact>;

export function resolveRidgeLandmarkAnchors(
  facts: RidgeBlockoutFacts
): RidgeLandmarkAnchors {
  return {
    cicka: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.cicka,
      'Cicka Home perch'
    ),
    outskirtsArtifact: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.outskirtsArtifact,
      'Outskirts artifact'
    ),
    stampede: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.stampede,
      'Stampede blanket'
    ),
    telegraph: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.telegraph,
      'Telegraph Terrace bag'
    ),
    guide: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.guide,
      'Ridge guide'
    ),
    relay: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.relay,
      'Relay Gate'
    ),
    domino: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.domino,
      'Domino Desk'
    ),
    highLedge: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.highLedge,
      'High Ledge teaser'
    )
  };
}
