import * as Phaser from 'phaser';
import {
  bridgeActions,
  bridgeStore,
  isItemEquipped,
  type OpenOverlayOptions,
  type RidgeBridgeBeatState,
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
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import {
  CICKA_ANIMATION_KEYS,
  CICKA_FRAME_INDEX,
  CICKA_ORIGIN,
  CICKA_RUNTIME_SCALE,
  CICKA_TEXTURE_KEY
} from '../cicka/assets';
import {
  createCickaAnimations,
  preloadCickaAssets
} from '../cicka/assets';
import {
  getBridgeDialogueLine,
  getBridgePromptText,
  type BridgeDialogueLineId
} from '../dialogue/bridgeDialogue';
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
  hasCickaSharedToyCar,
  isBridgeCrossingOpen,
  type BridgeTracerEffect,
  type BridgeTracerInteractionTarget,
  type BridgeTracerTargetId
} from './bridgeTracerSlice';

interface RidgeSceneStartData {
  onClose?: () => void;
  onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused?: boolean;
  resumePosition?: { x: number; y: number };
  ridgeDevControls?: RidgeDevControls;
}

type VisibleGameObject = Phaser.GameObjects.GameObject & {
  setVisible(visible: boolean): VisibleGameObject;
};

const RIDGE_PLAYER_EDGE_PADDING = 48;
const RIDGE_COYOTE_TIME_MS = 120;
const RIDGE_JUMP_BUFFER_MS = 120;
const BRIDGE_GROUND_COLLIDER_HEIGHT = 24;
const BRIDGE_DIALOGUE_DURATION_MS = 5600;
const BRIDGE_TEST_DURATION_MS = 1900;
const BRIDGE_DIALOGUE_PANEL_WIDTH = 460;
const BRIDGE_DIALOGUE_TEXT_WIDTH = 418;

