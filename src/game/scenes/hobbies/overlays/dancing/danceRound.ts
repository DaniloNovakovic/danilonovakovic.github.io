/** Pure rules for the Simon-style dance memory game. */

const DANCE_MOVES = ['up', 'right', 'down', 'left'] as const;
export type DanceMove = (typeof DANCE_MOVES)[number];

/** Clearing this round (a 5-move sequence) awards the spare part. */
export const DANCE_REWARD_ROUND = 5;
const DANCE_BPM = 100;
export const BEAT_SECONDS = 60 / DANCE_BPM;
/** Metronome beats before the first demonstrated move. */
export const COUNT_IN_BEATS = 2;

export type DanceInputResult = 'wrong' | 'continue' | 'cleared';

export function pickMove(random: () => number = Math.random): DanceMove {
  return DANCE_MOVES[Math.floor(random() * DANCE_MOVES.length)] ?? 'up';
}

/** Judges the player's move at position `inputIndex` of the round's sequence. */
export function judgeMove(sequence: readonly DanceMove[], inputIndex: number, move: DanceMove): DanceInputResult {
  if (sequence[inputIndex] !== move) return 'wrong';
  return inputIndex + 1 >= sequence.length ? 'cleared' : 'continue';
}

/** Round number equals sequence length; clearing it may award the reward. */
export function isRewardClear(clearedRound: number): boolean {
  return clearedRound === DANCE_REWARD_ROUND;
}

/** Beat index (from demo start) on which the move at `moveIndex` is shown. */
export function demoMoveBeat(moveIndex: number): number {
  return COUNT_IN_BEATS + moveIndex;
}

/** Total demo length in beats, after which the player's turn begins. */
export function demoLengthBeats(sequenceLength: number): number {
  return COUNT_IN_BEATS + sequenceLength;
}
