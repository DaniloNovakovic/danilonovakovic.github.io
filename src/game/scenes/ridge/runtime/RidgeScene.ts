import * as Phaser from 'phaser';
import {
  bridgeActions,
  bridgeStore,
  isItemEquipped,
  type OpenOverlayOptions,
  type RidgeFirstPlayableRouteState
} from '@/game/bridge/store';
import { type OverlayId } from '@/game/overlays/overlayIds';
import { PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  SIDE_VIEW_JUMP_VELOCITY_Y,
  SIDE_VIEW_PLAYER_GRAVITY_Y,
  SIDE_VIEW_SPRINT_SPEED,
  SIDE_VIEW_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import {
  createInteriorInteractionRuntime,
  type InteriorInteractionRuntime
} from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';
import {
  createCickaAnimations,
  preloadCickaAssets
} from '../cicka/assets';
import {
  applyRidgeDevTeleportToPlayer,
  RIDGE_DEFAULT_CAMERA_ZOOM,
  resolveRidgeDevCameraZoom,
  type RidgeDevControls
} from './ridgeDevControls';
import {
  BRIDGE_TRACER_INTERACT_RADIUS,
  BRIDGE_TRACER_WORLD,
  createBridgeTracerInteractionTargets,
  type BridgeTracerEffect,
  type BridgeTracerInteractionTarget,
  type BridgeTracerTargetId
} from './bridgeTracerSlice';
import {
  createBridgeTracerStageRuntime,
  type BridgeTracerStageRuntime
} from './BridgeTracerStageRuntime';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';

interface RidgeSceneStartData {
  onClose?: () => void;
  onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused?: boolean;
  resumePosition?: { x: number; y: number };
  ridgeDevControls?: RidgeDevControls;
}

const RIDGE_PLAYER_EDGE_PADDING = 48;
const RIDGE_COYOTE_TIME_MS = 120;
const RIDGE_JUMP_BUFFER_MS = 120;

export class RidgeScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  private playerRuntime?: SideViewPlayerRuntime;
  private bridgeStage?: BridgeTracerStageRuntime;
  private interactionRuntime?: InteriorInteractionRuntime<BridgeTracerTargetId, BridgeTracerEffect>;
  private onClose: () => void = () => {};
  private isPaused = false;
  private resumePosition?: { x: number; y: number };
  private ridgeDevControls?: RidgeDevControls;
  private ridgeSpawnPosition = { ...BRIDGE_TRACER_WORLD.spawn };
  private lastCameraZoom = RIDGE_DEFAULT_CAMERA_ZOOM;
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
  }

  preload(): void {
    if (!this.textures.exists('player_idle')) {
      TextureGenerator.generatePlayer(this);
    }
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
    this.routeState = bridgeStore.getState().progress.ridge.firstPlayableRoute;

    this.bridgeStage?.dispose();
    this.cameras.main.setBackgroundColor('#f7f1df');
    this.physics.world.setBounds(
      BRIDGE_TRACER_WORLD.bounds.x,
      BRIDGE_TRACER_WORLD.bounds.y,
      BRIDGE_TRACER_WORLD.bounds.width,
      BRIDGE_TRACER_WORLD.bounds.height
    );
    createCickaAnimations(this);

    this.bridgeStage = createBridgeTracerStageRuntime(this);
    this.createPlayer(this.bridgeStage.platforms);
    this.syncBridgeRouteState();
    this.createBridgeInteractions();
    this.setPaused(this.isPaused);
    this.playerRuntime?.syncAppearance();
    this.syncDevRuntimeState();
  }

  update(): void {
    this.applyDevControls();

    const playerUpdate = this.playerRuntime?.update();
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
    }

    this.bridgeStage?.showPrompt(
      interaction.activeTarget as BridgeTracerInteractionTarget,
      interaction.prompt.x,
      interaction.prompt.y
    );
    this.syncDevRuntimeState();
  }

  private createPlayer(platforms: readonly Phaser.GameObjects.Zone[]): void {
    this.ridgeSpawnPosition = { ...BRIDGE_TRACER_WORLD.spawn };
    const playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: this.ridgeSpawnPosition,
      resumePosition: this.resumePosition,
      resumeClamp: {
        minX: BRIDGE_TRACER_WORLD.bounds.x + RIDGE_PLAYER_EDGE_PADDING,
        maxX: BRIDGE_TRACER_WORLD.bounds.x + BRIDGE_TRACER_WORLD.bounds.width - RIDGE_PLAYER_EDGE_PADDING,
        minY: BRIDGE_TRACER_WORLD.bounds.y + RIDGE_PLAYER_EDGE_PADDING,
        maxY: BRIDGE_TRACER_WORLD.bounds.y + BRIDGE_TRACER_WORLD.bounds.height - RIDGE_PLAYER_EDGE_PADDING
      },
      sprite: {
        depth: 30,
        gravityY: SIDE_VIEW_PLAYER_GRAVITY_Y
      },
      movement: {
        walkSpeed: SIDE_VIEW_WALK_SPEED,
        sprintSpeed: SIDE_VIEW_SPRINT_SPEED,
        jumpVelocityY: SIDE_VIEW_JUMP_VELOCITY_Y,
        coyoteTimeMs: RIDGE_COYOTE_TIME_MS,
        jumpBufferMs: RIDGE_JUMP_BUFFER_MS
      },
      input: {
        allowJump: false,
        allowSprint: true,
        includeEscapeKey: true
      },
      appearance: {
        isGlassesEquipped: () => isItemEquipped('glasses'),
        idleTextureKey: 'player_idle',
        glassesTextureKey: 'player_glasses'
      },
      camera: {
        worldBounds: BRIDGE_TRACER_WORLD.bounds,
        designSize: {
          width: GAME_DESIGN_WIDTH,
          height: GAME_DESIGN_HEIGHT
        },
        resolveProfile: () => ({
          zoom: this.resolveCameraZoom(),
          followOffsetY: 10
        })
      }
    });
    this.playerRuntime = playerRuntime;
    this.player = playerRuntime.player;
    platforms.forEach((platform) => {
      this.physics.add.collider(playerRuntime.player, platform);
    });
  }

  private createBridgeInteractions(): void {
    this.interactionRuntime = createInteriorInteractionRuntime<
      BridgeTracerTargetId,
      BridgeTracerEffect
    >({
      interactRadius: BRIDGE_TRACER_INTERACT_RADIUS,
      targets: createBridgeTracerInteractionTargets(this.routeState)
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
    bridgeActions.setRidgeBridgeBeat('testing_bridge');
    this.syncBridgeRouteState();
    this.createBridgeInteractions();

    this.bridgeStage?.runToyCarTest(effect.lineIds, () => {
      bridgeActions.setRidgeBridgeBeat('bridge_complete');
      this.syncBridgeRouteState();
      this.createBridgeInteractions();
    });
  }

  private syncBridgeRouteState(): void {
    this.routeState = bridgeStore.getState().progress.ridge.firstPlayableRoute;
    this.bridgeStage?.syncBeat(this.routeState.bridgeBeat, this.player);
  }

  private resolveCameraZoom(): number {
    return resolveRidgeDevCameraZoom(this.ridgeDevControls?.resolveCameraZoom?.());
  }

  private applyDevControls(): void {
    if (!import.meta.env.DEV || !this.ridgeDevControls) return;

    const nextCameraZoom = this.resolveCameraZoom();
    if (nextCameraZoom !== this.lastCameraZoom) {
      this.lastCameraZoom = nextCameraZoom;
      this.playerRuntime?.cameraRuntime?.refresh();
    }

    if (!this.player) return;

    const resetRequest = this.ridgeDevControls.consumeResetRequest?.();
    if (resetRequest) {
      this.movePlayerForDev(this.ridgeSpawnPosition);
      return;
    }

    const request = this.ridgeDevControls.consumeTeleportRequest?.();
    if (!request) return;

    applyRidgeDevTeleportToPlayer(this.player, request);
    this.playerRuntime?.cameraRuntime?.refresh();
  }

  private movePlayerForDev(position: { x: number; y: number }): void {
    if (!this.player) return;
    this.player.setPosition(position.x, position.y);
    this.player.setVelocityX(0);
    this.player.setVelocityY(0);
    this.player.body.setAllowGravity(true);
    this.playerRuntime?.cameraRuntime?.refresh();
  }

  private syncDevRuntimeState(): void {
    if (!import.meta.env.DEV || !this.ridgeDevControls || !this.player) return;
    this.ridgeDevControls.publishPlayerSnapshot?.({
      x: this.player.x,
      y: this.player.y
    });
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Bridge tracer effect: ${JSON.stringify(value)}`);
}
