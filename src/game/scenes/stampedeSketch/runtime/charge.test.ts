import { describe, expect, it } from 'vitest';
import {
  ROOSTER_CHARGE,
  STAMPEDE_CHARGE_STALK,
  stepStampedeCharge
} from './charge';

describe('rooster charge', () => {
  it('keeps stalking until the player is within trigger range', () => {
    const far = stepStampedeCharge(STAMPEDE_CHARGE_STALK, { nowMs: 0, dx: 400, dy: 0 }, ROOSTER_CHARGE);
    expect(far).toBe(STAMPEDE_CHARGE_STALK);
  });

  it('telegraphs, then dashes along the line locked at windup', () => {
    const windup = stepStampedeCharge(STAMPEDE_CHARGE_STALK, { nowMs: 1_000, dx: 0, dy: 100 }, ROOSTER_CHARGE);
    expect(windup).toMatchObject({ phase: 'windup', dirX: 0, dirY: 1 });

    const stillWinding = stepStampedeCharge(windup, { nowMs: 1_100, dx: 100, dy: 0 }, ROOSTER_CHARGE);
    expect(stillWinding).toBe(windup);

    const dash = stepStampedeCharge(
      windup,
      { nowMs: 1_000 + ROOSTER_CHARGE.windupMs, dx: 100, dy: 0 },
      ROOSTER_CHARGE
    );
    expect(dash).toMatchObject({ phase: 'dash', dirX: 0, dirY: 1 });
  });

  it('rests after the dash before it can charge again', () => {
    const dash = { phase: 'dash', untilMs: 2_000, dirX: 1, dirY: 0 } as const;
    const rest = stepStampedeCharge(dash, { nowMs: 2_000, dx: 10, dy: 0 }, ROOSTER_CHARGE);
    expect(rest).toEqual({ phase: 'rest', untilMs: 2_000 + ROOSTER_CHARGE.restMs });

    const resting = stepStampedeCharge(rest, { nowMs: 2_100, dx: 10, dy: 0 }, ROOSTER_CHARGE);
    expect(resting).toBe(rest);

    const back = stepStampedeCharge(rest, { nowMs: 2_000 + ROOSTER_CHARGE.restMs, dx: 10, dy: 0 }, ROOSTER_CHARGE);
    expect(back).toBe(STAMPEDE_CHARGE_STALK);
  });
});
