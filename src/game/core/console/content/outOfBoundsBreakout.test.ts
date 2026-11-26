import { describe, expect, it } from 'vitest';
import { BASEMENT_BREACH_ENTRY, awayFromBasementBreach, isBasementBreachArrival } from './outOfBoundsBreakout';

describe('awayFromBasementBreach', () => {
  it('moves an exit by the right wall out of the arrival zone, so the hatch never replays the breach', () => {
    for (const x of [BASEMENT_BREACH_ENTRY.x, BASEMENT_BREACH_ENTRY.x + 26, BASEMENT_BREACH_ENTRY.x - 5]) {
      const kept = awayFromBasementBreach({ x, y: 473 });
      expect(isBasementBreachArrival(kept.x)).toBe(false);
      expect(kept.y).toBe(473);
    }
  });

  it('leaves positions elsewhere in the den alone', () => {
    const position = { x: 400, y: 473 };
    expect(awayFromBasementBreach(position)).toBe(position);
  });

  it('still recognises the breach entry Hobbies places', () => {
    expect(isBasementBreachArrival(BASEMENT_BREACH_ENTRY.x)).toBe(true);
  });
});
