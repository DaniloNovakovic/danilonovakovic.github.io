/**
 * Pure rules for the dance call-and-response game.
 * Each round is its own phrase. A double step is fine; three of the same
 * move, or a later round that starts by repeating the last dance, is not.
 */

const DANCE_MOVES = ['up', 'right', 'down', 'left'] as const;
export type DanceMove = (typeof DANCE_MOVES)[number];

/** Clearing this round (a 5-move sequence) awards the spare part. */
export const DANCE_REWARD_ROUND = 5;
const DANCE_BPM = 100;
export const BEAT_SECONDS = 60 / DANCE_BPM;
/** Metronome beats before the first demonstrated move. */
export const COUNT_IN_BEATS = 2;

export type DanceInputResult = 'wrong' | 'continue' | 'cleared';

/** A new phrase for this round. `avoid` is the dance the player just finished. */
export function composePhrase(
  length: number,
  avoid: readonly DanceMove[] | null = null,
  random: () => number = Math.random
): DanceMove[] {
  const safeLength = Math.max(1, Math.floor(length));
  const drafted = safeLength >= 4 ? motifPhrase(safeLength, random) : loosePhrase(safeLength, random);
  return ensureVariety(breakSameDance(ensureVariety(drafted), avoid));
}

function loosePhrase(length: number, random: () => number): DanceMove[] {
  const phrase: DanceMove[] = [];
  while (phrase.length < length) phrase.push(pickStep(phrase, random));
  return phrase;
}

/** State a two-beat idea, echo it when it fits, then turn away from a plain loop. */
function motifPhrase(length: number, random: () => number): DanceMove[] {
  const first = pickAny(random);
  const second = pickAny(random);
  const phrase: DanceMove[] = [first];
  if (second === first) {
    phrase.push(first, pickDifferent(first, random));
  } else if (length === 4) {
    phrase.push(second, first, pickDifferent(second, random));
  } else {
    phrase.push(second, first, second);
  }
  while (phrase.length < length) phrase.push(pickStep(phrase, random));
  return phrase.slice(0, length);
}

function pickAny(random: () => number): DanceMove {
  return DANCE_MOVES[Math.floor(random() * DANCE_MOVES.length)] ?? 'up';
}

function pickDifferent(from: DanceMove, random: () => number): DanceMove {
  const others = DANCE_MOVES.filter((move) => move !== from);
  return others[Math.floor(random() * others.length)] ?? 'up';
}

/** A repeat of the previous step weighs less than a change, and a third copy is blocked. */
function pickStep(phrase: readonly DanceMove[], random: () => number): DanceMove {
  const previous = phrase[phrase.length - 1] ?? null;
  const beforeThat = phrase[phrase.length - 2] ?? null;
  const blocked = previous !== null && previous === beforeThat ? previous : null;
  const weighted: DanceMove[] = [];
  for (const move of DANCE_MOVES) {
    if (move === blocked) continue;
    const weight = move === previous ? 1 : 2;
    for (let i = 0; i < weight; i++) weighted.push(move);
  }
  return weighted[Math.floor(random() * weighted.length)] ?? 'up';
}

function minimumDirections(length: number): number {
  if (length >= 5) return 3;
  if (length >= 3) return 2;
  return 1;
}

function ensureVariety(phrase: readonly DanceMove[]): DanceMove[] {
  const next = [...phrase];
  for (const move of DANCE_MOVES) {
    if (new Set(next).size >= minimumDirections(next.length)) return next;
    if (next.includes(move)) continue;
    const index = spareIndex(next);
    const step = next[index];
    if (index < 0 || step === undefined) continue;
    next[index] = move;
    if (hasTriple(next)) next[index] = step;
  }
  return next;
}

function spareIndex(phrase: readonly DanceMove[]): number {
  const counts = new Map<DanceMove, number>();
  for (const step of phrase) counts.set(step, (counts.get(step) ?? 0) + 1);
  for (let index = phrase.length - 1; index >= 0; index--) {
    const step = phrase[index];
    if (step && (counts.get(step) ?? 0) > 1) return index;
  }
  return phrase.length - 1;
}

function breakSameDance(phrase: readonly DanceMove[], avoid: readonly DanceMove[] | null): DanceMove[] {
  if (!sharesOpening(phrase, avoid)) return [...phrase];
  for (const move of DANCE_MOVES) {
    if (move === phrase[0]) continue;
    const next = [...phrase];
    next[0] = move;
    if (!hasTriple(next) && !sharesOpening(next, avoid)) return next;
  }
  return [...phrase];
}

function sharesOpening(phrase: readonly DanceMove[], avoid: readonly DanceMove[] | null): boolean {
  if (!avoid || avoid.length === 0) return false;
  const compared = Math.min(avoid.length, phrase.length);
  for (let index = 0; index < compared; index++) {
    if (phrase[index] !== avoid[index]) return false;
  }
  return true;
}

function hasTriple(phrase: readonly DanceMove[]): boolean {
  for (let index = 2; index < phrase.length; index++) {
    if (phrase[index] === phrase[index - 1] && phrase[index] === phrase[index - 2]) return true;
  }
  return false;
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
