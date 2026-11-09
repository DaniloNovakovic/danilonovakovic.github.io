import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_SCRAP_COLLECTION_RADIUS,
  applyStampedeUpgradeChoice,
  attractStampedePickups,
  collectStampedePickups,
  createStampedeProgressionState,
  grantStampedeStartingWeapon,
  openStampedeDraftIfReady,
  spawnStampedeGiftPickup,
  spawnStampedeHeartPickup,
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
    expect(started.scrapGoal).toBe(8);

    const meaner = applyStampedeUpgradeChoice(started, 'badSelfie');
    expect(meaner.upgradedWeaponIds).toEqual(['badSelfie']);
    expect(meaner.draftsTaken).toBe(1);
    expect(meaner.scrapGoal).toBe(20);
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

  it('lets a heart heal without counting as scraps', () => {
    const started = spawnStampedeHeartPickup(
      createStampedeProgressionState({ scrapsCollected: 3 }),
      { x: 200, y: 200 },
      () => 0
    );
    const frame = collectStampedePickups(started, { x: started.pickups[0]!.x, y: started.pickups[0]!.y });

    expect(frame.heartsCollected).toBe(1);
    expect(frame.state.scrapsCollected).toBe(3);
    expect(frame.state.pickups).toHaveLength(0);
  });

  it('grows one spare heart and keeps catch breath from sticking', () => {
    const feather = applyStampedeUpgradeChoice(
      createStampedeProgressionState({ appliedUpgradeIds: ['badBreath'] }),
      'spareFeather'
    );
    const again = applyStampedeUpgradeChoice(feather, 'catchBreath');

    expect(feather.bonusHearts).toBe(1);
    expect(again.bonusHearts).toBe(1);
    expect(again.appliedUpgradeIds).toEqual(['badBreath']);
  });

  it('pulls nearby scraps toward the player and keeps them homing', () => {
    const state = spawnStampedePickupsFromClearedMarks(
      createStampedeProgressionState(),
      [{ id: 'near', x: 160, y: 100 }, { id: 'far', x: 900, y: 100 }]
    );
    const pulled = attractStampedePickups(state, { x: 100, y: 100 }, 50);

    expect(pulled.pickups[0]!.x).toBeLessThan(160);
    expect(pulled.pickups[0]!.homing).toBe(true);
    expect(pulled.pickups[1]!.x).toBe(900);
    expect(attractStampedePickups(createStampedeProgressionState(), { x: 0, y: 0 }, 16))
      .toEqual(createStampedeProgressionState());
  });

  it('pulls every scrap during a magnet gift but never moves gifts', () => {
    const scraps = spawnStampedePickupsFromClearedMarks(
      createStampedeProgressionState(),
      [{ id: 'far', x: 900, y: 100 }]
    );
    const state = spawnStampedeGiftPickup(scraps, { x: 600, y: 100 });
    const pulled = attractStampedePickups(state, { x: 100, y: 100 }, 50, { pullAll: true });

    expect(pulled.pickups[0]!.x).toBeLessThan(900);
    expect(pulled.pickups[1]).toEqual(state.pickups[1]);

    const frame = collectStampedePickups(state, { x: 600, y: 100 });
    expect(frame.giftsCollected).toBe(1);
    expect(frame.state.scrapsCollected).toBe(0);
  });

  it('gives a free twist without spending the scrap goal or draft clock', () => {
    const state = createStampedeProgressionState({
      appliedUpgradeIds: ['badBreath'],
      scrapsCollected: 2,
      scrapGoal: 5,
      draftsTaken: 1,
      nextDraftAtMs: 30_000
    });
    const free = applyStampedeUpgradeChoice(state, 'breathWide', 20_000, { free: true });

    expect(free.appliedUpgradeIds).toContain('breathWide');
    expect(free.scrapGoal).toBe(5);
    expect(free.draftsTaken).toBe(1);
    expect(free.nextDraftAtMs).toBe(30_000);
    expect(free.upgradeDraftStatus).toBe(state.upgradeDraftStatus);
  });
});
