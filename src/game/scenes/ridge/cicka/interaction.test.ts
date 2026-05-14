import { describe, expect, it } from 'vitest';
import {
  CICKA_INTERACTION_TARGET_ID,
  getCickaInteractionResponse,
  shouldShowCickaInteractionPrompt
} from './interaction';
import { getRidgeWorldMemories } from '../worldMemory';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';

const copy = {
  fresh: 'meow.',
  stampedeMemory: 'mrrp!'
};

describe('cicka interaction', () => {
  it('returns the first-meeting line without Ridge memories', () => {
    expect(getCickaInteractionResponse([], copy)).toEqual({
      id: 'fresh',
      line: 'meow.'
    });
  });

  it('returns the post-Stampede line when the Cicka memory exists', () => {
    const memories = getRidgeWorldMemories({
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    });

    expect(getCickaInteractionResponse(memories, copy)).toEqual({
      id: 'stampede-memory',
      line: 'mrrp!'
    });
  });

  it('keeps unrelated memories on the first-meeting line', () => {
    expect(getCickaInteractionResponse([{ id: 'stampede-held-sticker' }], copy)).toEqual({
      id: 'fresh',
      line: 'meow.'
    });
  });

  it('replaces the Cicka interact prompt while her response is visible', () => {
    expect(
      shouldShowCickaInteractionPrompt({
        activeTargetId: CICKA_INTERACTION_TARGET_ID,
        responseVisible: true
      })
    ).toBe(false);

    expect(
      shouldShowCickaInteractionPrompt({
        activeTargetId: CICKA_INTERACTION_TARGET_ID,
        responseVisible: false
      })
    ).toBe(true);

    expect(
      shouldShowCickaInteractionPrompt({
        activeTargetId: 'trail-card-sketchbook',
        responseVisible: true
      })
    ).toBe(true);
  });
});
