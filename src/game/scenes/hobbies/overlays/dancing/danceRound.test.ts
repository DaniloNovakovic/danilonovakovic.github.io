import { describe, expect, it } from 'vitest';
import {
  COUNT_IN_BEATS,
  DANCE_REWARD_ROUND,
  demoLengthBeats,
  demoMoveBeat,
  isRewardClear,
  composePhrase,
  judgeMove,
  type DanceMove
} from './danceRound';

describe('judgeMove', () => {
  const sequence: DanceMove[] = ['up', 'left', 'down'];

  it('continues on a correct move and clears on the last one', () => {
    expect(judgeMove(sequence, 0, 'up')).toBe('continue');
    expect(judgeMove(sequence, 1, 'left')).toBe('continue');
    expect(judgeMove(sequence, 2, 'down')).toBe('cleared');
  });

  it('fails on a wrong move', () => {
    expect(judgeMove(sequence, 1, 'right')).toBe('wrong');
  });
});

describe('reward and demo timing', () => {
  it('awards only when round 5 is cleared', () => {
    expect(isRewardClear(DANCE_REWARD_ROUND - 1)).toBe(false);
    expect(isRewardClear(DANCE_REWARD_ROUND)).toBe(true);
    expect(isRewardClear(DANCE_REWARD_ROUND + 1)).toBe(false);
  });

  it('shows moves after the count-in, one per beat', () => {
    expect(demoMoveBeat(0)).toBe(COUNT_IN_BEATS);
    expect(demoMoveBeat(3)).toBe(COUNT_IN_BEATS + 3);
    expect(demoLengthBeats(4)).toBe(COUNT_IN_BEATS + 4);
  });

  it('builds a new phrase each round, with doubles allowed and ruts blocked', () => {
    let previous: DanceMove[] | null = null;
    for (let length = 1; length <= 8; length++) {
      const phrase = composePhrase(length, previous, () => 0);
      expectFreshPhrase(phrase, length, previous);
      previous = phrase;
    }
    expect(composePhrase(4, null, () => 0).some((move, index, phrase) => move === phrase[index - 1])).toBe(true);
  });

  it('keeps later rounds from replaying the previous dance across seeds', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const random = lcg(seed);
      let previous: DanceMove[] | null = null;
      for (let length = 1; length <= 8; length++) {
        const phrase = composePhrase(length, previous, random);
        expectFreshPhrase(phrase, length, previous);
        previous = phrase;
      }
    }
  });
});

function expectFreshPhrase(phrase: DanceMove[], length: number, previous: DanceMove[] | null) {
  expect(phrase).toHaveLength(length);
  expect(hasTriple(phrase)).toBe(false);
  const minimumDirections = length >= 5 ? 3 : 2;
  if (length >= 3) expect(new Set(phrase).size).toBeGreaterThanOrEqual(minimumDirections);
  if (previous) expect(phrase.slice(0, previous.length)).not.toEqual(previous);
}

function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hasTriple(phrase: readonly DanceMove[]): boolean {
  return phrase.some((move, index) => index >= 2 && move === phrase[index - 1] && move === phrase[index - 2]);
}
