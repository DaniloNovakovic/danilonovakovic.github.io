import { describe, expect, it, vi } from 'vitest';
import { PHASER_SCENE_KEYS, type MiniGameId } from '@/game/registry/featureIds';
import { createContextPlugins, type ContextPluginAssemblyDeps } from './createContextPlugins';

function makeDeps(
  overrides: Partial<ContextPluginAssemblyDeps> = {}
): ContextPluginAssemblyDeps {
  return {
    onInteract: vi.fn(),
    onClose: vi.fn(),
    getIsPaused: vi.fn(() => true),
    prepareSceneStart: vi.fn(),
    getSceneStartResume: vi.fn((sceneKey: string) => ({ x: sceneKey.length, y: 2 })),
    loadPhaserScene: vi.fn(async (id: MiniGameId) => ({ id })),
    ...overrides
  };
}

describe('createContextPlugins', () => {
  it('returns known context plugins in runtime order', () => {
    const plugins = createContextPlugins(makeDeps());

    expect(plugins.map((plugin) => plugin.sceneKey)).toEqual([
      PHASER_SCENE_KEYS.main,
      PHASER_SCENE_KEYS.hobbies,
      PHASER_SCENE_KEYS.basement,
      PHASER_SCENE_KEYS.potassium
    ]);
  });

  it('builds street start data from current bridge and resume deps', () => {
    const onInteract = vi.fn();
    const getSceneStartResume = vi.fn(() => ({ x: 3, y: 4 }));
    const plugins = createContextPlugins(makeDeps({ onInteract, getSceneStartResume }));

    expect(plugins[0].getStartData()).toEqual({
      onInteract,
      isPaused: true,
      resumePosition: { x: 3, y: 4 }
    });
    expect(getSceneStartResume).toHaveBeenCalledWith(PHASER_SCENE_KEYS.main);
  });

  it('builds hobbies and basement start data with shared close and interact deps', () => {
    const onClose = vi.fn();
    const onInteract = vi.fn();
    const getSceneStartResume = vi.fn((sceneKey: string) => ({ x: sceneKey.length, y: 9 }));
    const plugins = createContextPlugins(makeDeps({ onClose, onInteract, getSceneStartResume }));

    expect(plugins[1].getStartData()).toEqual({
      onClose,
      onInteract,
      isPaused: false,
      resumePosition: { x: PHASER_SCENE_KEYS.hobbies.length, y: 9 }
    });
    expect(plugins[2].getStartData()).toEqual({
      onClose,
      onInteract,
      isPaused: false,
      resumePosition: { x: PHASER_SCENE_KEYS.basement.length, y: 9 }
    });
    expect(getSceneStartResume).toHaveBeenCalledWith(PHASER_SCENE_KEYS.hobbies);
    expect(getSceneStartResume).toHaveBeenCalledWith(PHASER_SCENE_KEYS.basement);
  });

  it('prepares potassium start before reading potassium start position', () => {
    const calls: string[] = [];
    const prepareSceneStart = vi.fn((sceneKey: string) => {
      calls.push(`prepare:${sceneKey}`);
    });
    const getSceneStartResume = vi.fn((sceneKey: string) => {
      calls.push(`get:${sceneKey}`);
      return { x: 8, y: 13 };
    });
    const plugins = createContextPlugins(makeDeps({ prepareSceneStart, getSceneStartResume }));

    expect(plugins[3].getStartData()).toEqual({
      onClose: expect.any(Function),
      isPaused: false,
      resumePosition: { x: 8, y: 13 }
    });
    expect(calls).toEqual([
      `prepare:${PHASER_SCENE_KEYS.potassium}`,
      `get:${PHASER_SCENE_KEYS.potassium}`
    ]);
  });

  it('prepares each scene start before reading its resume position', () => {
    const calls: string[] = [];
    const prepareSceneStart = vi.fn((sceneKey: string) => {
      calls.push(`prepare:${sceneKey}`);
    });
    const getSceneStartResume = vi.fn((sceneKey: string) => {
      calls.push(`get:${sceneKey}`);
      return undefined;
    });
    const plugins = createContextPlugins(makeDeps({ prepareSceneStart, getSceneStartResume }));

    plugins.forEach((plugin) => plugin.getStartData());

    expect(calls).toEqual([
      `prepare:${PHASER_SCENE_KEYS.main}`,
      `get:${PHASER_SCENE_KEYS.main}`,
      `prepare:${PHASER_SCENE_KEYS.hobbies}`,
      `get:${PHASER_SCENE_KEYS.hobbies}`,
      `prepare:${PHASER_SCENE_KEYS.basement}`,
      `get:${PHASER_SCENE_KEYS.basement}`,
      `prepare:${PHASER_SCENE_KEYS.potassium}`,
      `get:${PHASER_SCENE_KEYS.potassium}`
    ]);
  });

  it('lazy loaders call loadPhaserScene with the matching feature id', async () => {
    const loadPhaserScene = vi.fn(async (id: MiniGameId) => ({ id }));
    const plugins = createContextPlugins(makeDeps({ loadPhaserScene }));

    await expect(plugins[1].loadScene?.()).resolves.toEqual({ id: PHASER_SCENE_KEYS.hobbies });
    await expect(plugins[2].loadScene?.()).resolves.toEqual({ id: PHASER_SCENE_KEYS.basement });
    await expect(plugins[3].loadScene?.()).resolves.toEqual({ id: PHASER_SCENE_KEYS.potassium });
    expect(loadPhaserScene).toHaveBeenNthCalledWith(1, PHASER_SCENE_KEYS.hobbies);
    expect(loadPhaserScene).toHaveBeenNthCalledWith(2, PHASER_SCENE_KEYS.basement);
    expect(loadPhaserScene).toHaveBeenNthCalledWith(3, PHASER_SCENE_KEYS.potassium);
  });

  it('rejects lazy loading with a descriptive error when a scene binding is missing', async () => {
    const plugins = createContextPlugins(makeDeps({ loadPhaserScene: vi.fn(() => undefined) }));

    await expect(plugins[1].loadScene?.()).rejects.toThrow('Missing Phaser scene binding for hobbies');
  });
});
