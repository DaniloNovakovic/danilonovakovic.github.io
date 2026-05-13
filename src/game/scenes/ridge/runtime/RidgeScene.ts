import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import {
  bridgeStore,
  isItemEquipped,
  type OpenOverlayOptions
} from '@/game/bridge/store';
import { TRAIL_CARD_OVERLAY_ID, type OverlayId } from '@/game/overlays/overlayIds';
import { getMessages } from '@/shared/i18n';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  OVERWORLD_JUMP_VELOCITY_Y,
  OVERWORLD_PLAYER_GRAVITY_Y,
  OVERWORLD_SPRINT_SPEED,
  OVERWORLD_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import {
  createInteriorInteractionRuntime,
  type InteriorInteractionRuntime
} from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';
import {
  RIDGE_FLOOR_Y,
  RIDGE_LANDMARKS,
  RIDGE_PLAYER_RESUME_CLAMP,
  RIDGE_PLAYER_START,
  RIDGE_TRAIL_CARD_TARGETS,
  RIDGE_WORLD_WIDTH,
  type RidgeTrailCardTargetId,
  type RidgeLandmark
} from '../worldLayout';
import {
  getRidgeWorldMemories,
  hasRidgeWorldMemory,
  type RidgeWorldMemory
} from '../worldMemory';
import {
  createCickaWalkByState,
  updateCickaWalkBy,
  type CickaWalkByState
} from '../cickaWalkBy';
import {
  CICKA_INTERACTION_RESPONSE_DURATION_MS,
  CICKA_INTERACTION_TARGET_ID,
  getCickaInteractionResponse,
  shouldShowCickaInteractionPrompt,
  type CickaInteractionCopy,
  type CickaInteractionResponse
} from '../cickaInteraction';
import type { TrailCardOverlayParams } from '@/game/overlays/trailCard/types';

interface RidgeSceneStartData {
  onClose?: () => void;
  onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused?: boolean;
  resumePosition?: { x: number; y: number };
}

type RidgeInteractionEffect =
  | { kind: 'close' }
  | { kind: 'openTrailCard'; params: TrailCardOverlayParams }
  | { kind: 'showCickaResponse'; response: CickaInteractionResponse };

type RidgeInteractionTargetId =
  | RidgeTrailCardTargetId
  | typeof CICKA_INTERACTION_TARGET_ID;

const CICKA_WALK_BY_ANCHOR_Y = RIDGE_FLOOR_Y - 74;

