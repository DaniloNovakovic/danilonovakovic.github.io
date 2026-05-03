import { describe, expect, it } from 'vitest';
import {
  applyPotassiumDraftOption,
  applyPotassiumGenericDraftOption,
  getPotassiumDuplicateCloneCount,
  getPotassiumDraftChoices,
  getPotassiumEnemyHealthState,
  getPotassiumExplosionDamage,
  getPotassiumExplosionRadius,
  getPotassiumFireCellKey,
  getPotassiumGenericUpgradeRank,
  getPotassiumScaledExplosionRadius,
  getPotassiumEnemyHpMultiplier,
  getPotassiumShieldSide,
  getPotassiumSplitterSpawnColumns,
  getPotassiumUpgradeChoices,
  getPotassiumWave,
  getScaledPotassiumEnemyHp,
  getUnlockedPotassiumEnemies,
  getUnlockedPotassiumUpgrades,
  isPotassiumShieldedHit,
  isPotassiumCampaignBossWave,
  isPotassiumBossWave,
  POTASSIUM_BOSS_WAVE,
  POTASSIUM_COLUMN_COUNT,
  POTASSIUM_ENDLESS_START_WAVE,
  POTASSIUM_NON_BOSS_WAVE_COUNT,
  POTASSIUM_UPGRADES,
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
      expect(row.filter((cell) => cell === 'wall' || cell === 'hardWall').length).toBeLessThanOrEqual(2);
      expect(row.filter((cell) => cell === 'deadline').length).toBeLessThanOrEqual(2);
      expect(row.some((cell) => cell === null)).toBe(true);
    });
  });

  it('escalates unlocked enemies over generated waves', () => {
    expect(getUnlockedPotassiumEnemies(1)).toEqual(['intern']);
    expect(getUnlockedPotassiumEnemies(2)).toContain('scope');
    expect(getUnlockedPotassiumEnemies(3)).toContain('wall');
    expect(getUnlockedPotassiumEnemies(5)).toContain('meeting');
    expect(getUnlockedPotassiumEnemies(5)).toContain('splitter');
    expect(getUnlockedPotassiumEnemies(7)).toContain('deadline');
    expect(getUnlockedPotassiumEnemies(8)).toContain('shield');
    expect(getUnlockedPotassiumEnemies(8)).toContain('hardWall');
  });

  it('keeps later-stage enemies out of the opening tutorial waves', () => {
    expect(getPotassiumWave(1).rows.flat()).not.toContain('splitter');
    expect(getPotassiumWave(2).rows.flat()).not.toContain('hardWall');
    expect(getPotassiumWave(4).rows.flat()).not.toContain('shield');
  });

  it('defines readable enemy helper behavior', () => {
    expect(getPotassiumEnemyHealthState(7, 10)).toBe('healthy');
    expect(getPotassiumEnemyHealthState(6, 10)).toBe('cracked');
    expect(getPotassiumEnemyHealthState(3, 10)).toBe('critical');
    expect(getPotassiumShieldSide(7, 0, 0)).toBe('left');
    expect(isPotassiumShieldedHit('bottom', 2, 8)).toBe(true);
    expect(isPotassiumShieldedHit('left', -8, 2)).toBe(true);
    expect(isPotassiumShieldedHit('right', 8, 2)).toBe(true);
    expect(isPotassiumShieldedHit('right', -8, 2)).toBe(false);
    expect(getPotassiumSplitterSpawnColumns(0)).toEqual([0, 1]);
    expect(getPotassiumSplitterSpawnColumns(2)).toEqual([2, 3]);
    expect(getPotassiumSplitterSpawnColumns(4)).toEqual([4]);
    expect(getPotassiumFireCellKey(276, 84, { left: 275, width: 450, top: 84, bottom: 504 }, 48)).toBe('0:0');
    expect(getPotassiumFireCellKey(724, 503, { left: 275, width: 450, top: 84, bottom: 504 }, 48)).toBe('4:8');
  });

  it('places splitters as two-column enemies with a reserved right lane', () => {
    [...getNonBossRows(), ...getPotassiumWave(POTASSIUM_ENDLESS_START_WAVE).rows].forEach((row) => {
      row.forEach((cell, index) => {
        if (cell !== 'splitter') return;
        expect(index).toBeLessThan(POTASSIUM_COLUMN_COUNT - 1);
        expect(row[index + 1]).toBeNull();
      });
    });
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
    expect(getPotassiumEnemyHpMultiplier(POTASSIUM_ENDLESS_START_WAVE)).toBe(1.7);
    expect(getPotassiumEnemyHpMultiplier(POTASSIUM_ENDLESS_START_WAVE + 99)).toBe(3);
    expect(getScaledPotassiumEnemyHp(2, 9)).toBe(4);
    expect(getScaledPotassiumEnemyHp(3, 9)).toBe(5);
  });

  it('keeps the campaign boss at wave 11 and generates endless rows after it', () => {
    expect(isPotassiumBossWave(POTASSIUM_NON_BOSS_WAVE_COUNT)).toBe(false);
    expect(isPotassiumBossWave(POTASSIUM_BOSS_WAVE)).toBe(true);
    expect(isPotassiumCampaignBossWave(POTASSIUM_BOSS_WAVE)).toBe(true);
    const endlessWave = getPotassiumWave(POTASSIUM_ENDLESS_START_WAVE);
    expect(isPotassiumBossWave(POTASSIUM_ENDLESS_START_WAVE)).toBe(false);
    expect(endlessWave.title).toBe('Endless Audit 1');
    expect(endlessWave.rows.every((row) => row.length === POTASSIUM_COLUMN_COUNT)).toBe(true);
    expect(endlessWave.rows.flat()).not.toContain('boss');
    endlessWave.rows.forEach((row) => {
      expect(row.filter((cell) => cell === 'wall' || cell === 'hardWall').length).toBeLessThanOrEqual(2);
      expect(row.filter((cell) => cell === 'deadline').length).toBeLessThanOrEqual(2);
      expect(row.some((cell) => cell === null)).toBe(true);
    });
  });

  it('offers generic stat drafts after all skills are maxed', () => {
    const maxedSkills = Object.fromEntries(POTASSIUM_UPGRADES.map((upgrade) => [upgrade, 2]));
    expect(getPotassiumDraftChoices(maxedSkills, {}, 12, () => 0.999)).toEqual([
      { type: 'generic', kind: 'damage' },
      { type: 'generic', kind: 'poison' }
    ]);
    expect(getPotassiumGenericUpgradeRank({ damage: 2 }, 'damage')).toBe(2);
    expect(applyPotassiumGenericDraftOption({ damage: 1 }, { type: 'generic', kind: 'damage' })).toEqual({ damage: 2 });
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
