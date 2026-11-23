import { beforeEach, describe, expect, it } from 'vitest';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import { HOBBIES_SCENE_ID } from '@/game/scenes/sceneIds';
import { canOpenBackpack } from './useBackpack';

describe('backpack availability', () => {
  beforeEach(() => {
    bridgeActions.returnToOverworld();
    bridgeActions.closeOverlay();
    bridgeActions.setSceneLoading(null);
    bridgeActions.resetProgress();
  });

  it('stays hidden until the first find', () => {
    expect(canOpenBackpack(bridgeStore.getState())).toBe(false);
    bridgeActions.collectGlasses();
    expect(canOpenBackpack(bridgeStore.getState())).toBe(true);
  });

  it('only lives on the street', () => {
    bridgeActions.collectGlasses();
    bridgeActions.enterScene(HOBBIES_SCENE_ID);
    expect(canOpenBackpack(bridgeStore.getState())).toBe(false);
  });
});
