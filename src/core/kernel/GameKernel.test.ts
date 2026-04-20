import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the registry so Phaser (loaded by HobbiesScene) is never imported in node env.
vi.mock('../../game/miniGameRegistry', () => ({
  getMiniGameById: (id: string) => {
    const REACT_OVERLAY = 'REACT_OVERLAY';
    const PHASER_SCENE = 'PHASER_SCENE';
    const map: Record<string, { id: string; type: string; name: string }> = {
      profile: { id: 'profile', type: REACT_OVERLAY, name: 'Profile' },
      hobbies: { id: 'hobbies', type: PHASER_SCENE, name: 'Hobbies' }
    };
    return map[id];
  },
  getAllMiniGames: () => []
}));

vi.mock('../../game/types', () => ({
  MiniGameType: { REACT_OVERLAY: 'REACT_OVERLAY', PHASER_SCENE: 'PHASER_SCENE' }
}));

import { GameKernel } from './GameKernel';
import { KernelEventBus, type KernelEvent } from './events';
import type { SceneRuntimeAdapter } from './SceneManager';
import { SceneManager } from './SceneManager';
import { bridgeActions } from '../../shared/bridge/store';
import { PHASER_SCENE_KEYS } from '../../config/featureIds';

function makeFakeAdapter(): SceneRuntimeAdapter {
  const active = new Set<string>();
  return {
    isSceneActive: (k) => active.has(k),
    startScene: (k) => { active.add(k); },
    stopScene: (k) => { active.delete(k); },
    listKnownSceneKeys: () => [PHASER_SCENE_KEYS.main, PHASER_SCENE_KEYS.hobbies],
    setPauseOnActiveScenes: vi.fn(),
    captureResume: () => null
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

  afterEach(() => {
    kernel.stop();
    resetBridge();
  });

  beforeEach(() => {
    resetBridge();
    eventBus = new KernelEventBus();
    events = [];
    eventBus.subscribe((e) => events.push(e));

    const adapter = makeFakeAdapter();
    const sceneManager = new SceneManager(adapter, PHASER_SCENE_KEYS.main);
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

  it('stop unsubscribes from bridgeStore', () => {
    kernel.stop();
    events.length = 0;
    bridgeActions.requestInteraction('profile');
    // Kernel is unsubscribed: no events should arrive on its event bus.
    expect(events.filter((e) => e.type === 'OverlayOpened').length).toBe(0);
  });
});
