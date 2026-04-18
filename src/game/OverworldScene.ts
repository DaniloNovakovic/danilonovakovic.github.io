import * as Phaser from 'phaser';
import { PORTFOLIO_SECTIONS } from '../config/portfolioRegistry';
import { TextureGenerator } from './textures/TextureGenerator';
import { EnvironmentBuilder } from './textures/EnvironmentBuilder';

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
    if (this.input.keyboard) {
      if (paused) {
        this.input.keyboard.enabled = false;
        if (this.input.keyboard.clearCaptures) {
          this.input.keyboard.clearCaptures();
        }
        if (this.player) this.player.setVelocityX(0);
      } else {
        this.input.keyboard.enabled = true;
        if (this.input.keyboard.addCapture) {
          this.input.keyboard.addCapture([16, 32, 37, 38, 39, 40, 65, 68, 69]);
        }
      }
    }
  }

  preload() {
    TextureGenerator.generatePlayer(this);
    PORTFOLIO_SECTIONS.forEach((s) => TextureGenerator.generateBuilding(this, s.id));
  }

  create() {
    const worldWidth = 3000;
    this.physics.world.setBounds(0, 0, worldWidth, 600);

    // --- ENVIRONMENT ---
    EnvironmentBuilder.buildMountains(this);
    EnvironmentBuilder.buildTrees(this);
    EnvironmentBuilder.buildGround(this, worldWidth);
    
    const groundZone = this.add.zone(worldWidth / 2, 575, worldWidth, 50);
    this.physics.add.existing(groundZone, true);

    // --- BUILDINGS ---
    this.buildings = this.add.group();
    PORTFOLIO_SECTIONS.forEach((s) => {
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
    this.player = this.physics.add.sprite(100, 400, 'player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(800);
    this.physics.add.collider(this.player, groundZone);

    // --- FOREGROUND ---
    EnvironmentBuilder.buildGrass(this, worldWidth);
    EnvironmentBuilder.buildClouds(this, worldWidth);

    // --- CAMERA ---
    this.cameras.main.setBounds(0, 0, worldWidth, 600);
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
    }

    // --- UI ---
    this.interactPrompt = this.add.text(0, 0, '[E] ENTER', {
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

    const isSprinting = this.cursors.shift.isDown;
    const speed = isSprinting ? 600 : 300;
    let isMoving = false;

    if (this.cursors.left.isDown || this.wasd.a.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      isMoving = true;
    } else if (this.cursors.right.isDown || this.wasd.d.isDown) {
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

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-500);
    }

    // Atmospheric ink particles
    if (Phaser.Math.Between(0, 100) > 95) {
      const px = this.cameras.main.scrollX + 1100;
      const py = Phaser.Math.Between(0, 600);
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
      if (dist < 80 && this.player.y > 400) {
        canInteractWith = bldg.getData('name');
        interactPos = { x: bldg.x, y: bldg.y + 40 };
        break;
      }
    }

    if (canInteractWith && interactPos) {
      this.interactPrompt.setPosition(interactPos.x, interactPos.y).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.onInteract?.(canInteractWith);
      }
    } else {
      this.interactPrompt.setVisible(false);
    }
  }
}
