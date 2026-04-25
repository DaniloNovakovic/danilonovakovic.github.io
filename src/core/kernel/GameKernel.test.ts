import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { GameKernel } from './GameKernel';
import { KernelEventBus, type KernelEvent } from './events';
import type { SceneRuntimeAdapter } from './SceneManager';
import { SceneManager } from './SceneManager';
import { bridgeActions } from '../../shared/bridge/store';
import { PHASER_SCENE_KEYS } from '../../config/featureIds';

interface FakeAdapter extends SceneRuntimeAdapter {
  startScene: ReturnType<typeof vi.fn<(k: string) => void>>;
  stopScene: ReturnType<typeof vi.fn<(k: string) => void>>;
  setPauseOnActiveScenes: ReturnType<typeof vi.fn<(paused: boolean) => void>>;
  getActiveScenes: () => string[];
}

function makeFakeAdapter(): FakeAdapter {
  const active = new Set<string>();
  return {
    isSceneActive: (k) => active.has(k),
    startScene: vi.fn((k: string) => { active.add(k); }),
    stopScene: vi.fn((k: string) => { active.delete(k); }),
    listKnownSceneKeys: () => [PHASER_SCENE_KEYS.main, PHASER_SCENE_KEYS.hobbies],
    setPauseOnActiveScenes: vi.fn(),
    captureResume: () => null,
    getActiveScenes: () => [...active]
  };
}

function resetBridge() {
  bridgeActions.closeActiveOverlay();
  bridgeActions.resetTouch();
}

describe('GameKernel', () => {
  let kernel: GameKernel;
  let eventBus: KernelEventBus;
  let events: KernelEvent[];
  let adapter: FakeAdapter;

  afterEach(() => {
    kernel.stop();
    resetBridge();
  });

  beforeEach(() => {
    resetBridge();
    eventBus = new KernelEventBus();
    events = [];
    eventBus.subscribe((e) => events.push(e));

    adapter = makeFakeAdapter();
    const sceneManager = new SceneManager(adapter);
    sceneManager.registerContext({
      id: PHASER_SCENE_KEYS.main,
      sceneKey: PHASER_SCENE_KEYS.main,
      getStartData: () => ({})
    });
    sceneManager.registerContext({
      id: PHASER_SCENE_KEYS.hobbies,
      sceneKey: PHASER_SCENE_KEYS.hobbies,
      getStartData: () => ({})
    });
    kernel = new GameKernel(sceneManager, eventBus);
    kernel.start();
  });

  it('emits PauseChanged on start', () => {
    expect(events.some((e) => e.type === 'PauseChanged')).toBe(true);
  });

  it('emits OverlayOpened when a REACT_OVERLAY becomes active', () => {
    events.length = 0;
    bridgeActions.requestInteraction('profile');
    const opened = events.find((e) => e.type === 'OverlayOpened');
    expect(opened).toBeDefined();
    expect((opened as Extract<KernelEvent, { type: 'OverlayOpened' }>).miniGameId).toBe('profile');
  });

  it('emits OverlayClosed when returning to exploring', () => {
    bridgeActions.requestInteraction('profile');
    events.length = 0;
    bridgeActions.closeActiveOverlay();
    expect(events.some((e) => e.type === 'OverlayClosed')).toBe(true);
  });

  it('emits PauseChanged when isPaused toggles', () => {
    events.length = 0;
    bridgeActions.requestInteraction('profile'); // REACT_OVERLAY → paused = true
    const pauseEvents = events.filter((e) => e.type === 'PauseChanged');
    expect(pauseEvents.length).toBeGreaterThanOrEqual(1);
    const last = pauseEvents[pauseEvents.length - 1] as Extract<KernelEvent, { type: 'PauseChanged' }>;
    expect(last.paused).toBe(true);
  });

  it('emits SceneTransitionRequested when returning to overworld', () => {
    bridgeActions.requestInteraction('profile');
    events.length = 0;
    bridgeActions.closeActiveOverlay();
    const trans = events.find((e) => e.type === 'SceneTransitionRequested');
    expect(trans).toBeDefined();
    expect((trans as Extract<KernelEvent, { type: 'SceneTransitionRequested' }>).targetContext).toBeNull();
  });

  it('enters a Phaser scene when a PHASER_SCENE mini-game becomes active', () => {
    events.length = 0;

    bridgeActions.requestInteraction('hobbies');

    const trans = events.find((e) => e.type === 'SceneTransitionRequested');
    expect(trans).toBeDefined();
    expect((trans as Extract<KernelEvent, { type: 'SceneTransitionRequested' }>).targetContext).toBe(
      'hobbies'
    );
    expect(adapter.getActiveScenes()).toEqual(['hobbies']);
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
    kernel.stop();
    events.length = 0;
    bridgeActions.requestInteraction('profile');
    // Kernel is unsubscribed: no events should arrive on its event bus.
    expect(events.filter((e) => e.type === 'OverlayOpened').length).toBe(0);
  });
});
