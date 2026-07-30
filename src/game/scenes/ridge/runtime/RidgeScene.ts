import * as Phaser from 'phaser';
import {
  bridgeActions,
  bridgeStore,
  type OpenOverlayOptions,
  type RidgeRouteBeatState
} from '@/game/bridge/store';
import {
  createRidgeRouteStages,
  RidgeConsoleSession,
  RIDGE_GUITAR_ITEM,
  RIDGE_INITIAL_BEAT,
  type RidgeAreaId,
  type RidgeCommandResult,
  type RidgeSessionEvent
} from '@/game/core/ridge';
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
import { toRidgeVisualViewModel } from '../art/types';
import { loadRidgeRouteDialogueCatalog } from '../content/routeCatalog';
import type { RidgeConversationPanelView } from '../sceneUi/RidgeConversationPanel';
import type { RidgeDevControls } from './ridgeDevControls';

interface RidgeSceneStartData {
  onClose?: () => void;
  onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused?: boolean;
  getRidgeDevControls?: () => RidgeDevControls | undefined;
}

const WALK_SPEED = 0.18; // progress units per second

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
  private lastConversationKey: string | null = null;
  private escJustHandled = false;

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
      inventory: hasGuitar ? [RIDGE_GUITAR_ITEM] : []
    });

    this.visuals = new StickVisualProvider(this);
    this.keys = bindSideViewKeyboard(this.input.keyboard, { includeEscapeKey: true });
    this.cameras.main.setZoom(1);

    this.syncPresentation();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
  }

  update(_time: number, delta: number): void {
    if (!this.session || !this.visuals || !this.keys || this.isPaused) return;

    this.handleSceneUiActions();

    const observation = this.session.observe();
    if (observation.mode === 'conversation') {
      this.syncPresentation();
      return;
    }

    const touch = bridgeStore.getState().touch;
    const commands = readSceneInputCommands({
      frame: this.inputFrame,
      cursors: this.keys.cursors,
      wasd: this.keys.wasd,
      interactKey: this.keys.interactKey,
      escapeKey: this.keys.escapeKey,
      touch,
      oneShots: bridgeActions.consumeTouchOneShots(),
      allowJump: false,
      allowSprint: false
    });

    if (commands.exitContext) {
      if (!this.escJustHandled) {
        this.escJustHandled = true;
        this.onClose();
      }
      return;
    }
    this.escJustHandled = false;

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

  private handleSceneUiActions(): void {
    if (!this.session) return;
    const action = bridgeActions.consumeSceneUiAction(RIDGE_SCENE_ID);
    if (!action) return;

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
    if (event.type === 'route_reset') {
      bridgeActions.resetRidgeFirstPlayableRoute();
    }
  }

  private syncPresentation(): void {
    if (!this.session || !this.visuals) return;
    const observation = this.session.observe();
    this.visuals.sync(toRidgeVisualViewModel(observation));
    this.syncConversationUi(observation);

    if (import.meta.env.DEV) {
      const controls = this.getRidgeDevControls?.();
      controls?.publishPlayerSnapshot?.({
        progress: observation.progress,
        beat: observation.beat,
        mode: observation.mode,
        nearby: observation.nearby.map((item) => item.label)
      });
    }
  }

  private syncConversationUi(
    observation: ReturnType<RidgeConsoleSession['observe']>
  ): void {
    if (observation.mode !== 'conversation' || !observation.conversation) {
      if (this.lastConversationKey !== null) {
        bridgeActions.clearSceneUiPanel(RIDGE_SCENE_ID);
        this.lastConversationKey = null;
      }
      return;
    }

    const c = observation.conversation;
    const key = `${c.id}:${c.lineIndex}:${c.awaitingChoice}:${c.choices?.map((choice) => choice.id).join(',') ?? ''}`;
    if (key === this.lastConversationKey) return;
    this.lastConversationKey = key;

    const view: RidgeConversationPanelView = {
      conversationId: c.id,
      speaker: c.speaker,
      speakerId: c.speakerId,
      text: c.text,
      lineIndex: c.lineIndex,
      lineCount: c.lineCount,
      awaitingChoice: c.awaitingChoice,
      choices: (c.choices ?? []).map((choice) => ({
        id: choice.id,
        label: choice.label
      })),
      portrait: portraitForSpeaker(c.speakerId)
    };

    bridgeActions.setSceneUiPanel(RIDGE_SCENE_ID, 'ridgeConversation', view);
  }

  private cleanup(): void {
    bridgeActions.clearSceneUi(RIDGE_SCENE_ID);
    this.visuals?.destroy();
    this.visuals = undefined;
    this.session = undefined;
    this.keys = undefined;
    this.lastConversationKey = null;
  }
}

function portraitForSpeaker(
  speakerId: string
): RidgeConversationPanelView['portrait'] {
  if (speakerId === 'cicka') return 'cicka';
  if (speakerId === 'bridgeDraftsperson' || speakerId === 'injuredGuitarist') {
    return 'draftsperson';
  }
  if (speakerId === 'prompt' || speakerId === 'dedication') return 'prompt';
  return 'player';
}
