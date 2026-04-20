/**
 * HobbiesScene — thin orchestrator.
 * Delegates room layout to HobbiesRoom, player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { HOBBIES_EXIT_X, HOBBIES_ROOM_INTERACTABLES } from '../config/hobbiesRoomLayout';
import { TEXTS } from '../config/content';
import {
  HOBBIES_FLOOR_Y,
  HOBBIES_GROUND_ZONE,
  HOBBIES_INTERACT_RADIUS,
  HOBBIES_RESUME_CLAMP,
  HOBBIES_ROOM_HEIGHT,
  HOBBIES_ROOM_WIDTH,
  HOBBIES_WALK_SPEED,
  HOBBIES_PLAYER_START_OFFSET_Y
} from './config';
import { setSceneKeyboardPaused } from './sceneKeyboardPause';
import { bridgeActions, bridgeStore } from '../shared/bridge/store';
import { PlayerController } from '../core/player/PlayerController';
import { buildHobbiesRoom } from './hobbies/HobbiesRoom';

export class HobbiesScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  exitPrompt!: Phaser.GameObjects.Text;

  private controller!: PlayerController;
  private onClose?: () => void;
  private onInteract?: (id: string) => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };

  constructor() {
    super({ key: 'hobbies' });
  }

  init(data: {
    onClose: () => void;
    onInteract: (id: string) => void;
    isPaused?: boolean;
    resumePosition?: { x: number; y: number };
  }) {
    this.onClose = data.onClose;
    this.onInteract = data.onInteract;
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    if (!this.player?.body) return null;
    return { x: this.player.x, y: this.player.y };
  }

  updateInteractCallback(callback: (id: string) => void) {
    this.onInteract = callback;
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
    const width = HOBBIES_ROOM_WIDTH;
    const height = HOBBIES_ROOM_HEIGHT;
    const floorY = HOBBIES_FLOOR_Y;

    this.physics.world.setBounds(0, 0, width, height);

    buildHobbiesRoom(this);

    // --- PLAYER ---
    const defaultPlayerX = width / 2;
    const defaultPlayerY = floorY - HOBBIES_PLAYER_START_OFFSET_Y;
    const rawX = this.resumePosition?.x ?? defaultPlayerX;
    const rawY = this.resumePosition?.y ?? defaultPlayerY;
    const playerX = Phaser.Math.Clamp(rawX, HOBBIES_RESUME_CLAMP.minX, HOBBIES_RESUME_CLAMP.maxX);
    const playerY = Phaser.Math.Clamp(rawY, HOBBIES_RESUME_CLAMP.minY, HOBBIES_RESUME_CLAMP.maxY);

    this.player = this.physics.add.sprite(playerX, playerY, 'player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(1000);

    const ground = this.add.zone(
      width / 2,
      floorY + HOBBIES_GROUND_ZONE.centerOffsetY,
      HOBBIES_GROUND_ZONE.width,
      HOBBIES_GROUND_ZONE.height
    );
    this.physics.add.existing(ground, true);
    this.physics.add.collider(this.player, ground);

    this.controller = new PlayerController({
      walkSpeed: HOBBIES_WALK_SPEED,
      sprintSpeed: HOBBIES_WALK_SPEED,
      jumpVelocityY: 0 // No jumping in the hobbies room
    });
    this.controller.mount(this.player);

    // --- INPUT ---
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

      const onClose = () => { if (!this.isPaused) this.onClose?.(); };
      this.input.keyboard.on('keydown-H', onClose);
      this.input.keyboard.on('keydown-ESC', onClose);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.keyboard?.off('keydown-H', onClose);
        this.input.keyboard?.off('keydown-ESC', onClose);
      });
    }

    this.exitPrompt = this.add
      .text(HOBBIES_EXIT_X, floorY - 150, TEXTS.navigation.interact, {
        fontFamily: '"Comic Sans MS", cursive',
        fontSize: '16px',
        color: '#1a1a1a',
        backgroundColor: '#ffffff',
        padding: { x: 5, y: 2 }
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(100);

    this.cameras.main.setBackgroundColor('#f4f1ea');

    this.setPaused(this.isPaused);
  }

  update() {
    if (this.isPaused) {
      this.controller.zeroVelocity();
      this.exitPrompt.setVisible(false);
      return;
    }

    const touchState = bridgeStore.getState().touch;
    const oneShots = bridgeActions.consumeTouchOneShots();

    const step = this.controller.step({
      left: this.cursors.left.isDown || this.wasd.a.isDown || touchState.left,
      right: this.cursors.right.isDown || this.wasd.d.isDown || touchState.right,
      sprint: false,
      jump: false,
      interact: Phaser.Input.Keyboard.JustDown(this.interactKey) || oneShots.interactTap
    });

    this.player.setFlipX(step.facingLeft);
    this.player.setAngle(step.moving ? Math.sin(this.time.now / 100) * 5 : 0);

    let nearInteractable = false;
    for (const item of HOBBIES_ROOM_INTERACTABLES) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.x,
        item.distanceAnchorY
      );
      if (dist < HOBBIES_INTERACT_RADIUS) {
        this.exitPrompt.setX(item.x).setVisible(true);
        nearInteractable = true;

        if (step.interactRequested) {
          if (item.id === 'exit') {
            this.onClose?.();
          } else {
            this.onInteract?.(item.id);
          }
        }
        break;
      }
    }

    if (!nearInteractable) {
      this.exitPrompt.setVisible(false);
    }
  }
}
