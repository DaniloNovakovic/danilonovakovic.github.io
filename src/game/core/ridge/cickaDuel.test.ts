import { describe, expect, it } from 'vitest';
import {
  buildCickaAttacks,
  CICKA_DODGE_ACTIVE,
  CICKA_DUEL_HEARTS,
  CICKA_DUEL_LOST_FLAG,
  CICKA_RESPECT_FLAG,
  CickaDuel,
  cickaStandoffFlags
} from './cickaDuel';

/** Dodge `lead` frames before every real landing; wait out feints. */
function playPerfectly(duel: CickaDuel, lead = 2): void {
  while (duel.phase === 'fighting') {
    duel.waitForNextLanding(lead);
    if (duel.phase !== 'fighting') break;
    if (duel.telegraph?.kind !== 'feint') duel.dodge();
    for (let i = 0; i <= lead; i += 1) duel.step();
    // Let the outro play once the last attack has landed.
    if (!duel.telegraph) for (let i = 0; i < 40 && duel.phase === 'fighting'; i += 1) duel.step();
  }
}

describe("Cicka's Standoff", () => {
  it('builds a script whose wind-ups never overlap', () => {
    const attacks = buildCickaAttacks();
    for (let i = 1; i < attacks.length; i += 1) {
      const previous = attacks[i - 1]!;
      const current = attacks[i]!;
      expect(current.at - current.windup).toBeGreaterThanOrEqual(previous.at);
    }
  });

  it('is won by dodging each real landing and waiting out feints', () => {
    const duel = new CickaDuel();
    playPerfectly(duel);
    expect(duel.phase).toBe('won');
    expect(duel.hearts).toBe(CICKA_DUEL_HEARTS);
    expect(duel.strikesDone).toBe(duel.strikesTotal);
    expect(duel.perfectCount).toBe(duel.strikesTotal);
  });

  it('is lost by standing still', () => {
    const duel = new CickaDuel();
    for (let i = 0; i < 5000 && duel.phase === 'fighting'; i += 1) duel.step();
    expect(duel.phase).toBe('lost');
    expect(duel.hearts).toBe(0);
  });

  it('counts an early dodge as a hit and a late-but-active one as a plain dodge', () => {
    const early = new CickaDuel([{ kind: 'swipe', at: 40, windup: 30 }]);
    early.waitForNextLanding(CICKA_DODGE_ACTIVE + 2);
    early.dodge();
    for (let i = 0; i < 20; i += 1) early.step();
    expect(early.lastResult?.result).toBe('hit');

    const loose = new CickaDuel([{ kind: 'swipe', at: 40, windup: 30 }]);
    loose.waitForNextLanding(CICKA_DODGE_ACTIVE - 2);
    loose.dodge();
    for (let i = 0; i < 20; i += 1) loose.step();
    expect(loose.lastResult?.result).toBe('dodged');
  });

  it('punishes dodging the feint: the follow-up lands during recovery', () => {
    const duel = new CickaDuel([
      { kind: 'feint', at: 40, windup: 30 },
      { kind: 'swipe', at: 64, windup: 24 }
    ]);
    duel.waitForNextLanding(1);
    expect(duel.dodge().ok).toBe(true);
    duel.step();
    duel.step();
    expect(duel.lastResult?.result).toBe('feinted');
    // Still recovering when the real wind-up nears its landing, however hard you press.
    duel.waitForNextLanding(2);
    expect(duel.canDodge).toBe(false);
    for (let i = 0; i < 10; i += 1) {
      duel.dodge();
      duel.step();
    }
    expect(duel.lastResult?.result).toBe('hit');
  });

  it('recovers at once after evading a real paw, so quick chains stay fair', () => {
    const duel = new CickaDuel([
      { kind: 'swipe', at: 40, windup: 30 },
      { kind: 'swipe', at: 56, windup: 16 }
    ]);
    duel.waitForNextLanding(2);
    duel.dodge();
    for (let i = 0; i < 3; i += 1) duel.step();
    expect(duel.lastResult?.result).toBe('perfect');
    expect(duel.canDodge).toBe(true);
    duel.waitForNextLanding(2);
    expect(duel.dodge().ok).toBe(true);
    for (let i = 0; i < 3; i += 1) duel.step();
    expect(duel.lastResult?.result).toBe('perfect');
  });

  it('does not reward mashing', () => {
    const duel = new CickaDuel();
    expect(duel.dodge().ok).toBe(true);
    expect(duel.dodge().ok).toBe(false);
    for (let i = 0; i < 5000 && duel.phase === 'fighting'; i += 1) {
      if (duel.canDodge) duel.dodge();
      duel.step();
    }
    expect(duel.phase).toBe('lost');
  });

  it('is almost never won by pressing to a fixed rhythm', () => {
    let wins = 0;
    let tries = 0;
    for (let period = 1; period <= 60; period += 1) {
      for (let offset = 0; offset < period; offset += 1) {
        const duel = new CickaDuel();
        for (let i = 0; i < 5000 && duel.phase === 'fighting'; i += 1) {
          if (i % period === offset) duel.dodge();
          duel.step();
        }
        tries += 1;
        if (duel.phase === 'won') wins += 1;
      }
    }
    expect(wins / tries).toBeLessThan(0.01);
  });

  it('restores the remembered outcome as session flags', () => {
    expect(cickaStandoffFlags('won')).toEqual([CICKA_RESPECT_FLAG]);
    expect(cickaStandoffFlags('lost')).toEqual([CICKA_DUEL_LOST_FLAG]);
    expect(cickaStandoffFlags(null)).toEqual([]);
    expect(cickaStandoffFlags(undefined)).toEqual([]);
  });
});
