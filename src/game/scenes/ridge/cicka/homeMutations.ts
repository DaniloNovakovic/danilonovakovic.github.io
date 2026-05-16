import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import type {
  BridgeRidgeProgressState,
  RidgeStampId
} from '@/game/bridge/store';
import type { RidgeHomeMutationFact } from '../blockout';

export type CickaHomeMutationProgressSource =
  | {
      kind: 'stamp';
      id: RidgeStampId;
    };

export interface CickaHomeMutation extends RidgeHomeMutationFact {
  source: CickaHomeMutationProgressSource;
}

export interface CickaHomeMutationPromise extends RidgeHomeMutationFact {
  source: {
    kind: 'future-progress';
  };
}

export interface CickaHomeMutationResolution {
  active: readonly CickaHomeMutation[];
  promises: readonly CickaHomeMutationPromise[];
}

const CICKA_HOME_MUTATION_PROGRESS_SOURCES: Readonly<Record<string, CickaHomeMutationProgressSource>> = {
  stampede_sketch: {
    kind: 'stamp',
    id: STAMPEDE_SKETCH_RIDGE_STAMP_ID
  }
};

export function resolveCickaHomeMutations(
  homeMutations: readonly RidgeHomeMutationFact[],
  ridgeProgress: BridgeRidgeProgressState
): CickaHomeMutationResolution {
  const active: CickaHomeMutation[] = [];
  const promises: CickaHomeMutationPromise[] = [];

  homeMutations.forEach((mutation) => {
    const source = CICKA_HOME_MUTATION_PROGRESS_SOURCES[mutation.id];
    if (!source) {
      promises.push({
        ...mutation,
        source: {
          kind: 'future-progress'
        }
      });
      return;
    }

    if (source.kind === 'stamp' && ridgeProgress.stampIds.includes(source.id)) {
      active.push({
        ...mutation,
        source
      });
    }
  });

  return { active, promises };
}

export function hasCickaHomeMutationAdd(
  mutations: readonly Pick<CickaHomeMutation, 'adds'>[],
  addId: string
): boolean {
  return mutations.some((mutation) => mutation.adds === addId);
}
