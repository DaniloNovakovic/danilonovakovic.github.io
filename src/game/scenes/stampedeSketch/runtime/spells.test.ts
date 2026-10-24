import { describe, expect, it } from 'vitest';
import {
  resolveEquippedStampedeSpell,
  resolveOwnedStampedeSpells,
  resolveStampedeSpellCast
} from './spells';

describe('chick magnet attacks', () => {
  it('starts with no extra attack and keeps every one you pick', () => {
    expect(resolveOwnedStampedeSpells([])).toEqual([]);
    expect(resolveEquippedStampedeSpell([])).toBeNull();
    expect(resolveOwnedStampedeSpells(['badBreath', 'badSmell'])).toEqual([
      'badBreath',
      'badSmell'
    ]);
    expect(resolveEquippedStampedeSpell(['badBreath', 'fakeGlasses'])).toBe('fakeGlasses');
  });

  it('breathes damage only onto the chicks in front', () => {
    const cast = resolveStampedeSpellCast({
      spellId: 'badBreath',
      player: { x: 200, y: 200 },
      facing: { x: 1, y: 0 },
      candidates: [
        { id: 'ahead', x: 320, y: 210 },
        { id: 'behind', x: 80, y: 200 },
        { id: 'aside', x: 230, y: 360 }
      ]
    });

    expect(cast.hitIds).toEqual(['ahead']);
    expect(cast.bark).toBe('haah');
    expect(cast.cooldownMs).toBeGreaterThan(0);

    const meaner = resolveStampedeSpellCast({
      spellId: 'badBreath',
      rank: 2,
      player: { x: 200, y: 200 },
      facing: { x: 1, y: 0 },
      candidates: [{ id: 'farther', x: 430, y: 200 }]
    });
    expect(meaner.hitIds).toEqual(['farther']);
    expect(meaner.cooldownMs).toBeLessThan(cast.cooldownMs);
  });

  it('lets a bad smell damage every chick in the circle', () => {
    const cast = resolveStampedeSpellCast({
      spellId: 'badSmell',
      player: { x: 200, y: 200 },
      facing: { x: 1, y: 0 },
      candidates: [
        { id: 'left', x: 120, y: 200 },
        { id: 'right', x: 280, y: 200 },
        { id: 'far', x: 200, y: 420 }
      ]
    });

    expect(cast.hitIds).toEqual(['left', 'right']);
  });

  it('damages the nearest chicks when the glasses flash', () => {
    const cast = resolveStampedeSpellCast({
      spellId: 'fakeGlasses',
      player: { x: 400, y: 300 },
      facing: { x: 0, y: 1 },
      candidates: [
        { id: 'west', x: 40, y: 300 },
        { id: 'east', x: 760, y: 300 },
        { id: 'close', x: 430, y: 300 }
      ]
    });

    expect(cast.hitIds[0]).toBe('close');
    expect(cast.hitIds).toContain('west');
    expect(cast.hitIds).toContain('east');
  });
});
