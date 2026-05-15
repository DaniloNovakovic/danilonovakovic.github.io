import { describe, it, expect, beforeEach } from 'vitest';
import {
  bridgeActions,
  bridgeStore,
  getTouchState,
  hasRidgeManualPage,
  hasRidgeStamp,
  isItemEquipped,
  isItemOwned,
  isRidgeShortcutUnlocked,
  isSecretDiscovered
} from './store';
import {
  OVERWORLD_SCENE_ID,
  POTASSIUM_SCENE_ID,
  RIDGE_SCENE_ID,
  STAMPEDE_SKETCH_SCENE_ID
} from '@/game/scenes/sceneIds';

function resetBridge() {
  bridgeActions.returnToOverworld();
  bridgeActions.closeOverlay();
  bridgeActions.setSceneLoading(null);
  bridgeActions.resetProgress();
  bridgeActions.resetTouch();
}

describe('bridgeStore', () => {
  beforeEach(() => {
    resetBridge();
  });

  describe('pause derivation', () => {
    it('is false when exploring without overlays', () => {
      expect(bridgeStore.getState().activeSceneId).toBe(OVERWORLD_SCENE_ID);
      expect(bridgeStore.getState().activeOverlayId).toBeNull();
      expect(bridgeStore.getState().isPaused).toBe(false);
    });

    it('is true when an overlay is active', () => {
      bridgeActions.openOverlay('profile');
      expect(bridgeStore.getState().activeOverlay).toMatchObject({
        id: 'profile',
        closeOnEscape: true,
        closeOnBackdrop: true
      });
      expect(bridgeStore.getState().activeOverlayId).toBe('profile');
      expect(bridgeStore.getState().isPaused).toBe(true);
    });

    it('is false when a Phaser scene is active without overlays', () => {
      bridgeActions.enterScene('hobbies');
      expect(bridgeStore.getState().activeSceneId).toBe('hobbies');
      expect(bridgeStore.getState().isPaused).toBe(false);
    });

    it('pauses temporarily while a Phaser scene is loading', () => {
      bridgeActions.enterScene('hobbies');
      bridgeActions.setSceneLoading('hobbies');
      expect(bridgeStore.getState().isPaused).toBe(true);
      expect(bridgeStore.getState().loadingSceneId).toBe('hobbies');

      bridgeActions.setSceneLoading(null);
      expect(bridgeStore.getState().isPaused).toBe(false);
      expect(bridgeStore.getState().loadingSceneId).toBeNull();
    });

    it('keeps loading-derived pause after an overlay closes', () => {
      bridgeActions.enterScene('hobbies');
      bridgeActions.setSceneLoading('hobbies');
      bridgeActions.openOverlay('devSwitcher');
      bridgeActions.closeOverlay();

      expect(bridgeStore.getState().activeOverlayId).toBeNull();
      expect(bridgeStore.getState().loadingSceneId).toBe('hobbies');
      expect(bridgeStore.getState().isPaused).toBe(true);
    });
  });

  describe('scene and overlay transitions', () => {
    it('opens an overlay without changing the active scene', () => {
      bridgeActions.enterScene('hobbies');
      bridgeActions.openOverlay('art');
      const s = bridgeStore.getState();
      expect(s.activeSceneId).toBe('hobbies');
      expect(s.activeOverlayId).toBe('art');
      expect(s.isPaused).toBe(true);
    });

    it('can open an overlay with an explicit return scene', () => {
      bridgeActions.openOverlay('games', { returnToSceneId: 'basement' });
      const s = bridgeStore.getState();
      expect(s.activeSceneId).toBe('basement');
      expect(s.activeOverlay).toMatchObject({
        id: 'games',
        returnToSceneId: 'basement',
        closeOnEscape: true,
        closeOnBackdrop: true
      });
      expect(s.activeOverlayId).toBe('games');
    });

    it('stores overlay params and close policy from the request', () => {
      const params = { source: 'test' };
      bridgeActions.openOverlay('profile', {
        params,
        closeOnEscape: false,
        closeOnBackdrop: false
      });
      const s = bridgeStore.getState();
      expect(s.activeOverlay).toEqual({
        id: 'profile',
        params,
        returnToSceneId: undefined,
        closeOnEscape: false,
        closeOnBackdrop: false
      });
      expect(s.activeOverlayId).toBe('profile');
      expect(s.isPaused).toBe(true);
    });

    it('closeOverlay keeps the active scene and unpauses', () => {
      bridgeActions.enterScene('basement');
      bridgeActions.openOverlay('games');
      bridgeActions.closeOverlay();
      const s = bridgeStore.getState();
      expect(s.activeSceneId).toBe('basement');
      expect(s.activeOverlay).toBeNull();
      expect(s.activeOverlayId).toBeNull();
      expect(s.isPaused).toBe(false);
    });

    it('returnToOverworld closes overlays and clears loading', () => {
      bridgeActions.enterScene('potassium');
      bridgeActions.openOverlay('inventory');
      bridgeActions.setSceneLoading('potassium');
      bridgeActions.returnToOverworld();
      const s = bridgeStore.getState();
      expect(s.activeSceneId).toBe(OVERWORLD_SCENE_ID);
      expect(s.activeOverlayId).toBeNull();
      expect(s.loadingSceneId).toBeNull();
      expect(s.isPaused).toBe(false);
    });

    it('clears scene hint text when changing scenes or overlays', () => {
      bridgeActions.setSceneHintText('Boss wave');
      expect(bridgeStore.getState().sceneHintText).toBe('Boss wave');
      bridgeActions.enterScene('potassium');
      expect(bridgeStore.getState().sceneHintText).toBeNull();
      bridgeActions.setSceneHintText('Wave clear');
      bridgeActions.openOverlay('inventory');
      expect(bridgeStore.getState().sceneHintText).toBeNull();
    });

    it('does not emit if state is unchanged', () => {
      let calls = 0;
      const unsub = bridgeStore.subscribe(() => { calls++; });
      bridgeActions.closeOverlay();
      unsub();
      expect(calls).toBe(0);
    });
  });

  describe('progress state', () => {
    it('starts without glasses', () => {
      expect(bridgeStore.getState().progress.hasGlasses).toBe(false);
      expect(bridgeStore.getState().progress.discoveredSecretIds).toEqual([]);
      expect(bridgeStore.getState().progress.ridge).toEqual({
        stampIds: [],
        manualPageIds: [],
        mobility: {
          glidePips: 0
        },
        shortcutIds: []
      });
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
      expect(bridgeStore.getState().progress.ridge).toEqual({
        stampIds: [],
        manualPageIds: [],
        mobility: {
          glidePips: 0
        },
        shortcutIds: []
      });
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

    it('awards Ridge stamps once by id', () => {
      bridgeActions.awardRidgeStamp('stampede-sketch');
      bridgeActions.awardRidgeStamp('stampede-sketch');
      expect(bridgeStore.getState().progress.ridge.stampIds).toEqual(['stampede-sketch']);
      expect(hasRidgeStamp('stampede-sketch')).toBe(true);
    });

    it('awards Ridge manual pages once by id', () => {
      bridgeActions.awardRidgeManualPage('relay-sign');
      bridgeActions.awardRidgeManualPage('relay-sign');
      expect(bridgeStore.getState().progress.ridge.manualPageIds).toEqual(['relay-sign']);
      expect(hasRidgeManualPage('relay-sign')).toBe(true);
    });

    it('adds Ridge glide pips from explicit reward actions', () => {
      bridgeActions.awardRidgeGlidePip();
      bridgeActions.awardRidgeGlidePip(2);
      bridgeActions.awardRidgeGlidePip(0);
      expect(bridgeStore.getState().progress.ridge.mobility.glidePips).toBe(3);
    });

    it('unlocks Ridge shortcuts once by id', () => {
      bridgeActions.unlockRidgeShortcut('outskirts-lift');
      bridgeActions.unlockRidgeShortcut('outskirts-lift');
      expect(bridgeStore.getState().progress.ridge.shortcutIds).toEqual(['outskirts-lift']);
      expect(isRidgeShortcutUnlocked('outskirts-lift')).toBe(true);
    });

    it('keeps Ridge stickers derived instead of stored', () => {
      bridgeActions.awardRidgeStamp('stampede-sketch');
      expect(bridgeStore.getState().progress.ridge).not.toHaveProperty('stickerIds');
      expect(Object.keys(bridgeStore.getState().progress.ridge).sort()).toEqual([
        'manualPageIds',
        'mobility',
        'shortcutIds',
        'stampIds'
      ]);
    });

    it('keeps Potassium Circuit ownership derived from inventory', () => {
      bridgeActions.awardRidgeStamp('stampede-sketch');
      expect(isItemOwned('circuit')).toBe(false);
      expect(bridgeStore.getState().progress.ridge).not.toHaveProperty('circuitOwned');

      bridgeActions.collectItem('circuit');
      expect(isItemOwned('circuit')).toBe(true);
      expect(bridgeStore.getState().progress.ridge).not.toHaveProperty('circuitOwned');
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

    it('collectItem can own the circuit without equipping it', () => {
      bridgeActions.collectItem('circuit');
      const s = bridgeStore.getState();
      expect(s.inventory.ownedItemIds).toContain('circuit');
      expect(s.equipment.equippedItemIds).toEqual([]);
      expect(s.progress.hasGlasses).toBe(false);
      expect(isItemOwned('circuit')).toBe(true);
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
    it('sets and clears directional axes', () => {
      bridgeActions.setTouchDirectional('left', 0.5);
      expect(bridgeStore.getState().touch.left).toBe(0.5);
      bridgeActions.setTouchDirectional('left', 0);
      expect(bridgeStore.getState().touch.left).toBe(0);
      bridgeActions.setTouchDirectional('up', 1);
      expect(bridgeStore.getState().touch.up).toBe(1);
      bridgeActions.setTouchDirectional('up', 0);
      expect(bridgeStore.getState().touch.up).toBe(0);
    });

    it('resetTouch zeroes everything', () => {
      bridgeActions.setTouchDirectional('right', 1.0);
      bridgeActions.queueJump();
      bridgeActions.resetTouch();
      const t = bridgeStore.getState().touch;
      expect(t.left).toBe(0);
      expect(t.right).toBe(0);
      expect(t.up).toBe(0);
      expect(t.down).toBe(0);
      expect(t.jumpQueued).toBe(false);
      expect(t.interactTap).toBe(false);
      expect(getTouchState()).toEqual(t);
    });
  });

  describe('scene control pointer events', () => {
    it('queues and consumes owner-scoped pointer events in order', () => {
      bridgeActions.enterScene(POTASSIUM_SCENE_ID);
      bridgeActions.dispatchSceneControlPointerEvent(POTASSIUM_SCENE_ID, {
        kind: 'down',
        pointerId: 7,
        x: 500,
        y: 540,
        timestamp: 12
      });
      bridgeActions.dispatchSceneControlPointerEvent(POTASSIUM_SCENE_ID, {
        kind: 'up',
        pointerId: 7,
        x: 520,
        y: 620,
        timestamp: 24
      });

      const events = bridgeActions.consumeSceneControlPointerEvents(POTASSIUM_SCENE_ID);
      expect(events.map((event) => event.kind)).toEqual(['down', 'up']);
      expect(events[0]).toMatchObject({
        ownerSceneId: POTASSIUM_SCENE_ID,
        pointerId: 7,
        x: 500,
        y: 540
      });
      expect(events[0].sequence).toBeGreaterThan(0);
      expect(bridgeActions.consumeSceneControlPointerEvents(POTASSIUM_SCENE_ID)).toEqual([]);
    });

    it('ignores pointer events for inactive scenes', () => {
      bridgeActions.enterScene(RIDGE_SCENE_ID);
      bridgeActions.dispatchSceneControlPointerEvent(POTASSIUM_SCENE_ID, {
        kind: 'down',
        pointerId: 1,
        x: 500,
        y: 500,
        timestamp: 10
      });

      expect(bridgeStore.getState().sceneControlPointerEvents).toEqual([]);
    });
  });

  describe('scene hint text', () => {
    it('sets, updates, and clears scene hint text', () => {
      bridgeActions.setSceneHintText('Drag toward a target');
      expect(bridgeStore.getState().sceneHintText).toBe('Drag toward a target');
      bridgeActions.setSceneHintText('Wave clear');
      expect(bridgeStore.getState().sceneHintText).toBe('Wave clear');
      bridgeActions.setSceneHintText(null);
      expect(bridgeStore.getState().sceneHintText).toBeNull();
    });
  });

  describe('scene UI', () => {
    it('sets and clears scene-owned status surfaces', () => {
      const params = { timerSeconds: 64 };
      bridgeActions.setSceneUiStatus(
        STAMPEDE_SKETCH_SCENE_ID,
        'stampedeStatus',
        params
      );

      expect(bridgeStore.getState().sceneUi.status).toEqual({
        ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
        id: 'stampedeStatus',
        params
      });

      bridgeActions.clearSceneUiStatus(STAMPEDE_SKETCH_SCENE_ID);
      expect(bridgeStore.getState().sceneUi.status).toBeNull();
    });

    it('sets and clears scene-owned panel surfaces', () => {
      bridgeActions.setSceneUiPanel(
        STAMPEDE_SKETCH_SCENE_ID,
        'stampedeStartPrompt',
        { title: 'Ready?' }
      );

      expect(bridgeStore.getState().sceneUi.panel).toMatchObject({
        ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
        id: 'stampedeStartPrompt'
      });

      bridgeActions.clearSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID);
      expect(bridgeStore.getState().sceneUi.panel).toBeNull();
    });

    it('dispatches and consumes one-shot scene UI actions', () => {
      const params = { option: { kind: 'fire', action: 'unlock' } };
      bridgeActions.dispatchSceneUiAction(POTASSIUM_SCENE_ID, 'potassiumDraftChoice', params);

      const action = bridgeActions.consumeSceneUiAction(POTASSIUM_SCENE_ID);
      expect(action).toMatchObject({
        ownerSceneId: POTASSIUM_SCENE_ID,
        action: 'potassiumDraftChoice',
        params
      });
      expect(action?.sequence).toBeGreaterThan(0);
      expect(bridgeStore.getState().sceneUi.lastAction).toBeNull();
      expect(bridgeActions.consumeSceneUiAction(POTASSIUM_SCENE_ID)).toBeNull();
    });

    it('guards clears and action consumption by owner scene', () => {
      bridgeActions.setSceneUiStatus(
        STAMPEDE_SKETCH_SCENE_ID,
        'stampedeStatus'
      );
      bridgeActions.setSceneUiPanel(
        STAMPEDE_SKETCH_SCENE_ID,
        'stampedeResult'
      );
      bridgeActions.dispatchSceneUiAction(STAMPEDE_SKETCH_SCENE_ID, 'retry');

      bridgeActions.clearSceneUiStatus(RIDGE_SCENE_ID);
      bridgeActions.clearSceneUiPanel(RIDGE_SCENE_ID);

      expect(bridgeStore.getState().sceneUi.status?.ownerSceneId).toBe(STAMPEDE_SKETCH_SCENE_ID);
      expect(bridgeStore.getState().sceneUi.panel?.ownerSceneId).toBe(STAMPEDE_SKETCH_SCENE_ID);
      expect(bridgeActions.consumeSceneUiAction(RIDGE_SCENE_ID)).toBeNull();
      expect(bridgeStore.getState().sceneUi.lastAction?.ownerSceneId).toBe(STAMPEDE_SKETCH_SCENE_ID);
    });
  });
});
