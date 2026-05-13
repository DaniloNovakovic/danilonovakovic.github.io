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

  it('derives the Stampede blanket memory layer from the first-clear stamp', () => {
    const memories = getRidgeWorldMemories({
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    });

    expect(memories.map((memory) => memory.id)).toEqual([
      'stampede-held-sticker',
      'stampede-settled-swarm',
      'stampede-glide-pip-decal'
    ]);
    expect(memories.every((memory) => memory.landmarkKind === 'stampede-blanket')).toBe(true);
    expect(hasRidgeWorldMemory(memories, 'stampede-held-sticker')).toBe(true);
  });

  it('anchors Stampede memories to the blanket without changing unrelated landmarks', () => {
    const stampedeBlanket = RIDGE_LANDMARKS.find((landmark) => landmark.kind === 'stampede-blanket');
    const telegraphBag = RIDGE_LANDMARKS.find((landmark) => landmark.kind === 'telegraph-bag');

    expect(stampedeBlanket).toBeDefined();
    expect(telegraphBag).toBeDefined();
    if (!stampedeBlanket || !telegraphBag) return;

    const ridgeProgress = {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    };

    expect(getRidgeLandmarkMemories(stampedeBlanket, ridgeProgress).map((memory) => memory.id)).toEqual([
      'stampede-held-sticker',
      'stampede-settled-swarm',
      'stampede-glide-pip-decal'
    ]);
    expect(getRidgeLandmarkMemories(telegraphBag, ridgeProgress)).toEqual([]);
  });
});
