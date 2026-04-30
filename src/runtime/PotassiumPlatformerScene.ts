import * as Phaser from 'phaser';
import { TEXTS } from '../config/content';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH
} from './config';
import { PlayerController } from '../core/player/PlayerController';
import { setSceneKeyboardPaused } from './sceneKeyboardPause';
import { createUiText } from './text/createUiText';
import { bridgeActions, bridgeStore } from '../shared/bridge/store';
import { commandFrameToPlayerStepInput, createInputCommandFrame } from '../core/input/commands';
import { readSceneInputCommands } from './input/readSceneInputCommands';
import { TextureGenerator } from './textures/TextureGenerator';

const FLOOR_Y = 552;
const START = { x: 120, y: 470 } as const;
const GOAL = { x: 900, y: 286, width: 150, height: 120 } as const;
const EXIT = { x: 90, y: FLOOR_Y - 70, radius: 58 } as const;
const PLATFORMER_COYOTE_TIME_MS = 120;
const PLATFORMER_JUMP_BUFFER_MS = 120;
const POTASSIUM_GRAVITY_Y = 820;
const POTASSIUM_WALK_SPEED = 240;
const POTASSIUM_SPRINT_SPEED = 390;
const POTASSIUM_JUMP_VELOCITY_Y = -660;

const PLATFORM_SPECS = [
  { id: 'starter-hop', x: 275, y: 504, width: 190, height: 18 },
  { id: 'banana-block-a', x: 470, y: 448, width: 150, height: 18 },
  { id: 'banana-block-b', x: 620, y: 392, width: 150, height: 18 },
  { id: 'rhythm-gap', x: 770, y: 338, width: 155, height: 18 },
  { id: 'goal-runup', x: 900, y: 292, width: 170, height: 18 }
] as const;

const BANANA_SPECS = [
  { x: 245, y: 464 },
  { x: 322, y: 464 },
  { x: 470, y: 408 },
  { x: 620, y: 352 },
  { x: 770, y: 298 },
  { x: 900, y: 252 }
] as const;

const BLOCK_SPECS = [
  { x: 470, y: 418, label: '?' },
  { x: 620, y: 362, label: '?' },
  { x: 770, y: 308, label: 'B' }
] as const;

type BananaCollectible = {
  x: number;
  y: number;
  body: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
  collected: boolean;
};

