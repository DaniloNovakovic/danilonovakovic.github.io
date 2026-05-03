import { describe, expect, it } from 'vitest';
import {
  POTASSIUM_FIRE_HIT_PATCH_LIFETIME_MS,
  POTASSIUM_POISON_TICK_INTERVAL_MS,
  resolvePotassiumDamage,
  resolvePotassiumExplosion,
  resolvePotassiumGhostBeam,
  resolvePotassiumPoisonTick,
  resolvePotassiumProjectileHit,
  type PotassiumEnemyCombatFacts,
  type PotassiumProjectileCombatFacts
} from './potassiumSlipCombat';

describe('potassium slip combat', () => {
  it('resolves normal hit damage, deflection, and unlocked effects', () => {
    expect(resolvePotassiumProjectileHit({
      now: 1000,
      enemy: enemy({ id: 'enemy-1', x: 300, y: 160 }),
      projectile: projectile({ id: 'banana', x: 280, y: 150 }),
      skillRanks: { poison: 1, explosion: 1, duplicate: 1, ghostHorizontal: 1 },
      genericRanks: { damage: 1, cloneTime: 2 }
    })).toEqual([
      { type: 'damageEnemy', enemyId: 'enemy-1', amount: 1.12, source: 'banana' },
      { type: 'ricochetProjectile', projectileId: 'banana', enemyId: 'enemy-1' },
      {
        type: 'applyPoison',
        enemyId: 'enemy-1',
        effectMultiplier: 1,
        poisonMultiplier: 1,
        expiresAt: 3500,
        nextTickAt: 1500
      },
      { type: 'explodeAt', x: 300, y: 160, effectMultiplier: 1, radiusMultiplier: 1 },
      { type: 'spawnBananaClones', count: 2, lifetimeMs: 3600 },
      { type: 'spawnGhostBeam', x: 300, y: 160, direction: 'horizontal', effectMultiplier: 1 }
    ]);
  });

  it('uses recall damage and recall velocity behavior', () => {
    expect(resolvePotassiumProjectileHit({
      now: 1000,
      enemy: enemy({ id: 'enemy-1' }),
      projectile: projectile({ id: 'banana', isRecall: true }),
      skillRanks: { explosion: 1, duplicate: 1, ghostVertical: 1 },
      genericRanks: {}
    })).toEqual([
      { type: 'damageEnemy', enemyId: 'enemy-1', amount: 0.65, source: 'banana' },
      { type: 'boostRecallVelocity', projectileId: 'banana' }
    ]);
  });

  it('blocks protected hits with cue and deflection commands', () => {
    expect(resolvePotassiumProjectileHit({
      now: 1000,
      enemy: enemy({ id: 'shield', shieldSide: 'right', x: 300, y: 150 }),
      projectile: projectile({ id: 'banana', x: 340, y: 152 }),
      skillRanks: { poison: 1, explosion: 1 },
      genericRanks: {}
    })).toEqual([
      { type: 'showDamageCue', enemyId: 'shield', source: 'ghost' },
      { type: 'ricochetProjectile', projectileId: 'banana', enemyId: 'shield' }
    ]);

    expect(resolvePotassiumProjectileHit({
      now: 1000,
      enemy: enemy({ id: 'boss', kind: 'boss', stoneUntil: 1400 }),
      projectile: projectile({ id: 'banana', isRecall: true }),
      skillRanks: { poison: 1 },
      genericRanks: {}
    })).toEqual([
      { type: 'showDamageCue', enemyId: 'boss', source: 'ghost' },
      { type: 'boostRecallVelocity', projectileId: 'banana' }
    ]);
  });

  it('adds fire patches for upgraded fire hits', () => {
    expect(resolvePotassiumProjectileHit({
      now: 1000,
      enemy: enemy({ id: 'enemy-1', x: 320, y: 180 }),
      projectile: projectile({ id: 'banana' }),
      skillRanks: { fire: 2 },
      genericRanks: {}
    })).toContainEqual({
      type: 'spawnFirePatch',
      x: 320,
      y: 180,
      effectMultiplier: 1,
      lifetimeMs: POTASSIUM_FIRE_HIT_PATCH_LIFETIME_MS,
      scale: 0.7
    });
  });

  it('applies explosion rank 2 status effects through explosion resolution', () => {
    expect(resolvePotassiumExplosion({
      now: 1000,
      x: 300,
      y: 160,
      effectMultiplier: 1,
      radiusMultiplier: 1,
      hits: [{ enemy: enemy({ id: 'enemy-1', x: 310, y: 160 }), distance: 10 }],
      skillRanks: { explosion: 2, poison: 1, fire: 1 },
      genericRanks: {}
    })).toEqual([
      { type: 'damageEnemy', enemyId: 'enemy-1', amount: 2, source: 'explosion' },
      {
        type: 'applyPoison',
        enemyId: 'enemy-1',
        effectMultiplier: 1,
        poisonMultiplier: 1,
        expiresAt: 3500,
        nextTickAt: 1500
      },
      {
        type: 'spawnFirePatch',
        x: 310,
        y: 160,
        effectMultiplier: 1,
        lifetimeMs: POTASSIUM_FIRE_HIT_PATCH_LIFETIME_MS,
        scale: 0.58
      }
    ]);
  });

  it('applies ghost rank 2 status effects through beam resolution', () => {
    expect(resolvePotassiumGhostBeam({
      now: 1000,
      x: 300,
      y: 160,
      direction: 'horizontal',
      effectMultiplier: 1,
      hits: [{ enemy: enemy({ id: 'enemy-1', x: 310, y: 160 }), inBeam: true }],
      skillRanks: { ghostHorizontal: 2, poison: 1 },
      genericRanks: {}
    })).toEqual([
      { type: 'damageEnemy', enemyId: 'enemy-1', amount: 1, source: 'ghost' },
      {
        type: 'applyPoison',
        enemyId: 'enemy-1',
        effectMultiplier: 1,
        poisonMultiplier: 1,
        expiresAt: 3500,
        nextTickAt: 1500
      },
      { type: 'spawnGhostStatusField', x: 300, y: 160, direction: 'horizontal', effectMultiplier: 1 }
    ]);
  });

  it('ticks, expires, and spreads poison decisions', () => {
    expect(resolvePotassiumPoisonTick({
      now: 1000,
      poisonUnlocked: true,
      enemy: enemy({ id: 'enemy-1', poisonExpiresAt: 2000, poisonNextTickAt: 900, poisonMultiplier: 1.25 })
    })).toEqual([
      { type: 'setPoisonNextTickAt', enemyId: 'enemy-1', poisonNextTickAt: 1000 + POTASSIUM_POISON_TICK_INTERVAL_MS },
      { type: 'damageEnemy', enemyId: 'enemy-1', amount: 1.25, source: 'poison' }
    ]);

    expect(resolvePotassiumPoisonTick({
      now: 2100,
      poisonUnlocked: true,
      enemy: enemy({ id: 'enemy-1', poisonExpiresAt: 2000 })
    })).toEqual([{ type: 'clearPoison', enemyId: 'enemy-1' }]);

    expect(resolvePotassiumDamage({
      now: 1000,
      enemy: enemy({ id: 'enemy-1', hp: 1, poisonExpiresAt: 2000, poisonMultiplier: 2 }),
      amount: 1,
      source: 'banana',
      skillRanks: { poison: 2 },
      genericRanks: {}
    })).toContainEqual({
      type: 'spreadPoisonFrom',
      x: 300,
      y: 150,
      effectMultiplier: 2,
      sourceEnemyId: 'enemy-1'
    });
  });

  it('cues indestructible enemies without hp loss or death', () => {
    expect(resolvePotassiumDamage({
      now: 1000,
      enemy: enemy({ id: 'wall', indestructible: true, hp: 999 }),
      amount: 20,
      source: 'banana',
      skillRanks: {},
      genericRanks: {}
    })).toEqual([{ type: 'showDamageCue', enemyId: 'wall', source: 'banana' }]);
  });
});

function enemy(overrides: Partial<PotassiumEnemyCombatFacts> = {}): PotassiumEnemyCombatFacts {
  return {
    id: 'enemy',
    kind: 'intern',
    active: true,
    dying: false,
    hp: 3,
    maxHp: 3,
    x: 300,
    y: 150,
    indestructible: false,
    splitsOnDeath: false,
    ...overrides
  };
}

function projectile(overrides: Partial<PotassiumProjectileCombatFacts> = {}): PotassiumProjectileCombatFacts {
  return {
    id: 'projectile',
    isMain: true,
    isRecall: false,
    x: 280,
    y: 150,
    effectMultiplier: 1,
    canApplyHitProcs: true,
    canDuplicate: true,
    explosionRadiusMultiplier: 1,
    ...overrides
  };
}
