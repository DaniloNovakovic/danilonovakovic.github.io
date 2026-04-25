import { describe, expect, it } from 'vitest';
import {
  commandFrameToPlayerStepInput,
  createInputCommandFrame,
  resetInputCommandFrame
} from './commands';

describe('input command frame', () => {
  it('maps movement commands to player step input', () => {
    const frame = createInputCommandFrame();
    frame.moveAxis = -0.75;
    frame.sprint = true;
    frame.jump = true;
    frame.interact = true;

    expect(commandFrameToPlayerStepInput(frame)).toEqual({
      left: true,
      right: false,
      sprint: true,
      jump: true,
      interact: true,
      analogX: -0.75
    });
  });

  it('resets all commands in place', () => {
    const frame = createInputCommandFrame();
    frame.moveAxis = 1;
    frame.sprint = true;
    frame.jump = true;
    frame.interact = true;
    frame.exitContext = true;

    resetInputCommandFrame(frame);

    expect(frame).toEqual(createInputCommandFrame());
  });
});
