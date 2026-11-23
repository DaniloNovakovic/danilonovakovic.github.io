import { describe, expect, it } from 'vitest';
import type { RidgeObservation } from '@/game/core/ridge';
import { conversationPartnerId, speakerSideFor } from './conversationStaging';

type Staging = Pick<RidgeObservation, 'actors' | 'nearby' | 'conversation'>;

function staging(
  speakerId: string | null,
  actors: Array<[RidgeObservation['actors'][number]['id'], number]>,
  focusActorId?: RidgeObservation['actors'][number]['id']
): Staging {
  return {
    actors: actors.map(([id, progress]) => ({
      id,
      label: id,
      progress,
      visible: true,
      facing: 'right'
    })),
    nearby: focusActorId
      ? [
          {
            spotId: 'spot',
            label: focusActorId,
            kind: 'npc',
            distance: 0,
            prompt: 'Talk',
            conversationId: 'c',
            progress: 0,
            actorId: focusActorId
          } as RidgeObservation['nearby'][number]
        ]
      : [],
    conversation: speakerId
      ? ({
          id: 'c',
          speaker: speakerId,
          speakerId,
          text: '',
          lineIndex: 0,
          lineCount: 1,
          awaitingChoice: false
        } as RidgeObservation['conversation'])
      : null
  };
}

describe('conversation staging', () => {
  it('puts a resident on the side they stand relative to the player', () => {
    expect(
      speakerSideFor(
        staging('cicka', [
          ['player', 0.2],
          ['cicka', 0.3]
        ])
      )
    ).toBe('right');
    expect(
      speakerSideFor(
        staging('cicka', [
          ['player', 0.4],
          ['cicka', 0.3]
        ])
      )
    ).toBe('left');
  });

  it('seats the player opposite their partner', () => {
    const view = staging(
      'player',
      [
        ['player', 0.2],
        ['cicka', 0.3],
        ['draftsperson', 0.1]
      ],
      'cicka'
    );
    expect(conversationPartnerId(view)).toBe('cicka');
    expect(speakerSideFor(view)).toBe('left');
  });

  it('falls back to the nearest visible resident when nothing is focused', () => {
    const view = staging('player', [
      ['player', 0.5],
      ['cicka', 0.2],
      ['draftsperson', 0.45]
    ]);
    expect(conversationPartnerId(view)).toBe('draftsperson');
    expect(speakerSideFor(view)).toBe('right');
  });

  it('centers narrator voices with no body on stage', () => {
    expect(speakerSideFor(staging('prompt', [['player', 0.2]]))).toBe('center');
  });
});
