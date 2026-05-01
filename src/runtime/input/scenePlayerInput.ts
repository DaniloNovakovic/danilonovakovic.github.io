import type { InputCommandFrame } from '../../core/input/commands';
import { commandFrameToPlayerStepInput } from '../../core/input/commands';
import type { PlayerController, PlayerStepResult } from '../../core/player/PlayerController';
import { bridgeActions, getTouchState } from '../../shared/bridge/store';
import { readSceneInputCommands, type SceneInputKeys } from './readSceneInputCommands';

interface ReadPlayerSceneStepOptions extends SceneInputKeys {
  frame: InputCommandFrame;
  controller: PlayerController;
  allowJump: boolean;
  allowSprint: boolean;
  nowMs?: number;
}

export interface PlayerSceneStep {
  commands: InputCommandFrame;
  step: PlayerStepResult;
}

export function readPlayerSceneStep(options: ReadPlayerSceneStepOptions): PlayerSceneStep {
  const commands = readSceneInputCommands({
    frame: options.frame,
    cursors: options.cursors,
    wasd: options.wasd,
    interactKey: options.interactKey,
    hKey: options.hKey,
    escapeKey: options.escapeKey,
    touch: getTouchState(),
    oneShots: bridgeActions.consumeTouchOneShots(),
    allowJump: options.allowJump,
    allowSprint: options.allowSprint
  });

  return {
    commands,
    step: options.controller.step({
      ...commandFrameToPlayerStepInput(commands),
      nowMs: options.nowMs
    })
  };
}
