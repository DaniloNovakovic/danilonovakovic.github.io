import * as Phaser from 'phaser';
import type { RidgeBridgeBeatState } from '@/game/bridge/store';
import {
  GAME_DESIGN_WIDTH
} from '@/game/sharedSceneRuntime/config';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { getMessages } from '@/shared/i18n';
import {
  CICKA_ANIMATION_KEYS,
  CICKA_FRAME_INDEX,
  CICKA_ORIGIN,
  CICKA_RUNTIME_SCALE,
  CICKA_TEXTURE_KEY
} from '../cicka/assets';
import { BRIDGE_TEXTURE_KEYS } from '../bridge/assets';
import {
  getBridgeDialogueLine,
  getBridgePromptText,
  type BridgeDialogueLineId
} from '../dialogue/bridgeDialogue';
import {
  BRIDGE_TRACER_WORLD,
  hasCickaSharedToyCar,
  isBridgeCrossingOpen,
  type BridgeTracerInteractionTarget
} from './bridgeTracerSlice';

type VisibleGameObject = Phaser.GameObjects.GameObject & {
  setVisible(visible: boolean): VisibleGameObject;
};

const BRIDGE_GROUND_COLLIDER_HEIGHT = 24;
const BRIDGE_DIALOGUE_DURATION_MS = 5600;
const BRIDGE_TEST_DURATION_MS = 1900;
const BRIDGE_DIALOGUE_PANEL_WIDTH = 460;
const BRIDGE_DIALOGUE_TEXT_WIDTH = 418;
const BRIDGE_CHARACTER_GROUND_OFFSET_Y = 8;
const BRIDGE_FAR_LAYER_SCALE = 0.82;
const BRIDGE_CLOSE_STAGE_SCALE = 1.25;
const BRIDGE_CLOSE_STAGE_FLOOR_SOURCE_Y = 556;
const BRIDGE_CLOSE_STAGE_OFFSET_Y = -12;

type BridgeImageOptions = {
  alpha?: number;
  depth?: number;
  flipX?: boolean;
  origin?: readonly [number, number];
  scale?: number;
  scrollFactor?: readonly [number, number];
  tint?: number;
};

export interface BridgeTracerStageRuntime {
  readonly platforms: readonly Phaser.GameObjects.Zone[];
  dispose(): void;
  hidePrompt(): void;
  showPrompt(target: BridgeTracerInteractionTarget, x: number, y: number): void;
  showDialogue(lineIds: readonly BridgeDialogueLineId[], durationMs?: number): void;
  syncBeat(
    bridgeBeat: RidgeBridgeBeatState,
    player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ): void;
  runToyCarTest(
    lineIds: readonly BridgeDialogueLineId[],
    onComplete: () => void
  ): boolean;
}

export function createBridgeTracerStageRuntime(
  scene: Phaser.Scene
): BridgeTracerStageRuntime {
  const stage = new BridgeTracerStageRuntimeImpl(scene);
  stage.create();
  return stage;
}

class BridgeTracerStageRuntimeImpl implements BridgeTracerStageRuntime {
  private readonly scene: Phaser.Scene;
  private readonly groundPlatforms: Phaser.GameObjects.Zone[] = [];
  private bridgeSpanCollider?: Phaser.GameObjects.Zone;
  private bridgeBlockerCollider?: Phaser.GameObjects.Zone;
  private blockedBridgeObjects: VisibleGameObject[] = [];
  private completedBridgeObjects: VisibleGameObject[] = [];
  private cickaSprite?: Phaser.GameObjects.Sprite;
  private cickaShadow?: Phaser.GameObjects.Ellipse;
  private toyCar?: Phaser.GameObjects.Image;
  private toyCarHalo?: Phaser.GameObjects.Graphics;
  private toyCarShadow?: Phaser.GameObjects.Ellipse;
  private bridgeBuilder?: Phaser.GameObjects.Image;
  private handoffNote?: Phaser.GameObjects.Text;
  private interactPrompt?: Phaser.GameObjects.Text;
  private dialogueContainer?: Phaser.GameObjects.Container;
  private dialogueText?: Phaser.GameObjects.Text;
  private dialogueHideEvent?: Phaser.Time.TimerEvent;
  private builderIdleTween?: Phaser.Tweens.Tween;
  private builderTalkTween?: Phaser.Tweens.Tween;
  private toyCarTween?: Phaser.Tweens.Tween;
  private toyCarTestRunning = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get platforms(): readonly Phaser.GameObjects.Zone[] {
    return this.groundPlatforms;
  }

