/**
 * Cicka's Standoff: a timing-dodge mini-game. Keep the toy car and Cicka
 * decides to test you. You never strike back: read her wind-up, dodge as the
 * paw lands, and outlast her. Pure and frame-stepped, like the bridge sim, so
 * the console verdict and the animated fight always agree.
 */

/** One fixed simulation frame, in seconds. */
export const CICKA_DUEL_DT = 1 / 60;
/** Frames a dodge keeps you clear after the press. */
export const CICKA_DODGE_ACTIVE = 12;
/** Frames the hop animation lasts after a press. */
export const CICKA_DODGE_HOP = 16;
/**
 * Frames before you can dodge again after a whiff (active + recovery). A dodge
 * that evades a real paw recovers the moment it lands, so quick chains stay
 * fair while feints and mashing leave you exposed.
 */
export const CICKA_DODGE_LOCKOUT = 40;
/** Dodges this close to the strike count as perfect. */
const CICKA_PERFECT_FRAMES = 4;
export const CICKA_DUEL_HEARTS = 3;
/** Set when the player outlasted Cicka's Standoff; she remembers. */
export const CICKA_RESPECT_FLAG = 'bridge_cicka_respect';
/** Set after losing a standoff, so Cicka offers a rematch. */
export const CICKA_DUEL_LOST_FLAG = 'bridge_cicka_duel_lost';

/** Session flags that restore a remembered standoff outcome on re-entry. */
export function cickaStandoffFlags(outcome: 'won' | 'lost' | null | undefined): string[] {
  if (outcome === 'won') return [CICKA_RESPECT_FLAG];
  if (outcome === 'lost') return [CICKA_DUEL_LOST_FLAG];
  return [];
}

/**
 * `swipe` a quick paw, `pounce` a long butt-wiggle then a leap, `feint` a
 * wind-up that stops short. Dodging a feint spends your dodge, and the real
 * swipe follows before you recover.
 */
export type CickaAttackKind = 'swipe' | 'pounce' | 'feint';

export interface CickaAttack {
  kind: CickaAttackKind;
  /** Frame the paw lands (or, for a feint, stops short). */
  at: number;
  /** Frames of readable wind-up before `at`. */
  windup: number;
}

export type CickaDuelPhase = 'fighting' | 'won' | 'lost';
export type CickaStrikeResult = 'perfect' | 'dodged' | 'hit' | 'feinted';

export interface CickaTelegraph {
  kind: CickaAttackKind;
  /** 0 when the wind-up starts, 1 on impact. */
  progress: number;
  framesToImpact: number;
  /** Full wind-up length in frames. */
  windup: number;
}

export interface CickaDuelResult {
  ok: boolean;
  message: string;
}

/** Steps between attacks, in frames: wind-up length then the rest after. */
type Step = readonly [kind: CickaAttackKind, windup: number, rest: number];

/** Starts gentle, teaches the feint, ends with a flurry and a big pounce. */
const STANDOFF_SCRIPT: readonly Step[] = [
  ['swipe', 72, 40],
  ['swipe', 48, 36],
  ['pounce', 72, 44],
  ['feint', 48, 0],
  ['swipe', 24, 40],
  ['swipe', 40, 0],
  ['swipe', 32, 40],
  ['feint', 40, 0],
  ['swipe', 24, 0],
  ['swipe', 32, 44],
  ['pounce', 64, 0]
];
/** Breath before the first wind-up, so the player can find the key. */
const LEAD_IN = 100;
/** Frames the last landing hangs before the standoff counts as won. */
const OUTRO = 30;

export function buildCickaAttacks(script: readonly Step[] = STANDOFF_SCRIPT): CickaAttack[] {
  const attacks: CickaAttack[] = [];
  let cursor = LEAD_IN;
  for (const [kind, windup, rest] of script) {
    const at = cursor + windup;
    attacks.push({ kind, at, windup });
    cursor = at + rest;
  }
  return attacks;
}

