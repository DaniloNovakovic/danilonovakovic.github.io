import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { RIDGE_LANDMARKS } from './worldLayout';
import {
  getRidgeLandmarkMemories,
  getRidgeWorldMemories,
  hasRidgeWorldMemory
} from './worldMemory';

describe('ridge world memory', () => {
  it('returns no derived memories for empty Ridge progress', () => {
    expect(getRidgeWorldMemories({ stampIds: [] })).toEqual([]);
  });

  it('ignores unrelated stamp ids', () => {
    expect(getRidgeWorldMemories({ stampIds: ['future-stamp'] })).toEqual([]);
  });

  it('derives the Stampede blanket memory layer from the first-clear stamp', () => {
    const memories = getRidgeWorldMemories({
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    });

    expect(memories.map((memory) => memory.id)).toEqual([
      'stampede-held-sticker',
      'stampede-settled-swarm',
      'stampede-glide-pip-decal',
      'cicka-stampede-note'
    ]);
    expect(hasRidgeWorldMemory(memories, 'stampede-held-sticker')).toBe(true);
    expect(hasRidgeWorldMemory(memories, 'cicka-stampede-note')).toBe(true);
  });

  it('anchors Stampede memories to the blanket and Cicka perch without changing unrelated landmarks', () => {
    const cickaPerch = RIDGE_LANDMARKS.find((landmark) => landmark.kind === 'cicka-perch');
    const stampedeBlanket = RIDGE_LANDMARKS.find((landmark) => landmark.kind === 'stampede-blanket');
    const telegraphBag = RIDGE_LANDMARKS.find((landmark) => landmark.kind === 'telegraph-bag');

    expect(cickaPerch).toBeDefined();
    expect(stampedeBlanket).toBeDefined();
    expect(telegraphBag).toBeDefined();
    if (!cickaPerch || !stampedeBlanket || !telegraphBag) return;

    const ridgeProgress = {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    };

    expect(getRidgeLandmarkMemories(stampedeBlanket, ridgeProgress).map((memory) => memory.id)).toEqual([
      'stampede-held-sticker',
      'stampede-settled-swarm',
      'stampede-glide-pip-decal'
    ]);
    expect(getRidgeLandmarkMemories(cickaPerch, ridgeProgress).map((memory) => memory.id)).toEqual([
      'cicka-stampede-note'
    ]);
    expect(getRidgeLandmarkMemories(telegraphBag, ridgeProgress)).toEqual([]);
  });
});
