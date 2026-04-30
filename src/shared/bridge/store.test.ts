import { describe, it, expect, beforeEach } from 'vitest';
import {
  bridgeActions,
  bridgeStore,
  getTouchState,
  isItemEquipped,
  isItemOwned,
  isSecretDiscovered
} from './store';
import { GameState } from '../../runtime/gameState';

function resetBridge() {
  bridgeActions.closeActiveOverlay();
  bridgeActions.resetProgress();
  bridgeActions.resetTouch();
}

describe('bridgeStore', () => {
  beforeEach(() => {
    resetBridge();
  });

  describe('pause derivation', () => {
    it('is false when exploring', () => {
      expect(bridgeStore.getState().isPaused).toBe(false);
    });

    it('is true when a REACT_OVERLAY mini-game is active', () => {
      bridgeActions.requestInteraction('profile');
      expect(bridgeStore.getState().isPaused).toBe(true);
    });

    it('is false when a PHASER_SCENE mini-game (hobbies) is active', () => {
      bridgeActions.requestInteraction('hobbies');
      expect(bridgeStore.getState().isPaused).toBe(false);
    });
  });

  describe('overlay transitions', () => {
    it('opens an overlay and sets activeMiniGameId', () => {
      bridgeActions.requestInteraction('projects');
      const s = bridgeStore.getState();
      expect(s.status).toBe(GameState.IN_MINIGAME);
      expect(s.activeMiniGameId).toBe('projects');
    });

    it('closeActiveOverlay returns to exploring', () => {
      bridgeActions.requestInteraction('profile');
      bridgeActions.closeActiveOverlay();
      const s = bridgeStore.getState();
      expect(s.status).toBe(GameState.EXPLORING);
      expect(s.activeMiniGameId).toBeNull();
      expect(s.isPaused).toBe(false);
    });

    it('does not emit if state is unchanged', () => {
      let calls = 0;
      const unsub = bridgeStore.subscribe(() => { calls++; });
      bridgeActions.closeActiveOverlay(); // already exploring — no change
      unsub();
      expect(calls).toBe(0);
    });
  });

  describe('progress state', () => {
    it('starts without glasses', () => {
      expect(bridgeStore.getState().progress.hasGlasses).toBe(false);
      expect(bridgeStore.getState().progress.discoveredSecretIds).toEqual([]);
      expect(bridgeStore.getState().inventory.ownedItemIds).toEqual([]);
      expect(bridgeStore.getState().equipment.equippedItemIds).toEqual([]);
    });

    it('collectGlasses unlocks the Lens', () => {
      bridgeActions.collectGlasses();
      expect(bridgeStore.getState().progress.hasGlasses).toBe(true);
      expect(bridgeStore.getState().inventory.ownedItemIds).toContain('glasses');
      expect(bridgeStore.getState().equipment.equippedItemIds).toContain('glasses');
      expect(isItemOwned('glasses')).toBe(true);
      expect(isItemEquipped('glasses')).toBe(true);
    });

    it('resetProgress clears glasses progress', () => {
      bridgeActions.collectGlasses();
      bridgeActions.resetProgress();
      expect(bridgeStore.getState().progress.hasGlasses).toBe(false);
      expect(bridgeStore.getState().progress.discoveredSecretIds).toEqual([]);
      expect(bridgeStore.getState().inventory.ownedItemIds).toEqual([]);
      expect(bridgeStore.getState().equipment.equippedItemIds).toEqual([]);
    });

    it('does not emit when glasses are already collected', () => {
      bridgeActions.collectGlasses();
      let calls = 0;
      const unsub = bridgeStore.subscribe(() => { calls++; });
      bridgeActions.collectGlasses();
      unsub();
      expect(calls).toBe(0);
    });

    it('tracks discovered secrets until progress reset', () => {
      bridgeActions.discoverSecret('banana-peel-clue');
      expect(bridgeStore.getState().progress.discoveredSecretIds).toEqual(['banana-peel-clue']);
      expect(isSecretDiscovered('banana-peel-clue')).toBe(true);
      bridgeActions.resetProgress();
      expect(bridgeStore.getState().progress.discoveredSecretIds).toEqual([]);
      expect(isSecretDiscovered('banana-peel-clue')).toBe(false);
    });

    it('does not emit when a secret is already discovered', () => {
      bridgeActions.discoverSecret('banana-peel-clue');
      let calls = 0;
      const unsub = bridgeStore.subscribe(() => { calls++; });
      bridgeActions.discoverSecret('banana-peel-clue');
      unsub();
      expect(calls).toBe(0);
    });
  });

  describe('inventory equipment', () => {
    it('does not equip item that is not owned', () => {
      bridgeActions.equipItem('glasses');
      expect(bridgeStore.getState().equipment.equippedItemIds).toEqual([]);
    });

    it('collectItem can own without auto-equip', () => {
      bridgeActions.collectItem('glasses');
      const s = bridgeStore.getState();
      expect(s.inventory.ownedItemIds).toContain('glasses');
      expect(s.equipment.equippedItemIds).toEqual([]);
      expect(s.progress.hasGlasses).toBe(true);
    });

    it('toggleItemEquipped unequips and re-equips owned item', () => {
      bridgeActions.collectGlasses();
      bridgeActions.toggleItemEquipped('glasses');
      expect(bridgeStore.getState().equipment.equippedItemIds).toEqual([]);
      bridgeActions.toggleItemEquipped('glasses');
      expect(bridgeStore.getState().equipment.equippedItemIds).toContain('glasses');
    });
  });

  describe('touch one-shots', () => {
    it('consumeTouchOneShots clears jumpQueued after reading', () => {
      bridgeActions.queueJump();
      expect(bridgeStore.getState().touch.jumpQueued).toBe(true);
      const shots = bridgeActions.consumeTouchOneShots();
      expect(shots.jumpQueued).toBe(true);
      expect(bridgeStore.getState().touch.jumpQueued).toBe(false);
    });

    it('consumeTouchOneShots clears interactTap after reading', () => {
      bridgeActions.tapInteract();
      const shots = bridgeActions.consumeTouchOneShots();
      expect(shots.interactTap).toBe(true);
      expect(bridgeStore.getState().touch.interactTap).toBe(false);
    });

    it('consumeTouchOneShots is a no-op when nothing is queued', () => {
      let calls = 0;
      const unsub = bridgeStore.subscribe(() => { calls++; });
      bridgeActions.consumeTouchOneShots();
      unsub();
      expect(calls).toBe(0);
    });
  });

  describe('directional touch state', () => {
    it('sets and clears left/right', () => {
      bridgeActions.setTouchDirectional('left', 0.5);
      expect(bridgeStore.getState().touch.left).toBe(0.5);
      bridgeActions.setTouchDirectional('left', 0);
      expect(bridgeStore.getState().touch.left).toBe(0);
    });

    it('resetTouch zeroes everything', () => {
      bridgeActions.setTouchDirectional('right', 1.0);
      bridgeActions.queueJump();
      bridgeActions.resetTouch();
      const t = bridgeStore.getState().touch;
      expect(t.left).toBe(0);
      expect(t.right).toBe(0);
      expect(t.jumpQueued).toBe(false);
      expect(t.interactTap).toBe(false);
      expect(getTouchState()).toEqual(t);
    });
  });
});
