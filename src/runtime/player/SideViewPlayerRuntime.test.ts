import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Phaser from 'phaser';
import { bridgeActions } from '../../shared/bridge/store';

vi.mock('phaser', () => ({
  Math: {
    Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        A: 65,
        D: 68,
        E: 69,
        H: 72,
        ESC: 27
      },
      JustDown: (key: { justDown?: boolean }) => key.justDown === true
    }
  }
}));

import { createSideViewPlayerRuntime } from './SideViewPlayerRuntime';

type FakeKey = Phaser.Input.Keyboard.Key & { justDown?: boolean };

function key(isDown = false, justDown = false): FakeKey {
  return { isDown, justDown } as FakeKey;
}

function createSprite() {
  const sprite = {
    x: 0,
    y: 0,
    body: { touching: { down: true } },
    setDepth: vi.fn(),
    setCollideWorldBounds: vi.fn(),
    setGravityY: vi.fn(),
    setVelocityX: vi.fn(),
    setVelocityY: vi.fn(),
    setFlipX: vi.fn(),
    setAngle: vi.fn(),
    setTexture: vi.fn()
  };
  return sprite as unknown as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & typeof sprite;
}

function createScene() {
  const sprite = createSprite();
  const cursors = {
    left: key(),
    right: key(),
    up: key(),
    shift: key(),
    down: key(),
    space: key()
  } as Phaser.Types.Input.Keyboard.CursorKeys;
  const keys = new Map<number, FakeKey>();
  const keyboard = {
    enabled: true,
    createCursorKeys: vi.fn(() => cursors),
    addKey: vi.fn((code: number) => {
      const next = key();
      keys.set(code, next);
      return next;
    }),
    addCapture: vi.fn(),
    removeCapture: vi.fn()
  };
  const scene = {
    physics: {
      add: {
        sprite: vi.fn((x: number, y: number) => {
          sprite.x = x;
          sprite.y = y;
          return sprite;
        })
      },
      world: {
        pause: vi.fn(),
        resume: vi.fn()
      }
    },
    input: { keyboard },
    time: { now: 100 }
  } as unknown as Phaser.Scene & {
    physics: {
      add: { sprite: ReturnType<typeof vi.fn> };
      world: { pause: ReturnType<typeof vi.fn>; resume: ReturnType<typeof vi.fn> };
    };
    input: { keyboard: typeof keyboard };
    time: { now: number };
  };

  return { scene, sprite, cursors, keys, keyboard };
}

const movement = {
  walkSpeed: 300,
  sprintSpeed: 600,
  jumpVelocityY: -500
};

describe('SideViewPlayerRuntime', () => {
  beforeEach(() => {
    bridgeActions.resetTouch();
  });

  it('spawns at the default start when no resume exists', () => {
    const { scene, sprite } = createScene();

    createSideViewPlayerRuntime({
      scene,
      start: { x: 10, y: 20 },
      sprite: { depth: 25, gravityY: 800 },
      movement,
      input: { allowJump: true, allowSprint: true }
    });

    expect(scene.physics.add.sprite).toHaveBeenCalledWith(10, 20, 'player_idle');
    expect(sprite.setDepth).toHaveBeenCalledWith(25);
    expect(sprite.setCollideWorldBounds).toHaveBeenCalledWith(true);
    expect(sprite.setGravityY).toHaveBeenCalledWith(800);
  });

  it('clamps resume positions when a resume clamp is provided', () => {
    const { scene } = createScene();

    createSideViewPlayerRuntime({
      scene,
      start: { x: 10, y: 20 },
      resumePosition: { x: -100, y: 999 },
      resumeClamp: { minX: 40, maxX: 960, minY: 120, maxY: 480 },
      sprite: { gravityY: 1000 },
      movement,
      input: { allowJump: true, allowSprint: true }
    });

    expect(scene.physics.add.sprite).toHaveBeenCalledWith(40, 480, 'player_idle');
  });

  it('steps movement input and applies active sprite animation', () => {
    const { scene, sprite, cursors } = createScene();
    cursors.right.isDown = true;

    const runtime = createSideViewPlayerRuntime({
      scene,
      start: { x: 10, y: 20 },
      sprite: { gravityY: 1000 },
      movement,
      input: { allowJump: true, allowSprint: false }
    });

    const result = runtime.update();

    expect(result.paused).toBe(false);
    if (!result.paused) {
      expect(result.commands.moveAxis).toBe(1);
      expect(result.step.moving).toBe(true);
    }
    expect(sprite.setVelocityX).toHaveBeenCalledWith(300);
    expect(sprite.setFlipX).toHaveBeenCalledWith(false);
    expect(sprite.setAngle).toHaveBeenCalledWith(Math.sin(1) * 5);
  });

  it('pauses controller, keyboard, and physics while zeroing velocity', () => {
    const { scene, sprite, keyboard } = createScene();
    const runtime = createSideViewPlayerRuntime({
      scene,
      start: { x: 10, y: 20 },
      sprite: { gravityY: 1000 },
      movement,
      input: { allowJump: true, allowSprint: true }
    });

    runtime.setPaused(true);

    expect(keyboard.enabled).toBe(false);
    expect(keyboard.removeCapture).toHaveBeenCalled();
    expect(scene.physics.world.pause).toHaveBeenCalled();
    expect(sprite.setVelocityX).toHaveBeenCalledWith(0);
  });

  it('returns a paused update and keeps velocity zero while paused', () => {
    const { scene, sprite } = createScene();
    const runtime = createSideViewPlayerRuntime({
      scene,
      start: { x: 10, y: 20 },
      sprite: { gravityY: 1000 },
      movement,
      input: { allowJump: true, allowSprint: true }
    });

    runtime.setPaused(true);
    sprite.setVelocityX.mockClear();

    expect(runtime.update()).toEqual({ paused: true });
    expect(sprite.setVelocityX).toHaveBeenCalledWith(0);
  });

  it('syncs idle and glasses textures only when equipment state changes', () => {
    const { scene, sprite } = createScene();
    let equipped = false;
    const runtime = createSideViewPlayerRuntime({
      scene,
      start: { x: 10, y: 20 },
      sprite: { gravityY: 1000 },
      movement,
      input: { allowJump: true, allowSprint: true },
      appearance: {
        isGlassesEquipped: () => equipped,
        idleTextureKey: 'player_idle',
        glassesTextureKey: 'player_glasses'
      }
    });

    runtime.syncAppearance();
    runtime.syncAppearance();
    equipped = true;
    runtime.syncAppearance();

    expect(sprite.setTexture).toHaveBeenCalledTimes(2);
    expect(sprite.setTexture).toHaveBeenNthCalledWith(1, 'player_idle');
    expect(sprite.setTexture).toHaveBeenNthCalledWith(2, 'player_glasses');
  });

  it('captures resume position and returns null when the sprite body is missing', () => {
    const { scene, sprite } = createScene();
    const runtime = createSideViewPlayerRuntime({
      scene,
      start: { x: 10, y: 20 },
      sprite: { gravityY: 1000 },
      movement,
      input: { allowJump: true, allowSprint: true }
    });

    sprite.x = 123;
    sprite.y = 456;
    expect(runtime.captureResume()).toEqual({ x: 123, y: 456 });

    sprite.body = undefined as unknown as typeof sprite.body;
    expect(runtime.captureResume()).toBeNull();
  });
});
