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
  type RidgeDevAuthoringState,
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
import {
  advanceStageAuthoringPointer,
  beginStageAuthoringPointer,
  createIdleStageAuthoringPointerState,
  finishStageAuthoringPointer,
  hitTestStageAuthoringTargets,
  isWorldPointInsideCameraView,
  resolveStageAuthoringTargetPoint,
  serializeStageAuthoringSelection,
  type StageAuthoringPointerIntent,
  type StageAuthoringPointerState
} from '../bridge/stageAuthoring';
import {
  BRIDGE_STAGE_SOURCE,
  getStageCompositionPlacementSignature,
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
  getRidgeDevControls?: () => RidgeDevControls | undefined;
}

export class RidgeScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  private playerRuntime?: BridgeWalkRailPlayerRuntime;
  private bridgeStage?: BridgeTracerStageRuntime;
  private bridgeDebugOverlay?: BridgeStageDebugOverlay;
  private interactionRuntime?: InteriorInteractionRuntime<BridgeTracerTargetId, BridgeTracerEffect>;
  private bridgeInteractionTargets: BridgeTracerInteractionTarget[] = [];
  private onClose: () => void = () => {};
  private isPaused = false;
  private resumePosition?: { x: number; y: number };
  private getRidgeDevControls?: () => RidgeDevControls | undefined;
  private authoringPointerBound = false;
  private lastAuthoringActive = false;
  private lastAuthoringSelectionKey: string | null = null;
  private authoringPointer: StageAuthoringPointerState = createIdleStageAuthoringPointerState();
  private ridgeSpawnPosition = { ...BRIDGE_TRACER_WORLD.spawn };
  private lastCameraZoom = RIDGE_DEFAULT_CAMERA_ZOOM;
  private lastCompositionPlacementSignature = getStageCompositionPlacementSignature(BRIDGE_STAGE_SOURCE);
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
    this.syncBridgeInteractionTargets(this.resolveCompositionSource());
    this.setPaused(this.isPaused);
    this.playerRuntime?.syncAppearance();
    this.bindDevAuthoringPointer();
    this.syncDevRuntimeState();
  }

  update(_time: number, delta: number): void {
    this.applyDevControls();

    const playerUpdate = this.playerRuntime?.update(delta);
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
  }

  private syncBridgeInteractionTargets(source: BridgeStageCompositionSource): void {
    const nextTargets = createBridgeTracerInteractionTargets(this.routeState, source);
    const canMutateTargets = this.interactionRuntime &&
      this.bridgeInteractionTargets.length === nextTargets.length &&
      this.bridgeInteractionTargets.every((target, index) => target.id === nextTargets[index]?.id);

    if (!this.interactionRuntime || !canMutateTargets) {
      this.bridgeInteractionTargets = nextTargets;
      this.interactionRuntime = createInteriorInteractionRuntime<
        BridgeTracerTargetId,
        BridgeTracerEffect
      >({
        interactRadius: BRIDGE_TRACER_INTERACT_RADIUS,
        targets: this.bridgeInteractionTargets
      });
      return;
    }

    nextTargets.forEach((nextTarget, index) => {
      Object.assign(this.bridgeInteractionTargets[index]!, nextTarget);
    });
  }

  private handleBridgeInteractionEffect(effect: BridgeTracerEffect): void {
    switch (effect.kind) {
      case 'showDialogue':
        this.bridgeStage?.showDialogue(effect.lineIds);
        if (effect.nextBeat) {
          bridgeActions.setRidgeBridgeBeat(effect.nextBeat);
          this.syncBridgeRouteState();
          this.syncBridgeInteractionTargets(this.resolveCompositionSource());
        }
        return;
      case 'runToyCarTest':
        this.runToyCarBridgeTest(effect);
        return;
      case 'triggerConcertHandoff':
        this.bridgeStage?.showDialogue(effect.lineIds, 7200);
        bridgeActions.triggerRidgeConcertHandoff();
        this.syncBridgeRouteState();
        this.syncBridgeInteractionTargets(this.resolveCompositionSource());
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
      this.syncBridgeInteractionTargets(this.resolveCompositionSource());
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
    return this.getRidgeDevControls?.();
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
    this.syncBridgeInteractionTargets(this.resolveCompositionSource());
  }

  private movePlayerForDev(position: { x: number; y: number }): void {
    this.playerRuntime?.moveToWorldPosition(position);
  }

  private bindDevAuthoringPointer(): void {
    if (!import.meta.env.DEV || this.authoringPointerBound) return;

    this.authoringPointerBound = true;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const ridgeDevControls = this.resolveRidgeDevControls();
      const authoring = ridgeDevControls?.resolveAuthoringState?.();
      if (!authoring?.active) return;

      const source = this.resolveCompositionSource();
      const hit = hitTestStageAuthoringTargets(source, pointer.worldX, pointer.worldY);
      const camera = this.cameras.main;

      this.authoringPointer = beginStageAuthoringPointer({
        hit,
        offsetOnly: pointer.event?.shiftKey ?? false,
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
        pointerX: pointer.x,
        pointerY: pointer.y
      });
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.authoringPointer.mode === 'idle') return;

      const ridgeDevControls = this.resolveRidgeDevControls();
      const authoring = ridgeDevControls?.resolveAuthoringState?.();
      if (!authoring?.active) {
        this.authoringPointer = createIdleStageAuthoringPointerState();
        return;
      }

      const camera = this.cameras.main;
      const step = advanceStageAuthoringPointer(this.authoringPointer, {
        pointerX: pointer.x,
        pointerY: pointer.y,
        worldX: pointer.worldX,
        worldY: pointer.worldY,
        zoom: camera.zoom
      });
      this.authoringPointer = step.state;
      this.publishAuthoringPointerIntents(ridgeDevControls, step.intents);
      if (step.panScroll) {
        camera.scrollX = step.panScroll.scrollX;
        camera.scrollY = step.panScroll.scrollY;
      }
    });

    this.input.on('pointerup', () => {
      const ridgeDevControls = this.resolveRidgeDevControls();
      const finished = finishStageAuthoringPointer(this.authoringPointer);
      this.authoringPointer = finished.state;
      this.publishAuthoringPointerIntents(ridgeDevControls, finished.intents);
    });
  }

  private publishAuthoringPointerIntents(
    ridgeDevControls: RidgeDevControls | undefined,
    intents: readonly StageAuthoringPointerIntent[]
  ): void {
    intents.forEach((intent) => {
      if (intent.kind === 'pick') {
        ridgeDevControls?.publishAuthoringPick?.(intent.selection);
        return;
      }
      ridgeDevControls?.publishAuthoringDrag?.({
        selection: intent.selection,
        worldX: intent.worldX,
        worldY: intent.worldY,
        offsetOnly: intent.offsetOnly
      });
    });
  }

  private syncAuthoringCamera(
    authoring: RidgeDevAuthoringState | undefined,
    source: BridgeStageCompositionSource
  ): void {
    const camera = this.cameras.main;
    const active = authoring?.active ?? false;

    if (active && !this.lastAuthoringActive) {
      camera.stopFollow();
    }

    if (!active && this.lastAuthoringActive && this.player) {
      camera.startFollow(this.player, true, 0.08, 0.08);
      this.playerRuntime?.cameraRuntime?.refresh();
      this.lastAuthoringSelectionKey = null;
    }

    this.lastAuthoringActive = active;
    if (!active) return;
    if (!authoring?.selection) {
      this.lastAuthoringSelectionKey = null;
      return;
    }

    const selectionKey = serializeStageAuthoringSelection(authoring.selection);
    if (!selectionKey || selectionKey === this.lastAuthoringSelectionKey) return;

    const target = resolveStageAuthoringTargetPoint(source, authoring.selection);
    if (!isWorldPointInsideCameraView(camera.worldView, target)) {
      camera.centerOn(target.x, target.y);
    }
    this.lastAuthoringSelectionKey = selectionKey;
  }

  private resolveCompositionSource(): BridgeStageCompositionSource {
    return this.resolveRidgeDevControls()?.resolveCompositionSource?.() ?? BRIDGE_STAGE_SOURCE;
  }

  private syncCompositionSource(): void {
    const source = this.resolveCompositionSource();
    const placementSignature = getStageCompositionPlacementSignature(source);
    if (placementSignature === this.lastCompositionPlacementSignature) return;

    this.lastCompositionPlacementSignature = placementSignature;
    this.playerRuntime?.setCompositionSource(source);
    this.bridgeStage?.applyCompositionSource(source);
    this.syncBridgeInteractionTargets(source);
  }

  private syncDevRuntimeState(): void {
    const ridgeDevControls = this.resolveRidgeDevControls();
    if (!import.meta.env.DEV || !ridgeDevControls || !this.player) return;
    this.syncCompositionSource();

    const authoring = ridgeDevControls.resolveAuthoringState?.();
    this.playerRuntime?.setAuthoringFrozen(authoring?.active ?? false);

    const compositionSource = this.resolveCompositionSource();
    this.syncAuthoringCamera(authoring, compositionSource);

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
