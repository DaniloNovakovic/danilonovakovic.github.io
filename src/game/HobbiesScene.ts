import * as Phaser from 'phaser';
import { HOBBY_REACT_OVERLAY_IDS, type HobbyReactOverlayId } from '../config/featureIds';
import {
  HOBBIES_EXIT_X,
  HOBBIES_ROOM_INTERACTABLES,
  HOBBY_STATION_LAYOUT
} from '../config/hobbiesRoomLayout';
import { TEXTS } from '../config/content';
import { TextureGenerator } from './textures/TextureGenerator';
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
import { mobileTouch } from './mobileTouchBridge';
import { setSceneKeyboardPaused } from './sceneKeyboardPause';

const hobbyLabel = (id: HobbyReactOverlayId): string =>
  (TEXTS.hobbies as Record<HobbyReactOverlayId, string>)[id];

export class HobbiesScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  exitPrompt!: Phaser.GameObjects.Text;

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
    setSceneKeyboardPaused(this, paused, {
      pausePhysicsWorld: true,
      zeroHorizontalVelocity: () => {
        if (this.player && this.player.body) {
          this.player.setVelocityX(0);
        }
      }
    });
  }

  create() {
    const width = HOBBIES_ROOM_WIDTH;
    const height = HOBBIES_ROOM_HEIGHT;
    this.physics.world.setBounds(0, 0, width, height);

    for (const hobbyId of HOBBY_REACT_OVERLAY_IDS) {
      TextureGenerator.generateHobbyItem(this, hobbyId);
    }

    this.add.rectangle(width / 2, height / 2, width, height, 0xf4f1ea);

    const bg = this.add.graphics();
    bg.lineStyle(6, 0x1a1a1a, 1);
    bg.fillStyle(0xfbfbf9, 1);
    bg.fillRect(50, 50, 900, 500);
    bg.strokeRect(50, 50, 900, 500);

    bg.lineStyle(2, 0x1a1a1a, 0.2);
    for (let y = 500; y < 550; y += 15) {
      bg.beginPath();
      bg.moveTo(50, y);
      bg.lineTo(950, y);
      bg.strokePath();
    }

    bg.lineStyle(4, 0x1a1a1a, 1);
    bg.beginPath();
    bg.moveTo(50, 500);
    bg.lineTo(950, 500);
    bg.strokePath();

    bg.lineStyle(2, 0x1a1a1a, 0.3);
    bg.beginPath();
    bg.moveTo(50, 420);
    bg.lineTo(950, 420);
    bg.strokePath();
    for (let x = 80; x < 950; x += 40) {
      bg.beginPath();
      bg.moveTo(x, 420);
      bg.lineTo(x, 500);
      bg.strokePath();
    }

    bg.lineStyle(4, 0x1a1a1a, 1);
    bg.strokeRect(150, 150, 120, 120);
    bg.lineStyle(2, 0x1a1a1a, 0.5);
    bg.beginPath();
    bg.moveTo(210, 150);
    bg.lineTo(210, 270);
    bg.strokePath();
    bg.beginPath();
    bg.moveTo(150, 210);
    bg.lineTo(270, 210);
    bg.strokePath();

    bg.lineStyle(4, 0x1a1a1a, 1);
    bg.strokeRect(730, 150, 120, 120);
    bg.lineStyle(2, 0x1a1a1a, 0.5);
    bg.beginPath();
    bg.moveTo(790, 150);
    bg.lineTo(790, 270);
    bg.strokePath();
    bg.beginPath();
    bg.moveTo(730, 210);
    bg.lineTo(850, 210);
    bg.strokePath();

    const floorY = HOBBIES_FLOOR_Y;

    for (const station of HOBBY_STATION_LAYOUT) {
      const texKey = `hobby_${station.id}`;
      if (station.spriteMode === 'floor') {
        this.add
          .sprite(station.x, floorY + station.yOffsetFromFloor, texKey)
          .setOrigin(0.5, 1);
      } else {
        this.add
          .sprite(station.x, floorY + station.yOffsetFromFloor, texKey)
          .setOrigin(0.5, 0.5);
      }
      this.add
        .text(station.x, floorY - 140, hobbyLabel(station.id), {
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '20px',
          color: '#1a1a1a',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
    }

    const exitX = HOBBIES_EXIT_X;
    const exitDoor = this.add.graphics();
    exitDoor.lineStyle(4, 0x1a1a1a, 1);
    exitDoor.fillStyle(0xfbfbf9, 1);
    exitDoor.fillRect(exitX - 30, floorY - 100, 60, 100);
    exitDoor.strokeRect(exitX - 30, floorY - 100, 60, 100);
    exitDoor.strokeCircle(exitX + 20, floorY - 50, 3);
    this.add
      .text(exitX, floorY - 120, TEXTS.navigation.exit, {
        fontFamily: '"Comic Sans MS", cursive',
        fontSize: '16px',
        color: '#1a1a1a'
      })
      .setOrigin(0.5);

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

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

      this.input.keyboard.on('keydown-H', () => {
        if (!this.isPaused) this.onClose?.();
      });
      this.input.keyboard.on('keydown-ESC', () => {
        if (!this.isPaused) this.onClose?.();
      });
    }

    this.exitPrompt = this.add
      .text(exitX, floorY - 150, TEXTS.navigation.interact, {
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
      if (this.player && this.player.body) {
        this.player.setVelocityX(0);
      }
      this.exitPrompt.setVisible(false);
      return;
    }

    mobileTouch.jumpQueued = false;

    const interactFromTouch = mobileTouch.interactTap;
    mobileTouch.interactTap = false;

    const speed = HOBBIES_WALK_SPEED;

    const left = this.cursors.left.isDown || this.wasd.a.isDown || mobileTouch.left;
    const right = this.cursors.right.isDown || this.wasd.d.isDown || mobileTouch.right;

    if (left && !right) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.player.setAngle(Math.sin(this.time.now / 100) * 5);
    } else if (right && !left) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      this.player.setAngle(Math.sin(this.time.now / 100) * 5);
    } else {
      this.player.setVelocityX(0);
      this.player.setAngle(0);
    }

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

        if (Phaser.Input.Keyboard.JustDown(this.interactKey) || interactFromTouch) {
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