export class PotassiumPlatformerScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  hKey!: Phaser.Input.Keyboard.Key;
  escapeKey!: Phaser.Input.Keyboard.Key;
  interactPrompt!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  bananaText!: Phaser.GameObjects.Text;
  goalFlag!: Phaser.GameObjects.Rectangle;

  private controller!: PlayerController;
  private onClose?: () => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };
  private readonly inputFrame = createInputCommandFrame();
  private hasGlassesSprite: boolean | null = null;
  private finishedRun = false;
  private finishCloseAtMs: number | null = null;
  private bananas: BananaCollectible[] = [];
  private bananaCount = 0;

  constructor() {
    super({ key: 'potassium' });
  }

  preload(): void {
    TextureGenerator.generatePlayer(this);
  }

  init(data: {
    onClose: () => void;
    isPaused?: boolean;
    resumePosition?: { x: number; y: number };
  }): void {
    this.onClose = data.onClose;
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
    this.hasGlassesSprite = null;
    this.finishedRun = false;
    this.finishCloseAtMs = null;
    this.bananas = [];
    this.bananaCount = 0;
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    if (!this.player?.body) return null;
    return { x: this.player.x, y: this.player.y };
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (paused) this.controller?.pause();
    else this.controller?.resume();
    setSceneKeyboardPaused(this, paused, {
      pausePhysicsWorld: true,
      zeroHorizontalVelocity: () => this.controller?.zeroVelocity()
    });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    this.cameras.main.setBackgroundColor('#f7f5ea');

    this.buildCourse();

    const startX = Phaser.Math.Clamp(this.resumePosition?.x ?? START.x, 44, GAME_DESIGN_WIDTH - 44);
    const startY = Phaser.Math.Clamp(this.resumePosition?.y ?? START.y, 80, FLOOR_Y - 20);
    this.player = this.physics.add.sprite(startX, startY, 'player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(POTASSIUM_GRAVITY_Y);

    this.controller = new PlayerController({
      walkSpeed: POTASSIUM_WALK_SPEED,
      sprintSpeed: POTASSIUM_SPRINT_SPEED,
      jumpVelocityY: POTASSIUM_JUMP_VELOCITY_Y,
      coyoteTimeMs: PLATFORMER_COYOTE_TIME_MS,
      jumpBufferMs: PLATFORMER_JUMP_BUFFER_MS
    });
    this.controller.mount(this.player);

    const colliderBodies = this.createColliders();
    for (const body of colliderBodies) {
      this.physics.add.collider(this.player, body);
    }

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
      this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    this.statusText = createUiText(this, GAME_DESIGN_WIDTH / 2, 34, 'Potassium Platformer: Reach the goal pole.', {
      fontSize: '18px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 8, y: 4 }
    })
      .setOrigin(0.5)
      .setDepth(90);

    this.bananaText = createUiText(this, GAME_DESIGN_WIDTH - 116, 34, this.getBananaText(), {
      fontSize: '16px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 8, y: 4 }
    })
      .setOrigin(0.5)
      .setDepth(90);

    this.interactPrompt = createUiText(this, 0, 0, TEXTS.navigation.interact, {
      fontSize: '16px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 5, y: 2 }
    })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(95);

    this.setPaused(this.isPaused);
    this.updatePlayerGlassesAppearance();
  }

  update(): void {
    this.updatePlayerGlassesAppearance();
    if (this.isPaused || this.finishedRun) {
      if (this.finishedRun && this.finishCloseAtMs !== null && this.time.now >= this.finishCloseAtMs) {
        this.finishCloseAtMs = null;
        this.onClose?.();
        return;
      }
      this.controller.zeroVelocity();
      this.interactPrompt.setVisible(false);
      return;
    }

    const touchState = bridgeStore.getState().touch;
    const oneShots = bridgeActions.consumeTouchOneShots();
    const commands = readSceneInputCommands({
      frame: this.inputFrame,
      cursors: this.cursors,
      wasd: this.wasd,
      interactKey: this.interactKey,
      hKey: this.hKey,
      escapeKey: this.escapeKey,
      touch: touchState,
      oneShots,
      allowJump: true,
      allowSprint: true
    });
    if (commands.exitContext) {
      this.onClose?.();
      return;
    }

    const step = this.controller.step({
      ...commandFrameToPlayerStepInput(commands),
      nowMs: this.time.now
    });
    this.player.setFlipX(step.facingLeft);
    this.player.setAngle(step.moving ? Math.sin(this.time.now / 100) * 4 : 0);
    this.updateBananaCollection();

    if (this.isInsideGoalZone()) {
      this.interactPrompt.setText('GOAL REACHED').setPosition(GOAL.x, GOAL.y - 116).setVisible(true);
      this.triggerFinishRun();
      return;
    }

    const nearExit =
      Phaser.Math.Distance.Between(this.player.x, this.player.y, EXIT.x, EXIT.y) < EXIT.radius;
    if (nearExit) {
      this.interactPrompt.setText('[E] RETURN').setPosition(EXIT.x, EXIT.y - 65).setVisible(true);
      if (step.interactRequested) {
        this.onClose?.();
      }
      return;
    }

    this.interactPrompt.setVisible(false);
  }

  private createColliders(): Phaser.GameObjects.GameObject[] {
    const bodies: Phaser.GameObjects.GameObject[] = [];
    const floor = this.add.rectangle(GAME_DESIGN_WIDTH / 2, FLOOR_Y + 10, GAME_DESIGN_WIDTH, 28, 0x1a1a1a, 0.12);
    this.physics.add.existing(floor, true);
    bodies.push(floor);

    for (const spec of PLATFORM_SPECS) {
      const rect = this.add.rectangle(spec.x, spec.y, spec.width, spec.height, 0xf3de72, 0.7);
      rect.setStrokeStyle(2, 0x1a1a1a, 0.7);
      rect.setData('platformId', spec.id);
      this.physics.add.existing(rect, true);
      bodies.push(rect);
    }

    return bodies;
  }

  private buildCourse(): void {
    const ink = this.add.graphics();
    ink.lineStyle(4, 0x1a1a1a, 0.95);
    ink.beginPath();
    ink.moveTo(0, FLOOR_Y);
    ink.lineTo(GAME_DESIGN_WIDTH, FLOOR_Y);
    ink.strokePath();

    createUiText(this, 278, 476, 'HOP', {
      fontSize: '12px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    for (const block of BLOCK_SPECS) {
      const rect = this.add.rectangle(block.x, block.y, 34, 28, 0xf3de72, 0.9);
      rect.setStrokeStyle(3, 0x1a1a1a, 0.85);
      createUiText(this, block.x, block.y - 9, block.label, {
        fontSize: '18px',
        color: '#1a1a1a',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    this.bananas = BANANA_SPECS.map((banana) => this.createBananaCollectible(banana.x, banana.y));

    createUiText(this, GOAL.x, GOAL.y - 110, 'GOAL POLE', {
      fontSize: '14px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 5, y: 2 },
      fontStyle: 'bold'
    }).setOrigin(0.5);
    ink.lineStyle(5, 0x1a1a1a, 0.9);
    ink.beginPath();
    ink.moveTo(GOAL.x, GOAL.y - 84);
    ink.lineTo(GOAL.x, GOAL.y + 64);
    ink.strokePath();
    this.goalFlag = this.add.rectangle(GOAL.x + 30, GOAL.y - 64, 48, 22, 0xf3de72, 0.95);
    this.goalFlag.setStrokeStyle(2, 0x1a1a1a, 1);

    createUiText(this, EXIT.x, EXIT.y - 92, 'LADDER BACK', {
      fontSize: '14px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5);
    ink.lineStyle(4, 0x1a1a1a, 0.85);
    ink.strokeRect(EXIT.x - 16, EXIT.y - 26, 32, 88);
    for (let y = EXIT.y - 12; y <= EXIT.y + 40; y += 16) {
      ink.beginPath();
      ink.moveTo(EXIT.x - 16, y);
      ink.lineTo(EXIT.x + 16, y);
      ink.strokePath();
    }
  }

  private updatePlayerGlassesAppearance(): void {
    const hasGlasses = bridgeStore.getState().equipment.equippedItemIds.includes('glasses');
    if (hasGlasses === this.hasGlassesSprite) return;
    this.hasGlassesSprite = hasGlasses;
    this.player.setTexture(hasGlasses ? 'player_glasses' : 'player_idle');
  }

  private triggerFinishRun(): void {
    if (this.finishedRun) return;
    this.finishedRun = true;
    this.finishCloseAtMs = this.time.now + 950;
    this.statusText.setText(`Stage clear. Bananas: ${this.bananaCount}/${this.bananas.length}.`);
    this.goalFlag.setFillStyle(0xfbfbf9, 1);
    this.goalFlag.setScale(1.25);
    this.tweens.add({
      targets: this.goalFlag,
      scaleX: 1,
      scaleY: 1,
      duration: 220,
      ease: 'Sine.easeOut'
    });
  }

  private createBananaCollectible(x: number, y: number): BananaCollectible {
    const body = this.add.ellipse(x, y, 26, 18, 0xf3de72, 0.92);
    body.setStrokeStyle(2, 0x1a1a1a, 0.85);
    const label = createUiText(this, x, y - 8, 'B', {
      fontSize: '12px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    return { x, y, body, label, collected: false };
  }

  private updateBananaCollection(): void {
    for (const banana of this.bananas) {
      if (banana.collected) continue;
      const near = Phaser.Math.Distance.Between(this.player.x, this.player.y, banana.x, banana.y) < 46;
      if (!near) continue;
      banana.collected = true;
      banana.body.setVisible(false);
      banana.label.setVisible(false);
      this.bananaCount += 1;
      this.bananaText.setText(this.getBananaText());
    }
  }

  private getBananaText(): string {
    return `Bananas: ${this.bananaCount}/${BANANA_SPECS.length}`;
  }

  private isInsideGoalZone(): boolean {
    return (
      this.player.x > GOAL.x - GOAL.width / 2 &&
      this.player.x < GOAL.x + GOAL.width / 2 &&
      this.player.y > GOAL.y - GOAL.height / 2 &&
      this.player.y < GOAL.y + GOAL.height / 2
    );
  }
}
