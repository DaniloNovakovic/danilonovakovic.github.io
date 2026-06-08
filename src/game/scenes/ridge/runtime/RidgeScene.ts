import * as Phaser from 'phaser';
import {
  bridgeActions,
  bridgeStore,
  type OpenOverlayOptions,
  type RidgeBridgeAreaBeatState,
  type RidgeBridgeBeatState,
  type RidgeFirstPlayableRouteState
} from '@/game/bridge/store';
import { type OverlayId } from '@/game/overlays/overlayIds';
import { PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import {
  createInteriorInteractionRuntime,
  type InteriorInteractionRuntime
} from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';
import {
  createCickaAnimations,
  preloadCickaAssets
} from '../cicka/assets';
import { preloadBridgeAssets } from '../bridge/assets';
import {
  RIDGE_DEFAULT_CAMERA_ZOOM,
  resolveRidgeDevDebugSettings,
  resolveRidgeDevCameraZoom,
  resolveRidgeDevTeleportPosition,
  type RidgeDevControls
} from './ridgeDevControls';
import {
  BRIDGE_TRACER_INTERACT_RADIUS,
  BRIDGE_TRACER_WORLD,
  createBridgeTracerInteractionTargets,
  type BridgeTracerEffect,
  type BridgeTracerInteractionTarget,
  type BridgeTracerTargetId
} from '../bridge/bridgeTracerSlice';
import {
  createBridgeTracerStageRuntime,
  type BridgeTracerStageRuntime
} from '../bridge/BridgeTracerStageRuntime';
import {
  createBridgeWalkRailPlayerRuntime,
  type BridgeWalkRailPlayerRuntime
} from '../bridge/BridgeWalkRailPlayerRuntime';
import {
  createBridgeStageDebugOverlay,
  type BridgeStageDebugOverlay
} from '../bridge/bridgeStageDebugOverlay';
import { hitTestStageAuthoringTargets } from '../bridge/stageAuthoring';
import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStagePresentation,
  type BridgeStageCompositionSource,
  type BridgeStagePresentationState
} from '../bridge/stageComposition';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';

interface RidgeSceneStartData {
  onClose?: () => void;
  onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused?: boolean;
  resumePosition?: { x: number; y: number };
  ridgeDevControls?: RidgeDevControls;
  getRidgeDevControls?: () => RidgeDevControls | undefined;
}

