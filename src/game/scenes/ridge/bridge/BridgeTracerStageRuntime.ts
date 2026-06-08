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
import {
  getBridgeDialogueLine,
  getBridgePromptText,
  type BridgeDialogueLineId
} from '../dialogue/bridgeDialogue';
import {
  BRIDGE_TRACER_WORLD,
  type BridgeTracerInteractionTarget
} from './bridgeTracerSlice';
import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeRailRelativeStageDepth,
  resolveBridgeStageObject,
  resolveBridgeStageObjectPlacement,
  resolveBridgeStagePresentation,
  resolveBridgeStageSpot,
  type BridgeStageCompositionSource,
  type BridgeStagePresentationState
} from './stageComposition';

type VisibleGameObject = Phaser.GameObjects.GameObject & {
  setVisible(visible: boolean): VisibleGameObject;
};

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
  applyCompositionSource(source: BridgeStageCompositionSource): void;
  dispose(): void;
  hidePrompt(): void;
  showPrompt(target: BridgeTracerInteractionTarget, x: number, y: number): void;
  showDialogue(lineIds: readonly BridgeDialogueLineId[], durationMs?: number): void;
  syncBeat(bridgeBeat: RidgeBridgeBeatState): BridgeStagePresentationState;
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
  private source: BridgeStageCompositionSource = BRIDGE_STAGE_SOURCE;
  private currentPresentation: BridgeStagePresentationState = resolveBridgeStagePresentation('intro');
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
    this.createCickaPlaySpot();
    this.createBridgeDraftsperson();
    this.createBridgeCrossingVisuals();
    this.createConcertHandoffNote();
    this.createInteractionPrompt();
    this.createDialoguePanel();
  }

  applyCompositionSource(source: BridgeStageCompositionSource): void {
    this.source = source;
    this.syncCickaAndToyCar(this.currentPresentation);
    this.syncBridgeObjectPlacements();
    this.recreateBridgeCrossingVisuals();
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

  syncBeat(bridgeBeat: RidgeBridgeBeatState): BridgeStagePresentationState {
    const presentation = resolveBridgeStagePresentation(bridgeBeat);
    this.currentPresentation = presentation;

    this.setVisible(this.blockedBridgeObjects, presentation.blockedBridgeVisible);
    this.setVisible(this.completedBridgeObjects, presentation.completedBridgeVisible);
    this.syncCickaAndToyCar(presentation);
    this.handoffNote?.setVisible(presentation.handoffNoteVisible);
    return presentation;
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
    const testStartPlacement = resolveBridgeStageObjectPlacement(
      this.source,
      'toy-car',
      { spotId: 'toy-car-test-start' }
    );
    const testEndPlacement = resolveBridgeStageObjectPlacement(
      this.source,
      'toy-car',
      { spotId: 'toy-car-test-end' }
    );

    this.toyCar.setPosition(testStartPlacement.x, testStartPlacement.y)
      .setDepth(testStartPlacement.depth);
    this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, true);
    this.toyCarTween?.stop();
    this.toyCarTween = this.scene.tweens.add({
      targets: this.toyCar,
      x: testEndPlacement.x,
      y: testEndPlacement.y,
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
    const { bounds } = BRIDGE_TRACER_WORLD;
    const paper = this.scene.add.graphics().setDepth(-90);
    paper.fillStyle(0xf7f1df, 1);
    paper.fillRect(0, 0, bounds.width, bounds.height);

    this.source.plates.forEach((plate) => {
      this.addBridgeImage(plate.textureKey, plate.x, plate.y, {
        depth: plate.depth,
        origin: plate.origin,
        scale: plate.scale,
        scrollFactor: plate.scrollFactor
      });
    });
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

  private createCickaPlaySpot(): void {
    const cickaPlaySpot = this.resolveCickaPlacement('cicka-play');
    this.cickaShadow = this.scene.add.ellipse(
      cickaPlaySpot.x,
      cickaPlaySpot.y - 2,
      92,
      18,
      0x1f1f1d,
      0.12
    ).setDepth(cickaPlaySpot.depth - 1);
    this.cickaSprite = this.scene.add.sprite(
      cickaPlaySpot.x,
      cickaPlaySpot.y,
      CICKA_TEXTURE_KEY,
      CICKA_FRAME_INDEX.perchSit
    )
      .setOrigin(CICKA_ORIGIN.x, CICKA_ORIGIN.y)
      .setScale(CICKA_RUNTIME_SCALE)
      .setDepth(cickaPlaySpot.depth);
    this.cickaSprite.play(CICKA_ANIMATION_KEYS.perchIdle);
    this.toyCar = this.createToyCar();
  }

  private createBridgeDraftsperson(): void {
    const builderPlacement = resolveBridgeStageObjectPlacement(
      this.source,
      'bridge-draftsperson'
    );
    const builderObject = builderPlacement.object;

    this.bridgeBuilder = this.addBridgeImage(builderObject.textureKey, builderPlacement.x, builderPlacement.y, {
      depth: builderPlacement.depth,
      scale: builderObject.scale
    });
    this.addGroundContactShadow(builderPlacement.x, builderPlacement.y, 72, 16, builderPlacement.depth - 1);
    this.builderIdleTween = this.scene.tweens.add({
      targets: this.bridgeBuilder,
      y: builderPlacement.y - 3,
      angle: -0.8,
      duration: 1320,
      ease: 'Stepped',
      easeParams: [5],
      repeat: -1,
      yoyo: true
    });
  }

  private createBridgeCrossingVisuals(): void {
    const bridgeObject = resolveBridgeStageObject(this.source, 'completed-bridge');
    const bridgePlacement = resolveBridgeStageObjectPlacement(this.source, 'completed-bridge');
    const leftBank = resolveBridgeStageSpot(this.source, bridgeObject.leftSpotId);
    const rightBank = resolveBridgeStageSpot(this.source, bridgeObject.rightSpotId);

    this.completedBridgeObjects.push(
      this.asVisible(this.createSimpleWoodenBridge(
        leftBank.x + bridgeObject.deckInset,
        rightBank.x - bridgeObject.deckInset,
        bridgePlacement.y,
        bridgePlacement.depth
      ))
    );
  }

  private createConcertHandoffNote(): void {
    const handoffPlacement = resolveBridgeStageObjectPlacement(this.source, 'handoff-note');
    this.handoffNote = createUiText(
      this.scene,
      handoffPlacement.x,
      handoffPlacement.y,
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
      .setDepth(handoffPlacement.depth)
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

  private syncBridgeObjectPlacements(): void {
    const builderPlacement = resolveBridgeStageObjectPlacement(this.source, 'bridge-draftsperson');
    const builderObject = builderPlacement.object;
    this.bridgeBuilder
      ?.setPosition(builderPlacement.x, builderPlacement.y)
      .setDepth(builderPlacement.depth)
      .setScale(builderObject.scale ?? 1);

    const handoffPlacement = resolveBridgeStageObjectPlacement(this.source, 'handoff-note');
    this.handoffNote?.setPosition(handoffPlacement.x, handoffPlacement.y);
  }

  private recreateBridgeCrossingVisuals(): void {
    this.completedBridgeObjects.forEach((object) => object.destroy());
    this.completedBridgeObjects = [];
    this.createBridgeCrossingVisuals();
  }

  private syncCickaAndToyCar(presentation: BridgeStagePresentationState): void {
    const cickaSpot = this.resolveCickaPlacement(presentation.cickaSpotId);
    this.cickaSprite
      ?.setPosition(cickaSpot.x, cickaSpot.y)
      .setDepth(cickaSpot.depth);
    this.cickaShadow
      ?.setPosition(cickaSpot.x, cickaSpot.y - 2)
      .setDepth(cickaSpot.depth - 1);

    if (!this.toyCar || this.toyCarTestRunning) return;

    if (presentation.toyCar.visible && presentation.toyCar.spotId === 'cicka-toy-car') {
      const toyCarPlacement = resolveBridgeStageObjectPlacement(
        this.source,
        'toy-car',
        { spotId: presentation.toyCar.spotId }
      );
      this.toyCar.setVisible(true);
      this.toyCarShadow?.setVisible(true);
      this.toyCar.setPosition(toyCarPlacement.x, toyCarPlacement.y)
        .setDepth(toyCarPlacement.depth);
      this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, true);

      if (!this.toyCarTween || !this.toyCarTween.isPlaying()) {
        this.toyCarTween?.stop();
        this.toyCarTween = this.scene.tweens.add({
          targets: this.toyCar,
          x: toyCarPlacement.x + 26,
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

    if (!presentation.toyCar.visible) {
      this.toyCar.setVisible(false);
      this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, false);
      return;
    }

    const toyCarPlacement = resolveBridgeStageObjectPlacement(
      BRIDGE_STAGE_SOURCE,
      'toy-car',
      { spotId: presentation.toyCar.spotId }
    );
    this.toyCar.setVisible(true);
    this.toyCarShadow?.setVisible(true);
    this.toyCar.setPosition(toyCarPlacement.x, toyCarPlacement.y)
      .setDepth(toyCarPlacement.depth);
    this.syncToyCarSupport(this.toyCar.x, this.toyCar.y, true);
  }

  private createToyCar(): Phaser.GameObjects.Image {
    const toyCarPlacement = resolveBridgeStageObjectPlacement(this.source, 'toy-car');
    const toyCarObject = toyCarPlacement.object;
    this.toyCarShadow = this.addGroundContactShadow(
      toyCarPlacement.x,
      toyCarPlacement.y + 2,
      78,
      14,
      toyCarPlacement.depth - 1
    );
    return this.addBridgeImage(toyCarObject.textureKey, toyCarPlacement.x, toyCarPlacement.y, {
      depth: toyCarPlacement.depth,
      scale: toyCarObject.scale
    });
  }

  private resolveCickaPlacement(spotId: BridgeStagePresentationState['cickaSpotId']) {
    const spot = resolveBridgeStageSpot(this.source, spotId);
    return {
      ...spot,
      depth: resolveBridgeRailRelativeStageDepth(spot.railPoint, spot)
    };
  }

  private syncToyCarSupport(x: number, y: number, visible: boolean): void {
    this.toyCarShadow?.setVisible(visible).setPosition(x, y + 4);
  }

  private setBuilderTalking(isTalking: boolean): void {
    if (!this.bridgeBuilder) return;
    this.builderTalkTween?.stop();
    this.builderTalkTween = undefined;

    if (!isTalking) {
      this.builderIdleTween?.resume();
      const builderPlacement = resolveBridgeStageObjectPlacement(
        this.source,
        'bridge-draftsperson'
      );
      const builderObject = builderPlacement.object;
      this.bridgeBuilder
        .setY(builderPlacement.y)
        .setScale(builderObject.scale ?? 1)
        .setDepth(builderPlacement.depth)
        .setAngle(0);
      return;
    }

    this.builderIdleTween?.pause();
    const builderPlacement = resolveBridgeStageObjectPlacement(
      BRIDGE_STAGE_SOURCE,
      'bridge-draftsperson'
    );
    const builderObject = builderPlacement.object;
    const baseScale = builderObject.scale ?? 1;
    this.builderTalkTween = this.scene.tweens.add({
      targets: this.bridgeBuilder,
      y: builderPlacement.y - 8,
      scaleX: baseScale + 0.03,
      scaleY: Math.max(0.1, baseScale - 0.02),
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
    deckTopY: number,
    depth: number
  ): Phaser.GameObjects.Graphics {
    const width = rightX - leftX;
    const bridge = this.scene.add.graphics().setDepth(depth);

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

  private asVisible<GameObject extends VisibleGameObject>(gameObject: GameObject): GameObject {
    return gameObject;
  }

  private setVisible(objects: readonly VisibleGameObject[], visible: boolean): void {
    objects.forEach((object) => object.setVisible(visible));
  }
}
