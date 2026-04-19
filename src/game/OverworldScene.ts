import * as Phaser from 'phaser';
import { HOBBIES_FEATURE_ID } from '../config/featureIds';
import { mobileTouch } from './mobileTouchBridge';
import { PORTFOLIO_SECTIONS } from '../config/portfolioRegistry';
import { TextureGenerator } from './textures/TextureGenerator';
import { EnvironmentBuilder } from './textures/EnvironmentBuilder';
import { TEXTS } from '../config/content';
import {
  GAME_DESIGN_HEIGHT,
  OVERWORLD_GROUND_ZONE,
  OVERWORLD_INTERACT_DISTANCE_X,
  OVERWORLD_INTERACT_MIN_PLAYER_Y,
  OVERWORLD_INTERACT_PROMPT_OFFSET_Y,
  OVERWORLD_JUMP_VELOCITY_Y,
  OVERWORLD_PARTICLE_MAX_Y,
  OVERWORLD_PLAYER_GRAVITY_Y,
  OVERWORLD_PLAYER_START,
  OVERWORLD_SPRINT_SPEED,
  OVERWORLD_WALK_SPEED,
  OVERWORLD_WIDTH
} from './config';
import { setSceneKeyboardPaused } from './sceneKeyboardPause';

export class OverworldScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key, d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  buildings!: Phaser.GameObjects.Group;
  interactPrompt!: Phaser.GameObjects.Text;
  
  private onInteract?: (area: string) => void;
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: { onInteract: (area: string) => void, isPaused: boolean }) {
    this.onInteract = data.onInteract;
    this.isPaused = data.isPaused;
  }

  updateInteractCallback(callback: (area: string) => void) {
    this.onInteract = callback;
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    setSceneKeyboardPaused(this, paused, {
      zeroHorizontalVelocity: () => {
        if (this.player) this.player.setVelocityX(0);
      }
    });
  }

  preload() {
    TextureGenerator.generatePlayer(this);
    PORTFOLIO_SECTIONS.forEach((s) => {
      if (s.x !== undefined) {
        TextureGenerator.generateBuilding(this, s.id);
      }
    });
  }

  create() {
    const worldWidth = OVERWORLD_WIDTH;
    this.physics.world.setBounds(0, 0, worldWidth, GAME_DESIGN_HEIGHT);

    // --- ENVIRONMENT ---
    EnvironmentBuilder.buildMountains(this);
    EnvironmentBuilder.buildTrees(this);
    EnvironmentBuilder.buildGround(this, worldWidth);
    
    const groundZone = this.add.zone(
      worldWidth / 2,
      OVERWORLD_GROUND_ZONE.centerY,
      worldWidth,
      OVERWORLD_GROUND_ZONE.height
    );
    this.physics.add.existing(groundZone, true);

    // --- BUILDINGS ---
    this.buildings = this.add.group();
    PORTFOLIO_SECTIONS.forEach((s) => {
      if (s.x === undefined) return;
      
      const bldg = this.add.sprite(s.x, 395, `building_${s.id}`);
      this.add.text(s.x, 150, s.name.toUpperCase(), {
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
        fontSize: '22px',
        color: '#1a1a1a',
        fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(1);

      bldg.setData('name', s.id);
      this.buildings.add(bldg);
    });

    // --- PLAYER ---
    this.player = this.physics.add.sprite(
      OVERWORLD_PLAYER_START.x,
      OVERWORLD_PLAYER_START.y,
      'player_idle'
    );
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(OVERWORLD_PLAYER_GRAVITY_Y);
    this.physics.add.collider(this.player, groundZone);

    // --- FOREGROUND ---
    EnvironmentBuilder.buildGrass(this, worldWidth);
    EnvironmentBuilder.buildClouds(this, worldWidth);

    // --- CAMERA ---
    this.cameras.main.setBounds(0, 0, worldWidth, GAME_DESIGN_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setFollowOffset(0, 100); 

    // --- INPUT ---
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

      this.input.keyboard.on('keydown-H', () => {
        if (!this.isPaused) this.onInteract?.(HOBBIES_FEATURE_ID);
      });
    }

    // --- UI ---
    this.interactPrompt = this.add.text(0, 0, TEXTS.navigation.enter, {
      fontFamily: '"Comic Sans MS", cursive, sans-serif',
      fontSize: '18px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(20);

    this.setPaused(this.isPaused);
  }


  update() {
    if (this.isPaused) {
      if (this.player && this.player.body) this.player.setVelocityX(0);
      return;
    }

    const jumpFromTouch = mobileTouch.jumpQueued;
    mobileTouch.jumpQueued = false;

    const interactFromTouch = mobileTouch.interactTap;
    mobileTouch.interactTap = false;

    const isSprinting = this.cursors.shift.isDown;
    const speed = isSprinting ? OVERWORLD_SPRINT_SPEED : OVERWORLD_WALK_SPEED;
    let isMoving = false;

    const left =
      this.cursors.left.isDown || this.wasd.a.isDown || mobileTouch.left;
    const right =
      this.cursors.right.isDown || this.wasd.d.isDown || mobileTouch.right;

    if (left && !right) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      isMoving = true;
    } else if (right && !left) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      isMoving = true;
    } else {
      this.player.setVelocityX(0);
    }

    if (isMoving) {
      this.player.setAngle(Math.sin(this.time.now / 100) * 5);
    } else {
      this.player.setAngle(0);
    }

    if (
      (this.cursors.up.isDown || jumpFromTouch) &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(OVERWORLD_JUMP_VELOCITY_Y);
    }

    // Atmospheric ink particles
    if (Phaser.Math.Between(0, 100) > 95) {
      const px = this.cameras.main.scrollX + 1100;
      const py = Phaser.Math.Between(0, OVERWORLD_PARTICLE_MAX_Y);
      const p = this.add.circle(px, py, Phaser.Math.Between(1, 3), 0x1a1a1a, 0.2);
      this.tweens.add({
        targets: p,
        x: px - 1200,
        y: py + Phaser.Math.Between(-100, 100),
        duration: Phaser.Math.Between(5000, 10000),
        onComplete: () => p.destroy()
      });
    }

    // Interaction Check
    let canInteractWith: string | null = null;
    let interactPos: {x: number, y: number} | null = null;

    const bldgs = this.buildings.getChildren() as Phaser.GameObjects.Sprite[];
    for (const bldg of bldgs) {
      const dist = Math.abs(this.player.x - bldg.x);
      if (dist < OVERWORLD_INTERACT_DISTANCE_X && this.player.y > OVERWORLD_INTERACT_MIN_PLAYER_Y) {
        canInteractWith = bldg.getData('name');
        interactPos = { x: bldg.x, y: bldg.y + OVERWORLD_INTERACT_PROMPT_OFFSET_Y };
        break;
      }
    }

    if (canInteractWith && interactPos) {
      this.interactPrompt.setPosition(interactPos.x, interactPos.y).setVisible(true);
      if (
        Phaser.Input.Keyboard.JustDown(this.interactKey) ||
        interactFromTouch
      ) {
        this.onInteract?.(canInteractWith);
      }
    } else {
      this.interactPrompt.setVisible(false);
    }
  }
}
