import { describe, expect, it } from 'vitest';
import {
  CHICK_CHASE_CHOICE,
  StreetConversation,
  chickConversation,
  litterConversation,
  signpostConversation
} from './streetConversation';

describe('street conversations', () => {
  it('walks the lines, then offers the chick choices on the last one', () => {
    const talk = new StreetConversation(chickConversation(false), 500);

    expect(talk.view(400).speaker).toBe('Street Chick');
    expect(talk.advance()).toBeNull();
    expect(talk.view(400).speakerId).toBe('player');
    expect(talk.advance()).toBeNull();
    expect(talk.advance()).toBeNull();

    const last = talk.view(400);
    expect(last.awaitingChoice).toBe(true);
    expect(last.choices.map((choice) => choice.id)).toEqual([CHICK_CHASE_CHOICE, 'later']);
    // Advancing a choice line does nothing; only a real choice ends it.
    expect(talk.advance()).toBeNull();
    expect(talk.choose('nonsense')).toBeNull();
    expect(talk.choose(CHICK_CHASE_CHOICE)).toBe(CHICK_CHASE_CHOICE);
  });

  it('ignores choices before the choice line', () => {
    const talk = new StreetConversation(chickConversation(false), 500);
    expect(talk.view(400).choices).toEqual([]);
    expect(talk.choose(CHICK_CHASE_CHOICE)).toBeNull();
  });

  it('finishes a choiceless talk on the last advance', () => {
    const talk = new StreetConversation(litterConversation(), 900);
    expect(talk.advance()).toBeNull();
    expect(talk.advance()).toBeNull();
    expect(talk.advance()).toBe('finished');
  });

  it('docks each speaker on their own side of the frame', () => {
    const talk = new StreetConversation(chickConversation(false), 500);
    // Player on the left of the chick: chick talks from the right.
    expect(talk.view(400).speakerSide).toBe('right');
    talk.advance();
    expect(talk.view(400).speakerSide).toBe('left');
    // Walk around to the other side and the seats swap.
    expect(talk.view(600).speakerSide).toBe('right');
  });

  it('reads the signpost as narration with the tally last', () => {
    const talk = new StreetConversation(signpostConversation('find-peel', 1, 6), 300);
    const hint = talk.view(280);
    expect(hint.speakerSide).toBe('center');
    expect(hint.portrait).toBe('prompt');
    talk.advance();
    expect(talk.view(280).text).toBe('Secrets found: 1/6');
    expect(talk.advance()).toBe('finished');
  });

  it('dresses the player bust like the street sprite', () => {
    const talk = new StreetConversation(litterConversation(), 900);
    talk.advance();
    expect(talk.view(900).portrait).toBe('streetPlayer');
    expect(talk.view(900, true).portrait).toBe('streetPlayerGlasses');
  });

  it('greets a returning player differently', () => {
    expect(chickConversation(true).lines[0].text).not.toBe(chickConversation(false).lines[0].text);
  });
});
