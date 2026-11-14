// Session dispatch mirrors many console verbs; complexity is the command surface.
// fallow-ignore-file complexity
import {
  advanceConversation,
  chooseInConversation,
  leaveConversation,
  startConversation
} from './conversation';
import {
  BLUEPRINT_BRIDGE_PUZZLE,
  BridgeWorkbench,
  type BridgeBuildAction,
  type BridgeDesign
} from './bridgeBuilder';
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
import { RIDGE_GUITAR_ITEM, RIDGE_INITIAL_BEAT, ridgeNextArea } from './types';

const DEFAULT_STEP = 0.05;
const BRIDGE_BUILT_CONVERSATION = 'bridge.draftsperson.bridge_built';
const TOY_CAR_SHARED_FLAG = 'toy_car_shared';
const BRIDGE_BUILD_STARTED_FLAG = 'bridge_build_started';

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
  /** A span the player already proved, restored when re-entering Ridge. */
  builtBridge?: BridgeDesign | null;
}

export class RidgeConsoleSession {
  private state: RidgeWorldState;
  private stage: RidgeStageDefinition;
  private readonly stages: RidgeStageRegistry | null;
  private workbench: BridgeWorkbench | null = null;

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
      lastMessage: null,
      builtBridge: options.builtBridge ?? null
    };
  }

  observe(): RidgeObservation {
    return observeRidgeWorld(this.state, this.stage, this.workbench);
  }

  /** Live workbench while the Blueprint Bridge is being drawn, for presentation. */
  get bridgeWorkbench(): BridgeWorkbench | null {
    return this.state.mode === 'bridgeBuild' ? this.workbench : null;
  }

  /** Advance an animated bridge test by one fixed frame (Phaser drives this). */
  stepBridgeTest(): void {
    if (this.state.mode === 'bridgeBuild') this.workbench?.stepTest();
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
      case 'skip':
        return this.handleSkip();
      case 'warp':
        return this.handleWarp(command.areaId);
      case 'build':
        return this.handleBuild(command.action);
      case 'unknown':
        return this.fail(
          command.raw
            ? `Unknown command "${command.raw}". Type help.`
            : 'Empty command. Type help.'
        );
    }
  }

  private handleGo(direction: RidgeFacing, steps: number): RidgeCommandResult {
    if (this.state.mode === 'bridgeBuild') {
      return this.fail('You are at the drawing table. build leave to step away.');
    }
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
      const blockedMessage = this.stage.blockedMessage;
      message =
        (typeof blockedMessage === 'function'
          ? blockedMessage(this.state)
          : blockedMessage) ??
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
    if (this.state.mode === 'bridgeBuild') {
      return this.fail('You are at the drawing table. Use build … or build leave.');
    }

    const nearby = [...this.stage.resolveInteractables(this.state)].sort(
      (a, b) => a.distance - b.distance
    );
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
    if (this.state.mode === 'bridgeBuild') return this.closeBridgeBuild();
    const result = leaveConversation(this.state);
    this.state = result.state;
    return {
      ok: true,
      message: result.message,
      observation: this.observe(),
      events: result.events
    };
  }

  private handleSkip(): RidgeCommandResult {
    const next = ridgeNextArea(this.state.areaId);
    if (!next) {
      return this.fail('Already at Relay. Use: warp bridge|concert|dance|relay');
    }
    return this.handleWarp(next);
  }

  private handleWarp(areaId: RidgeAreaId): RidgeCommandResult {
    if (!this.stages && areaId !== this.stage.areaId) {
      return this.fail('Warp needs the full route registry (use pnpm ridge:console).');
    }

    this.applyAreaHandoff(areaId);
    this.state = {
      ...this.state,
      inventory: inventoryForArea(areaId),
      flags: new Set(),
      lastMessage: `DEV warp → ${this.stage.title}`
    };

    return {
      ok: true,
      message: this.state.lastMessage ?? `Warped to ${areaId}.`,
      observation: this.observe(),
      events: [
        { type: 'area_handoff', areaId },
        { type: 'beat_changed', beat: this.state.beat }
      ]
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
      } else if (event.type === 'bridge_build_opened') {
        this.openBridgeBuild();
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
    this.workbench = null;
    if (areaId === 'bridge') this.state = { ...this.state, builtBridge: null };
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
    this.workbench = null;
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
      lastMessage: 'For Cicka. The page begins again at the Bridge.',
      builtBridge: null
    };
  }

  private handleBuild(action: BridgeBuildAction): RidgeCommandResult {
    const workbench = this.workbench;
    if (this.state.mode !== 'bridgeBuild' || !workbench) {
      return this.fail('The drawing table is not open. Bring the toy car to the Draftsperson.');
    }
    if (action.kind === 'leave') return this.closeBridgeBuild();

    const result = workbench.apply(action);
    if (result.ok && action.kind === 'done') return this.finishBridgeBuild(workbench.design);
    return result.ok ? this.ok(result.message) : this.fail(result.message);
  }

  private openBridgeBuild(): void {
    const workbench = (this.workbench ??= new BridgeWorkbench(BLUEPRINT_BRIDGE_PUZZLE));
    if (workbench.phase === 'testing' || workbench.phase === 'failed') {
      workbench.apply({ kind: 'edit' });
    }
    const flags = new Set(this.state.flags);
    flags.add(BRIDGE_BUILD_STARTED_FLAG);
    this.state = {
      ...this.state,
      mode: 'bridgeBuild',
      conversation: null,
      flags,
      lastMessage: 'The blueprint table unrolls across the gap.'
    };
  }

  /** Step away from the table. The drawing stays for when the player returns. */
  private closeBridgeBuild(): RidgeCommandResult {
    if (this.workbench?.phase === 'testing' || this.workbench?.phase === 'failed') {
      this.workbench.apply({ kind: 'edit' });
    }
    this.state = {
      ...this.state,
      mode: 'explore',
      lastMessage: 'You step back from the drawing table.'
    };
    return {
      ok: true,
      message: 'You step back from the drawing table.',
      observation: this.observe(),
      events: [{ type: 'bridge_build_closed' }]
    };
  }

  private finishBridgeBuild(design: BridgeDesign): RidgeCommandResult {
    this.workbench = null;
    const flags = new Set(this.state.flags);
    flags.delete(TOY_CAR_SHARED_FLAG);
    this.state = {
      ...this.state,
      mode: 'explore',
      beat: 'bridge_complete',
      flags,
      builtBridge: design
    };

    const events: RidgeSessionEvent[] = [
      { type: 'bridge_build_closed' },
      { type: 'bridge_built', design },
      { type: 'beat_changed', beat: 'bridge_complete' },
      { type: 'flag_changed', flag: TOY_CAR_SHARED_FLAG, present: false }
    ];

    const thanks = this.stage.resolveConversation(BRIDGE_BUILT_CONVERSATION, this.state);
    if (thanks) {
      const started = startConversation(this.state, thanks);
      this.state = started.state;
      events.push(...started.events);
    }

    return {
      ok: true,
      message: 'The sketch firms into a real bridge.',
      observation: this.observe(),
      events
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

function inventoryForArea(areaId: RidgeAreaId): string[] {
  if (areaId === 'danceFestival' || areaId === 'relay') {
    return [RIDGE_GUITAR_ITEM];
  }
  return [];
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
