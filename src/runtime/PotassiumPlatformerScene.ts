import * as Phaser from 'phaser';
import { TEXTS } from '../config/content';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  OVERWORLD_JUMP_VELOCITY_Y,
  OVERWORLD_SPRINT_SPEED,
  OVERWORLD_WALK_SPEED
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
const GOAL = { x: 890, y: 292, radius: 92 } as const;
const EXIT = { x: 100, y: FLOOR_Y - 70, radius: 80 } as const;
const PLATFORMER_COYOTE_TIME_MS = 120;
const PLATFORMER_JUMP_BUFFER_MS = 120;

export class PotassiumPlatformerScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  hKey!: Phaser.Input.Keyboard.Key;
  escapeKey!: Phaser.Input.Keyboard.Key;
  interactPrompt!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  goalFlag!: Phaser.GameObjects.Rectangle;

  private controller!: PlayerController;
  private onClose?: () => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };
  private readonly inputFrame = createInputCommandFrame();
  private hasGlassesSprite: boolean | null = null;
  private finishedRun = false;

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
    this.player.setGravityY(1000);

    this.controller = new PlayerController({
      walkSpeed: OVERWORLD_WALK_SPEED,
      sprintSpeed: OVERWORLD_SPRINT_SPEED,
      jumpVelocityY: OVERWORLD_JUMP_VELOCITY_Y,
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

    const nearGoal =
      Phaser.Math.Distance.Between(this.player.x, this.player.y, GOAL.x, GOAL.y) < GOAL.radius;
    if (nearGoal) {
      this.interactPrompt.setText('[E] FINISH RUN').setPosition(GOAL.x, GOAL.y - 72).setVisible(true);
      if (step.interactRequested) {
        this.finishedRun = true;
        this.statusText.setText('Stage clear. Banana route unlocked.');
        this.goalFlag.setFillStyle(0xfbfbf9, 1);
        this.goalFlag.setScale(1.25);
        this.tweens.add({
          targets: this.goalFlag,
          scaleX: 1,
          scaleY: 1,
          duration: 220,
          ease: 'Sine.easeOut'
        });
        this.time.delayedCall(650, () => this.onClose?.());
      }
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

    const platformSpecs = [
      { x: 250, y: 500, width: 260, height: 18 },
      { x: 450, y: 450, width: 190, height: 18 },
      { x: 610, y: 398, width: 170, height: 18 },
      { x: 760, y: 346, width: 170, height: 18 },
      { x: 885, y: 306, width: 150, height: 18 }
    ] as const;

    for (const spec of platformSpecs) {
      const rect = this.add.rectangle(spec.x, spec.y, spec.width, spec.height, 0xf3de72, 0.7);
      rect.setStrokeStyle(2, 0x1a1a1a, 0.7);
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

    createUiText(this, GOAL.x, GOAL.y - 110, 'GOAL POLE', {
      fontSize: '14px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 5, y: 2 },
      fontStyle: 'bold'
    }).setOrigin(0.5);
    ink.lineStyle(5, 0x1a1a1a, 0.9);
    ink.beginPath();
    ink.moveTo(GOAL.x, GOAL.y - 72);
    ink.lineTo(GOAL.x, GOAL.y + 48);
    ink.strokePath();
    this.goalFlag = this.add.rectangle(GOAL.x + 28, GOAL.y - 52, 44, 20, 0xf3de72, 0.95);
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
}