export class RidgeScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  private playerRuntime?: BridgeWalkRailPlayerRuntime;
  private bridgeStage?: BridgeTracerStageRuntime;
  private bridgeDebugOverlay?: BridgeStageDebugOverlay;
  private interactionRuntime?: InteriorInteractionRuntime<BridgeTracerTargetId, BridgeTracerEffect>;
  private bridgeInteractionTargets: BridgeTracerInteractionTarget[] = [];
  private playerReadabilityHalo?: Phaser.GameObjects.Graphics;
  private onClose: () => void = () => {};
  private isPaused = false;
  private resumePosition?: { x: number; y: number };
  private ridgeDevControls?: RidgeDevControls;
  private getRidgeDevControls?: () => RidgeDevControls | undefined;
  private authoringPointerBound = false;
  private ridgeSpawnPosition = { ...BRIDGE_TRACER_WORLD.spawn };
  private lastCameraZoom = RIDGE_DEFAULT_CAMERA_ZOOM;
  private lastCompositionSource: BridgeStageCompositionSource = BRIDGE_STAGE_SOURCE;
  private bridgePresentation: BridgeStagePresentationState = resolveBridgeStagePresentation('intro');
  private routeState: RidgeFirstPlayableRouteState = {
    activeAreaId: 'bridge',
    bridgeBeat: 'intro'
  };

  constructor() {
    super(PHASER_SCENE_KEYS.ridge);
  }

  init(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? (() => {});
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
    this.ridgeDevControls = import.meta.env.DEV ? data.ridgeDevControls : undefined;
    this.getRidgeDevControls = import.meta.env.DEV ? data.getRidgeDevControls : undefined;
  }

  preload(): void {
    if (!this.textures.exists('player_idle')) {
      TextureGenerator.generatePlayer(this);
    }
    preloadBridgeAssets(this);
    preloadCickaAssets(this);
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    return this.playerRuntime?.captureResume() ?? null;
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.playerRuntime?.setPaused(paused);
  }

  create(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? this.onClose;
    this.ridgeDevControls = import.meta.env.DEV
      ? data.ridgeDevControls ?? this.ridgeDevControls
      : undefined;
    this.getRidgeDevControls = import.meta.env.DEV
      ? data.getRidgeDevControls ?? this.getRidgeDevControls
      : undefined;
    this.routeState = bridgeStore.getState().progress.ridge.firstPlayableRoute;

    this.bridgeStage?.dispose();
    this.bridgeDebugOverlay?.destroy();
    this.cameras.main.setBackgroundColor('#f7f1df');
    this.physics.world.setBounds(
      BRIDGE_TRACER_WORLD.bounds.x,
      BRIDGE_TRACER_WORLD.bounds.y,
      BRIDGE_TRACER_WORLD.bounds.width,
      BRIDGE_TRACER_WORLD.bounds.height
    );
    createCickaAnimations(this);

    this.bridgeStage = createBridgeTracerStageRuntime(this);
    this.createPlayer();
    this.bridgeDebugOverlay = import.meta.env.DEV
      ? createBridgeStageDebugOverlay(this)
      : undefined;
    this.syncBridgeRouteState();
    this.createBridgeInteractions();
    this.setPaused(this.isPaused);
    this.playerRuntime?.syncAppearance();
    this.bindDevAuthoringPointer();
    this.syncDevRuntimeState();
  }

  update(_time: number, delta: number): void {
    this.applyDevControls();

    const playerUpdate = this.playerRuntime?.update(delta);
    this.syncPlayerReadabilityHalo();
    if (!playerUpdate || playerUpdate.paused) {
      this.syncDevRuntimeState();
      return;
    }

    if (playerUpdate.commands.exitContext) {
      this.syncDevRuntimeState();
      this.onClose();
      return;
    }

    const interaction = this.interactionRuntime?.update({
      playerX: this.player?.x ?? 0,
      playerY: this.player?.y ?? 0,
      interactRequested: playerUpdate.step.interactRequested,
      exitRequested: false
    });

    if (!interaction?.prompt.visible || !interaction.activeTarget) {
      this.bridgeStage?.hidePrompt();
      this.syncDevRuntimeState();
      return;
    }

    if (interaction.effect) {
      this.handleBridgeInteractionEffect(interaction.effect);
      this.syncDevRuntimeState();
      return;
    }

    this.bridgeStage?.showPrompt(
      interaction.activeTarget as BridgeTracerInteractionTarget,
      interaction.prompt.x,
      interaction.prompt.y
    );
    this.syncDevRuntimeState();
  }

  private createPlayer(): void {
    this.ridgeSpawnPosition = { ...BRIDGE_TRACER_WORLD.spawn };
    const playerRuntime = createBridgeWalkRailPlayerRuntime({
      scene: this,
      resumePosition: this.resumePosition,
      resolveCameraZoom: () => this.resolveCameraZoom()
    });
    this.playerRuntime = playerRuntime;
    this.player = playerRuntime.player;
    this.bridgePresentation = resolveBridgeStagePresentation(this.routeState.bridgeBeat);
    playerRuntime.setProgressRange(this.bridgePresentation.playerProgressRange);
    this.createPlayerReadabilityHalo();
  }

  private createPlayerReadabilityHalo(): void {
    this.playerReadabilityHalo?.destroy();
    const halo = this.add.graphics().setDepth(29);
    halo.fillStyle(0xf7f1df, 0.92);
    halo.lineStyle(2, 0xffffff, 0.78);
    halo.fillEllipse(0, 0, 58, 78);
    halo.strokeEllipse(0, 0, 66, 86);
    halo.lineStyle(1, 0x1f1f1d, 0.14);
    halo.strokeEllipse(3, -2, 54, 72);
    halo.lineBetween(-16, 24, 18, 20);
    this.playerReadabilityHalo = halo;
    this.syncPlayerReadabilityHalo();
  }

  private syncPlayerReadabilityHalo(): void {
    if (!this.player || !this.playerReadabilityHalo) return;
    this.playerReadabilityHalo
      .setPosition(this.player.x, this.player.y - 34)
      .setScale(Math.abs(this.player.scaleX))
      .setDepth(this.player.depth - 1);
  }

  private createBridgeInteractions(): void {
    this.bridgeInteractionTargets = createBridgeTracerInteractionTargets(this.routeState);
    this.interactionRuntime = createInteriorInteractionRuntime<
      BridgeTracerTargetId,
      BridgeTracerEffect
    >({
      interactRadius: BRIDGE_TRACER_INTERACT_RADIUS,
      targets: this.bridgeInteractionTargets
    });
  }

  private handleBridgeInteractionEffect(effect: BridgeTracerEffect): void {
    switch (effect.kind) {
      case 'showDialogue':
        this.bridgeStage?.showDialogue(effect.lineIds);
        if (effect.nextBeat) {
          bridgeActions.setRidgeBridgeBeat(effect.nextBeat);
          this.syncBridgeRouteState();
          this.createBridgeInteractions();
        }
        return;
      case 'runToyCarTest':
        this.runToyCarBridgeTest(effect);
        return;
      case 'triggerConcertHandoff':
        this.bridgeStage?.showDialogue(effect.lineIds, 7200);
        bridgeActions.triggerRidgeConcertHandoff();
        this.syncBridgeRouteState();
        this.createBridgeInteractions();
        return;
      default:
        assertNever(effect);
    }
  }

  private runToyCarBridgeTest(
    effect: Extract<BridgeTracerEffect, { kind: 'runToyCarTest' }>
  ): void {
    this.bridgeStage?.hidePrompt();
    this.bridgeStage?.runToyCarTest(effect.lineIds, () => {
      bridgeActions.setRidgeBridgeBeat('bridge_complete');
      this.syncBridgeRouteState();
      this.createBridgeInteractions();
    });
  }

  private syncBridgeRouteState(): void {
    this.routeState = bridgeStore.getState().progress.ridge.firstPlayableRoute;
    this.bridgePresentation =
      this.bridgeStage?.syncBeat(this.routeState.bridgeBeat) ??
      resolveBridgeStagePresentation(this.routeState.bridgeBeat);
    this.playerRuntime?.setProgressRange(this.bridgePresentation.playerProgressRange);
  }

  private resolveRidgeDevControls(): RidgeDevControls | undefined {
    if (!import.meta.env.DEV) return undefined;
    return this.getRidgeDevControls?.() ?? this.ridgeDevControls;
  }

  private resolveCameraZoom(): number {
    return resolveRidgeDevCameraZoom(this.resolveRidgeDevControls()?.resolveCameraZoom?.());
  }

  private applyDevControls(): void {
    const ridgeDevControls = this.resolveRidgeDevControls();
    if (!import.meta.env.DEV || !ridgeDevControls) return;

    const nextCameraZoom = this.resolveCameraZoom();
    if (nextCameraZoom !== this.lastCameraZoom) {
      this.lastCameraZoom = nextCameraZoom;
      this.playerRuntime?.cameraRuntime?.refresh();
    }

    if (!this.player) return;

    const routeBeatRequest = ridgeDevControls.consumeRouteBeatRequest?.();
    if (routeBeatRequest) {
      this.applyDevBridgeBeat(routeBeatRequest.bridgeBeat);
    }

    const resetRequest = ridgeDevControls.consumeResetRequest?.();
    if (resetRequest) {
      this.movePlayerForDev(this.ridgeSpawnPosition);
      return;
    }

    const request = ridgeDevControls.consumeTeleportRequest?.();
    if (!request) return;

    this.movePlayerForDev(resolveRidgeDevTeleportPosition(request));
  }

  private applyDevBridgeBeat(bridgeBeat: RidgeBridgeBeatState): void {
    if (bridgeBeat === 'concert_handoff') {
      bridgeActions.triggerRidgeConcertHandoff();
    } else {
      bridgeActions.setRidgeBridgeBeat(bridgeBeat as RidgeBridgeAreaBeatState);
    }
    this.syncBridgeRouteState();
    this.createBridgeInteractions();
    this.syncPlayerReadabilityHalo();
  }

  private movePlayerForDev(position: { x: number; y: number }): void {
    this.playerRuntime?.moveToWorldPosition(position);
    this.syncPlayerReadabilityHalo();
  }

  private bindDevAuthoringPointer(): void {
    if (!import.meta.env.DEV || this.authoringPointerBound) return;

    this.authoringPointerBound = true;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const ridgeDevControls = this.resolveRidgeDevControls();
      const authoring = ridgeDevControls?.resolveAuthoringState?.();
      if (!authoring?.active) return;

      const source = this.resolveCompositionSource();
      const selection = hitTestStageAuthoringTargets(source, pointer.worldX, pointer.worldY);
      if (selection) {
        ridgeDevControls?.publishAuthoringPick?.(selection);
      }
    });
  }

  private resolveCompositionSource(): BridgeStageCompositionSource {
    return this.resolveRidgeDevControls()?.resolveCompositionSource?.() ?? BRIDGE_STAGE_SOURCE;
  }

  private syncCompositionSource(): void {
    const source = this.resolveCompositionSource();
    if (source === this.lastCompositionSource) return;

    this.lastCompositionSource = source;
    this.playerRuntime?.setCompositionSource(source);
    this.bridgeStage?.applyCompositionSource(source);
  }

  private syncDevRuntimeState(): void {
    const ridgeDevControls = this.resolveRidgeDevControls();
    if (!import.meta.env.DEV || !ridgeDevControls || !this.player) return;
    this.syncCompositionSource();

    const authoring = ridgeDevControls.resolveAuthoringState?.();
    this.playerRuntime?.setAuthoringFrozen(authoring?.active ?? false);

    const railSnapshot = this.playerRuntime?.getRailSnapshot();
    const body = this.player.body
      ? {
          x: this.player.body.x,
          y: this.player.body.y,
          width: this.player.body.width,
          height: this.player.body.height
        }
      : undefined;
    const debugSettings = resolveRidgeDevDebugSettings(
      ridgeDevControls.resolveDebugSettings?.()
    );
    this.bridgeDebugOverlay?.render({
      source: this.resolveCompositionSource(),
      authoring: authoring
        ? {
            active: authoring.active,
            selection: authoring.selection
          }
        : undefined,
      interactionTargets: this.bridgeInteractionTargets,
      player: {
        x: this.player.x,
        y: this.player.y,
        body
      },
      railProgress: railSnapshot?.progress,
      settings: debugSettings
    });
    ridgeDevControls.publishPlayerSnapshot?.({
      x: this.player.x,
      y: this.player.y,
      railProgress: railSnapshot?.progress,
      railScale: railSnapshot?.scale,
      railDepth: railSnapshot?.depth,
      bridgeBeat: this.routeState.bridgeBeat,
      crossingOpen: this.bridgePresentation.crossingOpen,
      playerProgressMax: this.bridgePresentation.playerProgressRange.max,
      nearestStageSpotId: railSnapshot?.nearestSpotId,
      sourceSnippet: railSnapshot?.sourceSnippet
    });
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Bridge tracer effect: ${JSON.stringify(value)}`);
}
