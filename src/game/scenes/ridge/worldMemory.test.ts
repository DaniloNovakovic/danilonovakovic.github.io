import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
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
    const ridgeProgress = {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    };

    expect(getRidgeLandmarkMemories('stampede-blanket', ridgeProgress).map((memory) => memory.id)).toEqual([
      'stampede-held-sticker',
      'stampede-settled-swarm',
      'stampede-glide-pip-decal'
    ]);
    expect(getRidgeLandmarkMemories('cicka-perch', ridgeProgress).map((memory) => memory.id)).toEqual([
      'cicka-stampede-note'
    ]);
    expect(getRidgeLandmarkMemories('telegraph-bag', ridgeProgress)).toEqual([]);
  });
});