export class RidgeScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  interactPrompt?: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private interactionRuntime?: InteriorInteractionRuntime<RidgeInteractionTargetId, RidgeInteractionEffect>;
  private cickaSpeechBubble?: Phaser.GameObjects.Container;
  private cickaSpeechBubbleLabel?: Phaser.GameObjects.Text;
  private cickaSpeechVisibleUntilMs = 0;
  private cickaWalkByEnabled = false;
  private cickaWalkByBark = '';
  private cickaWalkByState: CickaWalkByState = createCickaWalkByState();
  private cickaWalkByAnchor: { x: number; y: number } = {
    x: RIDGE_PLAYER_START.x,
    y: CICKA_WALK_BY_ANCHOR_Y
  };
  private onClose: () => void = () => {};
  private onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  private isPaused = false;
  private resumePosition?: { x: number; y: number };

  constructor() {
    super(PHASER_SCENE_KEYS.ridge);
  }

  init(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? (() => {});
    this.onOpenOverlay = data.onOpenOverlay;
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
  }

  preload(): void {
    if (!this.textures.exists('player_idle')) {
      TextureGenerator.generatePlayer(this);
    }
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
    this.onOpenOverlay = data.onOpenOverlay ?? this.onOpenOverlay;
    const messages = getMessages();

    this.cameras.main.setBackgroundColor('#f7f1df');
    this.physics.world.setBounds(0, 0, RIDGE_WORLD_WIDTH, GAME_DESIGN_HEIGHT);

    const ground = this.createGround();
    const worldMemories = getRidgeWorldMemories(bridgeStore.getState().progress.ridge);

    this.configureCickaWalkByMemory(worldMemories);

    this.addBackdrop();
    this.addLandmarks(
      messages.scenes.ridge.memory.stampedeFirstClearLabel,
      worldMemories
    );
    this.cickaWalkByBark = messages.scenes.ridge.memory.cickaWalkByBark;
    this.addCickaSpeechBubble();
    this.addPlaceholderCopy();
    this.createPlayer(ground);
    this.createRidgeInteractions(
      messages.navigation.interact,
      messages.scenes.ridge.cicka.interaction,
      worldMemories
    );
    this.setPaused(this.isPaused);
    this.playerRuntime?.syncAppearance();
  }

  update(): void {
    const playerUpdate = this.playerRuntime?.update();
    if (!playerUpdate || playerUpdate.paused) return;

    if (playerUpdate.commands.exitContext) {
      this.onClose();
      return;
    }

    this.updateCickaWalkByMemory();
    this.updateCickaSpeechBubble();

    const interaction = this.interactionRuntime?.update({
      playerX: this.player?.x ?? 0,
      playerY: this.player?.y ?? 0,
      interactRequested: playerUpdate.step.interactRequested,
      exitRequested: playerUpdate.commands.exitContext
    });

    if (!interaction) {
      this.interactPrompt?.setVisible(false);
      return;
    }

    if (interaction.effect?.kind === 'openTrailCard') {
      this.onOpenOverlay?.(TRAIL_CARD_OVERLAY_ID, {
        params: interaction.effect.params,
        returnToSceneId: PHASER_SCENE_KEYS.ridge
      });
    } else if (interaction.effect?.kind === 'showCickaResponse') {
      this.showCickaSpeechBubble(interaction.effect.response.line);
    }

    if (
      !interaction.prompt.visible ||
      !shouldShowCickaInteractionPrompt({
        activeTargetId: interaction.activeTarget?.id ?? null,
        responseVisible: this.isCickaSpeechBubbleVisible()
      })
    ) {
      this.interactPrompt?.setVisible(false);
      return;
    }

    this.interactPrompt?.setPosition(interaction.prompt.x, interaction.prompt.y).setVisible(true);
  }

  private configureCickaWalkByMemory(memories: readonly RidgeWorldMemory[]): void {
    const cickaPerch = RIDGE_LANDMARKS.find((landmark) => landmark.kind === 'cicka-perch');
    this.cickaWalkByState = createCickaWalkByState();
    this.cickaWalkByEnabled = hasRidgeWorldMemory(memories, 'cicka-stampede-note') && !!cickaPerch;
    this.cickaSpeechBubble = undefined;
    this.cickaSpeechBubbleLabel = undefined;
    this.cickaSpeechVisibleUntilMs = 0;
    if (!cickaPerch) return;
    this.cickaWalkByAnchor = {
      x: cickaPerch.x,
      y: CICKA_WALK_BY_ANCHOR_Y
    };
  }

  private updateCickaWalkByMemory(): void {
    if (!this.player) {
      this.cickaSpeechBubble?.setVisible(false);
      return;
    }

    const walkByUpdate = updateCickaWalkBy(this.cickaWalkByState, {
      enabled: this.cickaWalkByEnabled,
      playerX: this.player.x,
      playerY: this.player.y,
      cickaX: this.cickaWalkByAnchor.x,
      cickaY: this.cickaWalkByAnchor.y,
      nowMs: this.time.now
    });

    this.cickaWalkByState = walkByUpdate.state;
    if (walkByUpdate.triggered) {
      this.showCickaSpeechBubble(this.cickaWalkByBark, walkByUpdate.state.visibleUntilMs);
    }
  }

  private showCickaSpeechBubble(
    line: string,
    visibleUntilMs: number = this.time.now + CICKA_INTERACTION_RESPONSE_DURATION_MS
  ): void {
    if (!this.cickaSpeechBubble || !this.cickaSpeechBubbleLabel) return;
    this.cickaSpeechBubbleLabel.setText(line);
    this.cickaSpeechVisibleUntilMs = visibleUntilMs;
    this.cickaSpeechBubble.setVisible(true);
  }

  private updateCickaSpeechBubble(): void {
    this.cickaSpeechBubble?.setVisible(this.isCickaSpeechBubbleVisible());
  }

  private isCickaSpeechBubbleVisible(): boolean {
    return this.time.now < this.cickaSpeechVisibleUntilMs;
  }

  private createGround(): Phaser.GameObjects.Zone {
    this.add.rectangle(
      RIDGE_WORLD_WIDTH / 2,
      GAME_DESIGN_HEIGHT - 42,
      RIDGE_WORLD_WIDTH,
      84,
      0x2f4736,
      1
    );
    this.add.rectangle(
      RIDGE_WORLD_WIDTH / 2,
      GAME_DESIGN_HEIGHT - 88,
      RIDGE_WORLD_WIDTH,
      44,
      0xd7c78f,
      1
    );

    const ground = this.add.zone(RIDGE_WORLD_WIDTH / 2, RIDGE_FLOOR_Y + 24, RIDGE_WORLD_WIDTH, 48);
    this.physics.add.existing(ground, true);
    return ground;
  }

  private addBackdrop(): void {
    for (let x = 120; x < RIDGE_WORLD_WIDTH; x += 260) {
      const y = 420 + Math.sin(x / 160) * 18;
      this.add.line(x, y, -130, 24, 130, -24, 0x1f1f1d, 0.18).setLineWidth(4);
      this.add.line(x + 36, y + 34, -80, 14, 80, -14, 0x1f1f1d, 0.12).setLineWidth(3);
    }

    this.add.rectangle(RIDGE_WORLD_WIDTH / 2, RIDGE_FLOOR_Y - 78, RIDGE_WORLD_WIDTH, 8, 0x1f1f1d, 0.12);
    this.add.rectangle(RIDGE_WORLD_WIDTH / 2, RIDGE_FLOOR_Y - 6, RIDGE_WORLD_WIDTH, 5, 0x1f1f1d, 0.16);
  }

  private createPlayer(ground: Phaser.GameObjects.Zone): void {
    this.playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: RIDGE_PLAYER_START,
      resumePosition: this.resumePosition,
      resumeClamp: RIDGE_PLAYER_RESUME_CLAMP,
      sprite: {
        depth: 30,
        gravityY: OVERWORLD_PLAYER_GRAVITY_Y
      },
      movement: {
        walkSpeed: OVERWORLD_WALK_SPEED,
        sprintSpeed: OVERWORLD_SPRINT_SPEED,
        jumpVelocityY: OVERWORLD_JUMP_VELOCITY_Y
      },
      input: {
        allowJump: true,
        allowSprint: true,
        includeEscapeKey: true
      },
      appearance: {
        isGlassesEquipped: () => isItemEquipped('glasses'),
        idleTextureKey: 'player_idle',
        glassesTextureKey: 'player_glasses'
      },
      camera: {
        worldBounds: {
          x: 0,
          y: 0,
          width: RIDGE_WORLD_WIDTH,
          height: GAME_DESIGN_HEIGHT
        },
        designSize: {
          width: GAME_DESIGN_WIDTH,
          height: GAME_DESIGN_HEIGHT
        },
        profile: {
          zoom: 1,
          followOffsetY: 0
        }
      }
    });
    this.player = this.playerRuntime.player;
    this.physics.add.collider(this.player, ground);
  }

  private createRidgeInteractions(
    promptText: string,
    cickaInteractionCopy: CickaInteractionCopy,
    worldMemories: readonly RidgeWorldMemory[]
  ): void {
    this.interactPrompt = createUiText(this, 0, 0, promptText, {
      fontSize: '16px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    this.interactionRuntime = createInteriorInteractionRuntime<
      RidgeInteractionTargetId,
      RidgeInteractionEffect
    >({
      interactRadius: 72,
      exitEffect: { kind: 'close' },
      targets: [
        {
          id: CICKA_INTERACTION_TARGET_ID,
          kind: 'cicka',
          x: this.cickaWalkByAnchor.x,
          distanceAnchorY: this.cickaWalkByAnchor.y,
          prompt: {
            x: this.cickaWalkByAnchor.x,
            y: this.cickaWalkByAnchor.y - 86
          },
          interactRadius: 78,
          effect: (): RidgeInteractionEffect => ({
            kind: 'showCickaResponse',
            response: getCickaInteractionResponse(worldMemories, cickaInteractionCopy)
          })
        },
        ...RIDGE_TRAIL_CARD_TARGETS.map((target) => ({
          id: target.id,
          kind: 'trail-card',
          x: target.x,
          distanceAnchorY: target.distanceAnchorY,
          prompt: target.prompt,
          effect: {
            kind: 'openTrailCard',
            params: target.card
          } satisfies RidgeInteractionEffect
        }))
      ]
    });
  }

  private addRelaySpire(x: number): void {
    this.add.triangle(x, 205, 0, 180, 46, 0, 92, 180, 0x1c1a18, 0.82);
    this.add.rectangle(x + 46, 330, 34, 250, 0x1c1a18, 0.82);
    this.add.line(x + 46, 205, -80, 35, 80, 35, 0x1c1a18, 0.5).setLineWidth(3);
    this.add.circle(x + 46, 166, 12, 0xf0d35f, 0.9);
  }

  private addLandmarks(
    stampedeFirstClearLabel: string,
    worldMemories: readonly RidgeWorldMemory[]
  ): void {
    RIDGE_LANDMARKS.forEach((landmark) => {
      const landmarkMemories = worldMemories.filter(
        (memory) => memory.landmarkKind === landmark.kind
      );

      switch (landmark.kind) {
        case 'cicka-perch':
          this.addCickaPerch(landmark, landmarkMemories);
          break;
        case 'stampede-blanket':
          this.addStampedeBlanket(landmark, stampedeFirstClearLabel, landmarkMemories);
          break;
        case 'telegraph-bag':
          this.addTelegraphBag(landmark);
          break;
        case 'ridge-guide':
          this.addRidgeGuide(landmark);
          break;
        case 'relay-spire':
          this.addRelaySpire(landmark.x);
          break;
        case 'domino-desk':
          this.addDominoDesk(landmark);
          break;
      }
      this.addLandmarkLabel(landmark);
    });
  }

  private addCickaSpeechBubble(): void {
    const bubble = this.add.container(
      this.cickaWalkByAnchor.x - 20,
      this.cickaWalkByAnchor.y - 98
    ).setDepth(45).setVisible(false);
    const panel = this.add.rectangle(0, 0, 66, 28, 0xf7f1df, 1)
      .setStrokeStyle(2, 0x1f1f1d, 0.88);
    const tail = this.add.line(22, 14, 0, 0, 13, 13, 0x1f1f1d, 0.5).setLineWidth(2);
    const label = this.add.text(0, -1, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#1f1f1d'
    }).setOrigin(0.5);

    bubble.add([panel, tail, label]);
    this.cickaSpeechBubble = bubble;
    this.cickaSpeechBubbleLabel = label;
  }

  private addCickaPerch(
    landmark: RidgeLandmark,
    memories: readonly RidgeWorldMemory[]
  ): void {
    const x = landmark.x;
    const y = RIDGE_FLOOR_Y - 74;
    this.add.rectangle(x, y + 28, 10, 86, 0x1f1f1d, 0.88);
    this.add.rectangle(x, y - 12, 86, 10, 0x1f1f1d, 0.88);
    this.add.rectangle(x + 18, y - 32, 72, 32, 0xf7f1df, 0.94)
      .setStrokeStyle(2, 0x1f1f1d, 0.22)
      .setAngle(-2);
    this.add.line(x + 8, y - 42, -20, 0, 20, 0, 0x1f1f1d, 0.16).setLineWidth(2);
    this.add.line(x + 8, y - 31, -22, 0, 18, 0, 0x1f1f1d, 0.12).setLineWidth(2);
    this.add.line(x - 10, y - 36, 0, 0, -28, -13, 0x1f1f1d, 0.9).setLineWidth(5);
    this.add.line(x - 38, y - 49, 0, 0, -16, 11, 0x1f1f1d, 0.9).setLineWidth(5);
    this.add.circle(x - 55, y - 37, 3, 0xf7f1df, 0.9);
    this.add.ellipse(x + 16, y - 36, 56, 29, 0x1f1f1d, 0.96);
    this.add.triangle(x - 8, y - 51, 0, 15, 12, 0, 23, 15, 0x1f1f1d, 0.96);
    this.add.triangle(x + 19, y - 51, 0, 15, 12, 0, 23, 15, 0x1f1f1d, 0.96);
    this.add.circle(x + 30, y - 38, 3, 0xf7f1df, 1);
    this.add.ellipse(x + 9, y - 30, 6, 3, 0xf7f1df, 0.88).setAngle(-10);
    this.add.circle(x + 4, y - 23, 2, 0xf7f1df, 0.9);
    this.add.circle(x + 21, y - 23, 2, 0xf7f1df, 0.9);
    if (hasRidgeWorldMemory(memories, 'cicka-stampede-note')) {
      this.addCickaStampedeNoteMemory(x, y);
    }
  }

  private addCickaStampedeNoteMemory(
    x: number,
    y: number
  ): void {
    this.add.rectangle(x + 62, y - 72, 42, 30, 0xf7f1df, 1)
      .setStrokeStyle(2, 0x1f1f1d, 0.88)
      .setAngle(5);
    this.add.line(x + 42, y - 63, -8, 5, 8, -5, 0x1f1f1d, 0.3).setLineWidth(2);
    this.add.circle(x + 59, y - 70, 5, 0x1f1f1d, 0.72);
    this.add.circle(x + 51, y - 81, 3, 0x1f1f1d, 0.72);
    this.add.circle(x + 60, y - 84, 3, 0x1f1f1d, 0.72);
    this.add.circle(x + 69, y - 81, 3, 0x1f1f1d, 0.72);
    this.add.line(x + 78, y - 70, -7, 5, 10, -5, 0x1f1f1d, 0.48).setLineWidth(2);
    this.add.line(x + 79, y - 63, -6, 4, 9, -4, 0x1f1f1d, 0.38).setLineWidth(2);
  }

  private addStampedeBlanket(
    landmark: RidgeLandmark,
    stampedeFirstClearLabel: string,
    memories: readonly RidgeWorldMemory[]
  ): void {
    const x = landmark.x;
    const y = RIDGE_FLOOR_Y - 46;
    this.add.rectangle(x, y, 104, 32, 0xb85f5a, 0.9);
    this.add.rectangle(x - 26, y, 18, 32, 0xf7f1df, 0.7);
    this.add.rectangle(x + 26, y, 18, 32, 0xf7f1df, 0.7);
    this.add.circle(x - 22, y - 26, 11, 0x1f1f1d, 0.92);
    this.add.circle(x + 28, y - 20, 9, 0x1f1f1d, 0.75);
    this.add.line(x, y - 42, -34, 6, 34, -6, 0x1f1f1d, 0.32).setLineWidth(3);
    if (memories.length) {
      this.addStampedeBlanketMemories(x, y, stampedeFirstClearLabel, memories);
    }
  }

  private addStampedeBlanketMemories(
    x: number,
    y: number,
    stampedeFirstClearLabel: string,
    memories: readonly RidgeWorldMemory[]
  ): void {
    if (hasRidgeWorldMemory(memories, 'stampede-settled-swarm')) {
      this.addStampedeSettledSwarmMemory(x, y);
    }
    if (hasRidgeWorldMemory(memories, 'stampede-held-sticker')) {
      this.addStampedeHeldStickerMemory(x, y, stampedeFirstClearLabel);
    }
    if (hasRidgeWorldMemory(memories, 'stampede-glide-pip-decal')) {
      this.addStampedeGlidePipMemory(x, y);
    }
  }

  private addStampedeHeldStickerMemory(
    x: number,
    y: number,
    stampedeFirstClearLabel: string
  ): void {
    this.add.rectangle(x + 42, y - 48, 58, 26, 0xf7f1df, 1)
      .setStrokeStyle(3, 0x1f1f1d, 0.95)
      .setAngle(-8);
    this.add.text(x + 20, y - 57, stampedeFirstClearLabel, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#1f1f1d'
    }).setAngle(-8).setDepth(5);
    this.add.line(x + 9, y - 32, -12, 10, 12, -10, 0x1f1f1d, 0.52).setLineWidth(2);
  }

  private addStampedeSettledSwarmMemory(x: number, y: number): void {
    [
      { x: -55, y: -36, radius: 4 },
      { x: -42, y: -49, radius: 3 },
      { x: -30, y: -39, radius: 2 },
      { x: 54, y: -30, radius: 3 },
      { x: 66, y: -43, radius: 2 }
    ].forEach((dot) => {
      this.add.circle(x + dot.x, y + dot.y, dot.radius, 0x1f1f1d, 0.24);
    });
    this.add.line(x - 64, y - 24, -12, 4, 12, -4, 0x1f1f1d, 0.22).setLineWidth(2);
    this.add.line(x + 58, y - 18, -10, -3, 10, 3, 0x1f1f1d, 0.2).setLineWidth(2);
  }

  private addStampedeGlidePipMemory(x: number, y: number): void {
    this.add.circle(x + 74, y - 18, 11, 0xf7f1df, 1)
      .setStrokeStyle(2, 0x1f1f1d, 0.9);
    this.add.line(x + 74, y - 18, -6, 6, 6, -6, 0x1f1f1d, 0.85).setLineWidth(2);
    this.add.circle(x + 80, y - 24, 2, 0x1f1f1d, 0.85);
  }

  private addTelegraphBag(landmark: RidgeLandmark): void {
    const x = landmark.x;
    const y = RIDGE_FLOOR_Y - 58;
    this.add.rectangle(x, y, 70, 54, 0x596f8f, 0.84);
    this.add.rectangle(x, y - 34, 48, 16, 0x1f1f1d, 0.88);
    this.add.arc(x, y - 40, 36, Math.PI, Math.PI * 2, false, 0x1f1f1d, 0.2).setStrokeStyle(4, 0x1f1f1d, 0.7);
    this.add.line(x + 62, y - 18, -30, -20, 30, 20, 0x1f1f1d, 0.7).setLineWidth(4);
  }

  private addRidgeGuide(landmark: RidgeLandmark): void {
    const x = landmark.x;
    const y = RIDGE_FLOOR_Y - 72;
    this.add.circle(x, y - 28, 16, 0xf7f1df, 1).setStrokeStyle(3, 0x1f1f1d, 1);
    this.add.rectangle(x, y + 8, 32, 58, 0xf7f1df, 1).setStrokeStyle(3, 0x1f1f1d, 1);
    this.add.line(x - 8, y + 2, -30, -16, -52, -28, 0x1f1f1d, 1).setLineWidth(4);
    this.add.rectangle(x + 42, y - 8, 42, 28, 0xf0d35f, 0.9).setStrokeStyle(3, 0x1f1f1d, 1);
    this.add.text(x + 29, y - 17, '?', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#1f1f1d'
    });
  }

  private addDominoDesk(landmark: RidgeLandmark): void {
    const x = landmark.x;
    const y = RIDGE_FLOOR_Y - 62;
    this.add.rectangle(x, y, 108, 50, 0xd7c78f, 0.96).setStrokeStyle(4, 0x1f1f1d, 1);
    this.add.rectangle(x + 70, y - 40, 46, 94, 0xf7f1df, 1).setStrokeStyle(4, 0x1f1f1d, 1);
    this.add.circle(x - 28, y - 16, 7, 0x1f1f1d, 1);
    this.add.circle(x, y - 16, 7, 0x1f1f1d, 1);
    this.add.circle(x + 28, y - 16, 7, 0x1f1f1d, 1);
  }

  private addLandmarkLabel(landmark: RidgeLandmark): void {
    this.add.text(landmark.x, RIDGE_FLOOR_Y - 14, landmark.label, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#1f1f1d',
      backgroundColor: '#f7f1dfcc',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5);
  }

  private addPlaceholderCopy(): void {
    this.add.text(48, 48, 'Sketchbook Ridge', {
      fontFamily: 'monospace',
      fontSize: '34px',
      color: '#1f1f1d'
    });
    this.add.text(50, 94, 'M1 shell placeholder. The old overworld stays default for now.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#4b4337'
    });
    this.add.text(50, 122, 'Move with arrows/WASD, sprint with Shift, jump with Up, exit with H or Esc.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#4b4337'
    });
  }
}
