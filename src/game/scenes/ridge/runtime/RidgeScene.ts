import * as Phaser from 'phaser';
import {
  bridgeActions,
  bridgeStore,
  type OpenOverlayOptions,
  type RidgeRouteBeatState
} from '@/game/bridge/store';
import {
  BRIDGE_SIM_DT,
  CICKA_DUEL_DT,
  createRidgeRouteStages,
  RidgeConsoleSession,
  RIDGE_GUITAR_ITEM,
  RIDGE_INITIAL_BEAT,
  ridgePrevArea,
  type BridgeBuildAction,
  type RidgeActorId,
  type RidgeAreaId,
  type RidgeCommandResult,
  type RidgeObservation,
  type RidgeSessionEvent
} from '@/game/core/ridge';
import { portraitForSpeaker } from '../content/castRegistry';
import { type OverlayId } from '@/game/overlays/overlayIds';
import { PHASER_SCENE_KEYS, RIDGE_SCENE_ID } from '@/game/scenes/sceneIds';
import {
  createInputCommandFrame,
  type InputCommandFrame
} from '@/game/core/input/commands';
import {
  readSceneInputCommands,
  type SceneInputKeys
} from '@/game/sharedSceneRuntime/input/readSceneInputCommands';
import { bindSideViewKeyboard } from '@/game/sharedSceneRuntime/input/sceneKeyboard';
import { StickVisualProvider } from '../art/stick/StickVisualProvider';
import { toRidgeVisualViewModel, type RidgeVisualViewModel } from '../art/types';
import { speakerSideFor } from '../art/conversationStaging';
import { loadRidgePresenceCatalog } from '../content/presenceCatalog';
import { loadRidgeRouteDialogueCatalog } from '../content/routeCatalog';
import type { RidgeConversationPanelView } from '../sceneUi/RidgeConversationPanel';
import type {
  RidgeBridgeBuilderPanelView,
  RidgeBridgeCommand,
  RidgeBridgeTool
} from '../sceneUi/RidgeBridgeBuilderPanel';
import type { RidgeCickaDuelPanelView } from '../sceneUi/RidgeCickaDuelPanel';
import { stageCickaDuel } from '../art/duelStaging';
import { BridgeBuilderView } from './BridgeBuilderView';
import { CickaDuelView } from './CickaDuelView';
import type { RidgeDevControls } from './ridgeDevControls';

interface RidgeSceneStartData {
  onClose?: () => void;
  onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused?: boolean;
  getRidgeDevControls?: () => RidgeDevControls | undefined;
}

const WALK_SPEED = 0.18; // progress units per second
/** How long the toy car's victory lap plays before the Draftsperson speaks. */
const BRIDGE_CELEBRATE_MS = 2200;
/** How long the standoff's last moment holds before Cicka reacts. */
const DUEL_OUTRO_MS = 1300;
/** Catch-up cap so a hitch never fast-forwards the bridge test. */
const MAX_SIM_STEPS_PER_FRAME = 4;

const BRIDGE_COMMAND_ACTIONS: Record<RidgeBridgeCommand, BridgeBuildAction> = {
  undo: { kind: 'undo' },
  clear: { kind: 'clear' },
  hint: { kind: 'hint' },
  sketch: { kind: 'sketch' },
  test: { kind: 'test', instant: false },
  stop: { kind: 'edit' },
  edit: { kind: 'edit' },
  leave: { kind: 'leave' }
};

/**
 * Thin Phaser adapter over RidgeConsoleSession + StickVisualProvider.
 * Gameplay decisions live in core; this scene only reads input and paints.
 */
