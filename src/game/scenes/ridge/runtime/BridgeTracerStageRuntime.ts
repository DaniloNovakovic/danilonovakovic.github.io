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
    this.scene.add.image(0, 0, BRIDGE_TEXTURE_KEYS.stageBackdrop)
      .setOrigin(0, 0)
      .setDepth(-80);

    this.scene.add.image(
      1035,
      BRIDGE_TRACER_WORLD.floorY + 16,
      BRIDGE_TEXTURE_KEYS.foregroundScreen
    )
      .setOrigin(0.5, 1)
      .setDepth(24);
  }

  private createBridgeGround(): void {
    const { floorY, bridge, bounds } = BRIDGE_TRACER_WORLD;
    const groundY = floorY + BRIDGE_GROUND_COLLIDER_HEIGHT / 2;

    this.scene.add.image(0, 0, BRIDGE_TEXTURE_KEYS.groundStrips)
      .setOrigin(0, 0)
      .setDepth(1);

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
    this.scene.add.rectangle(
      cickaPlaySpot.x + 34,
      cickaPlaySpot.y + 25,
      172,
      28,
      0xf7f1df,
      0.92
    )
      .setStrokeStyle(3, 0x1f1f1d, 0.26)
      .setAngle(-2)
      .setDepth(14);
    for (const offset of [-24, -8, 10]) {
      this.scene.add.circle(
        cickaPlaySpot.x + 112 + offset,
        cickaPlaySpot.y + 20 + Math.abs(offset % 7),
        3,
        0x1f1f1d,
        0.26
      ).setDepth(15);
    }
    this.cickaShadow = this.scene.add.ellipse(
      cickaPlaySpot.x,
      cickaPlaySpot.y + 8,
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
    this.toyCar = this.createToyCar(cickaPlaySpot.x + 66, cickaPlaySpot.y + 8);
  }

  private createBridgeDraftsperson(): void {
    const { draftsperson, blueprint, floorY } = BRIDGE_TRACER_WORLD;

    this.scene.add.image(
      draftsperson.x - 150,
      floorY + 6,
      BRIDGE_TEXTURE_KEYS.draftspersonRestShelter
    )
      .setOrigin(0.5, 1)
      .setDepth(9);

    this.scene.add.image(
      blueprint.x,
      floorY + 4,
      BRIDGE_TEXTURE_KEYS.draftspersonWorkZone
    )
      .setOrigin(0.5, 1)
      .setDepth(12);

    this.scene.add.image(
      draftsperson.x,
      draftsperson.y + 18,
      BRIDGE_TEXTURE_KEYS.draftspersonCharacter
    )
      .setOrigin(0.5, 1)
      .setScale(0.76)
      .setDepth(23);
  }

  private createBridgeCrossingVisuals(): void {
    const { bridge, floorY } = BRIDGE_TRACER_WORLD;

    this.blockedBridgeObjects.push(
      this.asVisible(this.scene.add.image(
        bridge.centerX,
        floorY - 46,
        BRIDGE_TEXTURE_KEYS.crossingBefore
      )
        .setOrigin(0.5)
        .setDepth(8))
    );

    this.completedBridgeObjects.push(
      this.asVisible(this.scene.add.image(
        bridge.centerX,
        floorY - 46,
        BRIDGE_TEXTURE_KEYS.crossingAfter
      )
        .setOrigin(0.5)
        .setDepth(8))
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

  private createToyCar(x: number, y: number): Phaser.GameObjects.Image {
    return this.scene.add.image(x, y, BRIDGE_TEXTURE_KEYS.toyCar)
      .setOrigin(0.5, 0.84)
      .setScale(0.72)
      .setDepth(25);
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
