import { describe, expect, it } from 'vitest';
import {
  COUNT_IN_BEATS,
  DANCE_REWARD_ROUND,
  demoLengthBeats,
  demoMoveBeat,
  isRewardClear,
  judgeMove,
  pickMove,
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

  it('maps the random source onto every move', () => {
    expect(pickMove(() => 0)).toBe('up');
    expect(pickMove(() => 0.99)).toBe('left');
  });
});