export class CickaDuel {
  readonly attacks: readonly CickaAttack[];
  readonly maxHearts = CICKA_DUEL_HEARTS;
  private frameCount = 0;
  private heartsLeft = CICKA_DUEL_HEARTS;
  private dodgedAt: number | null = null;
  private readyAt = 0;
  private nextAttack = 0;
  private readonly results: CickaStrikeResult[] = [];
  private last: { result: CickaStrikeResult; frame: number } | null = null;
  private endedAt: number | null = null;

  constructor(attacks: readonly CickaAttack[] = buildCickaAttacks()) {
    this.attacks = attacks;
  }

  get frame(): number {
    return this.frameCount;
  }

  get hearts(): number {
    return this.heartsLeft;
  }

  get phase(): CickaDuelPhase {
    if (this.heartsLeft <= 0) return 'lost';
    return this.nextAttack >= this.attacks.length && this.endedAt !== null && this.frameCount >= this.endedAt + OUTRO
      ? 'won'
      : 'fighting';
  }

  /** Real strikes only; feints are not counted against the player. */
  get strikesTotal(): number {
    return this.attacks.filter((attack) => attack.kind !== 'feint').length;
  }

  get strikesDone(): number {
    return this.results.filter((result) => result !== 'feinted').length;
  }

  get perfectCount(): number {
    return this.results.filter((result) => result === 'perfect').length;
  }

  /** Latest resolved landing and when it happened, for flashes and text. */
  get lastResult(): { result: CickaStrikeResult; frame: number } | null {
    return this.last;
  }

  /** Frames since the dodge press while the hop plays, else null. */
  get dodgeAge(): number | null {
    if (this.dodgedAt === null) return null;
    const age = this.frameCount - this.dodgedAt;
    return age < CICKA_DODGE_HOP ? age : null;
  }

  get canDodge(): boolean {
    return this.phase === 'fighting' && this.frameCount >= this.readyAt;
  }

  /** The wind-up in progress, if any. */
  get telegraph(): CickaTelegraph | null {
    const attack = this.attacks[this.nextAttack];
    if (!attack || this.phase !== 'fighting') return null;
    const start = attack.at - attack.windup;
    if (this.frameCount < start) return null;
    return {
      kind: attack.kind,
      progress: (this.frameCount - start) / attack.windup,
      framesToImpact: attack.at - this.frameCount,
      windup: attack.windup
    };
  }

  dodge(): CickaDuelResult {
    if (this.phase !== 'fighting') return { ok: false, message: 'The standoff is over.' };
    if (!this.canDodge) return { ok: false, message: 'Still landing from the last dodge.' };
    this.dodgedAt = this.frameCount;
    this.readyAt = this.frameCount + CICKA_DODGE_LOCKOUT;
    return { ok: true, message: 'You hop back.' };
  }

  step(): void {
    if (this.phase !== 'fighting') return;
    this.frameCount += 1;
    const attack = this.attacks[this.nextAttack];
    if (!attack || this.frameCount < attack.at) return;
    this.nextAttack += 1;
    this.resolve(attack);
    if (this.nextAttack >= this.attacks.length) this.endedAt = this.frameCount;
  }

  /** Step until the next landing is `lead` frames away (console helper). */
  waitForNextLanding(lead = 2): number {
    let stepped = 0;
    while (this.phase === 'fighting' && stepped < 10_000) {
      const attack = this.attacks[this.nextAttack];
      if (attack && attack.at - this.frameCount <= lead) break;
      this.step();
      stepped += 1;
    }
    return stepped;
  }

  private resolve(attack: CickaAttack): void {
    let result: CickaStrikeResult;
    if (attack.kind === 'feint') {
      result = 'feinted';
    } else if (this.dodgedAt !== null && attack.at - this.dodgedAt < CICKA_DODGE_ACTIVE) {
      result = attack.at - this.dodgedAt <= CICKA_PERFECT_FRAMES ? 'perfect' : 'dodged';
      // A clean read recovers on the spot: ready for the next paw.
      this.readyAt = this.frameCount;
    } else {
      result = 'hit';
      this.heartsLeft -= 1;
    }
    this.results.push(result);
    this.last = { result, frame: this.frameCount };
  }
}
