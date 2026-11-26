// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import { DEBUGGING_TOOLS_ITEM_ID, SCREEN_DESTROYER_TOTAL_HITS, STREET_FIGHT_TOTAL_SMASHES } from '@/game/core/console';
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
    expect(state.screenDamage.cracks).toHaveLength(0);
    expect(state.activeSceneId).toBe(OVERWORLD_SCENE_ID);
    expect(getSceneStartResume(PHASER_SCENE_KEYS.overworld)?.x).toBe(280);
  });

  it('screen destroyer: the fight is won', () => {
    applyOutOfBoundsCheckpoint(checkpoint('destroyer'));
    const { screenDamage } = bridgeStore.getState();
    expect(screenDamage.cracks).toHaveLength(STREET_FIGHT_TOTAL_SMASHES);
    expect(screenDamage.dents).toHaveLength(0);
  });

  it('unplugged: every layer is gone', () => {
    applyOutOfBoundsCheckpoint(checkpoint('unplugged'));
    expect(bridgeStore.getState().screenDamage.dents).toHaveLength(SCREEN_DESTROYER_TOTAL_HITS);
  });

  it('applies ?oob= once and drops it from the URL', () => {
    window.history.replaceState({}, '', '/?mode=interactive&oob=destroyer');
    applyOutOfBoundsCheckpointFromUrl();
    expect(bridgeStore.getState().screenDamage.cracks).toHaveLength(STREET_FIGHT_TOTAL_SMASHES);
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
