import { describe, expect, it, vi } from 'vitest';
import { PHASER_SCENE_KEYS, type SceneId } from '@/game/scenes/sceneIds';
import { createSceneContexts, type SceneContextAssemblyDeps } from './createSceneContexts';

function makeDeps(
  overrides: Partial<SceneContextAssemblyDeps> = {}
): SceneContextAssemblyDeps {
  return {
    onEnterScene: vi.fn(),
    onOpenOverlay: vi.fn(),
    onReturnToOverworld: vi.fn(),
    getIsPaused: vi.fn(() => true),
    prepareSceneStart: vi.fn(),
    getSceneStartResume: vi.fn((sceneKey: string) => ({ x: sceneKey.length, y: 2 })),
    loadPhaserScene: vi.fn(async (id: SceneId) => ({ id })),
    ...overrides
  };
}

describe('createSceneContexts', () => {
  it('returns known scene contexts in runtime order', () => {
    const contexts = createSceneContexts(makeDeps());

    expect(contexts.map((context) => context.sceneKey)).toEqual([
      PHASER_SCENE_KEYS.overworld,
      PHASER_SCENE_KEYS.hobbies,
      PHASER_SCENE_KEYS.basement,
      PHASER_SCENE_KEYS.potassium,
      PHASER_SCENE_KEYS.ridge
    ]);
  });

  it('builds overworld start data from current bridge and resume deps', () => {
    const onEnterScene = vi.fn();
    const onOpenOverlay = vi.fn();
    const getSceneStartResume = vi.fn(() => ({ x: 3, y: 4 }));
    const contexts = createSceneContexts(makeDeps({
      onEnterScene,
      onOpenOverlay,
      getSceneStartResume
    }));

    expect(contexts[0].getStartData()).toEqual({
      onEnterScene,
      onOpenOverlay,
      isPaused: true,
      resumePosition: { x: 3, y: 4 }
    });
    expect(getSceneStartResume).toHaveBeenCalledWith(PHASER_SCENE_KEYS.overworld);
  });

  it('builds hobbies and basement start data with shared close and overlay deps', () => {
    const onReturnToOverworld = vi.fn();
    const onOpenOverlay = vi.fn();
    const getSceneStartResume = vi.fn((sceneKey: string) => ({ x: sceneKey.length, y: 9 }));
    const contexts = createSceneContexts(makeDeps({
      onReturnToOverworld,
      onOpenOverlay,
      getSceneStartResume
    }));

    expect(contexts[1].getStartData()).toEqual({
      onClose: onReturnToOverworld,
      onOpenOverlay,
      isPaused: false,
      resumePosition: { x: PHASER_SCENE_KEYS.hobbies.length, y: 9 }
    });
    expect(contexts[2].getStartData()).toEqual({
      onClose: onReturnToOverworld,
      onOpenOverlay,
      isPaused: false,
      resumePosition: { x: PHASER_SCENE_KEYS.basement.length, y: 9 }
    });
    expect(getSceneStartResume).toHaveBeenCalledWith(PHASER_SCENE_KEYS.hobbies);
    expect(getSceneStartResume).toHaveBeenCalledWith(PHASER_SCENE_KEYS.basement);
  });

  it('passes overlay options through scene start callbacks', () => {
    const onOpenOverlay = vi.fn();
    const contexts = createSceneContexts(makeDeps({ onOpenOverlay }));
    const ridgeStartData = contexts[4].getStartData() as {
      onOpenOverlay: (overlayId: 'trailCard', options?: { params?: unknown }) => void;
    };
    const params = { title: 'Stampede Sketch' };

    ridgeStartData.onOpenOverlay('trailCard', { params });

    expect(onOpenOverlay).toHaveBeenCalledWith('trailCard', { params });
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
    const contexts = createSceneContexts(makeDeps({ prepareSceneStart, getSceneStartResume }));

    expect(contexts[3].getStartData()).toEqual({
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
    const contexts = createSceneContexts(makeDeps({ prepareSceneStart, getSceneStartResume }));

    contexts.forEach((context) => context.getStartData());

    expect(calls).toEqual([
      `prepare:${PHASER_SCENE_KEYS.overworld}`,
      `get:${PHASER_SCENE_KEYS.overworld}`,
      `prepare:${PHASER_SCENE_KEYS.hobbies}`,
      `get:${PHASER_SCENE_KEYS.hobbies}`,
      `prepare:${PHASER_SCENE_KEYS.basement}`,
      `get:${PHASER_SCENE_KEYS.basement}`,
      `prepare:${PHASER_SCENE_KEYS.potassium}`,
      `get:${PHASER_SCENE_KEYS.potassium}`,
      `prepare:${PHASER_SCENE_KEYS.ridge}`,
      `get:${PHASER_SCENE_KEYS.ridge}`
    ]);
  });

  it('lazy loaders call loadPhaserScene with the matching scene id', async () => {
    const loadPhaserScene = vi.fn(async (id: SceneId) => ({ id }));
    const contexts = createSceneContexts(makeDeps({ loadPhaserScene }));

    await expect(contexts[1].loadScene?.()).resolves.toEqual({ id: 'hobbies' });
    await expect(contexts[2].loadScene?.()).resolves.toEqual({ id: 'basement' });
    await expect(contexts[3].loadScene?.()).resolves.toEqual({ id: 'potassium' });
    await expect(contexts[4].loadScene?.()).resolves.toEqual({ id: 'ridge' });
    expect(loadPhaserScene).toHaveBeenNthCalledWith(1, 'hobbies');
    expect(loadPhaserScene).toHaveBeenNthCalledWith(2, 'basement');
    expect(loadPhaserScene).toHaveBeenNthCalledWith(3, 'potassium');
    expect(loadPhaserScene).toHaveBeenNthCalledWith(4, 'ridge');
  });

  it('rejects lazy loading with a descriptive error when a scene binding is missing', async () => {
    const contexts = createSceneContexts(makeDeps({ loadPhaserScene: vi.fn(() => undefined) }));

    await expect(contexts[1].loadScene?.()).rejects.toThrow('Missing Phaser scene binding for hobbies');
  });
});
