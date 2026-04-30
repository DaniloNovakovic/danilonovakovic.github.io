import * as Phaser from 'phaser';
import { TEXTS } from '../config/content';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  HOBBIES_GROUND_ZONE,
  OVERWORLD_JUMP_VELOCITY_Y,
  OVERWORLD_SPRINT_SPEED,
  OVERWORLD_WALK_SPEED
} from './config';
import { setSceneKeyboardPaused } from './sceneKeyboardPause';
import { bridgeActions, isItemEquipped, isItemOwned } from '../shared/bridge/store';
import { PlayerController } from '../core/player/PlayerController';
import { createUiText } from './text/createUiText';
import { createInputCommandFrame } from '../core/input/commands';
import { readPlayerSceneStep } from './input/scenePlayerInput';

const BASEMENT_FLOOR_Y = 500;
const BASEMENT_PLAYER_START = { x: 135, y: BASEMENT_FLOOR_Y - 50 } as const;
const BASEMENT_EXIT = { x: 95, y: BASEMENT_FLOOR_Y - 75, radius: 70 } as const;
const GLASSES_PICKUP = { x: 610, y: BASEMENT_FLOOR_Y - 95, radius: 70 } as const;

export class BasementScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  hKey!: Phaser.Input.Keyboard.Key;
  escapeKey!: Phaser.Input.Keyboard.Key;
  interactPrompt!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  glasses!: Phaser.GameObjects.Container;

  private controller!: PlayerController;
  private onClose?: () => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };
  private readonly inputFrame = createInputCommandFrame();
  private hasGlassesSprite: boolean | null = null;

  constructor() {
    super({ key: 'basement' });
  }

  init(data: {
    onClose: () => void;
    isPaused?: boolean;
    resumePosition?: { x: number; y: number };
  }) {
    this.onClose = data.onClose;
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
    // Scene instances are reused; force texture sync on each enter.
    this.hasGlassesSprite = null;
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    if (!this.player?.body) return null;
    return { x: this.player.x, y: this.player.y };
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) this.controller?.pause();
    else this.controller?.resume();
    setSceneKeyboardPaused(this, paused, {
      pausePhysicsWorld: true,
      zeroHorizontalVelocity: () => this.controller?.zeroVelocity()
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    this.buildRoom();

    const playerX = this.resumePosition?.x ?? BASEMENT_PLAYER_START.x;
    const playerY = this.resumePosition?.y ?? BASEMENT_PLAYER_START.y;
    this.player = this.physics.add.sprite(playerX, playerY, 'player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(1000);

    const ground = this.add.zone(
      GAME_DESIGN_WIDTH / 2,
      BASEMENT_FLOOR_Y + HOBBIES_GROUND_ZONE.centerOffsetY,
      GAME_DESIGN_WIDTH,
      HOBBIES_GROUND_ZONE.height
    );
    this.physics.add.existing(ground, true);
    this.physics.add.collider(this.player, ground);

    this.controller = new PlayerController({
      walkSpeed: OVERWORLD_WALK_SPEED,
      sprintSpeed: OVERWORLD_SPRINT_SPEED,
      jumpVelocityY: OVERWORLD_JUMP_VELOCITY_Y
    });
    this.controller.mount(this.player);

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

    this.interactPrompt = createUiText(this, 0, 0, TEXTS.navigation.interact, {
      fontSize: '16px',
      color: '#fbfbf9',
      backgroundColor: '#1a1a1a',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(100);

    this.statusText = createUiText(
      this,
      GAME_DESIGN_WIDTH / 2,
      78,
      isItemOwned('glasses')
        ? 'Lens acquired. The city can be seen differently now.'
        : 'A forgotten dev room hums under the sketch city.',
      {
        fontSize: '18px',
        color: '#fbfbf9',
        backgroundColor: '#1a1a1a',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(0.5).setDepth(100);

    this.refreshGlassesVisibility();
    this.setPaused(this.isPaused);
    this.updatePlayerGlassesAppearance();
  }

  update() {
    this.refreshGlassesVisibility();
    this.updatePlayerGlassesAppearance();

    if (this.isPaused) {
      this.controller.zeroVelocity();
      this.interactPrompt.setVisible(false);
      return;
    }

    const { commands, step } = readPlayerSceneStep({
      frame: this.inputFrame,
      controller: this.controller,
      cursors: this.cursors,
      wasd: this.wasd,
      interactKey: this.interactKey,
      hKey: this.hKey,
      escapeKey: this.escapeKey,
      allowJump: true,
      allowSprint: true
    });
    if (commands.exitContext) {
      this.onClose?.();
      return;
    }

    this.player.setFlipX(step.facingLeft);
    this.player.setAngle(step.moving ? Math.sin(this.time.now / 100) * 5 : 0);

    const nearGlasses =
      !isItemOwned('glasses') &&
      Phaser.Math.Distance.Between(this.player.x, this.player.y, GLASSES_PICKUP.x, GLASSES_PICKUP.y) <
        GLASSES_PICKUP.radius;
    if (nearGlasses) {
      this.interactPrompt.setPosition(GLASSES_PICKUP.x, GLASSES_PICKUP.y - 70).setVisible(true);
      if (step.interactRequested) {
        bridgeActions.collectGlasses();
        this.statusText.setText('Glasses acquired. The sketch city flickers into focus.');
        this.refreshGlassesVisibility();
      }
      return;
    }

    const nearExit =
      Phaser.Math.Distance.Between(this.player.x, this.player.y, BASEMENT_EXIT.x, BASEMENT_EXIT.y) <
      BASEMENT_EXIT.radius;
    if (nearExit) {
      this.interactPrompt.setPosition(BASEMENT_EXIT.x, BASEMENT_EXIT.y - 60).setVisible(true);
      if (step.interactRequested) {
        this.onClose?.();
      }
      return;
    }

    this.interactPrompt.setVisible(false);
  }

  private buildRoom(): void {
    this.cameras.main.setBackgroundColor('#151515');

    const g = this.add.graphics();
    g.fillStyle(0x151515, 1);
    g.fillRect(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    g.fillStyle(0x242424, 1);
    g.fillRect(0, BASEMENT_FLOOR_Y, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT - BASEMENT_FLOOR_Y);
    g.lineStyle(3, 0xfbfbf9, 0.7);
    g.beginPath();
    g.moveTo(0, BASEMENT_FLOOR_Y);
    g.lineTo(GAME_DESIGN_WIDTH, BASEMENT_FLOOR_Y);
    g.strokePath();

    for (let x = 20; x < GAME_DESIGN_WIDTH; x += 90) {
      g.lineStyle(1, 0x66ff99, 0.22);
      g.beginPath();
      g.moveTo(x, 120);
      g.lineTo(x + 50, 120);
      g.moveTo(x + 10, 152);
      g.lineTo(x + 72, 152);
      g.moveTo(x - 8, 184);
      g.lineTo(x + 42, 184);
      g.strokePath();
    }

    createUiText(this, GAME_DESIGN_WIDTH / 2, 34, 'DEVELOPER BASEMENT', {
      fontSize: '24px',
      color: '#66ff99',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    createUiText(this, BASEMENT_EXIT.x, BASEMENT_EXIT.y - 92, 'LADDER UP', {
      fontSize: '15px',
      color: '#fbfbf9',
      backgroundColor: '#1a1a1a',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5);
    g.lineStyle(4, 0xfbfbf9, 0.85);
    g.strokeRect(BASEMENT_EXIT.x - 18, BASEMENT_EXIT.y - 30, 36, 92);
    for (let y = BASEMENT_EXIT.y - 14; y <= BASEMENT_EXIT.y + 42; y += 18) {
      g.beginPath();
      g.moveTo(BASEMENT_EXIT.x - 18, y);
      g.lineTo(BASEMENT_EXIT.x + 18, y);
      g.strokePath();
    }

    this.glasses = this.add.container(GLASSES_PICKUP.x, GLASSES_PICKUP.y);
    const leftLens = this.add.ellipse(-18, 0, 30, 24, 0xfbfbf9, 0.08).setStrokeStyle(4, 0x66ff99, 1);
    const rightLens = this.add.ellipse(18, 0, 30, 24, 0xfbfbf9, 0.08).setStrokeStyle(4, 0x66ff99, 1);
    const bridge = this.add.rectangle(0, 0, 12, 4, 0x66ff99, 1);
    const glow = this.add.ellipse(0, 0, 104, 56, 0x66ff99, 0.08);
    this.glasses.add([glow, leftLens, rightLens, bridge]);
    createUiText(this, GLASSES_PICKUP.x, GLASSES_PICKUP.y + 42, 'GLASSES', {
      fontSize: '14px',
      color: '#66ff99',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  private refreshGlassesVisibility(): void {
    this.glasses?.setVisible(!isItemOwned('glasses'));
  }

  private updatePlayerGlassesAppearance(): void {
    const hasGlasses = isItemEquipped('glasses');
    if (hasGlasses === this.hasGlassesSprite) return;
    this.hasGlassesSprite = hasGlasses;
    this.player.setTexture(hasGlasses ? 'player_glasses' : 'player_idle');
  }
}
