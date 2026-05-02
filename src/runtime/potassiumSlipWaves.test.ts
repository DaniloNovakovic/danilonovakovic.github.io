import { describe, expect, it } from 'vitest';
import {
  applyPotassiumDraftOption,
  getPotassiumDuplicateCloneCount,
  getPotassiumExplosionDamage,
  getPotassiumExplosionRadius,
  getPotassiumScaledExplosionRadius,
  getPotassiumEnemyHpMultiplier,
  getPotassiumUpgradeChoices,
  getPotassiumWave,
  getScaledPotassiumEnemyHp,
  getUnlockedPotassiumEnemies,
  getUnlockedPotassiumUpgrades,
  isPotassiumBossWave,
  POTASSIUM_BOSS_WAVE,
  POTASSIUM_COLUMN_COUNT,
  POTASSIUM_NON_BOSS_WAVE_COUNT,
  POTASSIUM_WAVES,
  type PotassiumWaveCell
} from './potassiumSlipWaves';

describe('potassium slip waves', () => {
  it('generates deterministic 5-column non-boss waves', () => {
    expect(getPotassiumWave(4)).toEqual(getPotassiumWave(4));
    expect(POTASSIUM_WAVES.slice(0, POTASSIUM_NON_BOSS_WAVE_COUNT).every((wave) => (
      wave.rows.every((row) => row.length === POTASSIUM_COLUMN_COUNT)
    ))).toBe(true);
  });

  it('makes late waves larger and denser than early waves', () => {
    const wave1 = getPotassiumWave(1);
    const wave9 = getPotassiumWave(9);
    const wave10 = getPotassiumWave(10);
    expect(wave1.rows.length).toBe(7);
    expect(wave9.rows.length).toBe(28);
    expect(wave10.rows.length).toBe(28);
    expect(wave10.rows.length).toBeGreaterThan(wave1.rows.length);
    expect(countEnemies(wave10.rows)).toBeGreaterThan(countEnemies(wave1.rows));
  });

  it('respects row safety limits', () => {
    getNonBossRows().forEach((row) => {
      expect(row.filter((cell) => cell === 'wall').length).toBeLessThanOrEqual(2);
      expect(row.filter((cell) => cell === 'deadline').length).toBeLessThanOrEqual(2);
      expect(row.some((cell) => cell === null)).toBe(true);
    });
  });

  it('escalates unlocked enemies over generated waves', () => {
    expect(getUnlockedPotassiumEnemies(1)).toEqual(['intern']);
    expect(getUnlockedPotassiumEnemies(2)).toContain('scope');
    expect(getUnlockedPotassiumEnemies(3)).toContain('wall');
    expect(getUnlockedPotassiumEnemies(5)).toContain('meeting');
    expect(getUnlockedPotassiumEnemies(7)).toContain('deadline');
  });

  it('offers random unlock and rank-up choices without repeating completed skills', () => {
    expect(getPotassiumUpgradeChoices({}, 1, () => 0.999)).toEqual([
      { kind: 'fire', action: 'unlock' },
      { kind: 'poison', action: 'unlock' }
    ]);
    expect(getPotassiumUpgradeChoices({}, 1, () => 0)).toEqual([
      { kind: 'poison', action: 'unlock' },
      { kind: 'explosion', action: 'unlock' }
    ]);
    expect(getPotassiumUpgradeChoices({ fire: 1, poison: 1 }, 2, () => 0.999)).toEqual([
      { kind: 'fire', action: 'upgrade' },
      { kind: 'explosion', action: 'unlock' }
    ]);
    expect(getPotassiumUpgradeChoices({ fire: 2, poison: 1, explosion: 2 }, 2, () => 0.999)).toEqual([
      { kind: 'poison', action: 'upgrade' },
      { kind: 'duplicate', action: 'unlock' }
    ]);
    expect(getPotassiumUpgradeChoices({ fire: 1, poison: 1 }, 2, () => 0)).toEqual([
      { kind: 'poison', action: 'upgrade' },
      { kind: 'duplicate', action: 'unlock' }
    ]);
  });

  it('tracks owned skill ranks and draft application', () => {
    expect(getUnlockedPotassiumUpgrades({ poison: 1, fire: 2 })).toEqual(['fire', 'poison']);
    expect(applyPotassiumDraftOption({ fire: 1 }, { kind: 'fire', action: 'upgrade' })).toEqual({ fire: 2 });
    expect(applyPotassiumDraftOption({}, { kind: 'duplicate', action: 'unlock' })).toEqual({ duplicate: 1 });
  });

  it('defines duplicate and explosion scaling helpers', () => {
    expect(getPotassiumDuplicateCloneCount(1)).toBe(2);
    expect(getPotassiumDuplicateCloneCount(2)).toBe(3);
    expect(getPotassiumExplosionRadius(2)).toBeGreaterThan(getPotassiumExplosionRadius(1));
    expect(getPotassiumScaledExplosionRadius(1, 0.5)).toBe(33);
    expect(getPotassiumExplosionDamage(0, 66, 1)).toBe(2);
    expect(getPotassiumExplosionDamage(66, 66, 0.5)).toBe(0.5);
    expect(getPotassiumExplosionDamage(67, 66, 1)).toBe(0);
  });

  it('scales non-boss enemy hp gently by wave', () => {
    expect(getPotassiumEnemyHpMultiplier(1)).toBe(1);
    expect(getPotassiumEnemyHpMultiplier(3)).toBe(1.15);
    expect(getPotassiumEnemyHpMultiplier(5)).toBe(1.3);
    expect(getPotassiumEnemyHpMultiplier(7)).toBe(1.45);
    expect(getPotassiumEnemyHpMultiplier(9)).toBe(1.6);
    expect(getScaledPotassiumEnemyHp(2, 9)).toBe(4);
    expect(getScaledPotassiumEnemyHp(3, 9)).toBe(5);
  });

  it('keeps the boss as the final wave', () => {
    expect(isPotassiumBossWave(POTASSIUM_NON_BOSS_WAVE_COUNT)).toBe(false);
    expect(isPotassiumBossWave(POTASSIUM_BOSS_WAVE)).toBe(true);
    expect(getPotassiumWave(99).title).toBe('Compliance Review');
  });
});

function getNonBossRows(): PotassiumWaveCell[][] {
  return POTASSIUM_WAVES
    .slice(0, POTASSIUM_NON_BOSS_WAVE_COUNT)
    .flatMap((wave) => wave.rows);
}

function countEnemies(rows: readonly PotassiumWaveCell[][]): number {
  return rows.flat().filter((cell) => cell !== null).length;
}
