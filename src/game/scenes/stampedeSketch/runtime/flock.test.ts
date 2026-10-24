import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_BARTENDER_AT_MS,
  STAMPEDE_FIXER_AT_MS,
  STAMPEDE_HEN_AT_MS,
  STAMPEDE_NERD_AT_MS,
  STAMPEDE_PERFUME_AT_MS,
  STAMPEDE_ROOSTER_AT_MS,
  STAMPEDE_SITUATIONSHIP_AT_MS,
  getStampedeFlockProfile,
  isStampedeWeaponImmune,
  resolveStampedeFlockKind,
  resolveStampedeMendTarget
} from './flock';

describe('chick magnet flock', () => {
  it('keeps the opening as chicks', () => {
    expect(resolveStampedeFlockKind(4, STAMPEDE_HEN_AT_MS - 1)).toBe('chick');
    expect(resolveStampedeFlockKind(2, STAMPEDE_ROOSTER_AT_MS - 1)).toBe('chick');
  });

  it('sends hens in before the rooster wants a fight', () => {
    expect(resolveStampedeFlockKind(4, STAMPEDE_HEN_AT_MS)).toBe('hen');
    expect(resolveStampedeFlockKind(0, STAMPEDE_HEN_AT_MS)).toBe('chick');
    expect(resolveStampedeFlockKind(2, STAMPEDE_ROOSTER_AT_MS)).toBe('rooster');
    expect(resolveStampedeFlockKind(9, STAMPEDE_ROOSTER_AT_MS + 10_000)).toBe('rooster');
  });

  it('sends dating stereotypes in before the bartender opens', () => {
    expect(resolveStampedeFlockKind(1, STAMPEDE_NERD_AT_MS)).toBe('nerd');
    expect(resolveStampedeFlockKind(6, STAMPEDE_PERFUME_AT_MS)).toBe('perfume');
    expect(resolveStampedeFlockKind(8, STAMPEDE_FIXER_AT_MS)).toBe('fixer');
    expect(resolveStampedeFlockKind(3, STAMPEDE_SITUATIONSHIP_AT_MS)).toBe('situationship');
    expect(resolveStampedeFlockKind(5, STAMPEDE_BARTENDER_AT_MS - 1)).toBe('chick');
    expect(resolveStampedeFlockKind(5, STAMPEDE_BARTENDER_AT_MS)).toBe('bartender');
  });

  it('lets each stereotype shrug off the weapon that matches the bit', () => {
    expect(isStampedeWeaponImmune('nerd', 'fakeGlasses', 1)).toBe(true);
    expect(isStampedeWeaponImmune('nerd', 'fakeGlasses', 2)).toBe(false);
    expect(isStampedeWeaponImmune('perfume', 'badSmell', 2)).toBe(true);
    expect(isStampedeWeaponImmune('perfume', 'badBreath', 1)).toBe(false);
    expect(isStampedeWeaponImmune('situationship', 'badSelfie', 2)).toBe(true);
    expect(isStampedeWeaponImmune('chick', 'fakeGlasses', 1)).toBe(false);
  });

  it('lets the fixer mend the nearest wounded bird', () => {
    expect(resolveStampedeMendTarget(
      { id: 'fixer', x: 0, y: 0 },
      [
        { id: 'far', x: 80, y: 0, hp: 1, maxHp: 2, alive: true },
        { id: 'near', x: 20, y: 0, hp: 1, maxHp: 3, alive: true },
        { id: 'full', x: 5, y: 0, hp: 2, maxHp: 2, alive: true },
        { id: 'down', x: 4, y: 0, hp: 0, maxHp: 2, alive: false }
      ]
    )).toBe('near');
  });

  it('makes the rooster take more hits than a chick', () => {
    expect(getStampedeFlockProfile('chick').maxHp).toBe(1);
    expect(getStampedeFlockProfile('hen').maxHp).toBe(2);
    expect(getStampedeFlockProfile('rooster').maxHp).toBeGreaterThan(
      getStampedeFlockProfile('hen').maxHp
    );
    expect(getStampedeFlockProfile('rooster').speed).toBeGreaterThan(
      getStampedeFlockProfile('chick').speed
    );
    expect(getStampedeFlockProfile('rooster').scrapValue).toBeGreaterThan(1);
  });
});
