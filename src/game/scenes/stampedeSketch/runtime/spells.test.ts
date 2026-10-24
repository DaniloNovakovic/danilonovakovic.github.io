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

  it('leaves bad breath damage to the orbiting stink circles', () => {
    const cast = resolveStampedeSpellCast({
      spellId: 'badBreath',
      player: { x: 200, y: 200 },
      facing: { x: 1, y: 0 },
      candidates: [
        { id: 'ahead', x: 320, y: 210 },
        { id: 'behind', x: 80, y: 200 }
      ]
    });

    expect(cast.hitIds).toEqual([]);
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

  it('lets a perfume chick ignore the smell', () => {
    const cast = resolveStampedeSpellCast({
      spellId: 'badSmell',
      player: { x: 200, y: 200 },
      facing: { x: 1, y: 0 },
      candidates: [
        { id: 'plain', x: 250, y: 200 },
        { id: 'cloud', x: 160, y: 200, kind: 'perfume' }
      ]
    });

    expect(cast.hitIds).toEqual(['plain']);
    expect(cast.resistedIds).toEqual(['cloud']);
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
    expect(cast.hitIds).toHaveLength(2);
    expect(cast.hitIds).not.toContain('east');
  });

  it('lets nerds ignore fake glasses until the prescription', () => {
    const candidates = [
      { id: 'nerd', x: 430, y: 300, kind: 'nerd' as const },
      { id: 'chick', x: 470, y: 300 }
    ];
    const shrugged = resolveStampedeSpellCast({
      spellId: 'fakeGlasses',
      player: { x: 400, y: 300 },
      facing: { x: 1, y: 0 },
      candidates
    });
    const prescription = resolveStampedeSpellCast({
      spellId: 'fakeGlasses',
      rank: 2,
      player: { x: 400, y: 300 },
      facing: { x: 1, y: 0 },
      candidates
    });

    expect(shrugged.hitIds).toEqual(['chick']);
    expect(shrugged.resistedIds).toEqual(['nerd']);
    expect(prescription.hitIds).toEqual(['nerd', 'chick']);
  });
});
