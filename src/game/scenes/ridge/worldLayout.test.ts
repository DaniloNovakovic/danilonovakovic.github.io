import { describe, expect, it } from 'vitest';
import {
  RIDGE_FLOOR_Y,
  RIDGE_LANDMARKS,
  RIDGE_PLAYER_RESUME_CLAMP,
  RIDGE_PLAYER_START,
  RIDGE_TRAIL_CARD_TARGETS,
  RIDGE_WORLD_WIDTH
} from './worldLayout';

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
    expect(RIDGE_TRAIL_CARD_TARGETS.every((target) => target.card.unavailableReason.length > 0)).toBe(true);
  });
});
