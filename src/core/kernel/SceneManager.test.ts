import { describe, expect, it, vi } from 'vitest';
import { SceneManager, type SceneRuntimeAdapter } from './SceneManager';
import type { ContextPluginDefinition } from './types';

interface FakeAdapter extends SceneRuntimeAdapter {
  startScene: ReturnType<typeof vi.fn<(sceneKey: string) => void>>;
  stopScene: ReturnType<typeof vi.fn<(sceneKey: string) => void>>;
  captureResume: ReturnType<typeof vi.fn<(sceneKey: string) => { x: number; y: number } | null>>;
  activeScenes: () => string[];
}

function makeFakeAdapter(initialScenes: readonly string[] = []): FakeAdapter {
  const active = new Set(initialScenes);
  return {
    isSceneActive: (sceneKey) => active.has(sceneKey),
    startScene: vi.fn((sceneKey: string) => {
      active.add(sceneKey);
    }),
    stopScene: vi.fn((sceneKey: string) => {
      active.delete(sceneKey);
    }),
    listKnownSceneKeys: () => ['main', 'hobbies', 'lab'],
    setPauseOnActiveScenes: vi.fn(),
    captureResume: vi.fn(() => ({ x: 1, y: 2 })),
    activeScenes: () => [...active]
  };
}

function context(id: string, sceneKey = id): ContextPluginDefinition {
  return {
    id,
    sceneKey,
    getStartData: () => ({ id })
  };
}

describe('SceneManager', () => {
  it('stops the active root scene before entering another context', () => {
    const adapter = makeFakeAdapter(['main']);
    const manager = new SceneManager(adapter);
    manager.registerContext(context('main'));
    manager.registerContext(context('hobbies'));

    manager.enter('hobbies');

    expect(adapter.captureResume).toHaveBeenCalledWith('main');
    expect(adapter.stopScene).toHaveBeenCalledWith('main');
    expect(adapter.startScene).toHaveBeenCalledWith('hobbies', { id: 'hobbies' });
    expect(adapter.activeScenes()).toEqual(['hobbies']);
  });

  it('stops an active non-root context before entering another context', () => {
    const adapter = makeFakeAdapter(['hobbies']);
    const manager = new SceneManager(adapter);
    const hobbiesExit = vi.fn();
    manager.registerContext(context('main'));
    manager.registerContext({ ...context('hobbies'), onExit: hobbiesExit });
    manager.registerContext(context('lab'));

    manager.enter('lab');

    expect(adapter.captureResume).toHaveBeenCalledWith('hobbies');
    expect(adapter.stopScene).toHaveBeenCalledWith('hobbies');
    expect(hobbiesExit).toHaveBeenCalledWith({ x: 1, y: 2 });
    expect(adapter.startScene).toHaveBeenCalledWith('lab', { id: 'lab' });
    expect(adapter.activeScenes()).toEqual(['lab']);
  });

  it('passes captured resume snapshots to onExit when exiting to a target context', () => {
    const adapter = makeFakeAdapter(['hobbies']);
    const manager = new SceneManager(adapter);
    const hobbiesExit = vi.fn();
    manager.registerContext(context('main'));
    manager.registerContext({ ...context('hobbies'), onExit: hobbiesExit });

    manager.exitTo('main');

    expect(adapter.captureResume).toHaveBeenCalledWith('hobbies');
    expect(adapter.stopScene).toHaveBeenCalledWith('hobbies');
    expect(hobbiesExit).toHaveBeenCalledWith({ x: 1, y: 2 });
    expect(adapter.startScene).toHaveBeenCalledWith('main', { id: 'main' });
  });

  it('does not restart a context that is already active', () => {
    const adapter = makeFakeAdapter(['hobbies']);
    const manager = new SceneManager(adapter);
    manager.registerContext(context('main'));
    manager.registerContext(context('hobbies'));

    manager.enter('hobbies');

    expect(adapter.stopScene).not.toHaveBeenCalled();
    expect(adapter.startScene).not.toHaveBeenCalled();
  });
});
