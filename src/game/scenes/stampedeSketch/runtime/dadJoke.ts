import type { StampedeFlockKind } from './flock';

/**
 * The Dad Joke ultimate. A groan meter fills on its own and faster with clears;
 * it holds one joke at most, so jokes stay an event rather than background noise.
 */

const STARTING_CHARGE = 0.35;
export const STAMPEDE_JOKE_FILL_MS = 45_000;
const CLEAR_BONUS_MS = 1_500;
export const STAMPEDE_JOKE_RADIUS = 280;
export const STAMPEDE_JOKE_MAX_TARGETS = 8;
export const STAMPEDE_JOKE_DAMAGE = 2;
export const STAMPEDE_JOKE_DAZE_MS = 2_000;
export const STAMPEDE_JOKE_EX_DAZE_MS = 1_000;
export const STAMPEDE_JOKE_BIG_CLEAR = 5;
/** How long the joke bubble stays up; Brad answers once it is gone so the two never overlap. */
export const STAMPEDE_JOKE_BUBBLE_MS = 2_000;

export const STAMPEDE_JOKE_LINES = [
  "Hi, chick magnet. I'm Dad.",
  "Why'd the chicken join a band? Drumsticks.",
  "Why don't eggs tell jokes? They'd crack up.",
  'A hen who counts eggs? A mathemachicken.',
  'Chicken staring at lettuce? Chicken sees a salad.',
  "I'm reading about anti-gravity. Can't put it down.",
  "I only know 25 letters. I don't know y.",
  'Fake noodle? An impasta.',
  'Facial hair? It grew on me.',
  'Scarecrow won an award. Outstanding in his field.'
] as const;

export interface StampedeJokeMeter {
  charge: number;
}

export interface StampedeJokeCandidate {
  id: string;
  x: number;
  y: number;
  kind?: StampedeFlockKind;
}

export interface StampedeDadJokeTargets {
  hitIds: string[];
  bossIds: string[];
}

export type StampedeBoyfriendJokeOutcome = 'confused' | 'befriended';

export interface StampedeJokeBag {
  remaining: readonly number[];
}

export function createStampedeJokeMeter(): StampedeJokeMeter {
  return { charge: STARTING_CHARGE };
}

export function stepStampedeJokeMeter(
  meter: StampedeJokeMeter,
  deltaMs: number,
  clearedCount: number
): StampedeJokeMeter {
  if (meter.charge >= 1) return meter;
  const gainedMs = Math.max(0, deltaMs) + Math.max(0, clearedCount) * CLEAR_BONUS_MS;
  return { charge: Math.min(1, meter.charge + gainedMs / STAMPEDE_JOKE_FILL_MS) };
}

export function fillStampedeJokeMeter(meter: StampedeJokeMeter): StampedeJokeMeter {
  return meter.charge >= 1 ? meter : { charge: 1 };
}

export function spendStampedeJokeMeter(meter: StampedeJokeMeter): StampedeJokeMeter {
  return meter.charge <= 0 ? meter : { charge: 0 };
}

export function isStampedeJokeReady(meter: StampedeJokeMeter): boolean {
  return meter.charge >= 1;
}

export function resolveStampedeDadJoke({
  player,
  candidates
}: {
  player: { x: number; y: number };
  candidates: readonly StampedeJokeCandidate[];
}): StampedeDadJokeTargets {
  const inRange = candidates
    .map((candidate) => ({ candidate, distance: Math.hypot(candidate.x - player.x, candidate.y - player.y) }))
    .filter((entry) => entry.distance <= STAMPEDE_JOKE_RADIUS)
    .sort((left, right) => left.distance - right.distance);
  const bossIds = inRange
    .filter((entry) => entry.candidate.kind === 'boyfriend')
    .map((entry) => entry.candidate.id);
  const hitIds = inRange
    .filter((entry) => entry.candidate.kind !== 'boyfriend')
    .slice(0, STAMPEDE_JOKE_MAX_TARGETS)
    .map((entry) => entry.candidate.id);
  return { hitIds, bossIds };
}

/** Too fresh to laugh at a dad joke; worn down to half, he finally cracks. */
export function resolveBoyfriendJokeOutcome(hp: number, maxHp: number): StampedeBoyfriendJokeOutcome {
  return hp <= maxHp / 2 ? 'befriended' : 'confused';
}

export function createStampedeJokeBag(random: () => number = Math.random): StampedeJokeBag {
  return { remaining: shuffledIndexes(random) };
}

export function nextStampedeJokeLine(
  bag: StampedeJokeBag,
  random: () => number = Math.random
): { line: string; bag: StampedeJokeBag } {
  const remaining = bag.remaining.length > 0 ? bag.remaining : shuffledIndexes(random);
  const [index = 0, ...rest] = remaining;
  return { line: STAMPEDE_JOKE_LINES[index] ?? STAMPEDE_JOKE_LINES[0], bag: { remaining: rest } };
}

function shuffledIndexes(random: () => number): number[] {
  const indexes = STAMPEDE_JOKE_LINES.map((_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = indexes[index]!;
    indexes[index] = indexes[swapIndex]!;
    indexes[swapIndex] = current;
  }
  return indexes;
}
