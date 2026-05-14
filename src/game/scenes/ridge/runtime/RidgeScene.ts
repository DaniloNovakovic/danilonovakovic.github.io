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
  CICKA_INTERACTION_TARGET_ID,
  getCickaInteractionResponse,
  shouldShowCickaInteractionPrompt,
  type CickaInteractionCopy,
  type CickaInteractionResponse
} from '../cicka/interaction';
import {
  createCickaAnimations,
  preloadCickaAssets
} from '../cicka/assets';
import {
  createCickaPerch,
  type CickaPerch
} from '../cicka/CickaPerch';
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

export class RidgeScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  interactPrompt?: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private interactionRuntime?: InteriorInteractionRuntime<RidgeInteractionTargetId, RidgeInteractionEffect>;
  private cickaPerch?: CickaPerch;
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
    this.onOpenOverlay = data.onOpenOverlay ?? this.onOpenOverlay;
    const messages = getMessages();

    this.cameras.main.setBackgroundColor('#f7f1df');
    this.physics.world.setBounds(0, 0, RIDGE_WORLD_WIDTH, GAME_DESIGN_HEIGHT);
    createCickaAnimations(this);

    const ground = this.createGround();
    const worldMemories = getRidgeWorldMemories(bridgeStore.getState().progress.ridge);

    this.addBackdrop();
    this.addLandmarks(
      messages.scenes.ridge.memory.stampedeFirstClearLabel,
      messages.scenes.ridge.memory.cickaWalkByBark,
      worldMemories
    );
    this.addPlaceholderCopy();
    this.createPlayer(ground);
    this.createRidgeInteractions(
      messages.navigation.interact,
      messages.scenes.ridge.cicka.interaction
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

    this.cickaPerch?.update({
      playerX: this.player?.x ?? 0,
      playerY: this.player?.y ?? 0,
      nowMs: this.time.now
    });

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
      this.cickaPerch?.showLine(interaction.effect.response.line, this.time.now);
    }

    if (
      !interaction.prompt.visible ||
      !shouldShowCickaInteractionPrompt({
        activeTargetId: interaction.activeTarget?.id ?? null,
        responseVisible: this.cickaPerch?.isSpeechVisible(this.time.now) ?? false
      })
    ) {
      this.interactPrompt?.setVisible(false);
      return;
    }

    this.interactPrompt?.setPosition(interaction.prompt.x, interaction.prompt.y).setVisible(true);
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
    cickaInteractionCopy: CickaInteractionCopy
  ): void {
    this.interactPrompt?.destroy();

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
        ...(this.cickaPerch ? [{
          ...this.cickaPerch.interactionFacts,
          effect: (): RidgeInteractionEffect => ({
            kind: 'showCickaResponse',
            response: getCickaInteractionResponse(
              getRidgeWorldMemories(bridgeStore.getState().progress.ridge),
              cickaInteractionCopy
            )
          })
        }] : []),
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
    cickaWalkByLine: string,
    worldMemories: readonly RidgeWorldMemory[]
  ): void {
    this.cickaPerch = undefined;
    RIDGE_LANDMARKS.forEach((landmark) => {
      const landmarkMemories = worldMemories.filter(
        (memory) => memory.landmarkKind === landmark.kind
      );

      switch (landmark.kind) {
        case 'cicka-perch':
          this.addCickaPerch(landmark, landmarkMemories, cickaWalkByLine);
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

  private addCickaPerch(
    landmark: RidgeLandmark,
    memories: readonly RidgeWorldMemory[],
    walkByLine: string
  ): void {
    this.cickaPerch = createCickaPerch({
      scene: this,
      landmark,
      hasStampedeNoteMemory: hasRidgeWorldMemory(memories, 'cicka-stampede-note'),
      walkByLine
    });
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
