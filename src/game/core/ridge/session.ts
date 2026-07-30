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
  RidgeAreaId,
  RidgeCommand,
  RidgeCommandResult,
  RidgeFacing,
  RidgeObservation,
  RidgeRouteBeat,
  RidgeSessionEvent,
  RidgeStageDefinition,
  RidgeStageRegistry,
  RidgeWorldState
} from './types';
import { RIDGE_INITIAL_BEAT } from './types';

const DEFAULT_STEP = 0.05;

export interface RidgeSessionOptions {
  /** Preferred: full multi-area registry for Compact Area Transitions. */
  stages?: RidgeStageRegistry;
  /** Legacy single-stage constructor (Bridge-only tests). */
  stage?: RidgeStageDefinition;
  areaId?: RidgeAreaId;
  beat?: RidgeRouteBeat;
  progress?: number;
  facing?: RidgeFacing;
  inventory?: readonly string[];
  flags?: Iterable<string>;
}

export class RidgeConsoleSession {
  private state: RidgeWorldState;
  private stage: RidgeStageDefinition;
  private readonly stages: RidgeStageRegistry | null;

  constructor(options: RidgeSessionOptions) {
    if (options.stages) {
      this.stages = options.stages;
      const areaId = options.areaId ?? 'bridge';
      this.stage = options.stages[areaId];
    } else if (options.stage) {
      this.stages = null;
      this.stage = options.stage;
    } else {
      throw new Error('RidgeConsoleSession requires stages or stage.');
    }

    this.state = {
      areaId: this.stage.areaId,
      title: this.stage.title,
      progress: clamp01(options.progress ?? 0.05),
      facing: options.facing ?? 'right',
      beat: options.beat ?? RIDGE_INITIAL_BEAT[this.stage.areaId],
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
    const crossingOpen = this.stage.isCrossingOpen?.(this.state) ?? true;
    if (
      blockedAt !== undefined &&
      !crossingOpen &&
      direction === 'right' &&
      nextProgress > blockedAt
    ) {
      nextProgress = blockedAt;
      blocked = true;
      message =
        this.stage.blockedMessage ??
        'Something blocks the way east. Talk to someone nearby.';
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
    return this.commitConversationResult(result);
  }

  private handleChoose(choiceIdOrIndex: string): RidgeCommandResult {
    if (this.state.mode !== 'conversation') {
      return this.fail('No active conversation.');
    }
    const result = chooseInConversation(this.state, choiceIdOrIndex);
    return this.commitConversationResult({
      ...result,
      ok: !result.message.startsWith('Unknown')
    });
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

  private commitConversationResult(result: {
    state: RidgeWorldState;
    events: RidgeSessionEvent[];
    message: string;
    ok?: boolean;
  }): RidgeCommandResult {
    this.state = result.state;
    const events = [...result.events];

    for (const event of result.events) {
      if (event.type === 'area_handoff') {
        this.applyAreaHandoff(event.areaId);
        events.push({ type: 'beat_changed', beat: this.state.beat });
      } else if (event.type === 'route_reset') {
        this.applyRouteReset();
        events.push({ type: 'beat_changed', beat: this.state.beat });
        events.push({ type: 'area_handoff', areaId: 'bridge' });
      }
    }

    return {
      ok: result.ok ?? true,
      message: result.message,
      observation: this.observe(),
      events
    };
  }

  private applyAreaHandoff(areaId: RidgeAreaId): void {
    if (!this.stages) {
      this.state = {
        ...this.state,
        areaId,
        beat: RIDGE_INITIAL_BEAT[areaId],
        progress: 0.05,
        facing: 'right',
        lastMessage: `The page turns toward ${areaId}.`
      };
      return;
    }

    this.stage = this.stages[areaId];
    this.state = {
      ...this.state,
      areaId,
      title: this.stage.title,
      beat: RIDGE_INITIAL_BEAT[areaId],
      progress: 0.05,
      facing: 'right',
      mode: 'explore',
      conversation: null,
      lastMessage: `Arrived: ${this.stage.title}`
    };
  }

  private applyRouteReset(): void {
    const bridge = this.stages?.bridge ?? this.stage;
    this.stage = bridge;
    this.state = {
      areaId: 'bridge',
      title: bridge.title,
      progress: 0.05,
      facing: 'right',
      beat: 'intro',
      mode: 'explore',
      flags: new Set(),
      inventory: [],
      conversation: null,
      lastMessage: 'For Cicka. The page begins again at the Bridge.'
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