export class RidgeScene extends Phaser.Scene {
  private session?: RidgeConsoleSession;
  private visuals?: StickVisualProvider;
  private keys?: SceneInputKeys;
  private readonly inputFrame: InputCommandFrame = createInputCommandFrame();
  private onClose: () => void = () => {};
  private isPaused = false;
  private getRidgeDevControls?: () => RidgeDevControls | undefined;
  private lastPanelKey: string | null = null;
  private builder?: BridgeBuilderView;
  private bridgeTool: RidgeBridgeTool = 'road';
  private simAccumulator = 0;
  private celebrateMs = 0;
  private duelView?: CickaDuelView;
  private duelAccumulator = 0;
  private duelOutroMs = 0;
  private lastDevSnapshotKey = '';
  private nextKey?: Phaser.Input.Keyboard.Key;
  private prevKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super(PHASER_SCENE_KEYS.ridge);
  }

  init(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? (() => {});
    this.isPaused = data.isPaused ?? false;
    this.getRidgeDevControls = import.meta.env.DEV ? data.getRidgeDevControls : undefined;
  }

  create(): void {
    const route = bridgeStore.getState().progress.ridge.firstPlayableRoute;
    const areaId = route.activeAreaId;
    const hasGuitar =
      route.beat === 'concert_cleared' ||
      areaId === 'danceFestival' ||
      areaId === 'relay';

    this.session = new RidgeConsoleSession({
      stages: createRidgeRouteStages(loadRidgeRouteDialogueCatalog()),
      areaId,
      beat: route.beat,
      progress: 0.05,
      inventory: hasGuitar ? [RIDGE_GUITAR_ITEM] : [],
      builtBridge:
        areaId === 'bridge' && route.beat === 'bridge_complete' ? (route.bridgeDesign ?? null) : null
    });

    const presence = loadRidgePresenceCatalog();
    this.visuals = new StickVisualProvider(this, {
      roles: presence.roles,
      barks: presence.barks
    });
    // No Escape binding: Esc belongs to the conversation box (step back), and
    // leaving Ridge is the header Back button, so a stray Esc never exits.
    this.keys = bindSideViewKeyboard(this.input.keyboard);
    if (import.meta.env.DEV && this.input.keyboard) {
      this.nextKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET);
      this.prevKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET);
    }

    // Tap anywhere on the page to dodge during Cicka's Standoff.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (!this.isPaused && this.session?.observe().mode === 'cickaDuel') this.dodge();
    });

    this.syncPresentation();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
  }

  update(_time: number, delta: number): void {
    if (!this.session || !this.visuals || !this.keys || this.isPaused) return;

    this.handleSceneUiActions();
    this.handleDevSkipKeys();

    const { mode } = this.session.observe();
    if (mode !== 'explore') {
      if (mode === 'cickaDuel') this.updateCickaDuel(delta);
      if (mode === 'bridgeBuild') this.updateBridgeBuild(delta);
      // Drain edge-triggered input so a press made while talking or playing
      // does not fire the moment it closes (e.g. E re-opening a conversation).
      Phaser.Input.Keyboard.JustDown(this.keys.interactKey);
      bridgeActions.consumeTouchOneShots();
      this.syncPresentation();
      return;
    }

    const touch = bridgeStore.getState().touch;
    const commands = readSceneInputCommands({
      frame: this.inputFrame,
      cursors: this.keys.cursors,
      wasd: this.keys.wasd,
      interactKey: this.keys.interactKey,
      touch,
      oneShots: bridgeActions.consumeTouchOneShots(),
      allowJump: false,
      allowSprint: false
    });

    if (commands.moveAxis !== 0) {
      const direction = commands.moveAxis < 0 ? 'left' : 'right';
      const deltaProgress = Math.abs(commands.moveAxis) * WALK_SPEED * (delta / 1000);
      this.applyResult(this.session.nudge(direction, deltaProgress));
    }

    if (commands.interact) {
      this.applyResult(this.session.exec('interact'));
    }

    this.syncPresentation();
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  private handleDevSkipKeys(): void {
    if (!import.meta.env.DEV || !this.session) return;

    if (this.nextKey && Phaser.Input.Keyboard.JustDown(this.nextKey)) {
      this.applyResult(this.session.exec('skip'));
      this.syncPresentation();
      return;
    }

    if (this.prevKey && Phaser.Input.Keyboard.JustDown(this.prevKey)) {
      const currentArea = this.session.observe().areaId;
      this.applyResult(this.session.exec(`warp ${ridgePrevArea(currentArea)}`));
      this.syncPresentation();
    }
  }

  /** Fixed-step the toy-car test so the animated run matches the console verdict. */
  private updateBridgeBuild(delta: number): void {
    const session = this.session;
    const bench = session?.bridgeWorkbench;
    if (!session || !bench || !this.visuals) return;
    const builder = this.ensureBuilder();

    if (bench.phase === 'editing') {
      this.simAccumulator = 0;
    } else {
      this.simAccumulator += Math.min(delta, 100) / 1000;
      for (let i = 0; i < MAX_SIM_STEPS_PER_FRAME && this.simAccumulator >= BRIDGE_SIM_DT; i += 1) {
        this.simAccumulator -= BRIDGE_SIM_DT;
        session.stepBridgeTest();
        if (bench.sim) builder.afterSimStep(bench.sim);
      }
    }

    builder.sync(bench);

    if (bench.phase !== 'passed') {
      this.celebrateMs = 0;
      return;
    }
    this.celebrateMs += delta;
    if (this.celebrateMs >= BRIDGE_CELEBRATE_MS) {
      this.celebrateMs = 0;
      this.applyResult(session.run({ type: 'build', action: { kind: 'done' } }));
    }
  }

  /** Fixed-step the standoff so the animated fight matches the console verdict. */
  private updateCickaDuel(delta: number): void {
    const session = this.session;
    const duel = session?.cickaDuel;
    if (!session || !duel) return;

    if (duel.phase === 'fighting') {
      this.duelOutroMs = 0;
      this.duelAccumulator += Math.min(delta, 100) / 1000;
      for (let i = 0; i < MAX_SIM_STEPS_PER_FRAME && this.duelAccumulator >= CICKA_DUEL_DT; i += 1) {
        this.duelAccumulator -= CICKA_DUEL_DT;
        session.stepCickaDuel();
      }
      return;
    }
    this.duelAccumulator = 0;
    this.duelOutroMs += delta;
    if (this.duelOutroMs >= DUEL_OUTRO_MS) {
      this.duelOutroMs = 0;
      this.applyResult(session.run({ type: 'duel', action: { kind: 'done' } }));
    }
  }

  private dodge(): void {
    if (this.session) this.applyResult(this.session.run({ type: 'duel', action: { kind: 'dodge' } }));
  }

  private ensureBuilder(): BridgeBuilderView {
    if (!this.builder) {
      const origin = this.visuals!.bridgeGapOrigin();
      this.builder = new BridgeBuilderView(this, {
        originX: origin.x,
        originY: origin.y,
        onAction: (action) => this.applyResult(this.session!.run({ type: 'build', action }))
      });
      this.builder.setTool(this.bridgeTool);
    }
    return this.builder;
  }

  private handleBridgeUiAction(action: string, params: unknown): boolean {
    if (!this.session) return false;
    if (action === 'ridgeBridgeTool') {
      const tool = readStringParam(params, 'tool') as RidgeBridgeTool | undefined;
      if (tool === 'road' || tool === 'wood' || tool === 'eraser') {
        this.bridgeTool = tool;
        this.builder?.setTool(tool);
        this.lastPanelKey = null;
      }
      return true;
    }
    if (action === 'ridgeDuelDodge') {
      this.dodge();
      return true;
    }
    if (action === 'ridgeBridgeCommand') {
      const command = readStringParam(params, 'command') as RidgeBridgeCommand | undefined;
      const buildAction = command ? BRIDGE_COMMAND_ACTIONS[command] : undefined;
      if (buildAction) this.applyResult(this.session.run({ type: 'build', action: buildAction }));
      return true;
    }
    return false;
  }

  private handleSceneUiActions(): void {
    if (!this.session) return;
    const action = bridgeActions.consumeSceneUiAction(RIDGE_SCENE_ID);
    if (!action) return;
    if (this.handleBridgeUiAction(action.action, action.params)) return;

    if (action.action === 'ridgeConversationAdvance') {
      this.applyResult(this.session.exec('advance'));
      return;
    }
    if (action.action === 'ridgeConversationLeave') {
      this.applyResult(this.session.exec('leave'));
      return;
    }
    if (action.action === 'ridgeConversationChoose') {
      const choiceId =
        action.params &&
        typeof action.params === 'object' &&
        'choiceId' in action.params &&
        typeof (action.params as { choiceId: unknown }).choiceId === 'string'
          ? (action.params as { choiceId: string }).choiceId
          : undefined;
      if (choiceId) {
        this.applyResult(this.session.exec(`choose ${choiceId}`));
      }
    }
  }

  private applyResult(result: RidgeCommandResult): void {
    for (const event of result.events) {
      this.handleSessionEvent(event);
    }
  }

  private handleSessionEvent(event: RidgeSessionEvent): void {
    if (event.type === 'beat_changed') {
      bridgeActions.setRidgeRouteBeat(event.beat as RidgeRouteBeatState);
      return;
    }
    if (event.type === 'area_handoff') {
      const areaId = event.areaId as RidgeAreaId;
      bridgeActions.setRidgeAreaHandoff(areaId, RIDGE_INITIAL_BEAT[areaId] as RidgeRouteBeatState);
      return;
    }
    if (event.type === 'bridge_built') {
      bridgeActions.setRidgeBridgeDesign(event.design);
      return;
    }
    if (event.type === 'route_reset') {
      // v0: dedication ends the CRT story and returns to Overworld.
      // Post-game Open Ridge Return can replace this later.
      bridgeActions.resetRidgeFirstPlayableRoute();
      this.onClose();
    }
  }

  private syncPresentation(): void {
    if (!this.session || !this.visuals) return;
    const observation = this.session.observe();
    if (observation.mode !== 'bridgeBuild' && this.builder) {
      this.builder.destroy();
      this.builder = undefined;
    }
    const view = toRidgeVisualViewModel(observation);
    this.syncDuelStaging(observation, view);
    this.visuals.sync(view);
    this.syncSceneUiPanel(observation);

    if (import.meta.env.DEV) {
      const nearbyLabels = observation.nearby.map((item) => item.label);
      const snapshotKey = `${observation.progress.toFixed(3)}|${observation.beat}|${observation.mode}|${nearbyLabels.join(',')}`;
      if (snapshotKey !== this.lastDevSnapshotKey) {
        this.lastDevSnapshotKey = snapshotKey;
        this.getRidgeDevControls?.()?.publishPlayerSnapshot?.({
          progress: observation.progress,
          beat: observation.beat,
          mode: observation.mode,
          nearby: nearbyLabels
        });
      }
    }
  }

  /** Bodies lunge and hop through view nudges; the ring and marks draw on top. */
  private syncDuelStaging(observation: RidgeObservation, view: RidgeVisualViewModel): void {
    const duel = this.session?.cickaDuel;
    if (!duel || !this.visuals) {
      this.duelView?.destroy();
      this.duelView = undefined;
      return;
    }
    const xOf = (id: RidgeActorId) =>
      this.visuals!.worldXForProgress(observation.actors.find((actor) => actor.id === id)?.progress ?? 0);
    const frame = stageCickaDuel(duel, xOf('player') >= xOf('cicka') ? 1 : -1);
    view.actorNudges = frame.actors;
    this.duelView ??= new CickaDuelView(this);
    this.duelView.sync(frame, {
      playerX: xOf('player') + frame.actors.player.dx,
      cickaX: xOf('cicka') + frame.actors.cicka.dx
    });
  }

  /** One docked panel at a time: the conversation box or a mini-game's chrome. */
  private syncSceneUiPanel(observation: RidgeObservation): void {
    if (observation.mode === 'bridgeBuild' && observation.bridgeBuild) {
      this.syncBridgeBuilderPanel(observation.bridgeBuild);
      return;
    }
    if (observation.mode === 'cickaDuel' && observation.cickaDuel) {
      this.syncCickaDuelPanel(observation.cickaDuel);
      return;
    }
    if (observation.mode !== 'conversation' || !observation.conversation) {
      if (this.lastPanelKey !== null) {
        bridgeActions.clearSceneUiPanel(RIDGE_SCENE_ID);
        this.lastPanelKey = null;
      }
      return;
    }

    const c = observation.conversation;
    const key = `talk:${c.id}:${c.lineIndex}:${c.awaitingChoice}:${c.choices?.map((choice) => choice.id).join(',') ?? ''}`;
    if (key === this.lastPanelKey) return;
    this.lastPanelKey = key;

    const view: RidgeConversationPanelView = {
      conversationId: c.id,
      speaker: c.speaker,
      speakerId: c.speakerId,
      text: c.text,
      emotion: c.emotion,
      lineIndex: c.lineIndex,
      lineCount: c.lineCount,
      awaitingChoice: c.awaitingChoice,
      choices: (c.choices ?? []).map((choice) => ({
        id: choice.id,
        label: choice.label
      })),
      portrait: portraitForSpeaker(c.speakerId),
      speakerSide: speakerSideFor(observation)
    };

    bridgeActions.setSceneUiPanel(RIDGE_SCENE_ID, 'ridgeConversation', view);
  }

  private syncBridgeBuilderPanel(build: NonNullable<RidgeObservation['bridgeBuild']>): void {
    const view: RidgeBridgeBuilderPanelView = {
      phase: build.phase,
      tool: this.bridgeTool,
      ink: build.ink,
      inkBudget: build.inkBudget,
      attempts: build.attempts,
      tip: build.tip,
      tipText: build.tipText,
      hintVisible: build.hintVisible,
      sketchOffered: build.sketchOffered,
      hasBeams: build.beamCount > 0,
      canUndo: build.canUndo
    };
    const key = `build:${JSON.stringify(view)}`;
    if (key === this.lastPanelKey) return;
    this.lastPanelKey = key;
    bridgeActions.setSceneUiPanel(RIDGE_SCENE_ID, 'ridgeBridgeBuilder', view);
  }

  private syncCickaDuelPanel(duel: NonNullable<RidgeObservation['cickaDuel']>): void {
    const view: RidgeCickaDuelPanelView = {
      phase: duel.phase,
      hearts: duel.hearts,
      maxHearts: duel.maxHearts,
      strikesDone: duel.strikesDone,
      strikesTotal: duel.strikesTotal,
      canDodge: duel.canDodge,
      windup: duel.telegraph?.kind ?? null,
      lastResult: duel.lastResult
    };
    const key = `duel:${JSON.stringify(view)}`;
    if (key === this.lastPanelKey) return;
    this.lastPanelKey = key;
    bridgeActions.setSceneUiPanel(RIDGE_SCENE_ID, 'ridgeCickaDuel', view);
  }

  private cleanup(): void {
    this.duelView?.destroy();
    this.duelView = undefined;
    bridgeActions.clearSceneUi(RIDGE_SCENE_ID);
    this.builder?.destroy();
    this.builder = undefined;
    this.visuals?.destroy();
    this.visuals = undefined;
    this.session = undefined;
    this.keys = undefined;
    this.nextKey = undefined;
    this.prevKey = undefined;
    this.lastPanelKey = null;
  }
}

function readStringParam(params: unknown, key: string): string | undefined {
  if (!params || typeof params !== 'object' || !(key in params)) return undefined;
  const value = (params as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}
