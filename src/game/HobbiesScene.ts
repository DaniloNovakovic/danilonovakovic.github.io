import * as Phaser from 'phaser';
import { HOBBY_REACT_OVERLAY_IDS } from '../config/featureIds';
import { HOBBIES_ROOM_INTERACTABLES } from '../config/hobbiesRoomLayout';
import { TEXTS } from '../config/content';
import { TextureGenerator } from './textures/TextureGenerator';

export class HobbiesScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key, d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  exitPrompt!: Phaser.GameObjects.Text;
  
  private onClose?: () => void;
  private onInteract?: (id: string) => void;
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'hobbies' });
  }

  init(data: { onClose: () => void, onInteract: (id: string) => void, isPaused?: boolean }) {
    this.onClose = data.onClose;
    this.onInteract = data.onInteract;
    this.isPaused = data.isPaused ?? false;
  }

  updateInteractCallback(callback: (id: string) => void) {
    this.onInteract = callback;
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    if (this.input && this.input.keyboard) {
      // Phase 2: Disable keyboard manager when paused to prevent input bleed
      this.input.keyboard.enabled = !paused;

      if (paused) {
        this.physics.world.pause();
        if (this.player && this.player.body) {
          this.player.setVelocityX(0);
        }
      } else {
        this.physics.world.resume();
        if (this.input.keyboard.addCapture) {
          this.input.keyboard.addCapture([16, 32, 37, 38, 39, 40, 65, 68, 69, 72]);
        }
      }
    }
  }

  create() {
    const width = 1000;
    const height = 600;
    this.physics.world.setBounds(0, 0, width, height);

    // --- TEXTURES ---
    for (const hobbyId of HOBBY_REACT_OVERLAY_IDS) {
      TextureGenerator.generateHobbyItem(this, hobbyId);
    }

    // --- FULL BACKGROUND FILL ---
    this.add.rectangle(width/2, height/2, width, height, 0xf4f1ea);

    // --- ROOM BACKGROUND (House Interior) ---
    const bg = this.add.graphics();
    bg.lineStyle(6, 0x1a1a1a, 1);
    bg.fillStyle(0xfbfbf9, 1);
    bg.fillRect(50, 50, 900, 500); 
    bg.strokeRect(50, 50, 900, 500);

    // Floor (Wood boards)
    bg.lineStyle(2, 0x1a1a1a, 0.2);
    for (let y = 500; y < 550; y += 15) {
      bg.beginPath(); bg.moveTo(50, y); bg.lineTo(950, y); bg.strokePath();
    }
    
    // Floor line (Main)
    bg.lineStyle(4, 0x1a1a1a, 1);
    bg.beginPath(); bg.moveTo(50, 500); bg.lineTo(950, 500); bg.strokePath();

    // Wainscoting / Wall texture
    bg.lineStyle(2, 0x1a1a1a, 0.3);
    bg.beginPath(); bg.moveTo(50, 420); bg.lineTo(950, 420); bg.strokePath();
    for (let x = 80; x < 950; x += 40) {
      bg.beginPath(); bg.moveTo(x, 420); bg.lineTo(x, 500); bg.strokePath();
    }

    // Sketchy windows with frames
    bg.lineStyle(4, 0x1a1a1a, 1);
    bg.strokeRect(150, 150, 120, 120); 
    bg.lineStyle(2, 0x1a1a1a, 0.5);
    bg.beginPath(); bg.moveTo(210, 150); bg.lineTo(210, 270); bg.strokePath();
    bg.beginPath(); bg.moveTo(150, 210); bg.lineTo(270, 210); bg.strokePath();

    bg.lineStyle(4, 0x1a1a1a, 1);
    bg.strokeRect(730, 150, 120, 120);
    bg.lineStyle(2, 0x1a1a1a, 0.5);
    bg.beginPath(); bg.moveTo(790, 150); bg.lineTo(790, 270); bg.strokePath();
    bg.beginPath(); bg.moveTo(730, 210); bg.lineTo(850, 210); bg.strokePath();

    // --- HOBBY OBJECTS ---
    const floorY = 500;
    
    // Games / Coding (Laptop)
    this.add.sprite(200, floorY, 'hobby_games').setOrigin(0.5, 1);
    this.add.text(200, floorY - 140, TEXTS.hobbies.games, { fontFamily: '"Comic Sans MS", cursive', fontSize: '20px', color: '#1a1a1a', fontStyle: 'bold' }).setOrigin(0.5);

    // Art (Easel)
    this.add.sprite(400, floorY, 'hobby_art').setOrigin(0.5, 1);
    this.add.text(400, floorY - 140, TEXTS.hobbies.art, { fontFamily: '"Comic Sans MS", cursive', fontSize: '20px', color: '#1a1a1a', fontStyle: 'bold' }).setOrigin(0.5);

    // Music (Guitar)
    this.add.sprite(600, floorY, 'hobby_music').setOrigin(0.5, 1);
    this.add.text(600, floorY - 140, TEXTS.hobbies.music, { fontFamily: '"Comic Sans MS", cursive', fontSize: '20px', color: '#1a1a1a', fontStyle: 'bold' }).setOrigin(0.5);

    // Fitness (Punching Bag)
    // Phase 3: Move fitness asset up from floorY - 20 to floorY - 60
    this.add.sprite(800, floorY - 60, 'hobby_fitness').setOrigin(0.5, 0.5);
    this.add.text(800, floorY - 140, TEXTS.hobbies.fitness, { fontFamily: '"Comic Sans MS", cursive', fontSize: '20px', color: '#1a1a1a', fontStyle: 'bold' }).setOrigin(0.5);

    // --- EXIT DOOR ---
    const exitDoor = this.add.graphics();
    exitDoor.lineStyle(4, 0x1a1a1a, 1);
    exitDoor.fillStyle(0xfbfbf9, 1);
    exitDoor.fillRect(470, floorY - 100, 60, 100);
    exitDoor.strokeRect(470, floorY - 100, 60, 100);
    // Door handle
    exitDoor.strokeCircle(520, floorY - 50, 3);
    this.add.text(500, floorY - 120, TEXTS.navigation.exit, { fontFamily: '"Comic Sans MS", cursive', fontSize: '16px', color: '#1a1a1a' }).setOrigin(0.5);

    // --- PLAYER ---
    this.player = this.physics.add.sprite(width / 2, floorY - 50, 'player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(1000);
    
    const ground = this.add.zone(width / 2, floorY + 10, 900, 20);
    this.physics.add.existing(ground, true);
    this.physics.add.collider(this.player, ground);

    // --- INPUT ---
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

      this.input.keyboard.on('keydown-H', () => {
        if (!this.isPaused) this.onClose?.();
      });
      this.input.keyboard.on('keydown-ESC', () => {
        if (!this.isPaused) this.onClose?.();
      });
    }

    this.exitPrompt = this.add.text(500, floorY - 150, TEXTS.navigation.interact, {
      fontFamily: '"Comic Sans MS", cursive',
      fontSize: '16px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(100);
    
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

    const speed = 300;

    if (this.cursors.left.isDown || this.wasd.a.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.player.setAngle(Math.sin(this.time.now / 100) * 5);
    } else if (this.cursors.right.isDown || this.wasd.d.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      this.player.setAngle(Math.sin(this.time.now / 100) * 5);
    } else {
      this.player.setVelocityX(0);
      this.player.setAngle(0);
    }

    // Interaction Check
    let nearInteractable = false;
    for (const item of HOBBIES_ROOM_INTERACTABLES) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.x,
        item.distanceAnchorY
      );
      if (dist < 60) {
        this.exitPrompt.setX(item.x).setVisible(true);
        nearInteractable = true;
        
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
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
