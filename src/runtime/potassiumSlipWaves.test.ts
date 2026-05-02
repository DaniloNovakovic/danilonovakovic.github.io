import { describe, expect, it } from 'vitest';
import {
  getPotassiumWave,
  getUnlockedPotassiumEnemies,
  getUnlockedPotassiumUpgrades,
  isPotassiumBossWave
} from './potassiumSlipWaves';

describe('potassium slip waves', () => {
  it('introduces enemies incrementally', () => {
    expect(getUnlockedPotassiumEnemies(1)).toEqual(['intern']);
    expect(getUnlockedPotassiumEnemies(2)).toEqual(['intern', 'scope']);
    expect(getUnlockedPotassiumEnemies(5)).toEqual(['intern', 'scope', 'meeting', 'deadline']);
  });

  it('guarantees tutorial upgrades on early waves', () => {
    expect(getPotassiumWave(3).guaranteedUpgrade).toBe('split');
    expect(getPotassiumWave(4).guaranteedUpgrade).toBe('bomb');
    expect(getPotassiumWave(5).guaranteedUpgrade).toBe('poison');
    expect(getUnlockedPotassiumUpgrades(7)).toEqual(['split', 'bomb', 'poison', 'rubber', 'magnet']);
  });

  it('keeps the boss as the final wave', () => {
    expect(isPotassiumBossWave(7)).toBe(false);
    expect(isPotassiumBossWave(8)).toBe(true);
    expect(getPotassiumWave(99).title).toBe('Compliance Review');
  });
});
