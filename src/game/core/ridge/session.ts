// Session dispatch mirrors many console verbs; complexity is the command surface.
// fallow-ignore-file complexity
import {
  advanceConversation,
  chooseInConversation,
  leaveConversation,
  startConversation
} from './conversation';
import { getRidgeHelpText, parseRidgeCommand, parseRidgeScript } from './commands';
import { formatObservation, observeRidgeWorld } from './observe';
import type {
  RidgeBridgeBeat,
  RidgeCommand,
  RidgeCommandResult,
  RidgeFacing,
  RidgeObservation,
  RidgeStageDefinition,
  RidgeWorldState
} from './types';

const DEFAULT_STEP = 0.05;

export interface RidgeSessionOptions {
  stage: RidgeStageDefinition;
  beat?: RidgeBridgeBeat;
  progress?: number;
  facing?: RidgeFacing;
  inventory?: readonly string[];
  flags?: Iterable<string>;
}

export class RidgeConsoleSession {
  private state: RidgeWorldState;
  private readonly stage: RidgeStageDefinition;

  constructor(options: RidgeSessionOptions) {
    this.stage = options.stage;
    this.state = {
      areaId: options.stage.areaId,
      title: options.stage.title,
      progress: clamp01(options.progress ?? 0.05),
      facing: options.facing ?? 'right',
      beat: options.beat ?? 'intro',
      mode: 'explore',
      flags: new Set(options.flags ?? []),
      inventory: [...(options.inventory ?? [])],
      conversation: null,
      lastMessage: null
    };
  }

  observe(): RidgeObservation {
    return observeRidgeWorld(this.state, this.stage);
  }

  format(): string {
    return formatObservation(this.observe());
  }

  exec(raw: string): RidgeCommandResult {
    return this.run(parseRidgeCommand(raw));
  }

  execScript(script: string): RidgeCommandResult[] {
    return parseRidgeScript(script).map((command) => this.run(command));
  }

  /** Continuous explore movement for Phaser (delta progress). */
  nudge(direction: RidgeFacing, deltaProgress: number): RidgeCommandResult {
    return this.run({ type: 'go', direction, steps: deltaProgress / DEFAULT_STEP });
  }

  run(command: RidgeCommand): RidgeCommandResult {
    switch (command.type) {
      case 'help':
        return this.ok(getRidgeHelpText());
      case 'look':
      case 'status':
        return this.ok(command.type === 'look' ? 'You take in the page.' : 'Status.');
      case 'inventory':
        return this.ok(
          this.state.inventory.length > 0
            ? `Inventory: ${this.state.inventory.join(', ')}`
            : 'Inventory is empty.'
        );
      case 'go':
        return this.handleGo(command.direction, command.steps ?? 1);
      case 'interact':
        return this.handleInteract(command.target);
      case 'advance':
        return this.handleAdvance();
      case 'choose':
        return this.handleChoose(command.choiceIdOrIndex);
      case 'leave':
        return this.handleLeave();
      case 'unknown':
        return this.fail(
          command.raw
            ? `Unknown command "${command.raw}". Type help.`
            : 'Empty command. Type help.'
        );
    }
  }

  private handleGo(direction: RidgeFacing, steps: number): RidgeCommandResult {
    if (this.state.mode !== 'explore') {
      return this.fail('Movement is halted during conversation. advance or leave.');
    }

    const delta = steps * DEFAULT_STEP * (direction === 'right' ? 1 : -1);
    let nextProgress = clamp01(this.state.progress + delta);
    let message = direction === 'right' ? 'You walk right.' : 'You walk left.';
    let blocked = false;

    const blockedAt = this.stage.blockedProgress;
    if (
      blockedAt !== undefined &&
      this.state.beat !== 'bridge_complete' &&
      this.state.beat !== 'concert_handoff' &&
      direction === 'right' &&
      nextProgress > blockedAt
    ) {
      nextProgress = blockedAt;
      blocked = true;
      message = 'The unfinished bridge blocks the way. Talk to the draftsperson or finish the crossing.';
    }

    this.state = {
      ...this.state,
      progress: nextProgress,
      facing: direction,
      lastMessage: message
    };

    return {
      ok: !blocked,
      message,
      observation: this.observe(),
      events: []
    };
  }

  private handleInteract(target?: string): RidgeCommandResult {
    if (this.state.mode === 'conversation') {
      return this.fail('Already in conversation. Use advance / choose / leave.');
    }

    const nearby = this.stage.resolveInteractables(this.state);
    if (nearby.length === 0) {
      return this.fail('Nothing in reach.');
    }

    const selected = target
      ? nearby.find(
          (item) =>
            item.spotId === target ||
            item.label.toLowerCase().includes(target.toLowerCase())
        )
      : nearby[0];

    if (!selected) {
      return this.fail(
        `No interactable matching "${target}". Nearby: ${nearby.map((n) => n.label).join(', ')}`
      );
    }

    const definition = this.stage.resolveConversation(selected.conversationId, this.state);
    if (!definition) {
      return this.fail(`No conversation for ${selected.label}.`);
    }

    const started = startConversation(this.state, definition);
    this.state = started.state;
    return {
      ok: true,
      message: this.state.lastMessage ?? 'Conversation started.',
      observation: this.observe(),
      events: started.events
    };
  }

  private handleAdvance(): RidgeCommandResult {
    if (this.state.mode !== 'conversation') {
      return this.fail('No active conversation.');
    }
    const result = advanceConversation(this.state);
    this.state = result.state;
    return {
      ok: true,
      message: result.message,
      observation: this.observe(),
      events: result.events
    };
  }

  private handleChoose(choiceIdOrIndex: string): RidgeCommandResult {
    if (this.state.mode !== 'conversation') {
      return this.fail('No active conversation.');
    }
    const result = chooseInConversation(this.state, choiceIdOrIndex);
    this.state = result.state;
    return {
      ok: result.message.startsWith('Unknown') ? false : true,
      message: result.message,
      observation: this.observe(),
      events: result.events
    };
  }

  private handleLeave(): RidgeCommandResult {
    const result = leaveConversation(this.state);
    this.state = result.state;
    return {
      ok: true,
      message: result.message,
      observation: this.observe(),
      events: result.events
    };
  }

  private ok(message: string): RidgeCommandResult {
    this.state = { ...this.state, lastMessage: message };
    return {
      ok: true,
      message,
      observation: this.observe(),
      events: []
    };
  }

  private fail(message: string): RidgeCommandResult {
    this.state = { ...this.state, lastMessage: message };
    return {
      ok: false,
      message,
      observation: this.observe(),
      events: []
    };
  }
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
