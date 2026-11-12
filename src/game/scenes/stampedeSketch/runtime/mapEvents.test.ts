import { describe, expect, it } from 'vitest';
import {
  dueStampedeMapEvents,
  isStampedeLastCall,
  placeStampedeMirror,
  rollStampedeGift,
  STAMPEDE_EX_AT_MS,
  STAMPEDE_LAST_CALL_REMAINING_MS,
  STAMPEDE_MIRROR_AT_MS,
  STAMPEDE_MIRROR_CHARGE_MS,
  STAMPEDE_MIRROR_LIFE_MS,
  stepStampedeMirror
} from './mapEvents';
import { STAMPEDE_WORLD } from './movement';

const DURATION = 120_000;

describe('map events', () => {
  it('fires each scheduled event exactly once as time crosses it', () => {
    const fired: string[] = [];
    for (let at = 0; at < DURATION; at += 16) {
      fired.push(...dueStampedeMapEvents(at, at + 16, DURATION));
    }
    expect(fired.filter((kind) => kind === 'mirror')).toHaveLength(STAMPEDE_MIRROR_AT_MS.length);
    expect(fired.filter((kind) => kind === 'ex')).toHaveLength(1);
    expect(fired.filter((kind) => kind === 'lastCall')).toHaveLength(1);
    expect(dueStampedeMapEvents(STAMPEDE_EX_AT_MS - 1, STAMPEDE_EX_AT_MS, DURATION)).toEqual(['ex']);
  });

  it('flags last call for the final stretch', () => {
    expect(isStampedeLastCall(DURATION - STAMPEDE_LAST_CALL_REMAINING_MS - 1, DURATION)).toBe(false);
    expect(isStampedeLastCall(DURATION - STAMPEDE_LAST_CALL_REMAINING_MS, DURATION)).toBe(true);
  });

  it('repeats mirrors, ex visits and rushes on a beat in endless overtime', () => {
    const fired: string[] = [];
    for (let at = DURATION; at < DURATION + 300_000; at += 16) {
      fired.push(...dueStampedeMapEvents(at, at + 16, DURATION));
    }
    expect(fired.filter((kind) => kind === 'mirror')).toHaveLength(7);
    expect(fired.filter((kind) => kind === 'ex')).toHaveLength(4);
    expect(fired.filter((kind) => kind === 'lastCall')).toHaveLength(5);
  });

  it('turns overtime rushes on and off instead of staying in last call', () => {
    expect(isStampedeLastCall(DURATION + 1_000, DURATION)).toBe(false);
    expect(isStampedeLastCall(DURATION + 50_000, DURATION)).toBe(true);
    expect(isStampedeLastCall(DURATION + 70_000, DURATION)).toBe(false);
    expect(isStampedeLastCall(DURATION + 110_000, DURATION)).toBe(true);
  });

  it('places the mirror a short walk away, inside the field', () => {
    const player = { x: 800, y: 500 };
    const mirror = placeStampedeMirror(player, STAMPEDE_WORLD, 10_000, () => 0.3);
    const distance = Math.hypot(mirror.x - player.x, mirror.y - player.y);
    expect(distance).toBeGreaterThan(250);
    expect(distance).toBeLessThan(500);
    expect(mirror.expiresAtMs).toBe(10_000 + STAMPEDE_MIRROR_LIFE_MS);
    expect(mirror.charge).toBe(0);
  });

  it('completes the pep talk after standing at the mirror long enough', () => {
    let mirror = { x: 0, y: 0, expiresAtMs: 60_000, charge: 0 };
    let status = 'waiting';
    let elapsed = 0;
    while (status !== 'complete' && elapsed < STAMPEDE_MIRROR_CHARGE_MS * 2) {
      elapsed += 100;
      const step = stepStampedeMirror(mirror, { x: 10, y: 0 }, 100, elapsed);
      status = step.status;
      if (step.mirror) mirror = step.mirror;
    }
    expect(status).toBe('complete');
    expect(elapsed).toBeGreaterThanOrEqual(STAMPEDE_MIRROR_CHARGE_MS);
  });

  it('drains slowly when the player steps out, and expires on time', () => {
    const mirror = { x: 0, y: 0, expiresAtMs: 5_000, charge: 0.5 };
    const away = stepStampedeMirror(mirror, { x: 500, y: 0 }, 100, 1_000);
    expect(away.status).toBe('waiting');
    expect(away.mirror!.charge).toBeLessThan(0.5);
    expect(away.mirror!.charge).toBeGreaterThan(0.48);

    expect(stepStampedeMirror(mirror, { x: 0, y: 0 }, 100, 5_000)).toEqual({ status: 'expired', mirror: null });
  });

  it('only rolls a heal gift when the player is hurt', () => {
    expect(rollStampedeGift(true, () => 0.1)).toBe('heal');
    expect(rollStampedeGift(false, () => 0.1)).toBe('magnet');
    expect(rollStampedeGift(false, () => 0.9)).toBe('ghosting');
  });
});
