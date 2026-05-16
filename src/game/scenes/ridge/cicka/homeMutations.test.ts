import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import type { BridgeRidgeProgressState } from '@/game/bridge/store';
import {
  RIDGE_BLOCKOUT,
  compileRidgeBlockoutFacts
} from '../blockout';
import {
  hasCickaHomeMutationAdd,
  resolveCickaHomeMutations
} from './homeMutations';

function createRidgeProgress(
  overrides: Partial<BridgeRidgeProgressState> = {}
): BridgeRidgeProgressState {
  return {
    stampIds: [],
    manualPageIds: [],
    mobility: {
      glidePips: 0
    },
    shortcutIds: [],
    ...overrides
  };
}

describe('Cicka Home mutations', () => {
  it('activates no mutations for empty Ridge progress', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const resolution = resolveCickaHomeMutations(
      facts.homeMutations,
      createRidgeProgress()
    );

    expect(resolution.active).toEqual([]);
  });

  it('activates the compiled Stampede mutation from the durable Stampede stamp', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const resolution = resolveCickaHomeMutations(
      facts.homeMutations,
      createRidgeProgress({
        stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
      })
    );

    expect(resolution.active).toContainEqual(expect.objectContaining({
      id: 'stampede_sketch',
      adds: 'stampede_note',
      opens: 'fold_drop_landing',
      source: {
        kind: 'stamp',
        id: STAMPEDE_SKETCH_RIDGE_STAMP_ID
      }
    }));
    expect(hasCickaHomeMutationAdd(resolution.active, 'stampede_note')).toBe(true);
  });

  it('does not activate Cicka Home mutations from unrelated progress', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const resolution = resolveCickaHomeMutations(
      facts.homeMutations,
      createRidgeProgress({
        stampIds: ['future-stamp'],
        manualPageIds: ['future-manual-page'],
        shortcutIds: ['telegraph_clear'],
        mobility: {
          glidePips: 3
        }
      })
    );

    expect(resolution.active).toEqual([]);
  });

  it('keeps non-Stampede mutations as typed future promises', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const resolution = resolveCickaHomeMutations(
      facts.homeMutations,
      createRidgeProgress({
        stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
      })
    );

    expect(resolution.promises).toContainEqual(expect.objectContaining({
      id: 'work_artifact',
      adds: 'work_display',
      source: {
        kind: 'future-progress'
      }
    }));
    expect(resolution.active).not.toContainEqual(expect.objectContaining({
      id: 'work_artifact'
    }));
  });
});
