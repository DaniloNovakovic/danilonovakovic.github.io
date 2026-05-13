import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
  STAMPEDE_AUTO_ATTACK_HALF_WIDTH,
  createStampedeAutoAttackState,
  resolveStampedeAutoAttackFrame
} from './autoAttack';
import {
  resolveStampedeAutoAttackProfile,
  resolveStampedeGuardianSpeed
} from './upgrades';
import { STAMPEDE_PLAYER_SPEED } from './movement';

describe('stampede upgrades', () => {
  it('makes quick pencil shorten the next auto-attack cooldown', () => {
    const profile = resolveStampedeAutoAttackProfile(['quickPencil']);
    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player: { x: 100, y: 100 },
      velocity: { x: 1, y: 0 },
      candidates: [{ id: 'mark-a', x: 140, y: 100, radius: 5 }],
      profile
    });

    expect(frame.attack?.hitIds).toEqual(['mark-a']);
    expect(frame.state.nextFireAtMs).toBeLessThan(
      STAMPEDE_AUTO_ATTACK_COOLDOWN_MS * 2
    );
  });

  it('makes wider scribble catch marks outside the default swipe width', () => {
    const player = { x: 100, y: 100 };
    const target = { id: 'mark-target', x: 135, y: 100, radius: 5 };
    const candidate = {
      id: 'mark-wide',
      x: 180,
      y: 100 + STAMPEDE_AUTO_ATTACK_HALF_WIDTH + 20,
      radius: 5
    };
    const base = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 1, y: 0 },
      candidates: [target, candidate]
    });
    const upgraded = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 1, y: 0 },
      candidates: [target, candidate],
      profile: resolveStampedeAutoAttackProfile(['wideSwipe'])
    });

    expect(base.attack?.hitIds).toEqual(['mark-target']);
    expect(upgraded.attack?.hitIds).toEqual(['mark-target', 'mark-wide']);
  });

  it('makes lighter shoes increase guardian movement speed', () => {
    expect(resolveStampedeGuardianSpeed([])).toBe(STAMPEDE_PLAYER_SPEED);
    expect(resolveStampedeGuardianSpeed(['swiftGuardian'])).toBeGreaterThan(
      STAMPEDE_PLAYER_SPEED
    );
  });
});
