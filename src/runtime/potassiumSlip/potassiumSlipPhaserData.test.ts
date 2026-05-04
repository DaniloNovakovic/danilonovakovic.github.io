import { describe, expect, it } from 'vitest';
import {
  canPotassiumProjectileApplyHitProcs,
  canPotassiumProjectileDuplicate,
  getPotassiumCombatId,
  getPotassiumEnemyHp,
  getPotassiumHitCooldownKey,
  getPotassiumHitCooldownUntil,
  getPotassiumProjectileEffectMultiplier,
  getPotassiumProjectileNextTrailDropAt,
  isPotassiumProjectileRecallVisual,
  setPotassiumCombatId,
  setPotassiumEnemyHealth,
  setPotassiumHitCooldownUntil,
  setPotassiumProjectileDefaults
} from './potassiumSlipPhaserData';

function makeDataObject() {
  const data = new Map<string, unknown>();
  return {
    getData: (key: string) => data.get(key),
    setData: (key: string, value: unknown) => {
      data.set(key, value);
      return undefined;
    }
  };
}

describe('potassium slip Phaser data helpers', () => {
  it('centralizes projectile flags and combat ids', () => {
    const object = makeDataObject();

    setPotassiumProjectileDefaults(object, {
      canDuplicate: true,
      effectMultiplier: 0.5,
      canApplyHitProcs: false,
      nextTrailDropAt: 1200,
      recallVisual: true
    });
    setPotassiumCombatId(object, 'main-1');

    expect(canPotassiumProjectileDuplicate(object)).toBe(true);
    expect(getPotassiumProjectileEffectMultiplier(object)).toBe(0.5);
    expect(canPotassiumProjectileApplyHitProcs(object)).toBe(false);
    expect(getPotassiumProjectileNextTrailDropAt(object)).toBe(1200);
    expect(isPotassiumProjectileRecallVisual(object)).toBe(true);
    expect(getPotassiumCombatId(object)).toBe('main-1');
  });

  it('centralizes enemy health and hit cooldown keys', () => {
    const object = makeDataObject();

    setPotassiumEnemyHealth(object, 3, 'cracked');
    setPotassiumHitCooldownUntil(object, 'clone-7', 1400);

    expect(getPotassiumEnemyHp(object)).toBe(3);
    expect(getPotassiumHitCooldownKey('clone-7')).toBe('hitUntil:clone-7');
    expect(getPotassiumHitCooldownUntil(object, 'clone-7')).toBe(1400);
  });
});