  create(): void {
    this.scene.add.rectangle(
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
    this.createDialoguePanel();
  }

  dispose(): void {
    this.dialogueHideEvent?.remove(false);
    this.dialogueHideEvent = undefined;
    this.builderIdleTween?.stop();
    this.builderIdleTween = undefined;
    this.builderTalkTween?.stop();
    this.builderTalkTween = undefined;
    this.toyCarTween?.stop();
    this.toyCarTween = undefined;
    this.toyCarTestRunning = false;
  }

  hidePrompt(): void {
    this.interactPrompt?.setVisible(false);
  }

  showPrompt(target: BridgeTracerInteractionTarget, x: number, y: number): void {
    const prompt = getBridgePromptText(target.promptLineId);
    this.interactPrompt
      ?.setText(`[E] ${prompt}`)
      .setPosition(x, y)
      .setVisible(true);
  }

  showDialogue(
    lineIds: readonly BridgeDialogueLineId[],
    durationMs: number = BRIDGE_DIALOGUE_DURATION_MS
  ): void {
    if (!this.dialogueContainer || !this.dialogueText) return;
    const text = lineIds.map((id) => {
      const line = getBridgeDialogueLine(id);
      return line.speakerId === 'prompt'
        ? line.text
        : `${line.speaker}: ${line.text}`;
    }).join('\n');

    this.dialogueText.setText(text);
    this.dialogueContainer.setVisible(true);
    this.setBuilderTalking(lineIds.some((id) => id.startsWith('bridge.draftsperson.')));
    this.dialogueHideEvent?.remove(false);
    this.dialogueHideEvent = this.scene.time.delayedCall(durationMs, () => {
      this.dialogueContainer?.setVisible(false);
      this.setBuilderTalking(false);
    });
  }

  syncBeat(
    bridgeBeat: RidgeBridgeBeatState,
    player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ): void {
    const crossingOpen = isBridgeCrossingOpen(bridgeBeat);

    this.setVisible(this.blockedBridgeObjects, !crossingOpen);
    this.setVisible(this.completedBridgeObjects, crossingOpen);
    this.syncBridgePhysics(crossingOpen, player);
    this.syncCickaAndToyCar(bridgeBeat);
    this.handoffNote?.setVisible(bridgeBeat === 'concert_handoff');
  }

  runToyCarTest(
    lineIds: readonly BridgeDialogueLineId[],
    onComplete: () => void
  ): boolean {
    if (this.toyCarTestRunning) return false;
    this.toyCarTestRunning = true;
    this.showDialogue(lineIds, BRIDGE_DIALOGUE_DURATION_MS + BRIDGE_TEST_DURATION_MS);
    this.setVisible(this.completedBridgeObjects, true);

    if (!this.toyCar) {
      this.toyCarTestRunning = false;
      onComplete();
      return true;
    }

    this.toyCar.setVisible(true);
    this.toyCarShadow?.setVisible(true);
    this.toyCar.setPosition(
      BRIDGE_TRACER_WORLD.blueprint.x - 22,
      BRIDGE_TRACER_WORLD.blueprint.y + 44
    );
    this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, true);
    this.toyCarTween?.stop();
    this.toyCarTween = this.scene.tweens.add({
      targets: this.toyCar,
      x: BRIDGE_TRACER_WORLD.bridge.rightBankStartX + 120,
      y: this.getGroundedY(BRIDGE_TRACER_WORLD.floorY) - 4,
      duration: BRIDGE_TEST_DURATION_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!this.toyCar) return;
        this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, true);
      },
      onComplete: () => {
        this.toyCarTestRunning = false;
        onComplete();
        this.showDialogue(['bridge.draftsperson.toy_car_test.04'], 3600);
      }
    });
    return true;
  }

  private addBackdropInk(): void {
    const { bounds, floorY } = BRIDGE_TRACER_WORLD;
    const paper = this.scene.add.graphics().setDepth(-90);
    paper.fillStyle(0xf7f1df, 1);
    paper.fillRect(0, 0, bounds.width, bounds.height);

    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.layeredFarMountains, -80, -12, {
      depth: -82,
      origin: [0, 0],
      scale: BRIDGE_FAR_LAYER_SCALE,
      scrollFactor: [0.16, 1]
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.layeredFarMountains, 1260, -12, {
      depth: -82,
      origin: [0, 0],
      scale: BRIDGE_FAR_LAYER_SCALE,
      scrollFactor: [0.16, 1]
    });

    this.addBridgeImage(
      BRIDGE_TEXTURE_KEYS.layeredCloseStage,
      0,
      floorY - BRIDGE_CLOSE_STAGE_FLOOR_SOURCE_Y * BRIDGE_CLOSE_STAGE_SCALE + BRIDGE_CLOSE_STAGE_OFFSET_Y,
      {
        depth: 3,
        origin: [0, 0],
        scale: BRIDGE_CLOSE_STAGE_SCALE
      }
    );
    this.addAmbientInkLife();
  }

  private addAmbientInkLife(): void {
    const { bounds, floorY } = BRIDGE_TRACER_WORLD;
    const wind = this.scene.add.graphics().setDepth(-30);
    wind.lineStyle(2, 0x1f1f1d, 0.14);
    [
      [290, floorY - 128, 82],
      [1180, floorY - 154, 64],
      [1960, floorY - 118, 74],
      [2380, floorY - 166, 58]
    ].forEach(([x, y, width]) => {
      wind.beginPath();
      wind.moveTo(x, y);
      wind.lineTo(x + width / 2, y - 8);
      wind.lineTo(x + width, y);
      wind.strokePath();
    });

    const edgeDust = this.scene.add.graphics()
      .setDepth(4)
      .setScrollFactor(1, 1);
    edgeDust.lineStyle(1, 0x1f1f1d, 0.1);
    for (let x = 140; x < bounds.width; x += 220) {
      edgeDust.lineBetween(x, floorY + 18, x + 42, floorY + 14);
    }
  }

  private createBridgeGround(): void {
    const { floorY, bridge, bounds } = BRIDGE_TRACER_WORLD;
    const groundY = floorY + BRIDGE_GROUND_COLLIDER_HEIGHT / 2;

    this.groundPlatforms.push(
      this.addStaticZone(
        bridge.leftBankEndX / 2,
        groundY,
        bridge.leftBankEndX,
        BRIDGE_GROUND_COLLIDER_HEIGHT
      ),
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
    const groundY = this.getGroundedY(cickaPlaySpot.y);
    this.addReadabilityPocket(cickaPlaySpot.x + 34, groundY - 34, 176, 86, 14);
    this.cickaShadow = this.scene.add.ellipse(
      cickaPlaySpot.x,
      groundY - 2,
      92,
      18,
      0x1f1f1d,
      0.12
    ).setDepth(15);
    this.cickaSprite = this.scene.add.sprite(
      cickaPlaySpot.x,
      groundY,
      CICKA_TEXTURE_KEY,
      CICKA_FRAME_INDEX.perchSit
    )
      .setOrigin(CICKA_ORIGIN.x, CICKA_ORIGIN.y)
      .setScale(CICKA_RUNTIME_SCALE)
      .setDepth(26);
    this.cickaSprite.play(CICKA_ANIMATION_KEYS.perchIdle);
    this.toyCar = this.createToyCar(cickaPlaySpot.x + 72, groundY - 2);
  }

  private createBridgeDraftsperson(): void {
    const { draftsperson } = BRIDGE_TRACER_WORLD;
    const groundY = this.getGroundedY(draftsperson.y);

    this.addReadabilityPocket(draftsperson.x, groundY - 80, 104, 176, 22);
    this.bridgeBuilder = this.addBridgeImage(BRIDGE_TEXTURE_KEYS.bridgeBuilder, draftsperson.x, groundY - 2, {
      depth: 24,
      scale: 0.76
    });
    this.addGroundContactShadow(draftsperson.x, groundY - 2, 72, 16, 23);
    this.builderIdleTween = this.scene.tweens.add({
      targets: this.bridgeBuilder,
      y: groundY - 5,
      angle: -0.8,
      duration: 1320,
      ease: 'Stepped',
      easeParams: [5],
      repeat: -1,
      yoyo: true
    });
  }

  private createBridgeCrossingVisuals(): void {
    const { bridge, floorY } = BRIDGE_TRACER_WORLD;

    this.completedBridgeObjects.push(
      this.asVisible(this.createSimpleWoodenBridge(
        bridge.leftBankEndX + 8,
        bridge.rightBankStartX - 8,
        floorY
      ))
    );
  }

  private createConcertHandoffNote(): void {
    this.handoffNote = createUiText(
      this.scene,
      BRIDGE_TRACER_WORLD.exit.x + 70,
      BRIDGE_TRACER_WORLD.exit.y - 130,
      getMessages().scenes.ridge.bridge.handoffNote,
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
    this.interactPrompt = createUiText(this.scene, 0, 0, '', {
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
    const container = this.scene.add.container(GAME_DESIGN_WIDTH / 2, 78)
      .setDepth(220)
      .setScrollFactor(0)
      .setVisible(false);
    const panel = this.scene.add.rectangle(0, 0, BRIDGE_DIALOGUE_PANEL_WIDTH, 150, 0xf7f1df, 0.96)
      .setStrokeStyle(4, 0x1f1f1d, 0.9);
    const label = createUiText(this.scene, -210, -66, 'Bridge Tracer', {
      fontSize: '12px',
      color: '#4b4337'
    }).setOrigin(0, 0.5);
    const text = createUiText(this.scene, -210, -46, '', {
      fontSize: '12px',
      color: '#1a1a1a',
      lineSpacing: 5,
      wordWrap: { width: BRIDGE_DIALOGUE_TEXT_WIDTH }
    }).setOrigin(0, 0);

    container.add([panel, label, text]);
    this.dialogueContainer = container;
    this.dialogueText = text;
  }

  private syncBridgePhysics(
    crossingOpen: boolean,
    player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ): void {
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
        if (player) {
          this.scene.physics.add.collider(player, this.bridgeSpanCollider);
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
      if (player) {
        this.scene.physics.add.collider(player, this.bridgeBlockerCollider);
      }
    }
  }

  private syncCickaAndToyCar(bridgeBeat: RidgeBridgeBeatState): void {
    const cickaSpot = BRIDGE_TRACER_WORLD.cickaPlaySpot;
    const cickaGroundY = this.getGroundedY(cickaSpot.y);
    this.cickaSprite?.setPosition(cickaSpot.x, cickaGroundY);
    this.cickaShadow?.setPosition(cickaSpot.x, cickaGroundY - 2);

    if (!this.toyCar || this.toyCarTestRunning) return;

    if (!hasCickaSharedToyCar(bridgeBeat)) {
      this.toyCar.setVisible(true);
      this.toyCarShadow?.setVisible(true);
      this.toyCar.setPosition(
        BRIDGE_TRACER_WORLD.cickaPlaySpot.x + 72,
        cickaGroundY - 2
      );
      this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, true);

      if (!this.toyCarTween || !this.toyCarTween.isPlaying()) {
        this.toyCarTween?.stop();
        this.toyCarTween = this.scene.tweens.add({
          targets: this.toyCar,
          x: cickaSpot.x + 98,
          angle: 5,
          duration: 1180,
          ease: 'Sine.easeInOut',
          repeat: -1,
          onUpdate: () => {
            if (!this.toyCar) return;
            this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, true);
          },
          yoyo: true
        });
      }
      return;
    }

    this.toyCarTween?.stop();
    this.toyCarTween = undefined;
    this.toyCar.setAngle(0);

    if (bridgeBeat === 'toy_car_shared') {
      this.toyCar.setVisible(false);
      this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, false);
      return;
    }

    this.toyCar.setVisible(true);
    this.toyCarShadow?.setVisible(true);
    this.toyCar.setPosition(
      BRIDGE_TRACER_WORLD.bridge.rightBankStartX + 120,
      this.getGroundedY(BRIDGE_TRACER_WORLD.floorY) - 4
    );
    this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, true);
  }

  private createToyCar(x: number, y: number): Phaser.GameObjects.Image {
    this.toyCarHalo = this.addReadabilityPocket(x, y - 18, 98, 56, 23);
    this.toyCarShadow = this.addGroundContactShadow(x, y + 2, 78, 14, 24);
    return this.addBridgeImage(BRIDGE_TEXTURE_KEYS.modularToyCar, x, y, {
      depth: 25,
      scale: 0.78
    });
  }

  private syncToyCarSupport(x: number, y: number, visible: boolean): void {
    this.toyCarHalo?.setVisible(visible).setPosition(x, y - 18);
    this.toyCarShadow?.setVisible(visible).setPosition(x, y + 4);
  }

  private setBuilderTalking(isTalking: boolean): void {
    if (!this.bridgeBuilder) return;
    this.builderTalkTween?.stop();
    this.builderTalkTween = undefined;

    if (!isTalking) {
      this.builderIdleTween?.resume();
      const groundY = this.getGroundedY(BRIDGE_TRACER_WORLD.draftsperson.y);
      this.bridgeBuilder.setY(groundY - 2).setScale(0.76).setAngle(0);
      return;
    }

    this.builderIdleTween?.pause();
    this.builderTalkTween = this.scene.tweens.add({
      targets: this.bridgeBuilder,
      y: this.getGroundedY(BRIDGE_TRACER_WORLD.draftsperson.y) - 10,
      scaleX: 0.79,
      scaleY: 0.74,
      angle: 1.4,
      duration: 180,
      ease: 'Stepped',
      easeParams: [2],
      repeat: -1,
      yoyo: true
    });
  }

  private createSimpleWoodenBridge(
    leftX: number,
    rightX: number,
    deckTopY: number
  ): Phaser.GameObjects.Graphics {
    const width = rightX - leftX;
    const bridge = this.scene.add.graphics().setDepth(10);

    bridge.fillStyle(0xf7f1df, 0.9);
    bridge.lineStyle(4, 0x1f1f1d, 0.92);
    bridge.fillRect(leftX, deckTopY, width, 18);
    bridge.strokeRect(leftX, deckTopY, width, 18);

    bridge.lineStyle(2, 0x1f1f1d, 0.54);
    for (let x = leftX + 24; x < rightX - 12; x += 34) {
      bridge.lineBetween(x, deckTopY + 2, x - 5, deckTopY + 17);
    }

    bridge.lineStyle(3, 0x1f1f1d, 0.78);
    bridge.lineBetween(leftX + 26, deckTopY + 20, rightX - 26, deckTopY + 20);

    const supportInset = 58;
    const supportTopY = deckTopY + 18;
    const supportBottomY = deckTopY + 76;
    [leftX + supportInset, rightX - supportInset].forEach((x) => {
      bridge.fillStyle(0xf7f1df, 0.78);
      bridge.fillRect(x - 12, supportTopY, 24, supportBottomY - supportTopY);
      bridge.strokeRect(x - 12, supportTopY, 24, supportBottomY - supportTopY);
      bridge.lineBetween(x - 12, supportBottomY, x + 12, supportTopY);
      bridge.lineBetween(x + 12, supportBottomY, x - 12, supportTopY);
    });

    bridge.lineStyle(2, 0x1f1f1d, 0.32);
    bridge.lineBetween(leftX + 4, deckTopY + 22, leftX + 86, deckTopY + 34);
    bridge.lineBetween(rightX - 86, deckTopY + 34, rightX - 4, deckTopY + 22);

    return bridge;
  }

  private addBridgeImage(
    textureKey: string,
    x: number,
    y: number,
    options: BridgeImageOptions = {}
  ): Phaser.GameObjects.Image {
    const image = this.scene.add.image(x, y, textureKey)
      .setOrigin(options.origin?.[0] ?? 0.5, options.origin?.[1] ?? 1)
      .setScale(options.scale ?? 1)
      .setDepth(options.depth ?? 0);

    if (options.alpha !== undefined) {
      image.setAlpha(options.alpha);
    }
    if (options.tint !== undefined) {
      image.setTint(options.tint);
    }
    if (options.flipX) {
      image.setFlipX(true);
    }
    if (options.scrollFactor) {
      image.setScrollFactor(options.scrollFactor[0], options.scrollFactor[1]);
    }
    return image;
  }

  private addGroundContactShadow(
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number
  ): Phaser.GameObjects.Ellipse {
    return this.scene.add.ellipse(x, y + 2, width, height, 0x1f1f1d, 0.1)
      .setDepth(depth);
  }

  private getGroundedY(y: number): number {
    return y + BRIDGE_CHARACTER_GROUND_OFFSET_Y;
  }

  private addReadabilityPocket(
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number
  ): Phaser.GameObjects.Graphics {
    const pocket = this.scene.add.graphics().setDepth(depth);
    pocket.setPosition(x, y);
    pocket.fillStyle(0xf7f1df, 0.9);
    pocket.lineStyle(2, 0xffffff, 0.72);
    pocket.fillEllipse(0, 0, width, height);
    pocket.strokeEllipse(0, 0, width + 8, height + 8);

    pocket.lineStyle(1, 0x1f1f1d, 0.12);
    pocket.strokeEllipse(3, -2, width * 0.96, height * 0.9);
    pocket.lineBetween(-width * 0.32, height * 0.24, width * 0.32, height * 0.18);
    return pocket;
  }

  private addStaticZone(
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Zone {
    const zone = this.scene.add.zone(x, y, width, height);
    this.scene.physics.add.existing(zone, true);
    return zone;
  }

  private asVisible<GameObject extends VisibleGameObject>(gameObject: GameObject): GameObject {
    return gameObject;
  }

  private setVisible(objects: readonly VisibleGameObject[], visible: boolean): void {
    objects.forEach((object) => object.setVisible(visible));
  }
}
