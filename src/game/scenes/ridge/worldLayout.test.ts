import { describe, expect, it } from 'vitest';
import {
  RIDGE_FLOOR_Y,
  RIDGE_LANDMARKS,
  RIDGE_PLAYER_RESUME_CLAMP,
  RIDGE_PLAYER_START,
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
});
