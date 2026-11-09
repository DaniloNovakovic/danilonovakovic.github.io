import { describe, expect, it } from 'vitest';
import { ROOSTER_CHARGE } from './charge';
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
  pickStampedeSpawnKind,
  resolveStampedeMendTarget,
  type StampedeFlockKind
} from './flock';

const NONE = new Set<StampedeFlockKind>();
const ALL_SPECIALS = new Set<StampedeFlockKind>([
  'nerd', 'perfume', 'hen', 'fixer', 'situationship', 'rooster', 'bartender'
]);

describe('chick magnet flock', () => {
  it('keeps the opening as chicks', () => {
    const earliest = Math.min(STAMPEDE_HEN_AT_MS, STAMPEDE_NERD_AT_MS);
    for (const roll of [0, 0.5, 0.99]) {
      expect(pickStampedeSpawnKind(earliest - 1, {}, NONE, () => roll)).toBe('chick');
    }
  });

  it('gives each newly unlocked kind its own entrance, in unlock order', () => {
    const debuts: Array<[number, StampedeFlockKind]> = [
      [STAMPEDE_NERD_AT_MS, 'nerd'],
      [STAMPEDE_PERFUME_AT_MS, 'perfume'],
      [STAMPEDE_HEN_AT_MS, 'hen'],
      [STAMPEDE_FIXER_AT_MS, 'fixer'],
      [STAMPEDE_SITUATIONSHIP_AT_MS, 'situationship'],
      [STAMPEDE_ROOSTER_AT_MS, 'rooster'],
      [STAMPEDE_BARTENDER_AT_MS, 'bartender']
    ];
    debuts.forEach(([atMs, kind]) => {
      const introducedBefore = new Set(
        debuts.filter(([other]) => other < atMs).map(([, earlier]) => earlier)
      );
      expect(pickStampedeSpawnKind(atMs, {}, introducedBefore, () => 0.99)).toBe(kind);
    });
  });

  it('never exceeds a kind cap', () => {
    const late = STAMPEDE_BARTENDER_AT_MS + 1;
    const capped = { nerd: 2, perfume: 2, hen: 4, fixer: 1, situationship: 2, rooster: 2, bartender: 1 };
    for (let roll = 0; roll < 1; roll += 0.05) {
      expect(pickStampedeSpawnKind(late, capped, ALL_SPECIALS, () => roll)).toBe('chick');
    }
  });

  it('mixes kinds once everyone has debuted', () => {
    const late = STAMPEDE_BARTENDER_AT_MS + 1;
    const seen = new Set<StampedeFlockKind>();
    for (let roll = 0; roll < 1; roll += 0.02) {
      seen.add(pickStampedeSpawnKind(late, {}, ALL_SPECIALS, () => roll));
    }
    expect(seen.has('chick')).toBe(true);
    expect(seen.size).toBeGreaterThan(4);
  });

  it('uses the drawn body as the hitbox, with the ex as the biggest target', () => {
    expect(getStampedeFlockProfile('chick').radius).toBeLessThan(getStampedeFlockProfile('hen').radius);
    expect(getStampedeFlockProfile('ex').radius).toBeGreaterThan(getStampedeFlockProfile('rooster').radius);
    expect(getStampedeFlockProfile('ex').maxHp).toBeGreaterThan(10);
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
    expect(getStampedeFlockProfile('rooster').speed).toBeLessThan(ROOSTER_CHARGE.dashSpeed);
    expect(getStampedeFlockProfile('rooster').scrapValue).toBeGreaterThan(1);
  });
});
