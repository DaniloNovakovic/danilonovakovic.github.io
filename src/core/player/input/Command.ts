/**
 * The logical state of player input for a single frame.
 * This is what Commands manipulate.
 */
export interface PlayerInputState {
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  interact: boolean;
  analogX: number;
}

/**
 * Command Pattern: Decouples the physical input (keys, touch)
 * from the logical action (Move, Jump, Interact).
 */
export interface Command {
  execute(state: PlayerInputState): void;
}

/**
 * Sets horizontal movement direction and speed multiplier.
 *
 * PERFORMANCE NOTE: In a pure Command pattern, instances are immutable.
 * However, allocating a new MoveCommand 60 times a second creates severe
 * Garbage Collection (GC) pressure in JS/TS. We use a hybrid Object Pool
 * approach (a pool of size 1) by mutating a single instance via .set()
 * before returning it for the current frame. See docs/patterns/command.md.
 */
export class MoveCommand implements Command {
  constructor(
    private axis: number = 0,
    private sprint: boolean = false
  ) {}

  /** Internal use for reusing instances. */
  set(axis: number, sprint: boolean): this {
    this.axis = axis;
    this.sprint = sprint;
    return this;
  }

  execute(state: PlayerInputState): void {
    state.analogX = this.axis;
    state.left = this.axis < 0;
    state.right = this.axis > 0;
    state.sprint = this.sprint;
  }
}

/** Sets the intent to jump this frame. */
export class JumpCommand implements Command {
  execute(state: PlayerInputState): void {
    state.jump = true;
  }
}

/** Sets the intent to interact this frame. */
export class InteractCommand implements Command {
  execute(state: PlayerInputState): void {
    state.interact = true;
  }
}