export class RidgeScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  interactPrompt?: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
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

  private groundPlatforms: Phaser.GameObjects.Zone[] = [];
  private bridgeSpanCollider?: Phaser.GameObjects.Zone;
  private bridgeBlockerCollider?: Phaser.GameObjects.Zone;
  private blockedBridgeObjects: VisibleGameObject[] = [];
  private completedBridgeObjects: VisibleGameObject[] = [];
  private cickaSprite?: Phaser.GameObjects.Sprite;
  private cickaShadow?: Phaser.GameObjects.Ellipse;
  private toyCar?: Phaser.GameObjects.Container;
  private handoffNote?: Phaser.GameObjects.Text;
  private dialogueContainer?: Phaser.GameObjects.Container;
  private dialogueText?: Phaser.GameObjects.Text;
  private dialogueHideEvent?: Phaser.Time.TimerEvent;
  private toyCarTween?: Phaser.Tweens.Tween;
  private toyCarTestRunning = false;

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
    this.resetRuntimeObjects();

    this.cameras.main.setBackgroundColor('#f7f1df');
    this.physics.world.setBounds(
      BRIDGE_TRACER_WORLD.bounds.x,
      BRIDGE_TRACER_WORLD.bounds.y,
      BRIDGE_TRACER_WORLD.bounds.width,
      BRIDGE_TRACER_WORLD.bounds.height
    );
    createCickaAnimations(this);

    this.createBridgeBlockoutStage();
    this.createPlayer(this.groundPlatforms);
    this.createDialoguePanel();
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
      this.interactPrompt?.setVisible(false);
      this.syncDevRuntimeState();
      return;
    }

    if (interaction.effect) {
      this.handleBridgeInteractionEffect(interaction.effect);
    }

    this.showBridgePrompt(
      interaction.activeTarget as BridgeTracerInteractionTarget,
      interaction.prompt.x,
      interaction.prompt.y
    );
    this.syncDevRuntimeState();
  }

  private resetRuntimeObjects(): void {
    this.groundPlatforms = [];
    this.bridgeSpanCollider = undefined;
    this.bridgeBlockerCollider = undefined;
    this.blockedBridgeObjects = [];
    this.completedBridgeObjects = [];
    this.cickaSprite = undefined;
    this.cickaShadow = undefined;
    this.toyCar = undefined;
    this.handoffNote = undefined;
    this.dialogueContainer = undefined;
    this.dialogueText = undefined;
    this.dialogueHideEvent?.remove(false);
    this.dialogueHideEvent = undefined;
    this.toyCarTween?.stop();
    this.toyCarTween = undefined;
    this.toyCarTestRunning = false;
  }

  private createBridgeBlockoutStage(): void {
    this.add.rectangle(
      BRIDGE_TRACER_WORLD.bounds.width / 2,
      BRIDGE_TRACER_WORLD.bounds.height / 2,
      BRIDGE_TRACER_WORLD.bounds.width,
      BRIDGE_TRACER_WORLD.bounds.height,
      0xf7f1df,
      1
    ).setDepth(-100);

    this.addBackdropInk();
    this.createBridgeGround();
    this.createCickaPlaySpot();
    this.createBridgeDraftsperson();
    this.createBridgeCrossingVisuals();
    this.createConcertHandoffNote();
    this.createInteractionPrompt();
  }

  private addBackdropInk(): void {
    const graphics = this.add.graphics().setDepth(-80);
    graphics.lineStyle(2, 0x1f1f1d, 0.06);
    for (let y = 116; y < BRIDGE_TRACER_WORLD.bounds.height; y += 96) {
      graphics.strokeLineShape(new Phaser.Geom.Line(0, y, BRIDGE_TRACER_WORLD.bounds.width, y));
    }

    graphics.lineStyle(4, 0x1f1f1d, 0.12);
    graphics.beginPath();
    graphics.moveTo(0, BRIDGE_TRACER_WORLD.floorY - 34);
    graphics.lineTo(220, BRIDGE_TRACER_WORLD.floorY - 58);
    graphics.lineTo(460, BRIDGE_TRACER_WORLD.floorY - 34);
    graphics.lineTo(760, BRIDGE_TRACER_WORLD.floorY - 46);
    graphics.strokePath();

    for (let x = 180; x < 1000; x += 190) {
      graphics.lineStyle(3, 0x1f1f1d, 0.12);
      graphics.strokeTriangle(
        x,
        BRIDGE_TRACER_WORLD.floorY - 72,
        x - 34,
        BRIDGE_TRACER_WORLD.floorY - 14,
        x + 40,
        BRIDGE_TRACER_WORLD.floorY - 14
      );
      graphics.lineStyle(2, 0x1f1f1d, 0.1);
      graphics.strokeLineShape(new Phaser.Geom.Line(
        x,
        BRIDGE_TRACER_WORLD.floorY - 54,
        x,
        BRIDGE_TRACER_WORLD.floorY - 12
      ));
    }

    graphics.lineStyle(5, 0x1f1f1d, 0.14);
    graphics.strokeLineShape(new Phaser.Geom.Line(1980, 332, 2060, 250));
    graphics.strokeLineShape(new Phaser.Geom.Line(2060, 250, 2140, 332));
    graphics.lineStyle(3, 0x1f1f1d, 0.1);
    graphics.strokeLineShape(new Phaser.Geom.Line(2024, 292, 2094, 292));
  }

  private createBridgeGround(): void {
    const { floorY, bridge, bounds } = BRIDGE_TRACER_WORLD;
    const groundY = floorY + BRIDGE_GROUND_COLLIDER_HEIGHT / 2;

    this.add.rectangle(
      bridge.leftBankEndX / 2,
      floorY + 24,
      bridge.leftBankEndX,
      48,
      0xf7f1df,
      1
    )
      .setStrokeStyle(4, 0x1f1f1d, 0.8)
      .setDepth(1);
    this.add.rectangle(
      bridge.rightBankStartX + (bounds.width - bridge.rightBankStartX) / 2,
      floorY + 24,
      bounds.width - bridge.rightBankStartX,
      48,
      0xf7f1df,
      1
    )
      .setStrokeStyle(4, 0x1f1f1d, 0.8)
      .setDepth(1);

    this.addHatching(40, floorY + 8, bridge.leftBankEndX - 80, 34, 14, 0.12);
    this.addHatching(bridge.rightBankStartX + 34, floorY + 8, bounds.width - bridge.rightBankStartX - 80, 34, 14, 0.12);

    this.groundPlatforms.push(
      this.addStaticZone(bridge.leftBankEndX / 2, groundY, bridge.leftBankEndX, BRIDGE_GROUND_COLLIDER_HEIGHT),
      this.addStaticZone(
        bridge.rightBankStartX + (bounds.width - bridge.rightBankStartX) / 2,
        groundY,
        bounds.width - bridge.rightBankStartX,
        BRIDGE_GROUND_COLLIDER_HEIGHT
      )
    );
  }

  private createCickaPlaySpot(): void {
    const { cickaPlaySpot } = BRIDGE_TRACER_WORLD;
    this.cickaShadow = this.add.ellipse(
      cickaPlaySpot.x,
      cickaPlaySpot.y + 8,
      92,
      18,
      0x1f1f1d,
      0.12
    ).setDepth(15);
    this.cickaSprite = this.add.sprite(
      cickaPlaySpot.x,
      cickaPlaySpot.y,
      CICKA_TEXTURE_KEY,
      CICKA_FRAME_INDEX.perchSit
    )
      .setOrigin(CICKA_ORIGIN.x, CICKA_ORIGIN.y)
      .setScale(CICKA_RUNTIME_SCALE)
      .setDepth(26);
    this.cickaSprite.play(CICKA_ANIMATION_KEYS.perchIdle);
    this.toyCar = this.createToyCar(cickaPlaySpot.x + 66, cickaPlaySpot.y + 8);
  }

  private createBridgeDraftsperson(): void {
    const { draftsperson, blueprint } = BRIDGE_TRACER_WORLD;
    this.add.ellipse(draftsperson.x, draftsperson.y + 10, 80, 18, 0x1f1f1d, 0.1).setDepth(14);
    this.add.rectangle(draftsperson.x, draftsperson.y - 40, 38, 62, 0xf7f1df, 1)
      .setStrokeStyle(4, 0x1f1f1d, 0.86)
      .setDepth(21);
    this.add.circle(draftsperson.x, draftsperson.y - 82, 26, 0xf7f1df, 1)
      .setStrokeStyle(4, 0x1f1f1d, 0.9)
      .setDepth(22);
    this.add.line(draftsperson.x + 6, draftsperson.y - 87, -6, 0, 6, 0, 0x1f1f1d, 0.8)
      .setLineWidth(3)
      .setDepth(23);
    this.add.line(draftsperson.x - 16, draftsperson.y - 90, -5, -4, 5, 4, 0x1f1f1d, 0.65)
      .setLineWidth(2)
      .setDepth(23);
    this.add.line(draftsperson.x + 16, draftsperson.y - 90, -5, 4, 5, -4, 0x1f1f1d, 0.65)
      .setLineWidth(2)
      .setDepth(23);

    this.add.rectangle(blueprint.x, blueprint.y, 184, 116, 0xf7f1df, 1)
      .setStrokeStyle(4, 0x1f1f1d, 0.82)
      .setAngle(-2)
      .setDepth(12);
    this.add.line(blueprint.x - 48, blueprint.y - 6, -54, 0, -12, -18, 0x1f1f1d, 0.7)
      .setLineWidth(4)
      .setDepth(13);
    this.add.line(blueprint.x + 42, blueprint.y - 2, 10, -18, 54, 2, 0x1f1f1d, 0.7)
      .setLineWidth(4)
      .setDepth(13);
    this.completedBridgeObjects.push(this.asVisible(this.add.line(
      blueprint.x,
      blueprint.y - 13,
      -26,
      -6,
      26,
      6,
      0x1f1f1d,
      0.86
    ).setLineWidth(4).setDepth(14)));
    this.addHatching(blueprint.x - 74, blueprint.y + 28, 142, 24, 11, 0.1);
  }

  private createBridgeCrossingVisuals(): void {
    const { bridge, floorY } = BRIDGE_TRACER_WORLD;
    this.add.rectangle(bridge.leftBankEndX - 18, floorY - 22, 34, 88, 0xf7f1df, 1)
      .setStrokeStyle(4, 0x1f1f1d, 0.84)
      .setDepth(5);
    this.add.rectangle(bridge.rightBankStartX + 18, floorY - 22, 34, 88, 0xf7f1df, 1)
      .setStrokeStyle(4, 0x1f1f1d, 0.84)
      .setDepth(5);

    this.blockedBridgeObjects.push(
      this.asVisible(this.add.rectangle(bridge.centerX, floorY - 40, 220, 44, 0xf7f1df, 0.7)
        .setStrokeStyle(3, 0x1f1f1d, 0.45)
        .setDepth(6)),
      this.asVisible(this.add.line(bridge.centerX - 58, floorY - 42, -38, -22, 38, 22, 0x1f1f1d, 0.72)
        .setLineWidth(5)
        .setDepth(7)),
      this.asVisible(this.add.line(bridge.centerX + 58, floorY - 42, -38, 22, 38, -22, 0x1f1f1d, 0.72)
        .setLineWidth(5)
        .setDepth(7))
    );

    const deck = this.add.rectangle(
      bridge.centerX,
      bridge.deckY - 12,
      bridge.deckWidth,
      24,
      0xf7f1df,
      1
    )
      .setStrokeStyle(5, 0x1f1f1d, 0.9)
      .setDepth(8);
    const topLine = this.add.line(bridge.centerX, bridge.deckY - 30, -130, 0, 130, 0, 0x1f1f1d, 0.62)
      .setLineWidth(3)
      .setDepth(9);
    const bottomLine = this.add.line(bridge.centerX, bridge.deckY + 2, -128, 0, 128, 0, 0x1f1f1d, 0.36)
      .setLineWidth(2)
      .setDepth(9);
    this.completedBridgeObjects.push(
      this.asVisible(deck),
      this.asVisible(topLine),
      this.asVisible(bottomLine)
    );
  }

  private createConcertHandoffNote(): void {
    this.handoffNote = createUiText(
      this,
      BRIDGE_TRACER_WORLD.exit.x + 70,
      BRIDGE_TRACER_WORLD.exit.y - 130,
      'evening music ahead',
      {
        fontSize: '14px',
        color: '#1a1a1a',
        backgroundColor: '#f7f1df',
        padding: { x: 6, y: 3 }
      }
    )
      .setOrigin(0.5)
      .setAngle(-2)
      .setDepth(24)
      .setVisible(false);
  }

  private createInteractionPrompt(): void {
    this.interactPrompt?.destroy();
    this.interactPrompt = createUiText(this, 0, 0, '', {
      fontSize: '15px',
      color: '#1a1a1a',
      backgroundColor: '#f7f1df',
      padding: { x: 6, y: 3 }
    })
      .setOrigin(0.5)
      .setDepth(100)
      .setVisible(false);
  }

  private createDialoguePanel(): void {
    const container = this.add.container(GAME_DESIGN_WIDTH / 2, 78)
      .setDepth(220)
      .setScrollFactor(0)
      .setVisible(false);
    const panel = this.add.rectangle(0, 0, BRIDGE_DIALOGUE_PANEL_WIDTH, 150, 0xf7f1df, 0.96)
      .setStrokeStyle(4, 0x1f1f1d, 0.9);
    const label = createUiText(this, -210, -66, 'Bridge Tracer', {
      fontSize: '12px',
      color: '#4b4337'
    }).setOrigin(0, 0.5);
    const text = createUiText(this, -210, -46, '', {
      fontSize: '12px',
      color: '#1a1a1a',
      lineSpacing: 5,
      wordWrap: { width: BRIDGE_DIALOGUE_TEXT_WIDTH }
    }).setOrigin(0, 0);

    container.add([panel, label, text]);
    this.dialogueContainer = container;
    this.dialogueText = text;
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
    const targets = createBridgeTracerInteractionTargets(this.routeState);
    this.interactionRuntime = createInteriorInteractionRuntime<
      BridgeTracerTargetId,
      BridgeTracerEffect
    >({
      interactRadius: BRIDGE_TRACER_INTERACT_RADIUS,
      targets
    });
  }

  private handleBridgeInteractionEffect(effect: BridgeTracerEffect): void {
    if (effect.kind === 'showDialogue') {
      this.showBridgeDialogue(effect.lineIds);
      if (effect.nextBeat) {
        bridgeActions.setRidgeBridgeBeat(effect.nextBeat);
        this.syncBridgeRouteState();
        this.createBridgeInteractions();
      }
      return;
    }

    if (effect.kind === 'runToyCarTest') {
      this.runToyCarBridgeTest(effect.lineIds);
      return;
    }

    this.showBridgeDialogue(effect.lineIds, 7200);
    bridgeActions.triggerRidgeConcertHandoff();
    this.syncBridgeRouteState();
    this.createBridgeInteractions();
  }

  private runToyCarBridgeTest(lineIds: readonly BridgeDialogueLineId[]): void {
    if (this.toyCarTestRunning) return;
    this.toyCarTestRunning = true;
    this.showBridgeDialogue(lineIds, BRIDGE_DIALOGUE_DURATION_MS + BRIDGE_TEST_DURATION_MS);
    bridgeActions.setRidgeBridgeBeat('testing_bridge');
    this.syncBridgeRouteState();
    this.createBridgeInteractions();

    if (!this.toyCar) {
      bridgeActions.setRidgeBridgeBeat('bridge_complete');
      this.syncBridgeRouteState();
      this.createBridgeInteractions();
      this.toyCarTestRunning = false;
      return;
    }

    this.toyCar.setVisible(true);
    this.toyCar.setPosition(
      BRIDGE_TRACER_WORLD.blueprint.x - 22,
      BRIDGE_TRACER_WORLD.blueprint.y + 44
    );
    this.toyCarTween?.stop();
    this.toyCarTween = this.tweens.add({
      targets: this.toyCar,
      x: BRIDGE_TRACER_WORLD.bridge.rightBankStartX + 120,
      y: BRIDGE_TRACER_WORLD.floorY - 4,
      duration: BRIDGE_TEST_DURATION_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.toyCarTestRunning = false;
        bridgeActions.setRidgeBridgeBeat('bridge_complete');
        this.syncBridgeRouteState();
        this.createBridgeInteractions();
        this.showBridgeDialogue(['bridge.draftsperson.toy_car_test.04'], 3600);
      }
    });
  }

  private syncBridgeRouteState(): void {
    this.routeState = bridgeStore.getState().progress.ridge.firstPlayableRoute;
    const beat = this.routeState.bridgeBeat;
    const crossingOpen = isBridgeCrossingOpen(beat);
    const drawingVisible = beat === 'testing_bridge' || crossingOpen;

    this.setVisible(this.blockedBridgeObjects, !crossingOpen);
    this.setVisible(this.completedBridgeObjects, drawingVisible);
    this.syncBridgePhysics(crossingOpen);
    this.syncCickaAndToyCar(beat);
    this.handoffNote?.setVisible(beat === 'concert_handoff');
  }

  private syncBridgePhysics(crossingOpen: boolean): void {
    if (crossingOpen) {
      this.bridgeBlockerCollider?.destroy();
      this.bridgeBlockerCollider = undefined;
      if (!this.bridgeSpanCollider) {
        this.bridgeSpanCollider = this.addStaticZone(
          BRIDGE_TRACER_WORLD.bridge.centerX,
          BRIDGE_TRACER_WORLD.floorY + BRIDGE_GROUND_COLLIDER_HEIGHT / 2,
          BRIDGE_TRACER_WORLD.bridge.deckWidth,
          BRIDGE_GROUND_COLLIDER_HEIGHT
        );
        if (this.player) {
          this.physics.add.collider(this.player, this.bridgeSpanCollider);
        }
      }
      return;
    }

    this.bridgeSpanCollider?.destroy();
    this.bridgeSpanCollider = undefined;
    if (!this.bridgeBlockerCollider) {
      this.bridgeBlockerCollider = this.addStaticZone(
        BRIDGE_TRACER_WORLD.bridge.leftBankEndX - 22,
        BRIDGE_TRACER_WORLD.floorY - 58,
        34,
        126
      );
      if (this.player) {
        this.physics.add.collider(this.player, this.bridgeBlockerCollider);
      }
    }
  }

  private syncCickaAndToyCar(bridgeBeat: RidgeBridgeBeatState): void {
    const crossingOpen = isBridgeCrossingOpen(bridgeBeat);
    const cickaSpot = crossingOpen
      ? BRIDGE_TRACER_WORLD.cickaSettledSpot
      : BRIDGE_TRACER_WORLD.cickaPlaySpot;
    this.cickaSprite?.setPosition(cickaSpot.x, cickaSpot.y);
    this.cickaShadow?.setPosition(cickaSpot.x, cickaSpot.y + 8);

    if (!this.toyCar || this.toyCarTestRunning) return;

    if (!hasCickaSharedToyCar(bridgeBeat)) {
      this.toyCar.setVisible(true);
      this.toyCar.setPosition(
        BRIDGE_TRACER_WORLD.cickaPlaySpot.x + 66,
        BRIDGE_TRACER_WORLD.cickaPlaySpot.y + 8
      );
      return;
    }

    if (bridgeBeat === 'toy_car_shared') {
      this.toyCar.setVisible(true);
      this.toyCar.setPosition(
        BRIDGE_TRACER_WORLD.blueprint.x - 22,
        BRIDGE_TRACER_WORLD.blueprint.y + 44
      );
      return;
    }

    this.toyCar.setVisible(true);
    this.toyCar.setPosition(
      BRIDGE_TRACER_WORLD.bridge.rightBankStartX + 120,
      BRIDGE_TRACER_WORLD.floorY - 4
    );
  }

  private showBridgePrompt(
    target: BridgeTracerInteractionTarget,
    x: number,
    y: number
  ): void {
    const prompt = getBridgePromptText(target.promptLineId);
    this.interactPrompt
      ?.setText(`[E] ${prompt}`)
      .setPosition(x, y)
      .setVisible(true);
  }

  private showBridgeDialogue(
    lineIds: readonly BridgeDialogueLineId[],
    durationMs: number = BRIDGE_DIALOGUE_DURATION_MS
  ): void {
    if (!this.dialogueContainer || !this.dialogueText) return;
    const text = lineIds.map((id) => {
      const line = getBridgeDialogueLine(id);
      return line.speaker === 'Prompt'
        ? line.text
        : `${line.speaker}: ${line.text}`;
    }).join('\n');

    this.dialogueText.setText(text);
    this.dialogueContainer.setVisible(true);
    this.dialogueHideEvent?.remove(false);
    this.dialogueHideEvent = this.time.delayedCall(durationMs, () => {
      this.dialogueContainer?.setVisible(false);
    });
  }

  private createToyCar(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(25);
    const body = this.add.rectangle(0, -7, 48, 20, 0xf7f1df, 1)
      .setStrokeStyle(3, 0x1f1f1d, 0.88);
    const roof = this.add.rectangle(-4, -20, 24, 14, 0xf7f1df, 1)
      .setStrokeStyle(2, 0x1f1f1d, 0.72);
    const wheelLeft = this.add.circle(-15, 6, 6, 0x1f1f1d, 0.9);
    const wheelRight = this.add.circle(16, 6, 6, 0x1f1f1d, 0.9);
    container.add([body, roof, wheelLeft, wheelRight]);
    return container;
  }

  private addHatching(
    x: number,
    y: number,
    width: number,
    height: number,
    spacing: number,
    alpha: number
  ): void {
    const graphics = this.add.graphics().setDepth(4);
    graphics.lineStyle(2, 0x1f1f1d, alpha);
    for (let offset = 0; offset <= width + height; offset += spacing) {
      graphics.strokeLineShape(new Phaser.Geom.Line(
        x + offset,
        y,
        x + offset - height,
        y + height
      ));
    }
  }

  private addStaticZone(
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Zone {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    return zone;
  }

  private asVisible<GameObject extends VisibleGameObject>(gameObject: GameObject): GameObject {
    return gameObject;
  }

  private setVisible(objects: readonly VisibleGameObject[], visible: boolean): void {
    objects.forEach((object) => object.setVisible(visible));
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
