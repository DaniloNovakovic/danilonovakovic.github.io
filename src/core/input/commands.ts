import type { PlayerStepInput } from '../player/PlayerController';

export interface InputCommandFrame {
  moveAxis: number;
  sprint: boolean;
  jump: boolean;
  interact: boolean;
  exitContext: boolean;
}

export function createInputCommandFrame(): InputCommandFrame {
  return {
    moveAxis: 0,
    sprint: false,
    jump: false,
    interact: false,
    exitContext: false
  };
}

export function resetInputCommandFrame(frame: InputCommandFrame): void {
  frame.moveAxis = 0;
  frame.sprint = false;
  frame.jump = false;
  frame.interact = false;
  frame.exitContext = false;
}

export function commandFrameToPlayerStepInput(frame: InputCommandFrame): PlayerStepInput {
  return {
    left: frame.moveAxis < 0,
    right: frame.moveAxis > 0,
    sprint: frame.sprint,
    jump: frame.jump,
    interact: frame.interact,
    analogX: frame.moveAxis
  };
}
