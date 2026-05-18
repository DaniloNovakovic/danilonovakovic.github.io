import { describe, expect, it, vi } from 'vitest';
import { SceneManager, type SceneRuntimeAdapter } from './SceneManager';
import type { SceneContextDefinition } from './types';

interface FakeAdapter extends SceneRuntimeAdapter {
  registerScene: ReturnType<typeof vi.fn<(sceneKey: string, scene: unknown) => void>>;
  startScene: ReturnType<typeof vi.fn<(sceneKey: string, data: Record<string, unknown>) => void>>;
  stopScene: ReturnType<typeof vi.fn<(sceneKey: string) => void>>;
  captureResume: ReturnType<typeof vi.fn<(sceneKey: string) => { x: number; y: number } | null>>;
  activeScenes: () => string[];
}

function makeFakeAdapter(initialScenes: readonly string[] = []): FakeAdapter {
  const active = new Set(initialScenes);
  const known = new Set(['main', 'hobbies', 'lab']);
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
    captureResume: vi.fn(() => ({ x: 1, y: 2 })),
    activeScenes: () => [...active]
  };
}

function context(id: string, sceneKey = id): SceneContextDefinition {
  return {
    id,
    sceneKey,
    getStartData: () => ({ id })
  };
}

describe('SceneManager', () => {
  it('stops the active root scene before entering another context', async () => {
    const adapter = makeFakeAdapter(['main']);
    const manager = new SceneManager(adapter);
    manager.registerContext(context('main'));
    manager.registerContext(context('hobbies'));

    await manager.enter('hobbies');

    expect(adapter.captureResume).toHaveBeenCalledWith('main');
    expect(adapter.stopScene).toHaveBeenCalledWith('main');
    expect(adapter.startScene).toHaveBeenCalledWith('hobbies', { id: 'hobbies' });
    expect(adapter.activeScenes()).toEqual(['hobbies']);
  });

  it('stops an active non-root context before entering another context', async () => {
    const adapter = makeFakeAdapter(['hobbies']);
    const manager = new SceneManager(adapter);
    const hobbiesExit = vi.fn();
    manager.registerContext(context('main'));
    manager.registerContext({ ...context('hobbies'), onExit: hobbiesExit });
    manager.registerContext(context('lab'));

    await manager.enter('lab');

    expect(adapter.captureResume).toHaveBeenCalledWith('hobbies');
    expect(adapter.stopScene).toHaveBeenCalledWith('hobbies');
    expect(hobbiesExit).toHaveBeenCalledWith({ x: 1, y: 2 });
    expect(adapter.startScene).toHaveBeenCalledWith('lab', { id: 'lab' });
    expect(adapter.activeScenes()).toEqual(['lab']);
  });

  it('passes captured resume snapshots to onExit when exiting to a target context', async () => {
    const adapter = makeFakeAdapter(['hobbies']);
    const manager = new SceneManager(adapter);
    const hobbiesExit = vi.fn();
    manager.registerContext(context('main'));
    manager.registerContext({ ...context('hobbies'), onExit: hobbiesExit });

    await manager.exitTo('main');

    expect(adapter.captureResume).toHaveBeenCalledWith('hobbies');
    expect(adapter.stopScene).toHaveBeenCalledWith('hobbies');
    expect(hobbiesExit).toHaveBeenCalledWith({ x: 1, y: 2 });
    expect(adapter.startScene).toHaveBeenCalledWith('main', { id: 'main' });
  });

  it('starts the target context from a cold boot with scene start data', async () => {
    const adapter = makeFakeAdapter();
    const onSceneStarted = vi.fn();
    const manager = new SceneManager(adapter, { onSceneStarted });
    manager.registerContext(context('main'));

    await manager.exitTo('main');

    expect(adapter.stopScene).not.toHaveBeenCalled();
    expect(adapter.startScene).toHaveBeenCalledWith('main', { id: 'main' });
    expect(adapter.activeScenes()).toEqual(['main']);
    expect(onSceneStarted).toHaveBeenCalledTimes(1);
  });

  it('does not restart a context that is already active', async () => {
    const adapter = makeFakeAdapter(['hobbies']);
    const manager = new SceneManager(adapter);
    manager.registerContext(context('main'));
    manager.registerContext(context('hobbies'));

    await manager.enter('hobbies');

    expect(adapter.stopScene).not.toHaveBeenCalled();
    expect(adapter.startScene).not.toHaveBeenCalled();
  });

  it('notifies after entering a newly started context', async () => {
    const adapter = makeFakeAdapter(['main']);
    const onSceneStarted = vi.fn();
    const manager = new SceneManager(adapter, { onSceneStarted });
    manager.registerContext(context('main'));
    manager.registerContext(context('hobbies'));

    await manager.enter('hobbies');

    expect(onSceneStarted).toHaveBeenCalledTimes(1);
  });

  it('loads and registers a lazy context before starting it', async () => {
    const adapter = makeFakeAdapter(['main']);
    const loadingEvents: Array<string | null> = [];
    const manager = new SceneManager(adapter, {
      onSceneLoadingChange: (contextId) => loadingEvents.push(contextId)
    });
    const scene = class LazyScene {};
    const loadScene = vi.fn(async () => scene);
    manager.registerContext(context('main'));
    manager.registerContext({
      ...context('lazy-room'),
      loadScene
    });

    await manager.enter('lazy-room');

    expect(loadScene).toHaveBeenCalledTimes(1);
    expect(adapter.registerScene).toHaveBeenCalledWith('lazy-room', scene);
    expect(adapter.startScene).toHaveBeenCalledWith('lazy-room', { id: 'lazy-room' });
    expect(loadingEvents).toEqual(['lazy-room', null]);
  });

  it('registers a lazy context but skips start when the transition guard is stale', async () => {
    const adapter = makeFakeAdapter(['main']);
    const loadingEvents: Array<string | null> = [];
    const manager = new SceneManager(adapter, {
      onSceneLoadingChange: (contextId) => loadingEvents.push(contextId)
    });
    const scene = class LazyScene {};
    let current = true;
    manager.registerContext(context('main'));
    manager.registerContext({
      ...context('lazy-room'),
      loadScene: async () => {
        current = false;
        return scene;
      }
    });

    await manager.enter('lazy-room', { isCurrent: () => current });

    expect(adapter.registerScene).toHaveBeenCalledWith('lazy-room', scene);
    expect(adapter.startScene).not.toHaveBeenCalledWith('lazy-room', { id: 'lazy-room' });
    expect(adapter.activeScenes()).toEqual(['main']);
    expect(loadingEvents).toEqual(['lazy-room']);
  });

  it('clears loading state on dispose even when a guarded load is in flight', async () => {
    const adapter = makeFakeAdapter(['main']);
    const loadingEvents: Array<string | null> = [];
    const manager = new SceneManager(adapter, {
      onSceneLoadingChange: (contextId) => loadingEvents.push(contextId)
    });
    let resolveScene!: (scene: unknown) => void;
    const loadScene = new Promise<unknown>((resolve) => {
      resolveScene = resolve;
    });
    let current = true;
    manager.registerContext(context('main'));
    manager.registerContext({
      ...context('lazy-room'),
      loadScene: () => loadScene
    });

    const enterPromise = manager.enter('lazy-room', { isCurrent: () => current });
    await Promise.resolve();
    current = false;
    manager.dispose();
    resolveScene(class LazyScene {});
    await enterPromise;

    expect(adapter.registerScene).toHaveBeenCalledWith('lazy-room', expect.any(Function));
    expect(adapter.startScene).not.toHaveBeenCalledWith('lazy-room', { id: 'lazy-room' });
    expect(loadingEvents).toEqual(['lazy-room', null]);
  });
});
