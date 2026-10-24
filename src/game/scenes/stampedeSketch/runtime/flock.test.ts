import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_HEN_AT_MS,
  STAMPEDE_ROOSTER_AT_MS,
  getStampedeFlockProfile,
  resolveStampedeFlockKind
} from './flock';

describe('chick magnet flock', () => {
  it('keeps the opening as chicks', () => {
    expect(resolveStampedeFlockKind(4, STAMPEDE_HEN_AT_MS - 1)).toBe('chick');
    expect(resolveStampedeFlockKind(2, STAMPEDE_ROOSTER_AT_MS - 1)).toBe('chick');
  });

  it('sends hens in before the rooster wants a fight', () => {
    expect(resolveStampedeFlockKind(4, STAMPEDE_HEN_AT_MS)).toBe('hen');
    expect(resolveStampedeFlockKind(1, STAMPEDE_HEN_AT_MS)).toBe('chick');
    expect(resolveStampedeFlockKind(2, STAMPEDE_ROOSTER_AT_MS)).toBe('rooster');
    expect(resolveStampedeFlockKind(9, STAMPEDE_ROOSTER_AT_MS + 10_000)).toBe('rooster');
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
