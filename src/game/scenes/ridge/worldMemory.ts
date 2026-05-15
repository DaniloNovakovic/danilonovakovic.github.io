import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import type { BridgeRidgeProgressState, RidgeStampId } from '@/game/bridge/store';
import type { RidgeLandmarkKind } from './worldLayout';

type RidgeMemorySource =
  | {
      kind: 'stamp';
      id: RidgeStampId;
    };

export type RidgeWorldMemoryId =
  | 'stampede-held-sticker'
  | 'stampede-settled-swarm'
  | 'stampede-glide-pip-decal'
  | 'cicka-stampede-note';

export type RidgeWorldMemoryKind =
  | 'reward-sticker'
  | 'settled-swarm'
  | 'glide-pip-decal'
  | 'cicka-note';

export interface RidgeWorldMemory {
  id: RidgeWorldMemoryId;
  kind: RidgeWorldMemoryKind;
  landmarkKind: Extract<RidgeLandmarkKind, 'cicka-perch' | 'stampede-blanket'>;
  source: RidgeMemorySource;
}

const RIDGE_WORLD_MEMORIES: readonly RidgeWorldMemory[] = [
  {
    id: 'stampede-held-sticker',
    kind: 'reward-sticker',
    landmarkKind: 'stampede-blanket',
    source: {
      kind: 'stamp',
      id: STAMPEDE_SKETCH_RIDGE_STAMP_ID
    }
  },
  {
    id: 'stampede-settled-swarm',
    kind: 'settled-swarm',
    landmarkKind: 'stampede-blanket',
    source: {
      kind: 'stamp',
      id: STAMPEDE_SKETCH_RIDGE_STAMP_ID
    }
  },
  {
    id: 'stampede-glide-pip-decal',
    kind: 'glide-pip-decal',
    landmarkKind: 'stampede-blanket',
    source: {
      kind: 'stamp',
      id: STAMPEDE_SKETCH_RIDGE_STAMP_ID
    }
  },
  {
    id: 'cicka-stampede-note',
    kind: 'cicka-note',
    landmarkKind: 'cicka-perch',
    source: {
      kind: 'stamp',
      id: STAMPEDE_SKETCH_RIDGE_STAMP_ID
    }
  }
];

export function getRidgeWorldMemories(
  ridgeProgress: Pick<BridgeRidgeProgressState, 'stampIds'>
): readonly RidgeWorldMemory[] {
  return RIDGE_WORLD_MEMORIES.filter((memory) =>
    ridgeProgress.stampIds.includes(memory.source.id)
  );
}

export function getRidgeLandmarkMemories(
  landmarkKind: RidgeLandmarkKind,
  ridgeProgress: Pick<BridgeRidgeProgressState, 'stampIds'>
): readonly RidgeWorldMemory[] {
  return getRidgeWorldMemories(ridgeProgress).filter(
    (memory) => memory.landmarkKind === landmarkKind
  );
}

export function hasRidgeWorldMemory(
  memories: readonly RidgeWorldMemory[],
  memoryId: RidgeWorldMemoryId
): boolean {
  return memories.some((memory) => memory.id === memoryId);
}
