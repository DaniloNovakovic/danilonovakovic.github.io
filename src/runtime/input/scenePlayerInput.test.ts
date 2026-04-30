import { describe, expect, it, vi } from 'vitest';
import type * as Phaser from 'phaser';
import { createInputCommandFrame } from '../../core/input/commands';
import type { PlayerController } from '../../core/player/PlayerController';
import { bridgeActions } from '../../shared/bridge/store';

vi.mock('phaser', () => ({
  Input: {
    Keyboard: {
      JustDown: (key: { justDown?: boolean }) => key.justDown === true
    }
  }
}));

import { readPlayerSceneStep } from './scenePlayerInput';

function key(isDown = false, justDown = false): Phaser.Input.Keyboard.Key {
  return { isDown, justDown } as unknown as Phaser.Input.Keyboard.Key;
}

function cursors(
  overrides: Partial<Record<'left' | 'right' | 'up' | 'shift', Phaser.Input.Keyboard.Key>> = {}
): Phaser.Types.Input.Keyboard.CursorKeys {
  return {
    left: overrides.left ?? key(),
    right: overrides.right ?? key(),
    up: overrides.up ?? key(),
    shift: overrides.shift ?? key(),
    down: key(),
    space: key()
  } as Phaser.Types.Input.Keyboard.CursorKeys;
}

describe('readPlayerSceneStep', () => {
  it('reads bridge touch before consuming one-shots and steps controller once', () => {
    bridgeActions.resetTouch();
    bridgeActions.setTouchDirectional('right', 0.75);
    bridgeActions.queueJump();
    bridgeActions.tapInteract();
    const step = vi.fn(() => ({
      velocityX: 1,
      facingLeft: false,
      moving: true,
      interactRequested: true
    }));

    const result = readPlayerSceneStep({
      frame: createInputCommandFrame(),
      controller: { step } as unknown as PlayerController,
      cursors: cursors({ left: key(true) }),
      wasd: { a: key(), d: key() },
      interactKey: key(),
      allowJump: true,
      allowSprint: false,
      nowMs: 123
    });

    expect(result.commands.moveAxis).toBe(0.75);
    expect(result.commands.jump).toBe(true);
    expect(result.commands.interact).toBe(true);
    expect(step).toHaveBeenCalledWith({
      left: false,
      right: true,
      sprint: false,
      jump: true,
      interact: true,
      analogX: 0.75,
      nowMs: 123
    });

    const shots = bridgeActions.consumeTouchOneShots();
    expect(shots).toEqual({ jumpQueued: false, interactTap: false });
    bridgeActions.resetTouch();
  });
});
