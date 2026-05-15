import { describe, expect, it } from 'vitest';
import {
  RIDGE_BLOCKOUT,
  compileRidgeBlockoutFacts
} from '../blockout';
import {
  RIDGE_LANDMARK_ANCHOR_SELECTORS,
  resolveRidgeLandmarkAnchors
} from './ridgeLandmarkPresentation';

describe('ridge landmark presentation', () => {
  it('resolves the landmark anchors used by Ridge presentation', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const anchors = resolveRidgeLandmarkAnchors(facts);

    expect(Object.keys(anchors)).toEqual(Object.keys(RIDGE_LANDMARK_ANCHOR_SELECTORS));
    expect(anchors.cicka).toMatchObject({
      roomId: 'cicka_home',
      symbol: 'C',
      kind: 'npc',
      id: 'cicka'
    });
    expect(anchors.stampede).toMatchObject({
      roomId: 'stampede_blanket',
      symbol: '*',
      kind: 'minigame',
      id: 'stampede_sketch'
    });
    expect(anchors.telegraph).toMatchObject({
      roomId: 'telegraph_terrace',
      symbol: '*',
      kind: 'minigame',
      id: 'telegraph_future'
    });
    expect(anchors.relay).toMatchObject({
      roomId: 'relay_gate',
      symbol: '?',
      kind: 'gate',
      id: 'relay_proof_slots'
    });
    expect(anchors.domino).toMatchObject({
      roomId: 'domino_desk',
      symbol: 'A',
      id: 'domino_project_scrap'
    });
    expect(anchors.guide).toMatchObject({
      roomId: 'guide_overlook',
      symbol: 'N',
      kind: 'npc',
      id: 'ridge_guide'
    });
    expect(anchors.highLedge).toMatchObject({
      roomId: 'high_ledge',
      symbol: '?',
      kind: 'gate',
      id: 'movement_reward_tease'
    });
    expect(Object.values(anchors).every((anchor) =>
      Number.isFinite(anchor.x) && Number.isFinite(anchor.y)
    )).toBe(true);
  });
});
