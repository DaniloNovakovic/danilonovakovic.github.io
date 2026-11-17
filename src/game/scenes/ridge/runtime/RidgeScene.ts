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
  cickaStandoffFlags,
  createRidgeRouteStages,
  GIG_START_HYPE,
  isGigLane,
  RidgeConsoleSession,
  RIDGE_GUITAR_ITEM,
  RIDGE_INITIAL_BEAT,
  ridgePrevArea,
  type BridgeBuildAction,
  type ConcertGig,
  type GigLane,
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
import type { RidgeConcertGigPanelView } from '../sceneUi/RidgeConcertGigPanel';
import type { RidgeBachataPanelView } from '../sceneUi/RidgeBachataPanel';
import type { SceneUiActionRequest } from '@/game/sceneUi/types';
import { stageCickaDuel } from '../art/duelStaging';
import { stageConcertGig, type GigFrame } from '../art/gigStaging';
import { stageBachataLesson, stageNightDance, type LessonFrame } from '../art/lessonStaging';
import { BachataLessonView } from './BachataLessonView';
import { MemoryFrameView } from './MemoryFrameView';
import { ConcertGigAudio } from './concertGigAudio';
import { ConcertGigView } from './ConcertGigView';
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
/** How long the last chord and the cheer ring before Steve reacts. */
const GIG_OUTRO_MS = 2400;
/** How long the dancers hold the last tap before the Profe has her say. */
const LESSON_OUTRO_MS = 1600;
/** Keys for the three lanes: home row, arrows, the right hand's home row, digits. */
const GIG_LANE_KEYS: Record<string, GigLane> = {
  a: 0, s: 1, d: 2,
  arrowleft: 0, arrowdown: 1, arrowright: 2,
  j: 0, k: 1, l: 2,
  '1': 0, '2': 1, '3': 2
};
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
  private gigAudio?: ConcertGigAudio;
  /** Faded-out band from a finished gig, disconnected on the next gig or shutdown. */
  private releasedGigAudio: ConcertGigAudio[] = [];
  private gigView?: ConcertGigView;
  private gigFor: ConcertGig | null = null;
  private gigSection: number | null = null;
  private gigOutroMs = 0;
  private gigCheered = false;
  private lessonView?: BachataLessonView;
  private memoryFrame?: MemoryFrameView;
  private lessonOutroMs = 0;
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
    // Steve hands the guitar over after the show; re-entering a cleared Concert
    // replays that goodbye rather than skipping it.
    const hasGuitar = areaId === 'danceFestival' || areaId === 'relay';

    this.session = new RidgeConsoleSession({
      stages: createRidgeRouteStages(loadRidgeRouteDialogueCatalog()),
      areaId,
      beat: route.beat,
      progress: 0.05,
      inventory: hasGuitar ? [RIDGE_GUITAR_ITEM] : [],
      flags: areaId === 'bridge' ? cickaStandoffFlags(route.cickaStandoff) : [],
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
    // During the gig, tapping a lane on the highway card strums it, like its button.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused) return;
      const mode = this.session?.observe().mode;
      if (mode === 'cickaDuel') this.dodge();
      if (mode !== 'concertGig') return;
      const lane = this.gigView?.laneAt(pointer.x, pointer.y);
      if (lane !== undefined) this.strumGig(lane, pointer.event.timeStamp);
    });
    // Lane keys judge at the key's own timestamp, not the frame it is read on.
    // In the lesson the same keys are feet: left, the hip tap, right.
    this.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, (event: KeyboardEvent) => {
      const dancing = Boolean(this.session?.bachataLesson);
      // Space is the hip tap: the big key for the beat everyone feels.
      const lane = GIG_LANE_KEYS[event.key.toLowerCase()] ?? (dancing && event.key === ' ' ? 1 : undefined);
      if (lane === undefined || event.repeat || this.isPaused) return;
      if (dancing) this.stepLesson(lane, event.timeStamp);
      else this.strumGig(lane, event.timeStamp);
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
      if (mode === 'concertGig') this.updateConcertGig(delta);
      if (mode === 'bachataLesson') this.updateBachataLesson(delta);
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
    // The song clock stops with the scene, and the band goes quiet.
    if (paused) this.gigAudio?.pause();
    else this.gigAudio?.resume();
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

  /** Play the song: the audio clock drives the playhead, then a bow and Steve's verdict. */
  private updateConcertGig(delta: number): void {
    const session = this.session;
    const gig = session?.concertGig;
    if (!session || !gig) return;
    const audio = this.ensureGigAudio(gig);
    audio.update(delta);

    if (gig.phase !== 'finished') {
      session.advanceConcertGig(audio.nowMs());
      this.cheerNewSection(gig, audio);
      this.gigOutroMs = 0;
      return;
    }
    this.takeABow(gig, audio, delta);
  }

  /** Dance the lesson: the band's clock drives the count, then the dancers hold the last tap. */
  private updateBachataLesson(delta: number): void {
    const session = this.session;
    const lesson = session?.bachataLesson;
    if (!session || !lesson) return;
    const audio = this.ensureGigAudio(lesson);
    audio.update(delta);
    if (lesson.phase !== 'finished') {
      session.advanceBachataLesson(audio.nowMs());
      this.lessonOutroMs = 0;
      return;
    }
    this.lessonOutroMs += delta;
    if (this.lessonOutroMs < LESSON_OUTRO_MS) return;
    this.lessonOutroMs = 0;
    this.applyResult(session.run({ type: 'dance', action: { kind: 'done' } }));
  }

  /** Step at a DOM event time (keyboard or the panel's buttons). */
  private stepLesson(lane: GigLane, eventTimeStamp: number): void {
    const session = this.session;
    const lesson = session?.bachataLesson;
    if (!session || !lesson || lesson.phase === 'finished') return;
    const audio = this.ensureGigAudio(lesson);
    const at = audio.msAtEventTime(eventTimeStamp);
    const result = session.stepBachataLesson(lane, at);
    if (result.kind === 'ignored') return;
    this.lessonView?.press(lane, at);
    if (result.kind === 'hit' && result.hit.judgment !== 'miss') audio.step(lane, result.hit.judgment === 'perfect');
    else audio.scuff();
  }

  /** A warm crowd roars into each new section. */
  private cheerNewSection(gig: ConcertGig, audio: ConcertGigAudio): void {
    const section = gig.section?.index ?? null;
    if (section === this.gigSection) return;
    this.gigSection = section;
    if (section !== null && section > 0 && gig.mode === 'show' && gig.hype > 0.6) audio.cheer(gig.hype);
  }

  /** The last chord rings and the crowd roars, then Steve has his say. */
  private takeABow(gig: ConcertGig, audio: ConcertGigAudio, delta: number): void {
    if (!this.gigCheered) {
      this.gigCheered = true;
      if (gig.mode === 'show') audio.cheer(0.45 + gig.hype * 0.55);
    }
    this.gigOutroMs += delta;
    if (this.gigOutroMs < GIG_OUTRO_MS) return;
    this.gigOutroMs = 0;
    this.applyResult(this.session!.run({ type: 'gig', action: { kind: 'done' } }));
  }

  /** One band per gig: a fresh ConcertGig means a fresh song clock. */
  private ensureGigAudio(gig: ConcertGig): ConcertGigAudio {
    if (this.gigAudio && this.gigFor === gig) return this.gigAudio;
    this.releaseGigAudio();
    for (const old of this.releasedGigAudio.splice(0)) old.destroy();
    this.gigFor = gig;
    this.gigSection = null;
    this.gigCheered = false;
    this.gigOutroMs = 0;
    this.gigAudio = new ConcertGigAudio(ConcertGigAudio.outputFrom(this.sound), gig.song, {
      frontRowClap: gig.startHype > GIG_START_HYPE
    });
    return this.gigAudio;
  }

  private releaseGigAudio(): void {
    if (!this.gigAudio) return;
    this.gigAudio.release();
    this.releasedGigAudio.push(this.gigAudio);
    this.gigAudio = undefined;
    this.gigFor = null;
  }

  /** The panel's touch buttons send the lane and the press timestamp. */
  private handleGigStrumAction(params: unknown): void {
    const lane = readNumberParam(params, 'lane');
    if (isGigLane(lane)) this.strumGig(lane, readNumberParam(params, 'at') ?? performance.now());
  }

  /** Strum a lane at a DOM event time (keyboard or the panel's buttons). */
  private strumGig(lane: GigLane, eventTimeStamp: number): void {
    const session = this.session;
    const gig = session?.concertGig;
    if (!session || !gig || gig.phase === 'finished') return;
    const audio = this.ensureGigAudio(gig);
    const at = audio.msAtEventTime(eventTimeStamp);
    const result = session.strumConcertGig(lane, at);
    if (result.kind === 'ignored') return;
    this.gigView?.press(lane, at);
    if (result.kind === 'hit') audio.strum(result.chord, lane, result.hit.judgment === 'perfect');
    else audio.chuck();
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

  /** Drain every pending action: a two-lane chord on touch arrives as two taps in one frame. */
  private handleSceneUiActions(): void {
    for (let action = bridgeActions.consumeSceneUiAction(RIDGE_SCENE_ID); action && this.session; ) {
      this.handleSceneUiAction(action);
      action = bridgeActions.consumeSceneUiAction(RIDGE_SCENE_ID);
    }
  }

  /** Panel actions that are not the Blueprint Bridge's. */
  private readonly sceneUiHandlers: Partial<Record<SceneUiActionRequest['action'], (params: unknown) => void>> = {
    ridgeGigStrum: (params) => this.handleGigStrumAction(params),
    ridgeGigSkip: () => this.applyResult(this.session!.run({ type: 'gig', action: { kind: 'skip' } })),
    ridgeDanceStep: (params) => {
      const lane = readNumberParam(params, 'lane');
      if (isGigLane(lane)) this.stepLesson(lane, readNumberParam(params, 'at') ?? performance.now());
    },
    ridgeDanceSkip: () => this.applyResult(this.session!.run({ type: 'dance', action: { kind: 'skip' } })),
    ridgeConversationAdvance: () => this.applyResult(this.session!.exec('advance')),
    ridgeConversationLeave: () => this.applyResult(this.session!.exec('leave')),
    ridgeConversationChoose: (params) => {
      const choiceId = readStringParam(params, 'choiceId');
      if (choiceId) this.applyResult(this.session!.exec(`choose ${choiceId}`));
    }
  };

  private handleSceneUiAction(action: SceneUiActionRequest): void {
    if (!this.session) return;
    if (this.handleBridgeUiAction(action.action, action.params)) return;
    this.sceneUiHandlers[action.action]?.(action.params);
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
    if (event.type === 'cicka_duel_closed') {
      // A win sticks: a later loss never demotes Cicka's respect.
      const previous = bridgeStore.getState().progress.ridge.firstPlayableRoute.cickaStandoff;
      bridgeActions.setRidgeCickaStandoff(event.won || previous === 'won' ? 'won' : 'lost');
      return;
    }
    if (event.type === 'concert_gig_closed' || event.type === 'bachata_lesson_closed') {
      this.releaseGigAudio();
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
    const gigFrame = this.stageGig(view);
    const lessonFrame = this.stageLesson(view);
    this.stageMemory(view, observation);
    this.visuals.sync(view);
    // After the camera moved: the highway and step strip pin themselves to this frame's zoom.
    this.syncGigView(gigFrame, observation);
    this.syncLessonView(lessonFrame, observation);
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

  /** Bodies bounce and strum through view nudges, like the standoff. */
  private stageGig(view: RidgeVisualViewModel): GigFrame | null {
    const gig = this.session?.concertGig;
    if (!gig) return null;
    const frame = stageConcertGig(gig);
    view.actorNudges = frame.actors;
    return frame;
  }

  private syncGigView(frame: GigFrame | null, observation: RidgeObservation): void {
    const gig = this.session?.concertGig;
    if (!gig || !frame || !this.visuals) {
      this.gigView?.destroy();
      this.gigView = undefined;
      return;
    }
    const { actors } = observation;
    const xOf = (id: RidgeActorId) =>
      this.visuals!.worldXForProgress(actors.find((actor) => actor.id === id)?.progress ?? 0);
    this.gigView ??= new ConcertGigView(this);
    this.gigView.sync(gig, frame, {
      performerX: xOf('player'),
      crowdX: xOf('crowd'),
      onStage: observation.areaId === 'concert'
    });
  }

  /** A remembered night dance: the couple (then everyone) loops the basic. */
  private stageMemory(view: RidgeVisualViewModel, observation: RidgeObservation): void {
    const memory = observation.memory;
    if (memory && memory.dancers.length > 0) {
      view.actorNudges = stageNightDance(
        this.time.now,
        memory.dancers.map((id) => ({ id, facing: memory.actors.find((actor) => actor.id === id)?.facing ?? 'right' }))
      );
    }
    this.memoryFrame ??= new MemoryFrameView(this);
    this.memoryFrame.sync(memory?.shotKey ?? null, memory?.sceneryMarks.includes('sky-night') ?? false, this.time.now);
  }

  /** Dancers step and tap through view nudges, like the gig. */
  private stageLesson(view: RidgeVisualViewModel): LessonFrame | null {
    const lesson = this.session?.bachataLesson;
    if (!lesson) return null;
    const frame = stageBachataLesson(lesson);
    view.actorNudges = frame.actors;
    return frame;
  }

  private syncLessonView(frame: LessonFrame | null, observation: RidgeObservation): void {
    const lesson = this.session?.bachataLesson;
    if (!lesson || !frame || !this.visuals) {
      this.lessonView?.destroy();
      this.lessonView = undefined;
      return;
    }
    const player = observation.actors.find((actor) => actor.id === 'player');
    const playerX = this.visuals.worldXForProgress(player?.progress ?? observation.progress) + (frame.actors.player?.dx ?? 0);
    this.lessonView ??= new BachataLessonView(this);
    this.lessonView.sync(lesson, frame, { playerX });
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
    if (observation.mode === 'concertGig' && observation.concertGig) {
      this.syncConcertGigPanel(observation.concertGig);
      return;
    }
    if (observation.mode === 'bachataLesson' && observation.bachataLesson) {
      this.syncBachataPanel(observation.bachataLesson);
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

  private syncConcertGigPanel(gig: NonNullable<RidgeObservation['concertGig']>): void {
    const view: RidgeConcertGigPanelView = {
      mode: gig.mode,
      phase: gig.phase,
      section: gig.section,
      hype: Math.round(gig.hype * 20) / 20,
      combo: gig.combo,
      counts: gig.counts,
      notesTotal: gig.notesTotal,
      lastJudgment: gig.lastJudgment,
      grade: gig.grade,
      practice: gig.practice,
      kidHype: gig.warmStart
    };
    const key = `gig:${JSON.stringify(view)}`;
    if (key === this.lastPanelKey) return;
    this.lastPanelKey = key;
    bridgeActions.setSceneUiPanel(RIDGE_SCENE_ID, 'ridgeConcertGig', view);
  }

  private syncBachataPanel(lesson: NonNullable<RidgeObservation['bachataLesson']>): void {
    const view: RidgeBachataPanelView = {
      phase: lesson.phase,
      section: lesson.section,
      nerve: Math.round(lesson.nerve * 20) / 20,
      combo: lesson.combo,
      counts: lesson.counts,
      notesTotal: lesson.notesTotal,
      lastJudgment: lesson.lastJudgment,
      grade: lesson.grade
    };
    const key = `dance:${JSON.stringify(view)}`;
    if (key === this.lastPanelKey) return;
    this.lastPanelKey = key;
    bridgeActions.setSceneUiPanel(RIDGE_SCENE_ID, 'ridgeBachataLesson', view);
  }

  private cleanup(): void {
    this.lessonView?.destroy();
    this.memoryFrame?.destroy();
    this.memoryFrame = undefined;
    this.lessonView = undefined;
    this.gigView?.destroy();
    this.gigView = undefined;
    this.releaseGigAudio();
    for (const audio of this.releasedGigAudio.splice(0)) audio.destroy();
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

function readNumberParam(params: unknown, key: string): number | undefined {
  if (!params || typeof params !== 'object' || !(key in params)) return undefined;
  const value = (params as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readStringParam(params: unknown, key: string): string | undefined {
  if (!params || typeof params !== 'object' || !(key in params)) return undefined;
  const value = (params as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}
