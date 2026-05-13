import { describe, expect, it } from 'vitest';
import {
  RIDGE_FLOOR_Y,
  RIDGE_LANDMARKS,
  RIDGE_PLAYER_RESUME_CLAMP,
  RIDGE_PLAYER_START,
  RIDGE_TRAIL_CARD_TARGETS,
  RIDGE_WORLD_WIDTH,
  getRidgeLandmarkMemory
} from './worldLayout';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';

describe('ridge world layout', () => {
  it('keeps the first movement shell flat and inside world bounds', () => {
    expect(RIDGE_PLAYER_START.y).toBeLessThan(RIDGE_FLOOR_Y);
    expect(RIDGE_PLAYER_RESUME_CLAMP.minX).toBeGreaterThan(0);
    expect(RIDGE_PLAYER_RESUME_CLAMP.maxX).toBeLessThan(RIDGE_WORLD_WIDTH);
    expect(RIDGE_PLAYER_RESUME_CLAMP.maxY).toBeLessThan(RIDGE_FLOOR_Y);
  });

  it('stages the first Ridge shell landmarks in dependency order', () => {
    expect(RIDGE_LANDMARKS.map((landmark) => landmark.kind)).toEqual([
      'cicka-perch',
      'stampede-blanket',
      'telegraph-bag',
      'ridge-guide',
      'relay-spire',
      'domino-desk'
    ]);
  });

  it('keeps Relay Spire visible early in the first route', () => {
    const relay = RIDGE_LANDMARKS.find((landmark) => landmark.kind === 'relay-spire');

    expect(relay?.x).toBeGreaterThan(0);
    expect(relay?.x).toBeLessThan(1100);
  });

  it('defines exactly three Trail Card targets for the first trigger contract', () => {
    expect(RIDGE_TRAIL_CARD_TARGETS.map((target) => target.id)).toEqual([
      'stampede-sketch',
      'telegraph-terrace',
      'domino-desk'
    ]);
    expect(RIDGE_TRAIL_CARD_TARGETS.map((target) => target.landmarkKind)).toEqual([
      'stampede-blanket',
      'telegraph-bag',
      'domino-desk'
    ]);
  });

  it('enables only the Stampede Trail Card for the movement-only prototype', () => {
    const stampede = RIDGE_TRAIL_CARD_TARGETS.find((target) => target.id === 'stampede-sketch');
    const unavailable = RIDGE_TRAIL_CARD_TARGETS.filter((target) => target.id !== 'stampede-sketch');

    expect(stampede?.card.enterSceneId).toBe(STAMPEDE_SKETCH_SCENE_ID);
    expect(stampede?.card.unavailableReason).toBeUndefined();
    expect(unavailable.every((target) => target.card.unavailableReason && !target.card.enterSceneId)).toBe(true);
  });

  it('derives the Stampede blanket memory from the first-clear stamp', () => {
    const stampedeBlanket = RIDGE_LANDMARKS.find((landmark) => landmark.kind === 'stampede-blanket');
    const telegraphBag = RIDGE_LANDMARKS.find((landmark) => landmark.kind === 'telegraph-bag');

    expect(stampedeBlanket).toBeDefined();
    expect(telegraphBag).toBeDefined();
    if (!stampedeBlanket || !telegraphBag) return;

    expect(getRidgeLandmarkMemory(stampedeBlanket, { stampIds: [] })).toBeNull();
    expect(getRidgeLandmarkMemory(stampedeBlanket, {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    })).toBe('stampede-first-clear');
    expect(getRidgeLandmarkMemory(telegraphBag, {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    })).toBeNull();
  });
});
