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
    this.toyCarShadow?.setPosition(this.toyCar.x, this.toyCar.y + 4);
    this.toyCarTween?.stop();
    this.toyCarTween = this.scene.tweens.add({
      targets: [this.toyCar, this.toyCarShadow].filter(Boolean),
      x: BRIDGE_TRACER_WORLD.bridge.rightBankStartX + 120,
      y: BRIDGE_TRACER_WORLD.floorY - 4,
      duration: BRIDGE_TEST_DURATION_MS,
      ease: 'Sine.easeInOut',
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

    this.addDistantMountainRidge();
    this.addCloudLayer();
    this.addAmbientInkLife();
    this.addForestUnderstoryLayer();

    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.treePineFar, 220, floorY - 20, {
      depth: -75,
      scale: 1.15,
      scrollFactor: [0.2, 1],
      tint: 0xd8d8d8
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.treePineFar, 820, floorY - 48, {
      depth: -75,
      scale: 1.35,
      scrollFactor: [0.2, 1],
      tint: 0xd8d8d8
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.treePineFar, 1580, floorY - 46, {
      depth: -75,
      scale: 1.25,
      scrollFactor: [0.2, 1],
      tint: 0xd8d8d8
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.treePineFar, 2180, floorY - 34, {
      depth: -75,
      scale: 1.2,
      scrollFactor: [0.2, 1],
      tint: 0xd8d8d8
    });

    [
      [BRIDGE_TEXTURE_KEYS.treePineTallA, 340, 0.82],
      [BRIDGE_TEXTURE_KEYS.treePineTallB, 540, 0.8],
      [BRIDGE_TEXTURE_KEYS.treePineMediumA, 930, 0.86],
      [BRIDGE_TEXTURE_KEYS.treePineMediumB, 1080, 0.82],
      [BRIDGE_TEXTURE_KEYS.treePineTallB, 2050, 0.78],
      [BRIDGE_TEXTURE_KEYS.treePineMediumA, 2240, 0.76]
    ].forEach(([key, x, scale]) => {
      this.addBridgeImage(key as string, x as number, floorY - 4, {
        depth: -38,
        scale: scale as number,
        scrollFactor: [0.48, 1],
        tint: 0xd0d0d0
      });
    });

    [
      [BRIDGE_TEXTURE_KEYS.treePineTallA, 760, 0.94],
      [BRIDGE_TEXTURE_KEYS.treePineMediumA, 1040, 0.9],
      [BRIDGE_TEXTURE_KEYS.treePineMediumB, 1138, 0.82]
    ].forEach(([key, x, scale]) => {
      this.addGroundContactShadow(x as number, floorY - 2, 120 * (scale as number), 22, 4);
      this.addBridgeImage(key as string, x as number, floorY - 2, {
        alpha: 0.96,
        depth: 5,
        scale: scale as number
      });
    });
  }

  private addDistantMountainRidge(): void {
    const { bounds, floorY } = BRIDGE_TRACER_WORLD;
    const mountains = this.scene.add.graphics()
      .setDepth(-84)
      .setScrollFactor(0.14, 1);

    const peaks = [
      [40, floorY - 74, 270, floorY - 238, 510, floorY - 72],
      [410, floorY - 70, 710, floorY - 266, 1000, floorY - 68],
      [940, floorY - 78, 1250, floorY - 226, 1530, floorY - 76],
      [1430, floorY - 70, 1800, floorY - 252, 2180, floorY - 66],
      [2040, floorY - 76, 2380, floorY - 230, bounds.width + 180, floorY - 74]
    ];

    mountains.fillStyle(0xf0f0ee, 1);
    mountains.lineStyle(2, 0x8a8a86, 1);
    peaks.forEach(([leftX, leftY, peakX, peakY, rightX, rightY]) => {
      mountains.beginPath();
      mountains.moveTo(leftX, leftY);
      mountains.lineTo(peakX, peakY);
      mountains.lineTo(rightX, rightY);
      mountains.lineTo(rightX, floorY - 84);
      mountains.lineTo(leftX, floorY - 84);
      mountains.closePath();
      mountains.strokePath();
    });
  }

  private addCloudLayer(): void {
    [
      { x: 310, y: 116, scale: 0.85 },
      { x: 980, y: 92, scale: 0.7 },
      { x: 1630, y: 124, scale: 0.78 },
      { x: 2240, y: 86, scale: 0.72 }
    ].forEach(({ x, y, scale }, index) => {
      const cloud = this.scene.add.graphics()
        .setDepth(-82)
        .setScrollFactor(0.18 + index * 0.01, 1);
      cloud.fillStyle(0xfbfbf9, 0.78);
      cloud.lineStyle(2, 0x1f1f1d, 0.2);
      cloud.strokeEllipse(x - 34 * scale, y + 8 * scale, 72 * scale, 28 * scale);
      cloud.strokeEllipse(x + 12 * scale, y, 82 * scale, 34 * scale);
      cloud.strokeEllipse(x + 56 * scale, y + 10 * scale, 64 * scale, 24 * scale);
      cloud.lineStyle(1, 0x1f1f1d, 0.12);
      cloud.lineBetween(x - 72 * scale, y + 18 * scale, x + 92 * scale, y + 18 * scale);
    });
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

    [
      [520, 178],
      [1470, 154],
      [2130, 192]
    ].forEach(([x, y], index) => {
      const bird = this.scene.add.graphics()
        .setDepth(-28)
        .setScrollFactor(0.36, 1);
      bird.lineStyle(2, 0x1f1f1d, 0.38);
      bird.lineBetween(-8, 0, 0, -5);
      bird.lineBetween(0, -5, 9, 0);
      bird.setPosition(x, y);
      this.scene.tweens.add({
        targets: bird,
        x: x + 52,
        y: y + (index % 2 === 0 ? -6 : 5),
        alpha: 0.2,
        duration: 2600 + index * 380,
        ease: 'Stepped',
        easeParams: [6],
        repeat: -1,
        yoyo: true
      });
    });

    const edgeDust = this.scene.add.graphics()
      .setDepth(4)
      .setScrollFactor(1, 1);
    edgeDust.lineStyle(1, 0x1f1f1d, 0.1);
    for (let x = 140; x < bounds.width; x += 220) {
      edgeDust.lineBetween(x, floorY + 18, x + 42, floorY + 14);
    }
  }

  private addForestUnderstoryLayer(): void {
    const { floorY } = BRIDGE_TRACER_WORLD;
    [
      [BRIDGE_TEXTURE_KEYS.treeBushFarA, 110, 0.92, -66, false, 0.28],
      [BRIDGE_TEXTURE_KEYS.treeBushFarB, 420, 0.86, -66, true, 0.28],
      [BRIDGE_TEXTURE_KEYS.treeBushFarA, 990, 0.88, -66, true, 0.28],
      [BRIDGE_TEXTURE_KEYS.treeBushFarB, 1510, 0.9, -66, false, 0.28],
      [BRIDGE_TEXTURE_KEYS.treeBushFarA, 2020, 0.84, -66, false, 0.28],
      [BRIDGE_TEXTURE_KEYS.treeBushFarB, 2380, 0.86, -66, true, 0.28],
      [BRIDGE_TEXTURE_KEYS.treeBushMidA, 245, 0.86, -50, false, 0.42],
      [BRIDGE_TEXTURE_KEYS.treeBushMidA, 875, 0.82, -50, true, 0.42],
      [BRIDGE_TEXTURE_KEYS.treeBushMidA, 1695, 0.84, -50, false, 0.42],
      [BRIDGE_TEXTURE_KEYS.treeBushMidA, 2225, 0.8, -50, true, 0.42],
      [BRIDGE_TEXTURE_KEYS.bushLarge, 120, 0.92, -62, false],
      [BRIDGE_TEXTURE_KEYS.bushMedium, 310, 0.74, -61, true],
      [BRIDGE_TEXTURE_KEYS.bushLarge, 560, 0.98, -62, true],
      [BRIDGE_TEXTURE_KEYS.bushMedium, 740, 0.82, -60, false],
      [BRIDGE_TEXTURE_KEYS.bushLarge, 980, 0.9, -62, false],
      [BRIDGE_TEXTURE_KEYS.bushMedium, 1190, 0.8, -60, true],
      [BRIDGE_TEXTURE_KEYS.bushLarge, 1450, 0.96, -62, true],
      [BRIDGE_TEXTURE_KEYS.bushMedium, 1640, 0.78, -60, false],
      [BRIDGE_TEXTURE_KEYS.bushLarge, 1900, 0.98, -62, false],
      [BRIDGE_TEXTURE_KEYS.bushMedium, 2110, 0.8, -60, true],
      [BRIDGE_TEXTURE_KEYS.bushLarge, 2360, 0.92, -62, true],
      [BRIDGE_TEXTURE_KEYS.bushMedium, 2540, 0.76, -60, false]
    ].forEach(([key, x, scale, depth, flipX, scrollX], index) => {
      this.addBridgeImage(key as string, x as number, floorY - 42 + (index % 3) * 8, {
        depth: depth as number,
        scale: scale as number,
        scrollFactor: [(scrollX as number | undefined) ?? 0.34, 1],
        tint: 0xdcdcdc,
        flipX: Boolean(flipX)
      });
    });
  }

  private createBridgeGround(): void {
    const { floorY, bridge, bounds } = BRIDGE_TRACER_WORLD;
    const groundY = floorY + BRIDGE_GROUND_COLLIDER_HEIGHT / 2;

    this.addStageLandPlane();
    this.addGroundRun(0, bridge.leftBankEndX, {
      rightEdgeTexture: BRIDGE_TEXTURE_KEYS.cliffLeft
    });
    this.addGroundRun(bridge.rightBankStartX, bounds.width, {
      leftEdgeTexture: BRIDGE_TEXTURE_KEYS.cliffRight
    });

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

  private addStageLandPlane(): void {
    const { bounds, floorY } = BRIDGE_TRACER_WORLD;
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.terrainTopLong, 0, floorY - 62, {
      depth: 0,
      origin: [0, 0],
      scale: 1
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.terrainTopShort, 860, floorY - 62, {
      depth: 0,
      origin: [0, 0],
      scale: 1
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.terrainTopLong, BRIDGE_TRACER_WORLD.bridge.rightBankStartX, floorY - 62, {
      depth: 0,
      origin: [0, 0],
      scale: 1
    });

    const backEdge = this.scene.add.graphics().setDepth(-1);
    backEdge.lineStyle(2, 0x9a9a95, 1);
    backEdge.lineBetween(0, floorY - 72, bounds.width, floorY - 68);
  }

  private addGroundRun(
    leftX: number,
    rightX: number,
    options: {
      leftEdgeTexture?: string;
      rightEdgeTexture?: string;
    } = {}
  ): void {
    const { floorY } = BRIDGE_TRACER_WORLD;
    const ground = this.scene.add.graphics().setDepth(1);

    ground.lineStyle(4, 0x1f1f1d, 0.76);
    ground.lineBetween(leftX - 6, floorY - 28, rightX + 6, floorY - 28);

    if (options.leftEdgeTexture) {
      this.addTornBankEdge(leftX, 'left');
    }
    if (options.rightEdgeTexture) {
      this.addTornBankEdge(rightX, 'right');
    }
  }

  private addTornBankEdge(x: number, side: 'left' | 'right'): void {
    const { floorY } = BRIDGE_TRACER_WORLD;
    const visualTopY = floorY - 28;
    const direction = side === 'left' ? 1 : -1;
    const edge = this.scene.add.graphics().setDepth(2);

    edge.lineStyle(4, 0x1f1f1d, 0.72);
    edge.beginPath();
    edge.moveTo(x, visualTopY);
    edge.lineTo(x + direction * 20, visualTopY + 18);
    edge.lineTo(x + direction * 10, visualTopY + 38);
    edge.lineTo(x + direction * 26, visualTopY + 64);
    edge.strokePath();

    edge.lineStyle(1, 0x1f1f1d, 0.16);
    edge.lineBetween(x + direction * 8, visualTopY + 20, x + direction * 56, visualTopY + 52);
    edge.lineBetween(x + direction * 2, visualTopY + 52, x + direction * 48, visualTopY + 84);
  }

  private createCickaPlaySpot(): void {
    const { cickaPlaySpot } = BRIDGE_TRACER_WORLD;
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.flowers, cickaPlaySpot.x - 108, cickaPlaySpot.y - 4, {
      depth: 18,
      scale: 0.72
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.logPile, cickaPlaySpot.x + 142, cickaPlaySpot.y - 2, {
      alpha: 0.9,
      depth: 17,
      scale: 0.56
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.bushSmall, cickaPlaySpot.x - 184, cickaPlaySpot.y - 6, {
      alpha: 0.88,
      depth: 16,
      scale: 0.8
    });
    this.cickaShadow = this.scene.add.ellipse(
      cickaPlaySpot.x,
      cickaPlaySpot.y - 2,
      92,
      18,
      0x1f1f1d,
      0.12
    ).setDepth(15);
    this.cickaSprite = this.scene.add.sprite(
      cickaPlaySpot.x,
      cickaPlaySpot.y,
      CICKA_TEXTURE_KEY,
      CICKA_FRAME_INDEX.perchSit
    )
      .setOrigin(CICKA_ORIGIN.x, CICKA_ORIGIN.y)
      .setScale(CICKA_RUNTIME_SCALE)
      .setDepth(26);
    this.cickaSprite.play(CICKA_ANIMATION_KEYS.perchIdle);
    this.toyCar = this.createToyCar(cickaPlaySpot.x + 72, cickaPlaySpot.y - 2);
    this.toyCarTween = this.scene.tweens.add({
      targets: this.toyCar,
      x: cickaPlaySpot.x + 98,
      angle: 5,
      duration: 1180,
      ease: 'Sine.easeInOut',
      repeat: -1,
      yoyo: true
    });
  }

  private createBridgeDraftsperson(): void {
    const { draftsperson, blueprint, floorY } = BRIDGE_TRACER_WORLD;

    this.addGroundContactShadow(draftsperson.x - 300, floorY - 4, 170, 24, 7);
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.restShelter, draftsperson.x - 300, floorY - 4, {
      alpha: 0.94,
      depth: 8,
      scale: 0.72
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.bushMedium, draftsperson.x - 190, floorY - 4, {
      alpha: 0.78,
      depth: 9,
      scale: 0.58
    });
    this.addGroundContactShadow(blueprint.x, floorY - 2, 260, 28, 11);
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.draftingBoard, blueprint.x, floorY - 2, {
      depth: 12,
      scale: 0.72
    });
    this.bridgeBuilder = this.addBridgeImage(BRIDGE_TEXTURE_KEYS.bridgeBuilder, draftsperson.x + 80, draftsperson.y - 2, {
      depth: 24,
      scale: 0.76
    });
    this.addGroundContactShadow(draftsperson.x + 80, draftsperson.y - 2, 72, 16, 23);
    this.builderIdleTween = this.scene.tweens.add({
      targets: this.bridgeBuilder,
      y: draftsperson.y - 5,
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
      this.asVisible(this.addBridgeImage(
        BRIDGE_TEXTURE_KEYS.bridgeSpanComplete,
        bridge.centerX,
        floorY - 88,
        {
          depth: 8,
          origin: [0.5, 0],
          scale: 0.5
        }
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
    this.cickaSprite?.setPosition(cickaSpot.x, cickaSpot.y);
    this.cickaShadow?.setPosition(cickaSpot.x, cickaSpot.y - 2);

    if (!this.toyCar || this.toyCarTestRunning) return;

    if (!hasCickaSharedToyCar(bridgeBeat)) {
      this.toyCar.setVisible(true);
      this.toyCarShadow?.setVisible(true);
      this.toyCar.setPosition(
        BRIDGE_TRACER_WORLD.cickaPlaySpot.x + 72,
        BRIDGE_TRACER_WORLD.cickaPlaySpot.y - 2
      );
      this.toyCarShadow?.setPosition(this.toyCar.x, this.toyCar.y + 4);
      return;
    }

    if (bridgeBeat === 'toy_car_shared') {
      this.toyCar.setVisible(true);
      this.toyCarShadow?.setVisible(true);
      this.toyCar.setPosition(
        BRIDGE_TRACER_WORLD.blueprint.x - 22,
        BRIDGE_TRACER_WORLD.blueprint.y + 44
      );
      this.toyCarShadow?.setPosition(this.toyCar.x, this.toyCar.y + 4);
      return;
    }

    this.toyCar.setVisible(true);
    this.toyCarShadow?.setVisible(true);
    this.toyCar.setPosition(
      BRIDGE_TRACER_WORLD.bridge.rightBankStartX + 120,
      BRIDGE_TRACER_WORLD.floorY - 4
    );
    this.toyCarShadow?.setPosition(this.toyCar.x, this.toyCar.y + 4);
  }

  private createToyCar(x: number, y: number): Phaser.GameObjects.Image {
    this.toyCarShadow = this.addGroundContactShadow(x, y + 2, 78, 14, 24);
    return this.addBridgeImage(BRIDGE_TEXTURE_KEYS.modularToyCar, x, y, {
      depth: 25,
      scale: 0.62
    });
  }

  private setBuilderTalking(isTalking: boolean): void {
    if (!this.bridgeBuilder) return;
    this.builderTalkTween?.stop();
    this.builderTalkTween = undefined;

    if (!isTalking) {
      this.builderIdleTween?.resume();
      this.bridgeBuilder.setScale(0.76).setAngle(0);
      return;
    }

    this.builderIdleTween?.pause();
    this.builderTalkTween = this.scene.tweens.add({
      targets: this.bridgeBuilder,
      y: BRIDGE_TRACER_WORLD.draftsperson.y - 10,
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
