// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import { DEBUGGING_TOOLS_ITEM_ID, SCREEN_DESTROYER_TOTAL_HITS, observeScreenDestroyer } from '@/game/core/console';
import { HOBBIES_SCENE_ID, OVERWORLD_SCENE_ID, PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import { getSceneStartResume } from '@/game/sharedSceneRuntime/sceneResumePolicy';
import {
  applyOutOfBoundsCheckpoint,
  applyOutOfBoundsCheckpointFromUrl,
  findOutOfBoundsCheckpoint,
  outOfBoundsCheckpointUrl
} from './outOfBoundsCheckpoints';

function checkpoint(id: string) {
  const found = findOutOfBoundsCheckpoint(id);
  if (!found) throw new Error(`no checkpoint ${id}`);
  return found;
}

describe('Out of Bounds dev checkpoints', () => {
  beforeEach(() => {
    bridgeActions.resetProgress();
    bridgeActions.enterScene(OVERWORLD_SCENE_ID);
    window.history.replaceState({}, '', '/');
  });

  it('pickup: fresh progress, Hobbies, placed by the toolbox', () => {
    bridgeActions.collectItem('glasses');
    applyOutOfBoundsCheckpoint(checkpoint('pickup'));
    const state = bridgeStore.getState();
    expect(state.inventory.ownedItemIds).toEqual([]);
    expect(state.activeSceneId).toBe(HOBBIES_SCENE_ID);
    expect(getSceneStartResume(PHASER_SCENE_KEYS.hobbies)?.x).toBeLessThan(-5000);
  });

  it('street fight: owns the kit, no damage yet, up the hatch', () => {
    applyOutOfBoundsCheckpoint(checkpoint('street'));
    const state = bridgeStore.getState();
    expect(state.inventory.ownedItemIds).toEqual([DEBUGGING_TOOLS_ITEM_ID]);
    expect(state.screenDamage).toEqual({ smashes: 0, cardCracks: [], cracks: [] });
    expect(state.activeSceneId).toBe(OVERWORLD_SCENE_ID);
    expect(getSceneStartResume(PHASER_SCENE_KEYS.overworld)?.x).toBe(280);
  });

  it('endless horde: the chick is down, nothing on the page hit yet', () => {
    applyOutOfBoundsCheckpoint(checkpoint('destroyer'));
    const { screenDamage } = bridgeStore.getState();
    expect(screenDamage).toEqual({ smashes: 1, cardCracks: [], cracks: [] });
    expect(observeScreenDestroyer({ screenSmashes: 1 })).toMatchObject({ hits: 0, breaking: 'labels' });
  });

  it('screen: the street is gone, the card is next', () => {
    applyOutOfBoundsCheckpoint(checkpoint('screen'));
    const { screenDamage } = bridgeStore.getState();
    expect(observeScreenDestroyer({ screenSmashes: screenDamage.smashes })).toMatchObject({
      breaking: 'card',
      onTheScreen: true
    });
    expect(screenDamage.cardCracks).toHaveLength(0);
  });

  it('unplugged: every layer is gone, the card and the glass cracked', () => {
    applyOutOfBoundsCheckpoint(checkpoint('unplugged'));
    const { screenDamage } = bridgeStore.getState();
    expect(screenDamage.smashes).toBe(1 + SCREEN_DESTROYER_TOTAL_HITS);
    expect(screenDamage.cardCracks).toHaveLength(4);
    expect(screenDamage.cracks).toHaveLength(6);
    expect(observeScreenDestroyer({ screenSmashes: screenDamage.smashes })?.blackout).toBe(true);
  });

  it('applies ?oob= once and drops it from the URL', () => {
    window.history.replaceState({}, '', '/?mode=interactive&oob=destroyer');
    applyOutOfBoundsCheckpointFromUrl();
    expect(bridgeStore.getState().screenDamage.smashes).toBe(1);
    expect(window.location.search).toBe('?mode=interactive');
  });

  it('ignores an unknown checkpoint', () => {
    window.history.replaceState({}, '', '/?mode=interactive&oob=nope');
    applyOutOfBoundsCheckpointFromUrl();
    expect(bridgeStore.getState().inventory.ownedItemIds).toEqual([]);
  });

  it('builds a reload URL into the interactive app', () => {
    const url = new URL(outOfBoundsCheckpointUrl('unplugged', 'http://localhost:5173/?mode=static'));
    expect(url.searchParams.get('mode')).toBe('interactive');
    expect(url.searchParams.get('oob')).toBe('unplugged');
  });
});
