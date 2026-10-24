import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
  STAMPEDE_AUTO_ATTACK_RANGE,
  createStampedeAutoAttackState,
  resolveStampedeAutoAttackFrame
} from './autoAttack';
import {
  getStampedeStartingWeaponChoices,
  getStampedeUpgradeChoices,
  resolveStampedeAutoAttackProfile,
  resolveStampedeGuardianSpeed
} from './upgrades';
import { STAMPEDE_PLAYER_SPEED } from './movement';

describe('stampede upgrades', () => {
  it('offers two or three starting weapons and later prefers twists', () => {
    const steady = () => 0.99;
    const opening = getStampedeStartingWeaponChoices(steady).map((choice) => choice.id);
    expect(opening).toEqual(['badSelfie', 'badBreath', 'badSmell']);
    expect(getStampedeStartingWeaponChoices(() => 0)).toHaveLength(2);
    expect(opening.length).toBeLessThanOrEqual(3);

    expect(getStampedeUpgradeChoices(['badSelfie'], [], steady).map((choice) => ({
      id: choice.id,
      action: choice.action
    }))).toEqual([
      { id: 'selfieGroup', action: 'upgrade' },
      { id: 'selfiePose', action: 'upgrade' },
      { id: 'selfieRear', action: 'upgrade' }
    ]);

    const withUnlock = getStampedeUpgradeChoices(['badSelfie'], [], () => 0);
    expect(withUnlock).toHaveLength(3);
    expect(withUnlock.filter((choice) => choice.action === 'unlock')).toHaveLength(1);
  });

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

  it('makes a wider selfie reach marks outside the default range', () => {
    const player = { x: 100, y: 100 };
    const target = { id: 'mark-target', x: 160, y: 100, radius: 5 };
    const candidate = {
      id: 'mark-wide',
      x: 100 + STAMPEDE_AUTO_ATTACK_RANGE + 30,
      y: 100,
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

  it('makes an upgraded selfie hit more chicks', () => {
    const profile = resolveStampedeAutoAttackProfile(['badSelfie'], ['badSelfie']);
    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player: { x: 100, y: 100 },
      velocity: { x: 1, y: 0 },
      candidates: [
        { id: 'a', x: 140, y: 100, radius: 5 },
        { id: 'b', x: 150, y: 120, radius: 5 },
        { id: 'c', x: 160, y: 90, radius: 5 }
      ],
      profile
    });

    expect(frame.attack?.hitIds).toHaveLength(3);
    expect(frame.state.nextFireAtMs).toBeLessThan(STAMPEDE_AUTO_ATTACK_COOLDOWN_MS * 2);
  });

  it('makes lighter shoes increase guardian movement speed', () => {
    expect(resolveStampedeGuardianSpeed([])).toBe(STAMPEDE_PLAYER_SPEED);
    expect(resolveStampedeGuardianSpeed(['swiftGuardian'])).toBeGreaterThan(
      STAMPEDE_PLAYER_SPEED
    );
  });
});
