import { describe, expect, it } from 'vitest';
import {
  getPotassiumWave,
  getUnlockedPotassiumModifiers,
  getUnlockedPotassiumEnemies,
  getUnlockedPotassiumUpgrades,
  isPotassiumBossWave
} from './potassiumSlipWaves';

describe('potassium slip waves', () => {
  it('introduces enemies incrementally', () => {
    expect(getUnlockedPotassiumEnemies(1)).toEqual(['intern']);
    expect(getUnlockedPotassiumEnemies(2)).toEqual(['intern', 'scope']);
    expect(getUnlockedPotassiumEnemies(4)).toEqual(['intern', 'scope', 'wall']);
    expect(getUnlockedPotassiumEnemies(7)).toEqual(['intern', 'scope', 'wall', 'meeting', 'deadline']);
  });

  it('introduces permanent banana modifiers before split chaos', () => {
    expect(getPotassiumWave(3).modifierUnlock).toBe('poison');
    expect(getPotassiumWave(5).modifierUnlock).toBe('bomb');
    expect(getUnlockedPotassiumModifiers(1)).toEqual(['normal']);
    expect(getUnlockedPotassiumModifiers(5)).toEqual(['normal', 'poison', 'bomb']);
  });

  it('keeps split as a temporary tutorial pickup', () => {
    expect(getPotassiumWave(6).guaranteedUpgrade).toBe('split');
    expect(getUnlockedPotassiumUpgrades(8)).toEqual(['split', 'rubber', 'magnet']);
  });

  it('keeps the boss as the final wave', () => {
    expect(isPotassiumBossWave(8)).toBe(false);
    expect(isPotassiumBossWave(9)).toBe(true);
    expect(getPotassiumWave(99).title).toBe('Compliance Review');
  });
});
