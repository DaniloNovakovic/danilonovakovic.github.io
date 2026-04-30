import * as Phaser from 'phaser';
import type { TouchBridgeState } from '../../shared/bridge/store';
import type { InputCommandFrame } from '../../core/input/commands';
import { resetInputCommandFrame } from '../../core/input/commands';

export interface SceneInputKeys {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey: Phaser.Input.Keyboard.Key;
  hKey?: Phaser.Input.Keyboard.Key;
  escapeKey?: Phaser.Input.Keyboard.Key;
}

interface ReadSceneInputOptions extends SceneInputKeys {
  frame: InputCommandFrame;
  touch: TouchBridgeState;
  oneShots: { jumpQueued: boolean; interactTap: boolean };
  allowJump: boolean;
  allowSprint: boolean;
}

export function readSceneInputCommands(options: ReadSceneInputOptions): InputCommandFrame {
  const { frame, cursors, wasd, interactKey, hKey, escapeKey, touch, oneShots } = options;
  resetInputCommandFrame(frame);

  const digitalAxis =
    cursors.left.isDown || wasd.a.isDown ? -1 : cursors.right.isDown || wasd.d.isDown ? 1 : 0;
  const touchAxis = touch.right - touch.left;
  frame.moveAxis = touchAxis !== 0 ? touchAxis : digitalAxis;
  frame.sprint = options.allowSprint && cursors.shift.isDown;
  frame.jump = options.allowJump && (cursors.up.isDown || oneShots.jumpQueued);
  frame.interact = Phaser.Input.Keyboard.JustDown(interactKey) || oneShots.interactTap;
  frame.exitContext =
    (hKey ? Phaser.Input.Keyboard.JustDown(hKey) : false) ||
    (escapeKey ? Phaser.Input.Keyboard.JustDown(escapeKey) : false);

  return frame;
}
