import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SceneLifecycleController } from './SceneLifecycleController';
import { SceneLifecycleEventBus, type SceneLifecycleEvent } from './events';
import type { SceneRuntimeAdapter } from './SceneManager';
import { SceneManager } from './SceneManager';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import { OVERWORLD_SCENE_ID, PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';

interface FakeAdapter extends SceneRuntimeAdapter {
  registerScene: ReturnType<typeof vi.fn<(k: string, scene: unknown) => void>>;
  startScene: ReturnType<typeof vi.fn<(k: string, data: Record<string, unknown>) => void>>;
  stopScene: ReturnType<typeof vi.fn<(k: string) => void>>;
  setPauseOnActiveScenes: ReturnType<typeof vi.fn<(paused: boolean) => void>>;
  getActiveScenes: () => string[];
}

function makeFakeAdapter(): FakeAdapter {
  const active = new Set<string>();
  const known = new Set<string>([PHASER_SCENE_KEYS.overworld, PHASER_SCENE_KEYS.hobbies]);
  return {
    hasScene: (k) => known.has(k),
    registerScene: vi.fn((k: string) => { known.add(k); }),
    isSceneActive: (k) => active.has(k),
    startScene: vi.fn((k: string) => { active.add(k); }),
    stopScene: vi.fn((k: string) => { active.delete(k); }),
    listKnownSceneKeys: () => [...known],
    setPauseOnActiveScenes: vi.fn(),
    captureResume: () => null,
    getActiveScenes: () => [...active]
  };
}

function resetBridge() {
  bridgeActions.returnToOverworld();
  bridgeActions.closeOverlay();
  bridgeActions.setSceneLoading(null);
  bridgeActions.resetTouch();
}

describe('SceneLifecycleController', () => {
  let controller: SceneLifecycleController;
  let eventBus: SceneLifecycleEventBus;
  let events: SceneLifecycleEvent[];
  let adapter: FakeAdapter;
  let sceneManager: SceneManager;

  afterEach(() => {
    controller.stop();
    resetBridge();
  });

  beforeEach(() => {
    resetBridge();
    eventBus = new SceneLifecycleEventBus();
    events = [];
    eventBus.subscribe((e) => events.push(e));

    adapter = makeFakeAdapter();
    sceneManager = new SceneManager(adapter);
    sceneManager.registerContext({
      id: OVERWORLD_SCENE_ID,
      sceneKey: PHASER_SCENE_KEYS.overworld,
      getStartData: () => ({})
    });
    sceneManager.registerContext({
      id: 'hobbies',
      sceneKey: PHASER_SCENE_KEYS.hobbies,
      getStartData: () => ({})
    });
    controller = new SceneLifecycleController(sceneManager, eventBus);
    controller.start();
  });

  it('emits PauseChanged on start', () => {
    expect(events.some((e) => e.type === 'PauseChanged')).toBe(true);
  });

  it('emits OverlayOpened when an overlay becomes active', () => {
    events.length = 0;
    bridgeActions.openOverlay('profile');
    const opened = events.find((e) => e.type === 'OverlayOpened');
    expect(opened).toBeDefined();
    expect((opened as Extract<SceneLifecycleEvent, { type: 'OverlayOpened' }>).overlayId).toBe(
      'profile'
    );
  });

  it('emits OverlayOpened on initial sync when an overlay is already active', () => {
    controller.stop();
    bridgeActions.openOverlay('profile');
    eventBus = new SceneLifecycleEventBus();
    events = [];
    eventBus.subscribe((e) => events.push(e));

    const sceneManager = new SceneManager(makeFakeAdapter());
    controller = new SceneLifecycleController(sceneManager, eventBus);
    controller.sync(bridgeStore.getState());

    expect(events).toContainEqual({ type: 'OverlayOpened', overlayId: 'profile' });
  });

  it('emits OverlayClosed when closing an overlay', () => {
    bridgeActions.openOverlay('profile');
    events.length = 0;
    bridgeActions.closeOverlay();
    expect(events).toContainEqual({ type: 'OverlayClosed', activeSceneId: OVERWORLD_SCENE_ID });
  });

  it('emits PauseChanged when isPaused toggles', () => {
    events.length = 0;
    bridgeActions.openOverlay('profile');
    const pauseEvents = events.filter((e) => e.type === 'PauseChanged');
    expect(pauseEvents.length).toBeGreaterThanOrEqual(1);
    const last = pauseEvents[pauseEvents.length - 1] as Extract<
      SceneLifecycleEvent,
      { type: 'PauseChanged' }
    >;
    expect(last.paused).toBe(true);
  });

  it('emits SceneTransitionRequested when returning to overworld from another scene', async () => {
    bridgeActions.enterScene('hobbies');
    await Promise.resolve();
    events.length = 0;
    bridgeActions.returnToOverworld();
    await Promise.resolve();
    const trans = events.find((e) => e.type === 'SceneTransitionRequested');
    expect(trans).toBeDefined();
    expect(
      (trans as Extract<SceneLifecycleEvent, { type: 'SceneTransitionRequested' }>).targetContext
    ).toBeNull();
  });

  it('enters a Phaser scene when activeSceneId changes', async () => {
    events.length = 0;
    const enterSpy = vi.spyOn(sceneManager, 'enter');

    bridgeActions.enterScene('hobbies');
    await Promise.resolve();

    const trans = events.find((e) => e.type === 'SceneTransitionRequested');
    expect(trans).toBeDefined();
    expect(
      (trans as Extract<SceneLifecycleEvent, { type: 'SceneTransitionRequested' }>).targetContext
    ).toBe('hobbies');
    expect(enterSpy).toHaveBeenCalledWith('hobbies', { isCurrent: expect.any(Function) });
    expect(adapter.getActiveScenes()).toEqual(['hobbies']);
  });

  it('does not emit scene transitions for overlay-only bridge updates', () => {
    events.length = 0;
    adapter.startScene.mockClear();
    adapter.stopScene.mockClear();
    adapter.setPauseOnActiveScenes.mockClear();

    bridgeActions.openOverlay('inventory');

    expect(events.filter((e) => e.type === 'SceneTransitionRequested')).toHaveLength(0);
    expect(adapter.startScene).not.toHaveBeenCalled();
    expect(adapter.stopScene).not.toHaveBeenCalled();
    expect(adapter.setPauseOnActiveScenes).toHaveBeenCalledWith(true);
  });

  it('does not emit scene transitions for touch-only bridge updates', () => {
    events.length = 0;
    adapter.startScene.mockClear();
    adapter.stopScene.mockClear();
    adapter.setPauseOnActiveScenes.mockClear();

    bridgeActions.setTouchDirectional('right', 0.75);

    expect(events.filter((e) => e.type === 'SceneTransitionRequested')).toHaveLength(0);
    expect(adapter.startScene).not.toHaveBeenCalled();
    expect(adapter.stopScene).not.toHaveBeenCalled();
    expect(adapter.setPauseOnActiveScenes).not.toHaveBeenCalled();
  });

  it('stop unsubscribes from bridgeStore', () => {
    controller.stop();
    events.length = 0;
    bridgeActions.openOverlay('profile');
    expect(events.filter((e) => e.type === 'OverlayOpened').length).toBe(0);
  });
});
