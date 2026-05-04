import { describe, expect, it, vi } from 'vitest';
import type { MiniGameId } from '@game/registry/featureIds';
import { EXPLORING_MODE, type RuntimeMode } from '../runtime/gameState';
import { SceneManager, type SceneRuntimeAdapter } from './SceneManager';
import { SceneTransitionCoordinator } from './SceneTransitionCoordinator';
import { KernelEventBus, type KernelEvent } from './events';
import type { ContextPluginDefinition } from './types';

interface FakeAdapter extends SceneRuntimeAdapter {
  registerScene: ReturnType<typeof vi.fn<(sceneKey: string, scene: unknown) => void>>;
  startScene: ReturnType<typeof vi.fn<(sceneKey: string, data: Record<string, unknown>) => void>>;
  stopScene: ReturnType<typeof vi.fn<(sceneKey: string) => void>>;
  activeScenes: () => string[];
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeFakeAdapter(initialScenes: readonly string[] = ['MainScene']): FakeAdapter {
  const active = new Set(initialScenes);
  const known = new Set(['MainScene']);
  return {
    hasScene: (sceneKey) => known.has(sceneKey),
    registerScene: vi.fn((sceneKey: string) => {
      known.add(sceneKey);
    }),
    isSceneActive: (sceneKey) => active.has(sceneKey),
    startScene: vi.fn((sceneKey: string) => {
      active.add(sceneKey);
    }),
    stopScene: vi.fn((sceneKey: string) => {
      active.delete(sceneKey);
    }),
    listKnownSceneKeys: () => [...known],
    setPauseOnActiveScenes: vi.fn(),
    captureResume: vi.fn(() => null),
    activeScenes: () => [...active]
  };
}

function context(
  id: string,
  options: Partial<ContextPluginDefinition> = {}
): ContextPluginDefinition {
  return {
    id,
    sceneKey: id === 'main' ? 'MainScene' : id,
    getStartData: () => ({ id }),
    ...options
  };
}

function mode(miniGameId: MiniGameId): RuntimeMode {
  return { kind: 'phaserScene', miniGameId };
}

async function settleAsyncTransition(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('SceneTransitionCoordinator', () => {
  it('registers but does not start a lazy scene after a newer exploring request', async () => {
    const loadHobbies = deferred<unknown>();
    const adapter = makeFakeAdapter();
    const loadingEvents: Array<string | null> = [];
    const sceneManager = new SceneManager(adapter, {
      onSceneLoadingChange: (contextId) => loadingEvents.push(contextId)
    });
    const eventBus = new KernelEventBus();
    const events: KernelEvent[] = [];
    eventBus.subscribe((event) => events.push(event));
    sceneManager.registerContext(context('MainScene'));
    sceneManager.registerContext(context('hobbies', { loadScene: () => loadHobbies.promise }));

    const coordinator = new SceneTransitionCoordinator(sceneManager, eventBus);
    coordinator.request(mode('hobbies'));
    coordinator.request(EXPLORING_MODE);
    loadHobbies.resolve(class HobbiesScene {});
    await settleAsyncTransition();

    expect(adapter.registerScene).toHaveBeenCalledWith('hobbies', expect.any(Function));
    expect(adapter.startScene).not.toHaveBeenCalledWith('hobbies', { id: 'hobbies' });
    expect(adapter.activeScenes()).toEqual(['MainScene']);
    expect(loadingEvents).toEqual(['hobbies', null]);
    expect(events).toContainEqual({ type: 'SceneTransitionRequested', targetContext: null });
  });

  it('does not let stale lazy loads clear a newer loading state', async () => {
    const loadHobbies = deferred<unknown>();
    const loadBasement = deferred<unknown>();
    const adapter = makeFakeAdapter();
    const loadingEvents: Array<string | null> = [];
    const sceneManager = new SceneManager(adapter, {
      onSceneLoadingChange: (contextId) => loadingEvents.push(contextId)
    });
    const coordinator = new SceneTransitionCoordinator(sceneManager, new KernelEventBus());
    sceneManager.registerContext(context('MainScene'));
    sceneManager.registerContext(context('hobbies', { loadScene: () => loadHobbies.promise }));
    sceneManager.registerContext(context('basement', { loadScene: () => loadBasement.promise }));

    coordinator.request(mode('hobbies'));
    coordinator.request(mode('basement'));
    loadHobbies.resolve(class HobbiesScene {});
    await settleAsyncTransition();

    expect(adapter.registerScene).toHaveBeenCalledWith('hobbies', expect.any(Function));
    expect(adapter.startScene).not.toHaveBeenCalledWith('hobbies', { id: 'hobbies' });
    expect(loadingEvents).toEqual(['hobbies', 'basement']);

    loadBasement.resolve(class BasementScene {});
    await settleAsyncTransition();

    expect(adapter.registerScene).toHaveBeenCalledWith('basement', expect.any(Function));
    expect(adapter.startScene).toHaveBeenCalledWith('basement', { id: 'basement' });
    expect(loadingEvents).toEqual(['hobbies', 'basement', null]);
  });

  it('clears loading and swallows failed current lazy loads', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const loadHobbies = deferred<unknown>();
    const adapter = makeFakeAdapter();
    const loadingEvents: Array<string | null> = [];
    const sceneManager = new SceneManager(adapter, {
      onSceneLoadingChange: (contextId) => loadingEvents.push(contextId)
    });
    const coordinator = new SceneTransitionCoordinator(sceneManager, new KernelEventBus());
    sceneManager.registerContext(context('MainScene'));
    sceneManager.registerContext(context('hobbies', { loadScene: () => loadHobbies.promise }));

    coordinator.request(mode('hobbies'));
    loadHobbies.reject(new Error('load failed'));
    await settleAsyncTransition();

    expect(loadingEvents).toEqual(['hobbies', null]);
    expect(adapter.startScene).not.toHaveBeenCalledWith('hobbies', { id: 'hobbies' });
    expect(warnSpy).toHaveBeenCalledWith('Scene transition failed', expect.any(Error));
    warnSpy.mockRestore();
  });
});
