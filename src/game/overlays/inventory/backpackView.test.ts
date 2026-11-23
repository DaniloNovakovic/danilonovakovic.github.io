import { describe, expect, it } from 'vitest';
import { getBackpackView } from './backpackView';

const empty = { ownedItemIds: [], equippedItemIds: [], discoveredSecretIds: [] } as const;

describe('backpack view', () => {
  it('lists every street secret, none found on a fresh save', () => {
    const view = getBackpackView(empty);
    expect(view.slots.map((slot) => slot.id)).toEqual([
      'glasses',
      'litter-clue',
      'copper-string',
      'clock-crystal',
      'battery-cell',
      'circuit'
    ]);
    expect(view.slots.every((slot) => !slot.found)).toBe(true);
    expect(view).toMatchObject({ found: 0, total: 6 });
  });

  it('tracks whether the glasses are worn', () => {
    const worn = getBackpackView({ ...empty, ownedItemIds: ['glasses'], equippedItemIds: ['glasses'] });
    const pocketed = getBackpackView({ ...empty, ownedItemIds: ['glasses'] });
    expect(worn.slots[0]).toMatchObject({ found: true, worn: true });
    expect(pocketed.slots[0]).toMatchObject({ found: true, worn: false });
  });

  it('counts the litter clue and marks parts soldered once the Circuit exists', () => {
    const view = getBackpackView({
      ownedItemIds: ['glasses', 'copper-string', 'circuit'],
      equippedItemIds: ['glasses'],
      discoveredSecretIds: ['banana-peel-clue']
    });
    expect(view.found).toBe(4);
    expect(view.slots.find((slot) => slot.id === 'copper-string')).toMatchObject({ found: true, soldered: true });
    expect(view.slots.find((slot) => slot.id === 'clock-crystal')).toMatchObject({ found: false, soldered: false });
  });
});
