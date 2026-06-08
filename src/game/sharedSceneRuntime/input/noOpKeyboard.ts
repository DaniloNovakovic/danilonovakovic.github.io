import * as Phaser from 'phaser';
import type { SceneInputKeys } from './readSceneInputCommands';

function noOpKey(): Phaser.Input.Keyboard.Key {
  return { isDown: false } as Phaser.Input.Keyboard.Key;
}

function noOpCursors(): Phaser.Types.Input.Keyboard.CursorKeys {
  return {
    left: noOpKey(),
    right: noOpKey(),
    up: noOpKey(),
    shift: noOpKey(),
    down: noOpKey(),
    space: noOpKey()
  } as Phaser.Types.Input.Keyboard.CursorKeys;
}

export function bindSideViewKeyboard(
  keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null | undefined,
  options: { includeEscapeKey?: boolean } = {}
): SceneInputKeys {
  const bindings: SceneInputKeys = {
    cursors: keyboard?.createCursorKeys() ?? noOpCursors(),
    wasd: {
      a: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A) ?? noOpKey(),
      d: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D) ?? noOpKey(),
      w: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W) ?? noOpKey(),
      s: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S) ?? noOpKey()
    },
    interactKey: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? noOpKey(),
    hKey: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H) ?? noOpKey()
  };

  if (options.includeEscapeKey) {
    bindings.escapeKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC) ?? noOpKey();
  }

  return bindings;
}
