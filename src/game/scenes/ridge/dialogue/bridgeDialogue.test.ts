import { describe, expect, it } from 'vitest';
import {
  BRIDGE_DIALOGUE_CONVERSATION_IDS,
  getBridgeDialogueLine,
  getBridgeDialogueLines,
  getBridgePromptText
} from './bridgeDialogue';

describe('Bridge dialogue lookup', () => {
  it('keeps the accepted Bridge Tracer conversation ids available', () => {
    expect(BRIDGE_DIALOGUE_CONVERSATION_IDS).toEqual([
      'bridge.cicka.first_meet',
      'bridge.draftsperson.missing_span',
      'bridge.cicka.parallel_play',
      'bridge.draftsperson.toy_car_test',
      'bridge.exit.opened_crossing'
    ]);
  });

  it('looks up placeholder lines by stable line id', () => {
    expect(getBridgeDialogueLine('bridge.cicka.parallel_play.04')).toMatchObject({
      conversationId: 'bridge.cicka.parallel_play',
      speaker: 'Prompt',
      text: 'Cicka leaves the tiny car beside you.'
    });
  });

  it('returns conversation lines in authored order', () => {
    expect(getBridgeDialogueLines('bridge.draftsperson.toy_car_test').map((line) => line.id)).toEqual([
      'bridge.draftsperson.toy_car_test.01',
      'bridge.draftsperson.toy_car_test.02',
      'bridge.draftsperson.toy_car_test.03',
      'bridge.draftsperson.toy_car_test.04'
    ]);
  });

  it('uses the same data source for prompts and dialogue text', () => {
    expect(getBridgePromptText('bridge.exit.opened_crossing.01')).toBe(
      'Cross the finished bridge'
    );
  });
});
