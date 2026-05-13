import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_SCRAP_COLLECTION_RADIUS,
  applyStampedeUpgradeChoice,
  collectStampedePickups,
  createStampedeProgressionState,
  spawnStampedePickupsFromClearedMarks
} from './progression';

describe('stampede progression', () => {
  it('spawns scrap pickups from cleared marks', () => {
    const state = spawnStampedePickupsFromClearedMarks(
      createStampedeProgressionState(),
      [
        { id: 'mark-a', x: 120, y: 180 },
        { id: 'mark-b', x: 180, y: 220 }
      ]
    );

    expect(state.pickups).toMatchObject([
      { id: 'scrap-1', sourceId: 'mark-a', x: 120, y: 180, value: 1 },
      { id: 'scrap-2', sourceId: 'mark-b', x: 180, y: 220, value: 1 }
    ]);
    expect(state.nextPickupIndex).toBe(3);
  });

  it('collects nearby scraps and leaves distant scraps active', () => {
    const spawned = spawnStampedePickupsFromClearedMarks(
      createStampedeProgressionState(),
      [
        { id: 'near', x: 100, y: 100 },
        { id: 'far', x: 260, y: 100 }
      ]
    );
    const frame = collectStampedePickups(spawned, {
      x: 100 + STAMPEDE_SCRAP_COLLECTION_RADIUS,
      y: 100
    });

    expect(frame.collected.map((pickup) => pickup.sourceId)).toEqual(['near']);
    expect(frame.state.pickups.map((pickup) => pickup.sourceId)).toEqual(['far']);
    expect(frame.state.scrapsCollected).toBe(1);
  });

  it('opens the upgrade draft once at the first scrap threshold', () => {
    const spawned = spawnStampedePickupsFromClearedMarks(
      createStampedeProgressionState({ scrapGoal: 2 }),
      [
        { id: 'mark-a', x: 100, y: 100 },
        { id: 'mark-b', x: 106, y: 100 }
      ]
    );
    const collected = collectStampedePickups(spawned, { x: 100, y: 100 });

    expect(collected.state.scrapsCollected).toBe(2);
    expect(collected.state.upgradeDraftStatus).toBe('pending');

    const chosen = applyStampedeUpgradeChoice(collected.state, 'quickPencil');
    const withMoreScraps = spawnStampedePickupsFromClearedMarks(chosen, [
      { id: 'mark-c', x: 100, y: 100 },
      { id: 'mark-d', x: 104, y: 100 }
    ]);
    const collectedAgain = collectStampedePickups(withMoreScraps, { x: 100, y: 100 });

    expect(collectedAgain.state.scrapsCollected).toBe(4);
    expect(collectedAgain.state.upgradeDraftStatus).toBe('chosen');
    expect(collectedAgain.state.appliedUpgradeIds).toEqual(['quickPencil']);
  });
});
