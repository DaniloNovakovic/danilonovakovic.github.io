import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import {
  RIDGE_BLOCKOUT,
  compileRidgeBlockoutFacts
} from '../blockout';
import {
  CICKA_INTERACTION_TARGET_ID,
  type CickaInteractionCopy
} from '../cicka/interaction';
import type { CickaPerch } from '../cicka/CickaPerch';
import { getRidgeWorldMemories } from '../worldMemory';
import {
  createRidgeInteractionTargets,
  type RidgeInteractionEffect
} from './ridgeInteractionTargets';

const cickaCopy: CickaInteractionCopy = {
  fresh: 'meow.',
  stampedeMemory: 'mrrp!'
};

function createTestCickaPerch(): CickaPerch {
  return {
    interactionFacts: {
      id: CICKA_INTERACTION_TARGET_ID,
      kind: 'cicka',
      x: 120,
      distanceAnchorY: 130,
      prompt: { x: 120, y: 80 },
      interactRadius: 78
    },
    update: () => {},
    showLine: () => {},
    isSpeechVisible: () => false,
    destroy: () => {}
  };
}

describe('ridge interaction targets', () => {
  it('builds Cicka and Trail Card targets from compiled facts', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const targets = createRidgeInteractionTargets({
      facts,
      cickaPerch: createTestCickaPerch(),
      cickaInteractionCopy: cickaCopy,
      getWorldMemories: () => []
    });

    expect(targets.map((target) => target.id)).toEqual([
      CICKA_INTERACTION_TARGET_ID,
      STAMPEDE_SKETCH_RIDGE_STAMP_ID,
      'telegraph-terrace',
      'domino-desk'
    ]);
    expect(targets.every((target) => Number.isFinite(target.prompt.y))).toBe(true);
  });

  it('preserves Trail Card params when creating open effects', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const targets = createRidgeInteractionTargets({
      facts,
      cickaInteractionCopy: cickaCopy,
      getWorldMemories: () => []
    });
    const stampede = targets.find((target) => target.id === STAMPEDE_SKETCH_RIDGE_STAMP_ID);
    const telegraph = targets.find((target) => target.id === 'telegraph-terrace');
    const domino = targets.find((target) => target.id === 'domino-desk');

    expect(stampede?.effect).toEqual({
      kind: 'openTrailCard',
      params: expect.objectContaining({
        title: 'Stampede Sketch',
        enterSceneId: STAMPEDE_SKETCH_SCENE_ID
      })
    });
    expect(telegraph?.effect).toEqual({
      kind: 'openTrailCard',
      params: expect.objectContaining({
        title: 'Telegraph Terrace',
        unavailableReason: 'Telegraph Terrace is a later prototype.'
      })
    });
    expect(domino?.effect).toEqual({
      kind: 'openTrailCard',
      params: expect.objectContaining({
        title: 'Domino Desk',
        unavailableReason: 'Domino Desk is future scope.'
      })
    });
  });

  it('reads fresh world memories when resolving the Cicka response effect', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    let hasStampedeMemory = false;
    const targets = createRidgeInteractionTargets({
      facts,
      cickaPerch: createTestCickaPerch(),
      cickaInteractionCopy: cickaCopy,
      getWorldMemories: () =>
        getRidgeWorldMemories({
          stampIds: hasStampedeMemory ? [STAMPEDE_SKETCH_RIDGE_STAMP_ID] : []
        })
    });
    const cicka = targets.find((target) => target.id === CICKA_INTERACTION_TARGET_ID);
    if (typeof cicka?.effect !== 'function') {
      throw new Error('missing Cicka response effect');
    }

    expect((cicka.effect() as RidgeInteractionEffect)).toEqual({
      kind: 'showCickaResponse',
      response: { id: 'fresh', line: 'meow.' }
    });

    hasStampedeMemory = true;

    expect((cicka.effect() as RidgeInteractionEffect)).toEqual({
      kind: 'showCickaResponse',
      response: { id: 'stampede-memory', line: 'mrrp!' }
    });
  });
});
