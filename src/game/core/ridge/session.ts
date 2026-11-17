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
import { CICKA_DUEL_LOST_FLAG, CICKA_RESPECT_FLAG, CickaDuel } from './cickaDuel';
import {
  CONCERT_PRACTICE_ASSISTED_FLAG,
  ConcertGig,
  concertGradeFlag,
  GIG_GRADES,
  playNextNotePerfectly,
  type GigLane,
  type GigMode,
  type GigStrumResult
} from './concertGig';
import { getRidgeHelpText, parseRidgeCommand, parseRidgeScript } from './commands';
import { formatObservation, observeRidgeWorld } from './observe';
import type {
  RidgeAreaId,
  RidgeCommand,
  RidgeCommandResult,
  RidgeDuelAction,
  RidgeFacing,
  RidgeGigAction,
  RidgeObservation,
  RidgeRouteBeat,
  RidgeSessionEvent,
  RidgeStageDefinition,
  RidgeStageRegistry,
  RidgeWorldState
} from './types';
import { RIDGE_GUITAR_ITEM, RIDGE_INITIAL_BEAT, ridgeNextArea } from './types';

const DEFAULT_STEP = 0.05;
/** Stage distance the player keeps from Cicka during the standoff. */
const DUEL_SPACING = 0.045;
const BRIDGE_BUILT_CONVERSATION = 'bridge.draftsperson.bridge_built';
const TOY_CAR_SHARED_FLAG = 'toy_car_shared';
const BRIDGE_BUILD_STARTED_FLAG = 'bridge_build_started';
const CICKA_DUEL_WON_CONVERSATION = 'bridge.cicka.duel_won';
const CICKA_DUEL_LOST_CONVERSATION = 'bridge.cicka.duel_lost';
const GIG_PRACTICE_DONE_CONVERSATION = 'concert.gig.practice_done';
const GIG_SHOW_DONE_CONVERSATION = 'concert.gig.show_done';
/** Song-time step for console waits when no target is given. */
const GIG_WAIT_LEAD_MS = 1;

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
  private duel: CickaDuel | null = null;
  private gig: ConcertGig | null = null;

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
    return observeRidgeWorld(this.state, this.stage, this.workbench, this.duel, this.gig);
  }

  /** Live concert gig while practicing or playing, for presentation. */
  get concertGig(): ConcertGig | null {
    return this.state.mode === 'concertGig' ? this.gig : null;
  }

  /** Move the song playhead to `timeMs` (the adapter's audio clock drives this). */
  advanceConcertGig(timeMs: number): void {
    if (this.state.mode === 'concertGig') this.gig?.advance(timeMs);
  }

  /** Strum a lane at song time `atMs`. The adapter voices the result. */
  strumConcertGig(lane: GigLane, atMs: number): GigStrumResult {
    if (this.state.mode !== 'concertGig' || !this.gig) return { kind: 'ignored' };
    return this.gig.strum(lane, atMs);
  }

  /** Live workbench while the Blueprint Bridge is being drawn, for presentation. */
  get bridgeWorkbench(): BridgeWorkbench | null {
    return this.state.mode === 'bridgeBuild' ? this.workbench : null;
  }

  /** Advance an animated bridge test by one fixed frame (Phaser drives this). */
  stepBridgeTest(): void {
    if (this.state.mode === 'bridgeBuild') this.workbench?.stepTest();
  }

  /** Live standoff while dodging Cicka, for presentation. */
  get cickaDuel(): CickaDuel | null {
    return this.state.mode === 'cickaDuel' ? this.duel : null;
  }

  /** Advance the standoff by one fixed frame (Phaser drives this). */
  stepCickaDuel(): void {
    if (this.state.mode === 'cickaDuel') this.duel?.step();
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
      case 'duel':
        return this.handleDuel(command.action);
      case 'gig':
        return this.handleGig(command.action);
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
    if (this.state.mode === 'cickaDuel') {
      return this.fail('Cicka has you pinned with a stare. duel dodge or duel wait.');
    }
    if (this.state.mode === 'concertGig') {
      return this.fail('You are mid-song. gig hit or gig wait.');
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
    if (this.state.mode === 'cickaDuel') {
      return this.fail('Eyes on the paw. duel dodge or duel wait.');
    }
    if (this.state.mode === 'concertGig') {
      return this.fail('Eyes on the notes. gig hit or gig wait.');
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
    if (this.state.mode === 'cickaDuel') return this.fail('No backing out now. Cicka is mid-wiggle.');
    if (this.state.mode === 'concertGig') return this.leaveConcertGig();
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
      } else if (event.type === 'cicka_duel_opened') {
        this.openCickaDuel();
      } else if (event.type === 'concert_gig_opened') {
        this.openConcertGig(event.mode);
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
    this.duel = null;
    this.gig = null;
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
    this.duel = null;
    this.gig = null;
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

  private handleDuel(action: RidgeDuelAction): RidgeCommandResult {
    const duel = this.duel;
    if (this.state.mode !== 'cickaDuel' || !duel) {
      return this.fail('Cicka is not squaring up. Keep the toy car if you want to find out.');
    }
    switch (action.kind) {
      case 'dodge': {
        const result = duel.dodge();
        return result.ok ? this.ok(result.message) : this.fail(result.message);
      }
      case 'wait': {
        if (duel.phase !== 'fighting') return this.fail('The standoff is over. duel done.');
        if (action.frames === undefined) {
          duel.waitForNextLanding();
        } else {
          for (let i = 0; i < action.frames; i += 1) duel.step();
        }
        return this.ok(duel.lastResult ? `Last landing: ${duel.lastResult.result}.` : 'You hold still.');
      }
      case 'done':
        if (duel.phase === 'fighting') return this.fail('Cicka is not done with you yet.');
        return this.finishCickaDuel(duel.phase === 'won');
    }
  }

  private openCickaDuel(): void {
    this.duel = new CickaDuel();
    // Square up: give Cicka room to lunge, and face her.
    const cicka = this.stage.resolveActors(this.state).find((actor) => actor.id === 'cicka');
    const offset = cicka ? this.state.progress - cicka.progress : 0;
    const side = offset >= 0 ? 1 : -1;
    const progress = cicka
      ? clamp01(cicka.progress + side * Math.max(DUEL_SPACING, Math.abs(offset)))
      : this.state.progress;
    this.state = {
      ...this.state,
      progress,
      facing: side > 0 ? 'left' : 'right',
      mode: 'cickaDuel',
      conversation: null,
      lastMessage: 'Cicka plants herself on the car. Her tail lashes. This is a test.'
    };
  }

  /** Win: she respects you and hands over the car. Loss: she keeps it, for now. */
  private finishCickaDuel(won: boolean): RidgeCommandResult {
    this.duel = null;
    const flags = new Set(this.state.flags);
    const events: RidgeSessionEvent[] = [{ type: 'cicka_duel_closed', won }];
    const flag = won ? CICKA_RESPECT_FLAG : CICKA_DUEL_LOST_FLAG;
    flags.add(flag);
    events.push({ type: 'flag_changed', flag, present: true });
    this.state = { ...this.state, mode: 'explore', flags };

    const followUp = this.stage.resolveConversation(
      won ? CICKA_DUEL_WON_CONVERSATION : CICKA_DUEL_LOST_CONVERSATION,
      this.state
    );
    if (followUp) {
      const started = startConversation(this.state, followUp);
      this.state = started.state;
      events.push(...started.events);
    }
    const message = won ? 'Cicka sits back. Something has changed.' : 'Cicka keeps the car. For now.';
    return { ok: true, message, observation: this.observe(), events };
  }

  private handleGig(action: RidgeGigAction): RidgeCommandResult {
    const gig = this.gig;
    if (this.state.mode !== 'concertGig' || !gig) {
      return this.fail('No song is playing. Steve can teach you the riff.');
    }
    if (action.kind === 'done') {
      if (gig.phase !== 'finished') return this.fail('The song is still going.');
      return this.finishConcertGig(gig);
    }
    if (gig.phase === 'finished') return this.fail('The last chord already rang out. gig done.');

    switch (action.kind) {
      case 'hit': {
        if (action.lane === undefined) {
          const results = playNextNotePerfectly(gig);
          return results.length > 0 ? this.ok(describeStrums(results)) : this.fail('No notes left to play.');
        }
        return this.ok(describeStrums([gig.strum(action.lane)]));
      }
      case 'wait': {
        const next = gig.nextPendingNote();
        const target =
          action.ms !== undefined
            ? gig.timeMs + action.ms
            : next
              ? next.timeMs - GIG_WAIT_LEAD_MS
              : gig.song.endMs + 1;
        gig.advance(Math.max(target, gig.timeMs + GIG_WAIT_LEAD_MS));
        return this.ok(gigOver(gig) ? 'The last chord rings out.' : 'The band plays on.');
      }
      case 'auto':
        while (!gigOver(gig) && gig.nextPendingNote()) playNextNotePerfectly(gig);
        gig.finish();
        return this.ok('Every note lands.');
      case 'skip':
        gig.finish();
        return this.ok('The song plays out around you.');
    }
  }

  private openConcertGig(mode: GigMode): void {
    this.gig = new ConcertGig({
      mode,
      startHype: this.stage.concertGigStartHype?.(this.state, mode)
    });
    this.state = {
      ...this.state,
      mode: 'concertGig',
      conversation: null,
      lastMessage: mode === 'practice' ? 'Steve counts you in, slowly.' : 'Lights up. The drummer clicks four.'
    };
  }

  /** Practice can be put down; the show goes on. */
  private leaveConcertGig(): RidgeCommandResult {
    const gig = this.gig;
    if (!gig || gig.mode === 'show') return this.fail('The show must go on.');
    this.gig = null;
    this.state = { ...this.state, mode: 'explore', lastMessage: 'You set the riff down for now.' };
    return {
      ok: true,
      message: 'You set the riff down for now.',
      observation: this.observe(),
      events: [{ type: 'concert_gig_closed', mode: gig.mode, grade: gig.grade, passed: false }]
    };
  }

  /** Practice opens the show; the show clears the crossing. Steve reacts either way. */
  private finishConcertGig(gig: ConcertGig): RidgeCommandResult {
    // Step off where the performance left you (the stage), not where you stood before.
    const performer = this.stage.resolveActors(this.state).find((actor) => actor.id === 'player');
    this.gig = null;
    const flags = new Set(this.state.flags);
    const events: RidgeSessionEvent[] = [
      { type: 'concert_gig_closed', mode: gig.mode, grade: gig.grade, passed: gig.passed }
    ];
    let beat = this.state.beat;

    if (gig.mode === 'practice') {
      if (gig.passed) flags.delete(CONCERT_PRACTICE_ASSISTED_FLAG);
      else flags.add(CONCERT_PRACTICE_ASSISTED_FLAG);
      if (beat === 'concert_arrival') beat = 'concert_practiced';
    } else {
      for (const grade of GIG_GRADES) flags.delete(concertGradeFlag(grade));
      flags.add(concertGradeFlag(gig.grade));
      events.push({ type: 'flag_changed', flag: concertGradeFlag(gig.grade), present: true });
      beat = 'concert_cleared';
    }
    if (beat !== this.state.beat) events.push({ type: 'beat_changed', beat });

    this.state = {
      ...this.state,
      mode: 'explore',
      beat,
      flags,
      progress: performer?.progress ?? this.state.progress
    };

    const followUp = this.stage.resolveConversation(
      gig.mode === 'practice' ? GIG_PRACTICE_DONE_CONVERSATION : GIG_SHOW_DONE_CONVERSATION,
      this.state
    );
    if (followUp) {
      const started = startConversation(this.state, followUp);
      this.state = started.state;
      events.push(...started.events);
    }
    const message = gig.mode === 'practice' ? 'The riff settles into your fingers.' : `The crowd roars. (${gig.grade})`;
    return { ok: true, message, observation: this.observe(), events };
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

/** Read fresh: the playhead moves under a narrowed `phase`. */
function gigOver(gig: ConcertGig): boolean {
  return gig.phase === 'finished';
}

function describeStrums(results: readonly GigStrumResult[]): string {
  return results
    .map((result) =>
      result.kind === 'hit'
        ? `${result.hit.judgment} (lane ${result.hit.lane})`
        : result.kind === 'stray'
          ? `nothing to strum on lane ${result.lane}`
          : 'ignored'
    )
    .join(', ');
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
