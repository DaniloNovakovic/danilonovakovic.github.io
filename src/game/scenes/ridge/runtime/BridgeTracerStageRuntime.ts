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
  private handoffNote?: Phaser.GameObjects.Text;
  private interactPrompt?: Phaser.GameObjects.Text;
  private dialogueContainer?: Phaser.GameObjects.Container;
  private dialogueText?: Phaser.GameObjects.Text;
  private dialogueHideEvent?: Phaser.Time.TimerEvent;
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
    this.dialogueHideEvent?.remove(false);
    this.dialogueHideEvent = this.scene.time.delayedCall(durationMs, () => {
      this.dialogueContainer?.setVisible(false);
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
    this.toyCar.setPosition(
      BRIDGE_TRACER_WORLD.blueprint.x - 22,
      BRIDGE_TRACER_WORLD.blueprint.y + 44
    );
    this.toyCarTween?.stop();
    this.toyCarTween = this.scene.tweens.add({
      targets: this.toyCar,
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
    paper.lineStyle(1, 0x1f1f1d, 0.08);
    [126, 244, 374].forEach((y) => {
      paper.lineBetween(0, y, bounds.width, y + 8);
    });
    paper.lineStyle(3, 0x1f1f1d, 0.12);
    paper.beginPath();
    paper.moveTo(0, floorY - 78);
    paper.lineTo(380, floorY - 96);
    paper.lineTo(760, floorY - 82);
    paper.lineTo(1110, floorY - 104);
    paper.lineTo(1430, floorY - 86);
    paper.lineTo(1780, floorY - 106);
    paper.lineTo(2200, floorY - 88);
    paper.lineTo(bounds.width, floorY - 100);
    paper.strokePath();

    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.treePineFar, 220, floorY - 20, {
      alpha: 0.42,
      depth: -75,
      scale: 1.15,
      scrollFactor: [0.2, 1]
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.treePineFar, 820, floorY - 48, {
      alpha: 0.34,
      depth: -75,
      scale: 1.35,
      scrollFactor: [0.2, 1]
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.treePineFar, 1580, floorY - 46, {
      alpha: 0.32,
      depth: -75,
      scale: 1.25,
      scrollFactor: [0.2, 1]
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.treePineFar, 2180, floorY - 34, {
      alpha: 0.38,
      depth: -75,
      scale: 1.2,
      scrollFactor: [0.2, 1]
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
        alpha: 0.52,
        depth: -38,
        scale: scale as number,
        scrollFactor: [0.48, 1]
      });
    });

    [
      [BRIDGE_TEXTURE_KEYS.treePineTallA, 760, 0.94],
      [BRIDGE_TEXTURE_KEYS.treePineMediumA, 1040, 0.9],
      [BRIDGE_TEXTURE_KEYS.treePineMediumB, 1138, 0.82]
    ].forEach(([key, x, scale]) => {
      this.addBridgeImage(key as string, x as number, floorY - 2, {
        alpha: 0.96,
        depth: 5,
        scale: scale as number
      });
    });
  }

  private createBridgeGround(): void {
    const { floorY, bridge, bounds } = BRIDGE_TRACER_WORLD;
    const groundY = floorY + BRIDGE_GROUND_COLLIDER_HEIGHT / 2;

    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.groundLong, 610, floorY - 12, {
      depth: 1,
      origin: [0.5, 0],
      scale: 1
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.cliffLeft, bridge.leftBankEndX - 178, floorY - 10, {
      depth: 2,
      origin: [0.5, 0],
      scale: 1
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.cliffRight, bridge.rightBankStartX + 178, floorY - 10, {
      depth: 2,
      origin: [0.5, 0],
      scale: 1
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.groundLong, 2320, floorY - 12, {
      depth: 1,
      origin: [0.5, 0],
      scale: 1
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
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.draftingBoard, blueprint.x, floorY - 2, {
      depth: 12,
      scale: 0.72
    });
    this.addBridgeImage(BRIDGE_TEXTURE_KEYS.bridgeBuilder, draftsperson.x + 80, draftsperson.y - 2, {
      depth: 24,
      scale: 0.72
    });
  }

  private createBridgeCrossingVisuals(): void {
    const { bridge, floorY } = BRIDGE_TRACER_WORLD;

    this.blockedBridgeObjects.push(
      this.asVisible(this.addBridgeImage(
        BRIDGE_TEXTURE_KEYS.supportPier,
        bridge.leftBankEndX - 54,
        floorY - 8,
        {
          alpha: 0.78,
          depth: 7,
          scale: 0.46
        }
      )),
      this.asVisible(this.addBridgeImage(
        BRIDGE_TEXTURE_KEYS.supportPier,
        bridge.rightBankStartX + 54,
        floorY - 8,
        {
          alpha: 0.78,
          depth: 7,
          scale: 0.46
        }
      ))
    );

    this.blockedBridgeObjects.push(
      this.asVisible(this.addBridgeImage(
        BRIDGE_TEXTURE_KEYS.bridgeSpanComplete,
        bridge.centerX,
        floorY - 12,
        {
          alpha: 0.16,
          depth: 6,
          scale: 0.38
        }
      ))
    );

    this.completedBridgeObjects.push(
      this.asVisible(this.addBridgeImage(
        BRIDGE_TEXTURE_KEYS.bridgeSpanComplete,
        bridge.centerX,
        floorY - 12,
        {
          depth: 8,
          scale: 0.38
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
    const crossingOpen = isBridgeCrossingOpen(bridgeBeat);
    const cickaSpot = crossingOpen
      ? BRIDGE_TRACER_WORLD.cickaSettledSpot
      : BRIDGE_TRACER_WORLD.cickaPlaySpot;
    this.cickaSprite?.setPosition(cickaSpot.x, cickaSpot.y);
    this.cickaShadow?.setPosition(cickaSpot.x, cickaSpot.y - 2);

    if (!this.toyCar || this.toyCarTestRunning) return;

    if (!hasCickaSharedToyCar(bridgeBeat)) {
      this.toyCar.setVisible(true);
      this.toyCar.setPosition(
        BRIDGE_TRACER_WORLD.cickaPlaySpot.x + 72,
        BRIDGE_TRACER_WORLD.cickaPlaySpot.y - 2
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

  private createToyCar(x: number, y: number): Phaser.GameObjects.Image {
    return this.addBridgeImage(BRIDGE_TEXTURE_KEYS.modularToyCar, x, y, {
      depth: 25,
      scale: 0.62
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
    if (options.flipX) {
      image.setFlipX(true);
    }
    if (options.scrollFactor) {
      image.setScrollFactor(options.scrollFactor[0], options.scrollFactor[1]);
    }
    return image;
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
