import * as Phaser from 'phaser';
import { bridgeStore, bridgeActions } from '../../shared/bridge/store';
import {
  MoveCommand,
  JumpCommand,
  InteractCommand,
  type Command
} from '../../core/player/input/Command';

export interface InputMapperConfig {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey: Phaser.Input.Keyboard.Key;
}

/**
 * InputMapper translates hardware input (keyboard, touch)
 * into logical Command objects.
 */
export class InputMapper {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  private interactKey: Phaser.Input.Keyboard.Key;

  // Pre-allocate exactly one instance of each command to prevent
  // per-frame garbage collection (GC) pauses during the game loop.
  // This acts as a micro Object Pool for our ephemeral commands.
  private readonly moveCommand = new MoveCommand();
  private readonly jumpCommand = new JumpCommand();
  private readonly interactCommand = new InteractCommand();
  private readonly commandsOut: Command[] = [];

  constructor(config: InputMapperConfig) {
    this.cursors = config.cursors;
    this.wasd = config.wasd;
    this.interactKey = config.interactKey;
  }

  /**
   * Evaluates current input state and returns a list of Commands to execute.
   * NOTE: The returned array is ephemeral and reused every frame. Do not store references.
   * @param allowJump Whether jump commands are permitted in the current context.
   * @param allowSprint Whether sprint speed is permitted in the current context.
   */
  getCommands(allowJump: boolean, allowSprint: boolean): readonly Command[] {
    this.commandsOut.length = 0;

    const touchState = bridgeStore.getState().touch;
    const oneShots = bridgeActions.consumeTouchOneShots();

    // --- Horizontal Movement ---
    const keyboardLeft = this.cursors.left.isDown || this.wasd.a.isDown;
    const keyboardRight = this.cursors.right.isDown || this.wasd.d.isDown;
    const touchIntensity = touchState.right - touchState.left;

    const isKeyboardActive = keyboardLeft || keyboardRight;
    let axis = touchIntensity;

    // Keyboard overrides touch for precision if held
    if (keyboardLeft && !keyboardRight) axis = -1;
    if (keyboardRight && !keyboardLeft) axis = 1;
    if (keyboardLeft && keyboardRight) axis = 0;

    // Sprinting:
    // 1. Keyboard requires Shift.
    // 2. Touch always allows the full range up to sprintSpeed if allowed.
    const isSprinting = allowSprint && (
      (isKeyboardActive && this.cursors.shift.isDown) ||
      (!isKeyboardActive && touchIntensity !== 0)
    );

    if (axis !== 0) {
      this.commandsOut.push(this.moveCommand.set(axis, isSprinting));
    }

    // --- Jump ---
    const jumpPressed = this.cursors.up.isDown || oneShots.jumpQueued;
    if (allowJump && jumpPressed) {
      this.commandsOut.push(this.jumpCommand);
    }

    // --- Interaction ---
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.interactKey) || oneShots.interactTap;
    if (interactPressed) {
      this.commandsOut.push(this.interactCommand);
    }

    return this.commandsOut;
  }
}
