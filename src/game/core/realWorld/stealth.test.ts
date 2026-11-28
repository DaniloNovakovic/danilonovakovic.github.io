import { describe, expect, it } from 'vitest';
import { findCells } from './labRoom';
import { DECK_ESCAPE, SHIP_DECK } from './shipDeck';
import { hasLineOfSight, lightAt, noticeRate, SIGHT, STEALTH, startGuard, stepGuard, type Guard } from './stealth';

const DT = 1 / 60;
const NORTH = 0;
const SOUTH = Math.PI;
const [researcher] = DECK_ESCAPE.guards;
const [serviceDoor] = findCells(SHIP_DECK.walls, 'S');

describe('light and shadow on the deck', () => {
  it('is fully lit under a strip and dark between the corridor’s pools', () => {
    for (const strip of SHIP_DECK.strips!) expect(lightAt(SHIP_DECK, strip.x, strip.z)).toBeCloseTo(1);
    expect(lightAt(SHIP_DECK, 13.5, 17.5)).toBeLessThan(0.3);
    expect(lightAt(SHIP_DECK, 13.5, 29.5)).toBeLessThan(0.3);
    expect(lightAt(SHIP_DECK, 40, 40)).toBeCloseTo(STEALTH.ambient);
  });

  it('keeps the storeroom’s doorway and the corridor’s nook in the dark: places to hide', () => {
    expect(lightAt(SHIP_DECK, serviceDoor.x, serviceDoor.z)).toBeLessThan(0.2);
    expect(lightAt(SHIP_DECK, 16.6, 31.5)).toBeLessThan(0.2);
  });
});

describe('being seen', () => {
  const eye = { x: 13.5, z: 20.6, yaw: SOUTH };

  it('sees you far off in the light, only up close in the dark', () => {
    expect(noticeRate(SHIP_DECK, false, 'researcher', eye, { x: 13.5, z: 26.7 })).toBeGreaterThan(0);
    expect(noticeRate(SHIP_DECK, false, 'researcher', eye, { x: 13.5, z: 23.6 })).toBe(0);
    const dark = SIGHT.researcher.range * STEALTH.ambient;
    expect(
      noticeRate(SHIP_DECK, false, 'researcher', { ...eye, z: 29.5 - dark + 0.3 }, { x: 13.5, z: 29.5 })
    ).toBeGreaterThan(0);
  });

  it('fills faster the closer you are', () => {
    const near = noticeRate(SHIP_DECK, false, 'researcher', { ...eye, z: 24.7 }, { x: 13.5, z: 26.7 });
    const far = noticeRate(SHIP_DECK, false, 'researcher', eye, { x: 13.5, z: 26.7 });
    expect(near).toBeGreaterThan(far);
  });

  it('only sees ahead, unless you’re right in its way', () => {
    expect(noticeRate(SHIP_DECK, false, 'researcher', { ...eye, yaw: NORTH }, { x: 13.5, z: 26.7 })).toBe(0);
    expect(noticeRate(SHIP_DECK, false, 'researcher', { ...eye, yaw: NORTH }, { x: 13.5, z: 21.2 })).toBeGreaterThan(0);
  });

  it('can’t see through walls, a shut door, or tall furniture', () => {
    const inStore = { x: serviceDoor.x + 2.5, z: serviceDoor.z };
    const outside = { x: 13.5, z: serviceDoor.z };
    expect(hasLineOfSight(SHIP_DECK, false, outside, inStore)).toBe(false);
    expect(hasLineOfSight(SHIP_DECK, true, outside, inStore)).toBe(true);
    // Through the corridor wall into the laundry.
    expect(hasLineOfSight(SHIP_DECK, true, outside, { x: 6, z: serviceDoor.z })).toBe(false);
    // The coat rack in the laundry.
    expect(hasLineOfSight(SHIP_DECK, true, { x: 6, z: 20 }, { x: 10.5, z: 20 })).toBe(false);
  });
});

describe('an alien on its round', () => {
  const run = (guard: Guard, player: { x: number; z: number } | null, seconds: number) => {
    for (let t = 0; t < seconds; t += DT) guard = stepGuard(SHIP_DECK, researcher, guard, player, false, DT);
    return guard;
  };
  const watching = (): Guard => ({
    ...startGuard(researcher),
    patrol: { ...startGuard(researcher).patrol, x: 13.5, z: 20.6, yaw: SOUTH }
  });

  it('catches you standing lit in front of it, after a beat, not at once', () => {
    const lit = { x: 13.5, z: 25.7 };
    expect(run(watching(), lit, 0.2).state).toBe('patrol');
    const looking = run(watching(), lit, 0.6);
    expect(looking.state).toBe('suspicious');
    expect(looking.patrol.moving).toBe(false);
    expect(run(watching(), lit, 3).state).toBe('caught');
  });

  it('calms down and goes back to its round once you’re out of sight', () => {
    const lit = { x: 13.5, z: 25.7 };
    const looking = run(watching(), lit, 0.6);
    const calm = run(looking, null, 3);
    expect(calm.alert).toBe(0);
    expect(calm.state).toBe('patrol');
  });

  it('turns towards where it saw you while it’s suspicious', () => {
    // Standing at the end of the corridor, looking south into the security post.
    const start = startGuard(researcher);
    const atEnd: Guard = { ...start, patrol: { ...start.patrol, x: 13.5, z: 31, yaw: SOUTH, target: 3 } };
    const offside = { x: 12.6, z: 36.8 };
    const looking = run(atEnd, offside, 0.9);
    expect(looking.state).toBe('suspicious');
    expect(looking.patrol.yaw).not.toBeCloseTo(SOUTH);
  });
});
