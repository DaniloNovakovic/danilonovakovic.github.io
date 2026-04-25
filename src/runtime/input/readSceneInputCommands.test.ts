import { describe, expect, it, vi } from 'vitest';
import type * as Phaser from 'phaser';
import { createInputCommandFrame } from '../../core/input/commands';
import type { TouchBridgeState } from '../../shared/bridge/store';

vi.mock('phaser', () => ({
  Input: {
    Keyboard: {
      JustDown: (key: { justDown?: boolean }) => key.justDown === true
    }
  }
}));

import { readSceneInputCommands } from './readSceneInputCommands';

const neutralTouch: TouchBridgeState = {
  left: 0,
  right: 0,
  jumpQueued: false,
  interactTap: false
};

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

describe('readSceneInputCommands', () => {
  it('maps keyboard movement, sprint, jump, and interact to commands', () => {
    const frame = readSceneInputCommands({
      frame: createInputCommandFrame(),
      cursors: cursors({ left: key(true), up: key(true), shift: key(true) }),
      wasd: { a: key(), d: key() },
      interactKey: key(false, true),
      touch: neutralTouch,
      oneShots: { jumpQueued: false, interactTap: false },
      allowJump: true,
      allowSprint: true
    });

    expect(frame).toEqual({
      moveAxis: -1,
      sprint: true,
      jump: true,
      interact: true,
      exitContext: false
    });
  });

  it('prefers touch movement over digital movement and consumes one-shot intent', () => {
    const frame = readSceneInputCommands({
      frame: createInputCommandFrame(),
      cursors: cursors({ left: key(true) }),
      wasd: { a: key(), d: key() },
      interactKey: key(),
      touch: { ...neutralTouch, right: 0.5 },
      oneShots: { jumpQueued: true, interactTap: true },
      allowJump: true,
      allowSprint: false
    });

    expect(frame.moveAxis).toBe(0.5);
    expect(frame.sprint).toBe(false);
    expect(frame.jump).toBe(true);
    expect(frame.interact).toBe(true);
  });

  it('maps H and Escape to exit context', () => {
    const frame = readSceneInputCommands({
      frame: createInputCommandFrame(),
      cursors: cursors(),
      wasd: { a: key(), d: key() },
      interactKey: key(),
      hKey: key(false, true),
      escapeKey: key(),
      touch: neutralTouch,
      oneShots: { jumpQueued: false, interactTap: false },
      allowJump: false,
      allowSprint: false
    });

    expect(frame.exitContext).toBe(true);
  });
});
