import {
  CICKA_DODGE_HOP,
  type CickaAttackKind,
  type CickaDuel,
  type CickaStrikeResult,
  type RidgeActorId,
  type RidgeEmotion
} from '@/game/core/ridge';

/** Per-actor nudge from where the stage puts them, in world units (y < 0 is up). */
export interface ActorNudge {
  dx: number;
  dy: number;
  emotion?: RidgeEmotion;
}

export type DuelActorStaging = Partial<Record<RidgeActorId, ActorNudge>>;

/** What a frame of Cicka's Standoff looks like, independent of Phaser. */
export interface DuelFrame {
  /** Closing timing ring, or null between wind-ups. */
  ring: null | { kind: CickaAttackKind; radius: number; meets: boolean };
  /** The most recent landing and how many frames ago it happened. */
  landing: null | { result: CickaStrikeResult; kind: CickaAttackKind; age: number };
  actors: { cicka: ActorNudge; player: ActorNudge };
}

/** Radius the closing ring shrinks onto: the target circle around the player. */
export const DUEL_TARGET_RADIUS = 22;
const RING_START_RADIUS = 92;
/**
 * The ring meets the target this many frames before the paw lands, so
 * "press when the circles touch" is a perfect dodge with a frame of slack.
 */
const RING_MEETS_EARLY = 4;
const LUNGE: Record<CickaAttackKind, number> = { swipe: 24, pounce: 40, feint: 5 };
const CROUCH: Record<CickaAttackKind, number> = { swipe: 6, pounce: 11, feint: 6 };
const LUNGE_FRAMES = 12;
const HIT_FRAMES = 16;
const HOP_DISTANCE = 20;
const HOP_HEIGHT = 15;

type Telegraph = NonNullable<CickaDuel['telegraph']>;
type Landing = NonNullable<DuelFrame['landing']>;

/**
 * Pure staging for the standoff. `toward` is +1 when the player stands to the
 * right of Cicka, so her lunge and the player's hop point the right way.
 */
export function stageCickaDuel(duel: CickaDuel, toward: 1 | -1): DuelFrame {
  const telegraph = duel.telegraph;
  const landing = landingOf(duel);
  return {
    ring: telegraph ? ringFor(telegraph) : null,
    landing,
    actors: {
      cicka: { ...cickaBody(duel, telegraph, landing, toward), emotion: cickaEmotion(duel) },
      player: { ...playerBody(duel, landing, toward), emotion: playerEmotion(duel, landing) }
    }
  };
}

function landingOf(duel: CickaDuel): DuelFrame['landing'] {
  const last = duel.lastResult;
  const attack = last ? lastLandedAttack(duel.attacks, duel.frame) : null;
  if (!last || !attack) return null;
  return { result: last.result, kind: attack.kind, age: duel.frame - last.frame };
}

/** The ring meets the target circle a few frames before the paw lands. */
function ringFor(telegraph: Telegraph): NonNullable<DuelFrame['ring']> {
  const span = Math.max(1, telegraph.windup - RING_MEETS_EARLY);
  const left = Math.max(0, telegraph.framesToImpact - RING_MEETS_EARLY);
  return {
    kind: telegraph.kind,
    radius: DUEL_TARGET_RADIUS + (RING_START_RADIUS - DUEL_TARGET_RADIUS) * (left / span),
    meets: left === 0
  };
}

/** Crouch back and low while winding up (the pounce wiggles), then lunge. */
function cickaBody(
  duel: CickaDuel,
  telegraph: Telegraph | null,
  landing: Landing | null,
  toward: number
): { dx: number; dy: number } {
  if (landing && landing.age < LUNGE_FRAMES && !telegraphNear(telegraph)) {
    const t = landing.age / LUNGE_FRAMES;
    const out = Math.sin(Math.PI * Math.min(1, t * 1.4));
    const leap = landing.kind === 'pounce' ? -18 * Math.sin(Math.PI * t) : 0;
    return { dx: toward * LUNGE[landing.kind] * out, dy: leap };
  }
  if (!telegraph) return { dx: 0, dy: 0 };
  const crouch = easeIn(telegraph.progress) * CROUCH[telegraph.kind];
  const wiggle = telegraph.kind === 'pounce' ? Math.sin(duel.frame * 0.9) * 2 * telegraph.progress : 0;
  return { dx: -toward * crouch + wiggle, dy: crouch * 0.35 };
}

/** Hop back and up on a dodge; flinch when the paw connects. */
function playerBody(duel: CickaDuel, landing: Landing | null, toward: number): { dx: number; dy: number } {
  const age = duel.dodgeAge;
  const arc = age === null ? 0 : Math.sin((Math.PI * age) / CICKA_DODGE_HOP);
  const flinch =
    landing?.result === 'hit' && landing.age < HIT_FRAMES
      ? 7 * (1 - landing.age / HIT_FRAMES) * Math.cos(landing.age * 1.9)
      : 0;
  return { dx: toward * (HOP_DISTANCE * arc + flinch), dy: -HOP_HEIGHT * arc };
}

const CICKA_END_EMOTION: Record<CickaDuel['phase'], RidgeEmotion> = {
  fighting: 'determined',
  won: 'curious',
  lost: 'playful'
};

function cickaEmotion(duel: CickaDuel): RidgeEmotion {
  return CICKA_END_EMOTION[duel.phase];
}

function playerEmotion(duel: CickaDuel, landing: Landing | null): RidgeEmotion | undefined {
  if (duel.phase === 'won') return 'playful';
  if (!landing) return undefined;
  if (landing.result === 'hit' && landing.age < HIT_FRAMES) return 'surprised';
  if (landing.result === 'perfect' && landing.age < HIT_FRAMES * 2) return 'playful';
  return undefined;
}

/** A fresh wind-up takes over Cicka's body from the previous lunge. */
function telegraphNear(telegraph: Telegraph | null): boolean {
  return telegraph !== null && telegraph.progress > 0.25;
}

function lastLandedAttack(attacks: CickaDuel['attacks'], frame: number) {
  let found: CickaDuel['attacks'][number] | null = null;
  for (const attack of attacks) {
    if (attack.at <= frame) found = attack;
    else break;
  }
  return found;
}

function easeIn(t: number): number {
  return t * t;
}
