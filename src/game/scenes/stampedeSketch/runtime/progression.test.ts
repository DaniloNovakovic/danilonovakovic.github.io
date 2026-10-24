import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_SCRAP_COLLECTION_RADIUS,
  applyStampedeUpgradeChoice,
  collectStampedePickups,
  createStampedeProgressionState,
  grantStampedeStartingWeapon,
  openStampedeDraftIfReady,
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

  it('opens another attack draft at the next scrap threshold', () => {
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

    const chosen = applyStampedeUpgradeChoice(collected.state, 'badBreath');
    expect(chosen.upgradeDraftStatus).toBe('none');
    expect(chosen.appliedUpgradeIds).toEqual(['badBreath']);
    expect(chosen.scrapGoal).toBeGreaterThan(collected.state.scrapsCollected);

    const withMoreScraps = spawnStampedePickupsFromClearedMarks(
      { ...chosen, scrapsCollected: chosen.scrapGoal - 1 },
      [{ id: 'mark-c', x: 100, y: 100 }]
    );
    const collectedAgain = collectStampedePickups(withMoreScraps, { x: 100, y: 100 });

    expect(collectedAgain.state.upgradeDraftStatus).toBe('pending');
    expect(collectedAgain.state.appliedUpgradeIds).toEqual(['badBreath']);
  });

  it('keeps the first scrap goal after the starting weapon', () => {
    const started = grantStampedeStartingWeapon(
      createStampedeProgressionState(),
      'badSelfie'
    );

    expect(started.appliedUpgradeIds).toEqual(['badSelfie']);
    expect(started.draftsTaken).toBe(0);
    expect(started.scrapGoal).toBe(16);

    const meaner = applyStampedeUpgradeChoice(started, 'badSelfie');
    expect(meaner.upgradedWeaponIds).toEqual(['badSelfie']);
    expect(meaner.draftsTaken).toBe(1);
    expect(meaner.scrapGoal).toBe(40);
    expect(meaner.nextDraftAtMs).toBeGreaterThan(0);
  });

  it('holds a banked draft until the gap has passed', () => {
    const spawned = spawnStampedePickupsFromClearedMarks(
      createStampedeProgressionState({ scrapGoal: 1, nextDraftAtMs: 18_000 }),
      [{ id: 'mark-a', x: 100, y: 100 }]
    );
    const early = collectStampedePickups(spawned, { x: 100, y: 100 }, { elapsedMs: 4_000 });

    expect(early.state.scrapsCollected).toBe(1);
    expect(early.state.upgradeDraftStatus).toBe('none');
    expect(openStampedeDraftIfReady(early.state, 18_000).upgradeDraftStatus).toBe('pending');
  });
});
