import { describe, expect, it, vi } from 'vitest';
import { DEV_DEBUG_GLOBAL, createDevDebugHook, installDevDebugHook } from './devDebugHook';

function fakePlayer(x: number, y: number) {
  const player = {
    x,
    y,
    setPosition: vi.fn((nx: number, ny: number) => {
      player.x = nx;
      player.y = ny;
    }),
    body: {
      reset: vi.fn((nx: number, ny: number) => {
        player.x = nx;
        player.y = ny;
      })
    }
  };
  return player;
}

function fakeGame(scenes: object[]) {
  return { scene: { getScenes: vi.fn(() => scenes) } } as never;
}

describe('dev debug hook', () => {
  it('reports the topmost running scene that has a player, by app scene id', () => {
    const game = fakeGame([
      { scene: { key: 'MainScene' }, player: fakePlayer(100, 400) },
      {
        scene: { key: 'hobbies' },
        player: fakePlayer(926.4, 450),
        physics: { world: { bounds: { x: 0, y: 0, width: 950, height: 600 } } }
      },
      { scene: { key: 'decoration' } }
    ]);
    const hook = createDevDebugHook(() => game);

    expect(hook.scenes()).toEqual(['overworld', 'hobbies', 'decoration']);
    expect(hook.scene()).toBe('hobbies');
    expect(hook.player()).toEqual({ x: 926, y: 450 });
    expect(hook.worldBounds()).toEqual({ x: 0, y: 0, width: 950, height: 600 });
  });

  it('teleports through the physics body and keeps y when omitted', () => {
    const player = fakePlayer(500, 450);
    const hook = createDevDebugHook(() => fakeGame([{ scene: { key: 'hobbies' }, player }]));

    expect(hook.teleport(20)).toBe(true);
    expect(player.body.reset).toHaveBeenCalledWith(20, 450);
    expect(hook.player()).toEqual({ x: 20, y: 450 });
  });

  it('returns nulls before the game boots', () => {
    const hook = createDevDebugHook(() => null);
    expect(hook.scene()).toBeNull();
    expect(hook.player()).toBeNull();
    expect(hook.teleport(10)).toBe(false);
  });

  it('removes only its own hook on uninstall', () => {
    const target: Record<string, unknown> = {};
    const uninstallFirst = installDevDebugHook(target, () => null);
    const uninstallSecond = installDevDebugHook(target, () => null);
    const second = target[DEV_DEBUG_GLOBAL];

    uninstallFirst();
    expect(target[DEV_DEBUG_GLOBAL]).toBe(second);
    uninstallSecond();
    expect(target).not.toHaveProperty(DEV_DEBUG_GLOBAL);
  });
});
