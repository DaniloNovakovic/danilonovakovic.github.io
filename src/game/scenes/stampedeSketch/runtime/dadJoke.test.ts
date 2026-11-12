import { describe, expect, it } from 'vitest';
import {
  createStampedeJokeBag,
  createStampedeJokeMeter,
  fillStampedeJokeMeter,
  isStampedeJokeReady,
  nextStampedeJokeLine,
  resolveBoyfriendJokeOutcome,
  resolveStampedeDadJoke,
  spendStampedeJokeMeter,
  STAMPEDE_JOKE_FILL_MS,
  STAMPEDE_JOKE_LINES,
  STAMPEDE_JOKE_MAX_TARGETS,
  STAMPEDE_JOKE_RADIUS,
  stepStampedeJokeMeter
} from './dadJoke';

describe('groan meter', () => {
  it('starts part full so the first joke comes early', () => {
    const meter = createStampedeJokeMeter();
    expect(meter.charge).toBeGreaterThan(0);
    expect(isStampedeJokeReady(meter)).toBe(false);
  });

  it('fills over time and faster with clears, and never stores more than one joke', () => {
    const empty = { charge: 0 };
    const half = stepStampedeJokeMeter(empty, STAMPEDE_JOKE_FILL_MS / 2, 0);
    expect(half.charge).toBeCloseTo(0.5);

    const withClears = stepStampedeJokeMeter(empty, STAMPEDE_JOKE_FILL_MS / 2, 4);
    expect(withClears.charge).toBeGreaterThan(half.charge);

    const full = stepStampedeJokeMeter(empty, STAMPEDE_JOKE_FILL_MS * 3, 50);
    expect(full.charge).toBe(1);
    expect(isStampedeJokeReady(full)).toBe(true);
  });

  it('empties when told and fills instantly from a punchline card', () => {
    expect(spendStampedeJokeMeter({ charge: 1 }).charge).toBe(0);
    expect(isStampedeJokeReady(fillStampedeJokeMeter({ charge: 0.1 }))).toBe(true);
  });
});

describe('dad joke targets', () => {
  const player = { x: 0, y: 0 };

  it('hits only the closest birds inside the radius', () => {
    const near = Array.from({ length: STAMPEDE_JOKE_MAX_TARGETS + 3 }, (_, index) => ({
      id: `near-${index}`,
      x: 20 + index * 10,
      y: 0,
      kind: 'chick' as const
    }));
    const far = { id: 'far', x: STAMPEDE_JOKE_RADIUS + 50, y: 0, kind: 'chick' as const };
    const result = resolveStampedeDadJoke({ player, candidates: [far, ...near].reverse() });

    expect(result.hitIds).toHaveLength(STAMPEDE_JOKE_MAX_TARGETS);
    expect(result.hitIds[0]).toBe('near-0');
    expect(result.hitIds).not.toContain('far');
  });

  it('hands the boyfriend to his own rule without spending a target slot', () => {
    const chicks = Array.from({ length: STAMPEDE_JOKE_MAX_TARGETS }, (_, index) => ({
      id: `chick-${index}`,
      x: 40 + index,
      y: 0,
      kind: 'chick' as const
    }));
    const brad = { id: 'brad', x: 10, y: 0, kind: 'boyfriend' as const };
    const result = resolveStampedeDadJoke({ player, candidates: [brad, ...chicks] });

    expect(result.bossIds).toEqual(['brad']);
    expect(result.hitIds).toHaveLength(STAMPEDE_JOKE_MAX_TARGETS);
    expect(result.hitIds).not.toContain('brad');
  });

  it('only wins the boyfriend over once he is worn down to half', () => {
    expect(resolveBoyfriendJokeOutcome(24, 24)).toBe('confused');
    expect(resolveBoyfriendJokeOutcome(13, 24)).toBe('confused');
    expect(resolveBoyfriendJokeOutcome(12, 24)).toBe('befriended');
  });
});

describe('joke bag', () => {
  it('does not repeat a line until every line has been told', () => {
    let bag = createStampedeJokeBag(() => 0.3);
    const told: string[] = [];
    for (let index = 0; index < STAMPEDE_JOKE_LINES.length; index += 1) {
      const next = nextStampedeJokeLine(bag, () => 0.3);
      told.push(next.line);
      bag = next.bag;
    }
    expect(new Set(told).size).toBe(STAMPEDE_JOKE_LINES.length);
    expect(nextStampedeJokeLine(bag, () => 0.3).line).toBeTruthy();
  });
});
