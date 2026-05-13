import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import type { BridgeRidgeProgressState } from '@/game/bridge/store';
import type { RidgeLandmark, RidgeLandmarkKind } from './worldLayout';

type RidgeMemorySource =
  | {
      kind: 'stamp';
      id: typeof STAMPEDE_SKETCH_RIDGE_STAMP_ID;
    };

export type RidgeWorldMemoryId =
  | 'stampede-held-sticker'
  | 'stampede-settled-swarm'
  | 'stampede-glide-pip-decal';

export type RidgeWorldMemoryKind =
  | 'reward-sticker'
  | 'settled-swarm'
  | 'glide-pip-decal';

export interface RidgeWorldMemory {
  id: RidgeWorldMemoryId;
  kind: RidgeWorldMemoryKind;
  landmarkKind: Extract<RidgeLandmarkKind, 'stampede-blanket'>;
  source: RidgeMemorySource;
}

const STAMPEDE_FIRST_CLEAR_MEMORIES: readonly RidgeWorldMemory[] = [
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
  }
];

export function getRidgeWorldMemories(
  ridgeProgress: Pick<BridgeRidgeProgressState, 'stampIds'>
): readonly RidgeWorldMemory[] {
  if (!ridgeProgress.stampIds.includes(STAMPEDE_SKETCH_RIDGE_STAMP_ID)) {
    return [];
  }
  return STAMPEDE_FIRST_CLEAR_MEMORIES;
}

export function getRidgeLandmarkMemories(
  landmark: Pick<RidgeLandmark, 'kind'>,
  ridgeProgress: Pick<BridgeRidgeProgressState, 'stampIds'>
): readonly RidgeWorldMemory[] {
  return getRidgeWorldMemories(ridgeProgress).filter(
    (memory) => memory.landmarkKind === landmark.kind
  );
}

export function hasRidgeWorldMemory(
  memories: readonly RidgeWorldMemory[],
  memoryId: RidgeWorldMemoryId
): boolean {
  return memories.some((memory) => memory.id === memoryId);
}
